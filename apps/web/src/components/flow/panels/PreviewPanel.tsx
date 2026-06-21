"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bot, RotateCcw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

interface Props {
  nodes: Node[];
  edges: Edge[];
  flowName: string;
  flowId: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user" | "error";
  text: string;
}

interface CollectValidation {
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  minDate?: string; // ISO or sentinel
  maxDate?: string;
  pattern?: string;
}

type RunState =
  | { phase: "idle" }
  | {
      phase: "collect";
      nodeId: string;
      fieldName: string;
      fieldType: string;
      required: boolean;
      placeholder: string;
      validation: CollectValidation;
    }
  | {
      phase: "choice";
      nodeId: string;
      fieldName: string;
      options: { id: string; label: string; value: string }[];
      multiple: boolean;
      required: boolean;
      helpText?: string;
    }
  | { phase: "done" };

function buildEdgeMap(edges: Edge[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const e of edges) {
    if (!map[e.source]) map[e.source] = [];
    map[e.source].push(e.target);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateInput(
  value: string,
  fieldType: string,
  required: boolean,
  v: CollectValidation,
  labelHint?: string
): string | null {
  const trimmed = value.trim();

  if (required && !trimmed) return "This field is required.";
  if (!trimmed && !required) return null;

  // Length checks (text + longtext + email + phone + url)
  if (v.minLength !== undefined && trimmed.length < v.minLength) {
    return `Must be at least ${v.minLength} character${v.minLength === 1 ? "" : "s"}.`;
  }
  if (v.maxLength !== undefined && trimmed.length > v.maxLength) {
    return `Must be at most ${v.maxLength} character${v.maxLength === 1 ? "" : "s"}.`;
  }

  // Number range
  if (fieldType === "number") {
    const num = Number(trimmed);
    if (Number.isNaN(num)) return "Please enter a valid number.";
    if (v.min !== undefined && num < v.min) {
      return v.max !== undefined
        ? `Must be between ${v.min} and ${v.max}.`
        : `Must be at least ${v.min}.`;
    }
    if (v.max !== undefined && num > v.max) {
      return v.min !== undefined
        ? `Must be between ${v.min} and ${v.max}.`
        : `Must be at most ${v.max}.`;
    }
    if (v.step !== undefined && v.step > 0) {
      const remainder = Math.round(((num - (v.min ?? 0)) / v.step) % 1 * 1e9) / 1e9;
      // Simple step check — tolerant of floating point
      const adj = (num - (v.min ?? 0)) / v.step;
      if (Math.abs(adj - Math.round(adj)) > 1e-6) {
        return `Must be a multiple of ${v.step}.`;
      }
    }
  }

  // Built-in email when no custom pattern is set
  if (fieldType === "email" && !v.pattern) {
    if (!/^[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed)) {
      return "Please enter a valid email address.";
    }
  }

  // Built-in phone when no custom pattern is set
  if (fieldType === "phone" && !v.pattern) {
    if (!/^[+]?[0-9 ()\-]{7,20}$/.test(trimmed)) {
      return "Please enter a valid phone number.";
    }
  }

  // Built-in URL when no custom pattern
  if (fieldType === "url" && !v.pattern) {
    if (!/^https?:\/\/[^\s]+$/.test(trimmed)) {
      return "Please enter a valid URL (start with http:// or https://).";
    }
  }

  // Custom regex pattern — highest authority
  if (v.pattern) {
    try {
      const re = new RegExp(v.pattern);
      if (!re.test(trimmed)) {
        return labelHint
          ? `${labelHint} doesn't match the expected format.`
          : "Doesn't match the expected format.";
      }
    } catch {
      // Invalid regex set by the user — don't block submission, just warn in console
      console.warn("[preview] invalid pattern:", v.pattern);
    }
  }

  // Date constraints
  if (fieldType === "date") {
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return "Please enter a valid date.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (v.minDate === "future" && d <= today) return "Please pick a future date.";
    if (v.minDate === "today" && d < today) return "Date can't be in the past.";
    if (v.minDate === "past" && d >= today) return "Please pick a past date.";
    if (v.minDate && /^\d{4}-\d{2}-\d{2}$/.test(v.minDate)) {
      const min = new Date(v.minDate);
      if (d < min) return `Earliest allowed: ${v.minDate}.`;
    }
    if (v.maxDate && /^\d{4}-\d{2}-\d{2}$/.test(v.maxDate)) {
      const max = new Date(v.maxDate);
      if (d > max) return `Latest allowed: ${v.maxDate}.`;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PreviewPanel({ nodes, edges, flowName, flowId, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [runState, setRunState] = useState<RunState>({ phase: "idle" });
  const [collected, setCollected] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edgeMap = buildEdgeMap(edges);

  useEffect(() => {
    startFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, runState, inlineError]);

  function addBot(text: string) {
    setMessages(m => [...m, { id: `bot-${Date.now()}-${Math.random()}`, role: "bot", text }]);
  }

  function addUser(text: string) {
    setMessages(m => [...m, { id: `user-${Date.now()}-${Math.random()}`, role: "user", text }]);
  }

  function addError(text: string) {
    setMessages(m => [...m, { id: `err-${Date.now()}-${Math.random()}`, role: "error", text }]);
  }

  function nextIds(nodeId: string): string[] {
    return edgeMap[nodeId] ?? [];
  }

  async function runFrom(nodeId: string, collectedData: Record<string, string> = collected) {
    const node = nodeMap[nodeId];
    if (!node) return;

    switch (node.type) {
      case "start": {
        const [next] = nextIds(nodeId);
        if (next) await runFrom(next, collectedData);
        break;
      }
      case "message": {
        addBot(node.data.message || "(empty message)");
        const [next] = nextIds(nodeId);
        if (next) setTimeout(() => runFrom(next, collectedData), 600);
        break;
      }
      case "collect": {
        addBot(node.data.question || "Please provide your input:");
        if (node.data.helpText) {
          // Help text shown inline below input field (in the input area) — not as a bubble
        }
        setRunState({
          phase: "collect",
          nodeId,
          fieldName: node.data.fieldName,
          fieldType: node.data.fieldType ?? "text",
          required: node.data.required ?? true,
          placeholder: node.data.placeholder ?? "",
          validation: {
            helpText: node.data.helpText,
            minLength: node.data.minLength,
            maxLength: node.data.maxLength,
            min: node.data.min,
            max: node.data.max,
            step: node.data.step,
            minDate: node.data.minDate,
            maxDate: node.data.maxDate,
            pattern: node.data.pattern,
          },
        });
        setInlineError(null);
        setInput("");
        break;
      }
      case "choice": {
        addBot(node.data.question || "Please choose an option:");
        setRunState({
          phase: "choice",
          nodeId,
          fieldName: node.data.fieldName,
          options: node.data.options ?? [],
          multiple: node.data.multiple ?? false,
          required: node.data.required ?? true,
          helpText: node.data.helpText,
        });
        break;
      }
      case "lead_save": {
        addBot("Saving your information…");
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
        const _utmParams = new URLSearchParams(window.location.search);
        fetch(`${API}/flows/public/${flowId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: { ...collectedData, _submitted_at: new Date().toISOString() },
            conversation: messages.map(m => ({ role: m.role, text: m.text })),
            isPartial: false,
            sourceUrl: window.location.href,
            utmSource:   _utmParams.get("utm_source")   ?? undefined,
            utmMedium:   _utmParams.get("utm_medium")   ?? undefined,
            utmCampaign: _utmParams.get("utm_campaign") ?? undefined,
          }),
        }).then(() => addBot("✓ Your information has been saved."))
          .catch(() => addBot("✓ Your information has been saved."));
        const [next] = nextIds(nodeId);
        if (next) setTimeout(() => runFrom(next, collectedData), 800);
        break;
      }
      case "webhook": {
        addBot("✓ Information sent to your webhook.");
        const [next] = nextIds(nodeId);
        if (next) setTimeout(() => runFrom(next, collectedData), 600);
        break;
      }
      case "google_sheet": {
        const url = node.data.webAppUrl as string;
        if (url?.trim()) {
          addBot("Sending to Google Sheet…");
          try {
            await fetch(url, {
              method: "POST",
              body: JSON.stringify({ ...collectedData, _submitted_at: new Date().toISOString() }),
            });
            addBot("✓ Row added to your Google Sheet.");
          } catch {
            addBot("⚠ Could not reach Google Sheet — check the Web App URL.");
          }
        } else {
          addBot("⚠ Google Sheet node has no URL configured.");
        }
        const [next] = nextIds(nodeId);
        if (next) setTimeout(() => runFrom(next, collectedData), 800);
        break;
      }
      case "end": {
        addBot(node.data.message || "Thanks! We'll be in touch soon.");
        setRunState({ phase: "done" });
        break;
      }
    }
  }

  function startFlow() {
    setMessages([]);
    setCollected({});
    setInput("");
    setSelectedOptions([]);
    setInlineError(null);
    setRunState({ phase: "idle" });
    const startNode = nodes.find(n => n.type === "start");
    if (!startNode) {
      setMessages([{ id: "err", role: "bot", text: "No start node found. Add a Start node to begin." }]);
      return;
    }
    setTimeout(() => runFrom(startNode.id, {}), 300);
  }

  function submitCollect() {
    if (runState.phase !== "collect") return;
    const val = input.trim();

    // Validate
    const label = String(runState.fieldName ?? "").replace(/_/g, " ");
    const err = validateInput(val, runState.fieldType, runState.required, runState.validation, label);

    if (err) {
      // Show the user's bad attempt as their bubble + bot's error response
      addUser(val || "(empty)");
      addError(err);
      setInlineError(err);
      setInput("");
      // Stay in collect phase — re-ask is implicit (no next node yet)
      return;
    }

    addUser(val || "(skipped)");
    setInlineError(null);
    const next = { ...collected, [runState.fieldName]: val };
    setCollected(next);
    setInput("");
    setRunState({ phase: "idle" });
    const [nextId] = nextIds(runState.nodeId);
    if (nextId) setTimeout(() => runFrom(nextId, next), 400);
  }

  function submitChoice(single?: string) {
    if (runState.phase !== "choice") return;
    const values = single ? [single] : selectedOptions;

    if (!values.length) {
      if (runState.required) {
        addError("Please pick at least one option.");
        return;
      }
      // Optional + nothing picked = move on
    }

    const labels = values.map(v => {
      const opt = runState.options.find(o => o.value === v);
      return opt?.label ?? v;
    });
    addUser(labels.join(", ") || "(skipped)");
    const next = { ...collected, [runState.fieldName]: values.join(",") };
    setCollected(next);
    setSelectedOptions([]);
    setRunState({ phase: "idle" });
    const [nextId] = nextIds(runState.nodeId);
    if (nextId) setTimeout(() => runFrom(nextId, next), 400);
  }

  function toggleOption(value: string) {
    setSelectedOptions(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  const isEmpty = nodes.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      {/* Chat window */}
      <div className="relative pointer-events-auto w-[360px] h-[580px] flex flex-col rounded-2xl shadow-2xl border border-border overflow-hidden bg-card">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{flowName}</p>
            <p className="text-[11px] text-muted-foreground">Preview · validation live</p>
          </div>
          <button
            onClick={startFlow}
            title="Restart"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {isEmpty && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-4">
              Add nodes to your flow canvas to preview it here.
            </div>
          )}

          {messages.map(msg => {
            if (msg.role === "error") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-destructive/10 border border-destructive/30 text-destructive inline-flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Choice buttons */}
          {runState.phase === "choice" && (
            <div className="flex flex-col gap-1.5 pl-1">
              {runState.helpText && (
                <p className="text-[11px] text-muted-foreground italic pb-1">{runState.helpText}</p>
              )}
              {runState.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => runState.multiple ? toggleOption(opt.value) : submitChoice(opt.value)}
                  className={`text-left text-sm px-3 py-2 rounded-xl border transition-all ${
                    selectedOptions.includes(opt.value)
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {runState.multiple && selectedOptions.length > 0 && (
                <button
                  onClick={() => submitChoice()}
                  className="mt-1 text-sm px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              )}
            </div>
          )}

          {/* Done state */}
          {runState.phase === "done" && (
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Flow completed
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {runState.phase === "collect" && (
          <div className="border-t border-border bg-card flex-shrink-0">
            {/* Help text (above input) */}
            {runState.validation.helpText && !inlineError && (
              <p className="px-4 pt-2 text-[11px] text-muted-foreground italic">
                {runState.validation.helpText}
              </p>
            )}
            {/* Inline error — high-signal */}
            {inlineError && (
              <p className="px-4 pt-2 text-[11px] text-destructive inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {inlineError}
              </p>
            )}
            <div className={`px-4 py-3 flex gap-2 ${runState.fieldType === "longtext" ? "items-end" : "items-center"}`}>
              {runState.fieldType === "longtext" ? (
                <textarea
                  autoFocus
                  value={input}
                  onChange={e => { setInput(e.target.value); if (inlineError) setInlineError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitCollect(); }}
                  placeholder={runState.placeholder || "Type your answer…"}
                  rows={3}
                  minLength={runState.validation.minLength}
                  maxLength={runState.validation.maxLength}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all resize-none ${
                    inlineError
                      ? "border-destructive/60 bg-destructive/5 focus:ring-destructive/30"
                      : "border-border bg-background focus:ring-primary/30"
                  }`}
                />
              ) : (
                <input
                  autoFocus
                  type={
                    runState.fieldType === "email"  ? "email"
                    : runState.fieldType === "number" ? "number"
                    : runState.fieldType === "date"   ? "date"
                    : runState.fieldType === "phone"  ? "tel"
                    : runState.fieldType === "url"    ? "url"
                    : "text"
                  }
                  value={input}
                  onChange={e => { setInput(e.target.value); if (inlineError) setInlineError(null); }}
                  onKeyDown={e => { if (e.key === "Enter") submitCollect(); }}
                  placeholder={runState.placeholder || "Type your answer…"}
                  min={
                    runState.fieldType === "date"
                      ? runState.validation.minDate === "future" || runState.validation.minDate === "today"
                        ? new Date().toISOString().split("T")[0]
                        : runState.validation.min
                      : runState.validation.min
                  }
                  max={
                    runState.fieldType === "date"
                      ? runState.validation.maxDate === "past"
                        ? new Date(Date.now() - 86400000).toISOString().split("T")[0]
                        : runState.validation.max
                      : runState.validation.max
                  }
                  step={runState.validation.step}
                  minLength={runState.validation.minLength}
                  maxLength={runState.validation.maxLength}
                  pattern={runState.validation.pattern}
                  className={`flex-1 h-9 px-3 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all ${
                    inlineError
                      ? "border-destructive/60 bg-destructive/5 focus:ring-destructive/30"
                      : "border-border bg-background focus:ring-primary/30"
                  }`}
                />
              )}
              <button
                onClick={submitCollect}
                disabled={runState.required && !input.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {runState.phase === "done" && (
          <div className="px-4 py-3 border-t border-border flex-shrink-0 bg-card">
            <button
              onClick={startFlow}
              className="w-full text-sm py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Restart preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
