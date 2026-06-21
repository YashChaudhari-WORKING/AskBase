import { useState, useEffect, useRef, useCallback } from "react";
import type { WidgetConfig, ChatMsg, FlowNode } from "../types";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "https://api.askbase.io";

// ---------------------------------------------------------------------------
// Inject minimal keyframe CSS once (typing bounce + bubble pop)
// ---------------------------------------------------------------------------

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes ab-bounce {
      0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)}
    }
    @keyframes ab-pop {
      from{opacity:0;transform:translateY(6px) scale(0.95)}
      to{opacity:1;transform:translateY(0) scale(1)}
    }
    #askbase-widget-root * { box-sizing: border-box; }
    #askbase-widget-root ::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Notification sound
// ---------------------------------------------------------------------------

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

// ---------------------------------------------------------------------------
// Tiny markdown renderer
// ---------------------------------------------------------------------------

function MdText({ text, accent, fontSize = "14px" }: { text: string; accent: string; fontSize?: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  function parseInline(s: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      if (m[1]) parts.push(<strong key={m.index}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={m.index}>{m[4]}</em>);
      else if (m[5])
        parts.push(
          <a key={m.index} href={m[7]} target="_blank" rel="noopener noreferrer"
            style={{ color: accent, textDecoration: "underline" }}>
            {m[6]}
          </a>
        );
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  }

  while (i < lines.length) {
    const line = lines[i];
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    const ulMatch = line.match(/^[-*]\s+(.*)/);

    if (olMatch || ulMatch) {
      const isOl = !!olMatch;
      const items: React.ReactNode[] = [];
      let lk = 0;
      while (i < lines.length) {
        const l = lines[i];
        const om = l.match(/^(\d+)\.\s+(.*)/);
        const um = l.match(/^[-*]\s+(.*)/);
        if (isOl && om) { items.push(<li key={lk++}>{parseInline(om[2])}</li>); i++; }
        else if (!isOl && um) { items.push(<li key={lk++}>{parseInline(um[1])}</li>); i++; }
        else break;
      }
      nodes.push(
        isOl
          ? <ol key={k++} style={{ paddingLeft: 16, margin: "4px 0" }}>{items}</ol>
          : <ul key={k++} style={{ paddingLeft: 16, margin: "4px 0" }}>{items}</ul>
      );
      continue;
    }

    if (line.trim() === "") { nodes.push(<br key={k++} />); i++; continue; }
    nodes.push(<p key={k++} style={{ margin: "2px 0" }}>{parseInline(line)}</p>);
    i++;
  }

  return <div style={{ fontSize, lineHeight: 1.5 }}>{nodes}</div>;
}

// ---------------------------------------------------------------------------
// SVG icons (subset of lucide)
// ---------------------------------------------------------------------------

const Icon = {
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  MessageSquareSm: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  BookOpen: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevronUp: ({ rotated }: { rotated?: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: rotated ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}>
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: WidgetConfig = {
  name: "Assistant",
  welcomeMessage: "Hi! How can I help you today?",
  primaryColor: "#6366f1",
  botAvatarEmoji: "💬",
  botAvatarUrl: null,
  botSubtitle: "",
  widgetPosition: "bottom-right",
  openingMessages: [],
  repeatMessages: false,
  homeGreeting: "Hi! How can we help?",
  homeSubgreeting: "We usually reply in a few minutes.",
  conversationStarters: [],
  inputPlaceholder: "Type a message…",
  widgetQuickReplies: [],
  allowAttachments: false,
  showHelpCenter: false,
  helpCenterTitle: "Help & Resources",
  helpArticles: [],
  helpCenterUrl: null,
  showPoweredBy: true,
  footerText: "Powered by AskBase",
  footerLinkUrl: "",
  businessHoursText: "",
  theme: null,
};

// ---------------------------------------------------------------------------
// Main ChatWidget
// ---------------------------------------------------------------------------

interface Props { apiKey: string }

export function ChatWidget({ apiKey }: Props) {
  useEffect(() => { injectCSS(); }, []);

  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"home" | "chat" | "help">("chat");

  // Proactive bubbles
  const [proactiveBubbles, setProactiveBubbles] = useState<string[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick reply chips
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Chat state
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Flow state
  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [flowFieldValue, setFlowFieldValue] = useState("");
  const [flowFieldError, setFlowFieldError] = useState<string | null>(null);
  const [flowNodeIdx, setFlowNodeIdx] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
  const [flowDone, setFlowDone] = useState(false);

  const messagesEnd = useRef<HTMLDivElement>(null);

  // Load config
  useEffect(() => {
    if (!apiKey) return;
    fetch(`${API_URL}/api/knowledge/config/public`, {
      headers: { "x-api-key": apiKey },
    })
      .then((r) => r.json())
      .then((data) => {
        const d = data?.data ?? data;
        if (d) setConfig((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});
  }, [apiKey]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, sending]);

  // Resolved theme colors
  const C = {
    headerBg: config.theme?.headerBg ?? config.primaryColor,
    headerText: config.theme?.headerText ?? "#ffffff",
    chatBg: config.theme?.chatBg ?? "#f8fafc",
    botBg: config.theme?.botBg ?? "#f1f5f9",
    botText: config.theme?.botText ?? "#1e293b",
    userBg: config.theme?.userBg ?? config.primaryColor,
    userText: config.theme?.userText ?? "#ffffff",
    accent: config.theme?.accent ?? config.primaryColor,
    launcherBg: config.theme?.launcherBg ?? config.primaryColor,
    launcherIconUrl: config.theme?.launcherIconUrl ?? null,
    radius: config.theme?.radius ?? "16px",
    fontSize: config.theme?.fontSize ?? "14px",
    showTimestamps: config.theme?.showTimestamps ?? false,
  };

  const posStyle: React.CSSProperties =
    config.widgetPosition === "bottom-left" ? { left: 24 } : { right: 24 };

  const inFlow = !!flowId && !flowDone;

  // ── Proactive messages ───────────────────────────────────────────────────

  function scheduleProactive(
    openingMsgs: Array<{ text: string; delaySeconds: number }>,
    repeat: boolean
  ) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (cycleRef.current) clearTimeout(cycleRef.current);

    openingMsgs.forEach(({ text, delaySeconds }) => {
      const t = setTimeout(() => {
        setProactiveBubbles((prev) => [...prev, text]);
        playNotificationSound();
      }, delaySeconds * 1000);
      timersRef.current.push(t);
    });

    if (repeat && openingMsgs.length > 0) {
      const lastDelay = Math.max(...openingMsgs.map((m) => m.delaySeconds));
      cycleRef.current = setTimeout(() => {
        setProactiveBubbles([]);
        scheduleProactive(openingMsgs, repeat);
      }, (lastDelay + 2) * 1000);
    }
  }

  useEffect(() => {
    const msgs = config.openingMessages ?? [];
    if (msgs.length === 0 || open) return;
    scheduleProactive(msgs, config.repeatMessages ?? false);
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.openingMessages, config.repeatMessages]);

  function clearProactive() {
    setProactiveBubbles([]);
    timersRef.current.forEach(clearTimeout);
    if (cycleRef.current) clearTimeout(cycleRef.current);
  }

  function openWidget() {
    setOpen(true);
    setTab("chat");
    if (msgs.length === 0) addBotMsg(config.welcomeMessage || "Hi! How can I help?");
    clearProactive();
  }

  // ── Chat helpers ─────────────────────────────────────────────────────────

  function addBotMsg(content: string, choices?: ChatMsg["choices"]) {
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "bot", content, choices },
    ]);
  }

  // ── Flow logic ────────────────────────────────────────────────────────────

  async function advanceFlow(userAnswer?: string, fieldName?: string) {
    const nodes = flowNodes;
    let idx = flowNodeIdx;
    const answers = { ...flowAnswers };

    if (userAnswer !== undefined && fieldName) {
      answers[fieldName] = userAnswer;
      setFlowAnswers(answers);
    }

    while (idx < nodes.length) {
      const node = nodes[idx];
      idx++;

      if (node.type === "start") continue;

      if (node.type === "message") {
        addBotMsg(node.data.message || "");
        continue;
      }

      if (node.type === "collect") {
        setFlowNodeIdx(idx);
        setFlowFieldValue("");
        setFlowFieldError(null);
        addBotMsg(
          node.data.question ||
            `Please enter your ${node.data.fieldName || "answer"}`
        );
        return;
      }

      if (node.type === "choice") {
        setFlowNodeIdx(idx);
        setMsgs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "bot",
            content: node.data.question || "Please choose an option:",
            choices: node.data.options ?? [],
          },
        ]);
        return;
      }

      if (
        node.type === "lead_save" ||
        node.type === "webhook" ||
        node.type === "google_sheet"
      ) {
        try {
          await fetch(`${API_URL}/api/flows/public/${flowId}/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({ data: answers }),
          });
        } catch {}
        continue;
      }

      if (node.type === "end") {
        addBotMsg(node.data.message || "Thanks! We'll be in touch soon.");
        setFlowDone(true);
        setFlowId(null);
        setFlowNodes([]);
        return;
      }
    }

    setFlowDone(true);
    setFlowId(null);
    setFlowNodes([]);
  }

  async function startFlow(fId: string) {
    try {
      const res = await fetch(`${API_URL}/api/flows/public/${fId}`, {
        headers: { "x-api-key": apiKey },
      });
      const data = await res.json();
      const d = data?.data ?? data;
      const nodes: FlowNode[] = d.nodes ?? [];

      setFlowId(fId);
      setFlowNodes(nodes);
      setFlowNodeIdx(0);
      setFlowAnswers({});
      setFlowDone(false);

      let idx = 0;
      while (idx < nodes.length) {
        const node = nodes[idx];
        idx++;
        if (node.type === "start") continue;
        if (node.type === "message") { addBotMsg(node.data.message || ""); continue; }
        if (node.type === "collect") {
          setFlowNodeIdx(idx);
          addBotMsg(
            node.data.question ||
              `Please enter your ${node.data.fieldName || "answer"}`
          );
          return;
        }
        if (node.type === "choice") {
          setFlowNodeIdx(idx);
          setMsgs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "bot",
              content: node.data.question || "Please choose:",
              choices: node.data.options ?? [],
            },
          ]);
          return;
        }
        if (node.type === "end") {
          addBotMsg(node.data.message || "Thanks!");
          setFlowDone(true);
          return;
        }
      }
    } catch {
      addBotMsg("I wasn't able to load that flow. Please try again.");
    }
  }

  function validateFlowInput(value: string, node: FlowNode): string | null {
    const {
      fieldType = "text",
      required = false,
      minLength,
      maxLength,
      min,
      max,
      step,
      minDate,
      maxDate,
      pattern,
      fieldName,
    } = node.data ?? {};
    const trimmed = value.trim();

    if (required && !trimmed) return "This field is required.";
    if (!trimmed && !required) return null;

    if (minLength !== undefined && trimmed.length < minLength)
      return `Must be at least ${minLength} character${minLength === 1 ? "" : "s"}.`;
    if (maxLength !== undefined && trimmed.length > maxLength)
      return `Must be at most ${maxLength} character${maxLength === 1 ? "" : "s"}.`;

    if (fieldType === "number") {
      const num = Number(trimmed);
      if (Number.isNaN(num)) return "Please enter a valid number.";
      if (min !== undefined && num < min)
        return max !== undefined ? `Must be between ${min} and ${max}.` : `Must be at least ${min}.`;
      if (max !== undefined && num > max)
        return min !== undefined ? `Must be between ${min} and ${max}.` : `Must be at most ${max}.`;
      if (step !== undefined && step > 0) {
        const adj = (num - (min ?? 0)) / step;
        if (Math.abs(adj - Math.round(adj)) > 1e-6)
          return `Must be a multiple of ${step}.`;
      }
    }

    if (fieldType === "email" && !pattern) {
      if (!/^[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed))
        return "Please enter a valid email address.";
    }
    if (fieldType === "phone" && !pattern) {
      if (!/^[+]?[0-9 ()\-]{7,20}$/.test(trimmed))
        return "Please enter a valid phone number.";
    }
    if (fieldType === "url" && !pattern) {
      if (!/^https?:\/\/[^\s]+$/.test(trimmed))
        return "Please enter a valid URL (start with http:// or https://).";
    }

    if (pattern) {
      try {
        if (!new RegExp(pattern).test(trimmed))
          return `${fieldName ?? "Value"} doesn't match the expected format.`;
      } catch {}
    }

    if (fieldType === "date") {
      const d = new Date(trimmed);
      if (Number.isNaN(d.getTime())) return "Please enter a valid date.";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (minDate === "future" && d <= today) return "Please pick a future date.";
      if (minDate === "today" && d < today) return "Date can't be in the past.";
      if (minDate === "past" && d >= today) return "Please pick a past date.";
      if (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate) && d < new Date(minDate))
        return `Earliest allowed: ${minDate}.`;
      if (maxDate && /^\d{4}-\d{2}-\d{2}$/.test(maxDate) && d > new Date(maxDate))
        return `Latest allowed: ${maxDate}.`;
    }

    return null;
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function send(text?: string) {
    const raw = (text ?? input).trim();
    if (!raw || sending) return;

    if (tab !== "chat") setTab("chat");
    setInput("");

    if (flowId && flowNodes.length > 0) {
      const currentNode = flowNodes[flowNodeIdx - 1];
      if (currentNode?.type === "collect") {
        const err = validateFlowInput(raw, currentNode);
        if (err) { setFlowFieldError(err); return; }
        setFlowFieldError(null);
      }
      setMsgs((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: raw },
      ]);
      const fieldName = currentNode?.data?.fieldName ?? "answer";
      await advanceFlow(raw, fieldName);
      return;
    }

    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: raw },
    ]);

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ content: raw, conversationId: convId ?? undefined }),
      });
      const data = await res.json();
      const d = data?.data ?? data;
      if (d?.conversationId) setConvId(d.conversationId);

      if (d?.action === "invoke_flow" && d?.flowId) {
        await startFlow(d.flowId);
      } else {
        const reply = d?.message?.content ?? d?.content ?? "…";
        addBotMsg(reply);
      }
    } catch {
      addBotMsg("Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function pickChoice(option: { id: string; label: string; value: string }) {
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: option.label },
    ]);
    const currentNode = flowNodes[flowNodeIdx - 1];
    const fieldName = currentNode?.data?.fieldName ?? "choice";
    await advanceFlow(option.value, fieldName);
  }

  function openChat() {
    setTab("chat");
    if (msgs.length === 0) addBotMsg(config.welcomeMessage || "Hi! How can I help?");
  }

  // ── Bot avatar ────────────────────────────────────────────────────────────

  function BotAvatar({ size = 28 }: { size?: number }) {
    return C.launcherIconUrl || config.botAvatarUrl ? (
      <img
        src={config.botAvatarUrl!}
        alt=""
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    ) : (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.accent + "20",
          flexShrink: 0,
          fontSize: size * 0.5,
        }}
      >
        {config.botAvatarEmoji}
      </div>
    );
  }

  // ── Tab config ─────────────────────────────────────────────────────────────

  const tabs = [
    { id: "chat" as const, label: "Chat", icon: Icon.MessageSquareSm },
    { id: "home" as const, label: "Home", icon: Icon.Home },
    ...(config.showHelpCenter
      ? [{ id: "help" as const, label: "Help", icon: Icon.BookOpen }]
      : []),
  ];

  const starters = (config.conversationStarters ?? []).filter((s) => s.label?.trim());
  const qr = (config.widgetQuickReplies ?? []).filter((q) => q.label?.trim());
  const articles = (config.helpArticles ?? []).filter((a) => a.title?.trim());

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif" }}>

      {/* Proactive bubbles */}
      {!open && proactiveBubbles.length > 0 && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            bottom: 88,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
            maxWidth: 280,
            ...posStyle,
          }}
        >
          {proactiveBubbles.map((text, i) => (
            <button
              key={i}
              onClick={openWidget}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "10px 14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                fontSize: 13,
                color: "#111",
                textAlign: "left",
                cursor: "pointer",
                maxWidth: 280,
                lineHeight: 1.4,
                fontFamily: "inherit",
                animation: "ab-pop 0.22s ease",
              }}
            >
              {text}
            </button>
          ))}
          <button
            onClick={clearProactive}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: "#9ca3af",
              cursor: "pointer",
              padding: "2px 4px",
              fontFamily: "inherit",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Launcher FAB */}
      <button
        onClick={() => (open ? setOpen(false) : openWidget())}
        style={{
          position: "fixed",
          bottom: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: C.launcherBg,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          transition: "transform 0.15s",
          ...posStyle,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        title={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <span style={{ color: "#fff", display: "flex" }}><Icon.X /></span>
        ) : C.launcherIconUrl ? (
          <img src={C.launcherIconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
        ) : (
          <span style={{ fontSize: 24 }}>{config.botAvatarEmoji}</span>
        )}
        {!open && proactiveBubbles.length > 0 && (
          <span style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 14,
            height: 14,
            background: "#ef4444",
            borderRadius: "50%",
            border: "2px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            color: "#fff",
            fontWeight: 700,
          }}>
            {proactiveBubbles.length}
          </span>
        )}
      </button>

      {/* Widget panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            zIndex: 9998,
            width: 360,
            height: 560,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#fff",
            ...posStyle,
          }}
        >

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            backgroundColor: C.headerBg,
            flexShrink: 0,
          }}>
            {config.botAvatarUrl ? (
              <img src={config.botAvatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: C.headerText + "25", flexShrink: 0, fontSize: 16,
              }}>
                {config.botAvatarEmoji}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.headerText, fontWeight: 600, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {config.name}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: C.headerText, opacity: 0.75 }}>
                  {config.botSubtitle || "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.headerText, opacity: 0.7, display: "flex", padding: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
            >
              <Icon.X />
            </button>
          </div>

          {/* HOME TAB */}
          {tab === "home" && (
            <div style={{ flex: 1, overflowY: "auto", backgroundColor: C.chatBg, scrollbarWidth: "none" }}>
              {/* Greeting hero */}
              <div style={{ padding: "24px 20px 20px", backgroundColor: C.headerBg + "12" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>
                  {config.homeGreeting}
                </p>
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, margin: "6px 0 0" }}>
                  {config.homeSubgreeting}
                </p>
              </div>

              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Start chat CTA */}
                <button
                  onClick={openChat}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "12px 16px", borderRadius: C.radius,
                    backgroundColor: C.accent, color: "#fff", border: "none",
                    cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon.MessageSquareSm /> Start a conversation
                  </span>
                  <Icon.ChevronRight />
                </button>

                {/* Conversation starters */}
                {starters.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "12px 0 4px", padding: "0 4px" }}>
                      Ask us anything
                    </p>
                    {starters.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s.message || s.label)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", padding: "12px 16px", borderRadius: C.radius,
                          backgroundColor: "#fff", color: "#111827",
                          border: "1px solid #e5e7eb", cursor: "pointer",
                          fontSize: 13, textAlign: "left", fontFamily: "inherit",
                        }}
                      >
                        <span>{s.label}</span>
                        <span style={{ color: "#9ca3af", flexShrink: 0 }}><Icon.ChevronRight /></span>
                      </button>
                    ))}
                  </>
                )}

                {/* Help preview */}
                {config.showHelpCenter && articles.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "12px 0 4px", padding: "0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon.BookOpen /> {config.helpCenterTitle}
                    </p>
                    {articles.slice(0, 3).map((a, i) => (
                      <a
                        key={i}
                        href={a.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: C.radius,
                          backgroundColor: "#fff", color: "#111827",
                          border: "1px solid #e5e7eb", textDecoration: "none", fontSize: 13,
                        }}
                      >
                        <span>{a.title}</span>
                        <span style={{ color: "#9ca3af", flexShrink: 0 }}><Icon.ChevronRight /></span>
                      </a>
                    ))}
                    {config.helpCenterUrl && (
                      <a
                        href={config.helpCenterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, fontWeight: 500, color: C.accent, display: "flex", alignItems: "center", gap: 4, padding: "4px 4px", textDecoration: "none" }}
                      >
                        View all articles <Icon.ChevronRight />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {tab === "chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: C.chatBg }}>
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  scrollbarWidth: "none",
                }}
              >
                {msgs.length === 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <BotAvatar />
                    <div style={{ backgroundColor: C.botBg, borderRadius: C.radius, borderTopLeftRadius: 4, padding: "10px 12px", maxWidth: "80%" }}>
                      <MdText text={config.welcomeMessage || "Hi! How can I help?"} accent={C.accent} fontSize={C.fontSize} />
                    </div>
                  </div>
                )}

                {msgs.map((m) => (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start" }}>
                      {m.role === "bot" && <BotAvatar />}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: "80%" }}>
                        <div style={{
                          borderRadius: C.radius,
                          ...(m.role === "user"
                            ? { borderTopRightRadius: 4, backgroundColor: C.userBg, color: C.userText }
                            : { borderTopLeftRadius: 4, backgroundColor: C.botBg, color: C.botText }),
                          padding: "10px 12px",
                          fontSize: C.fontSize,
                          lineHeight: 1.5,
                        }}>
                          {m.role === "bot"
                            ? <MdText text={m.content} accent={C.accent} fontSize={C.fontSize} />
                            : m.content}
                        </div>
                        {C.showTimestamps && (
                          <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, padding: "0 4px", textAlign: m.role === "user" ? "right" : "left" }}>
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Flow choice buttons */}
                    {m.choices && m.choices.length > 0 && inFlow && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 38 }}>
                        {m.choices.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => pickChoice(opt)}
                            style={{
                              textAlign: "left", fontSize: 13, padding: "8px 12px",
                              borderRadius: C.radius, border: `1px solid ${C.accent}60`,
                              color: C.accent, background: "none", cursor: "pointer",
                              fontFamily: "inherit", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.accent + "10"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {sending && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <BotAvatar />
                    <div style={{ backgroundColor: C.botBg, borderRadius: C.radius, borderTopLeftRadius: 4, padding: "12px 14px", display: "flex", alignItems: "center", gap: 4 }}>
                      {[0, 120, 240].map((delay, i) => (
                        <span key={i} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: C.botText + "80",
                          display: "inline-block",
                          animation: `ab-bounce 1.2s ${delay}ms infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>

              {/* Flow collect input */}
              {(() => {
                const currentNode = inFlow ? flowNodes[flowNodeIdx - 1] : null;
                if (!currentNode || currentNode.type !== "collect") return null;
                const { fieldType = "text", placeholder, helpText } = currentNode.data ?? {};
                const isLong = fieldType === "longtext";

                const inputStyle: React.CSSProperties = {
                  width: "100%",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "8px 12px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "none",
                  color: "#111827",
                  background: "#fff",
                };

                return (
                  <div style={{ padding: "8px 12px 12px", flexShrink: 0, borderTop: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: 6 }}>
                    {isLong ? (
                      <textarea
                        autoFocus rows={3} value={flowFieldValue}
                        onChange={(e) => { setFlowFieldValue(e.target.value); setFlowFieldError(null); }}
                        placeholder={placeholder || "Type your answer…"}
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        autoFocus
                        type={
                          fieldType === "email" ? "email"
                          : fieldType === "phone" ? "tel"
                          : fieldType === "number" ? "number"
                          : fieldType === "url" ? "url"
                          : fieldType === "date" ? "date"
                          : "text"
                        }
                        value={flowFieldValue}
                        onChange={(e) => { setFlowFieldValue(e.target.value); setFlowFieldError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(flowFieldValue); } }}
                        placeholder={placeholder || "Type your answer…"}
                        min={currentNode.data?.min}
                        max={currentNode.data?.max}
                        step={currentNode.data?.step}
                        style={inputStyle}
                      />
                    )}
                    {flowFieldError && <p style={{ fontSize: 11, color: "#ef4444", margin: 0 }}>{flowFieldError}</p>}
                    {helpText && !flowFieldError && <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{helpText}</p>}
                    <button
                      onClick={() => send(flowFieldValue)}
                      disabled={!flowFieldValue.trim()}
                      style={{
                        height: 32, borderRadius: 12, fontSize: 13, fontWeight: 600,
                        color: "#fff", backgroundColor: C.accent, border: "none",
                        cursor: "pointer", fontFamily: "inherit", opacity: flowFieldValue.trim() ? 1 : 0.4,
                      }}
                    >
                      Continue →
                    </button>
                  </div>
                );
              })()}

              {/* Quick reply chips */}
              {qr.length > 0 && !inFlow && msgs.length > 0 && showQuickReplies && (
                <div style={{ padding: "8px 12px 4px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #e5e7eb" }}>
                  {qr.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { send(q.label); setShowQuickReplies(false); }}
                      style={{
                        padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                        border: `1px solid ${C.accent}60`, color: C.accent,
                        background: "none", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Main chat input */}
              {!inFlow && (
                <div style={{ padding: "8px 12px 12px", flexShrink: 0, borderTop: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "6px 10px", backgroundColor: "#fff" }}>
                    {qr.length > 0 && msgs.length > 0 && (
                      <button
                        onClick={() => setShowQuickReplies((v) => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", padding: 2, flexShrink: 0 }}
                        title="Quick replies"
                      >
                        <Icon.ChevronUp rotated={showQuickReplies} />
                      </button>
                    )}
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                      }}
                      placeholder={config.inputPlaceholder}
                      disabled={sending}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        fontSize: 13, color: "#111827", fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || sending}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                        backgroundColor: C.accent, border: "none", cursor: "pointer",
                        color: "#fff", opacity: input.trim() && !sending ? 1 : 0.4,
                        transition: "opacity 0.15s",
                      }}
                    >
                      <Icon.Send />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HELP TAB */}
          {tab === "help" && config.showHelpCenter && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, backgroundColor: C.chatBg, scrollbarWidth: "none" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.accent }}><Icon.BookOpen /></span>
                {config.helpCenterTitle}
              </p>

              {articles.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 8, color: "#d1d5db" }}>
                  <Icon.BookOpen />
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No articles added yet.</p>
                </div>
              ) : (
                articles.map((a, i) => (
                  <a
                    key={i}
                    href={a.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: C.radius,
                      backgroundColor: "#fff", color: "#111827",
                      border: "1px solid #e5e7eb", textDecoration: "none", fontSize: 13,
                    }}
                  >
                    <span>{a.title}</span>
                    <span style={{ color: "#9ca3af", flexShrink: 0 }}><Icon.ChevronRight /></span>
                  </a>
                ))
              )}

              {config.helpCenterUrl && (
                <a
                  href={config.helpCenterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 500, color: C.accent, display: "flex", alignItems: "center", gap: 4, padding: "4px 4px", textDecoration: "none", marginTop: 8 }}
                >
                  View all articles <Icon.ChevronRight />
                </a>
              )}
            </div>
          )}

          {/* Footer */}
          {(config.showPoweredBy || config.businessHoursText) && (
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 16px", borderTop: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
              {config.businessHoursText && (
                <span style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {config.businessHoursText}
                </span>
              )}
              {config.showPoweredBy && (
                <a
                  href={config.footerLinkUrl || "#"}
                  target={config.footerLinkUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  style={{ fontSize: 10, color: "#9ca3af", textDecoration: "none", marginLeft: "auto", flexShrink: 0 }}
                >
                  {config.footerText || "Powered by AskBase"}
                </a>
              )}
            </div>
          )}

          {/* Tab bar */}
          <div style={{ flexShrink: 0, display: "flex", borderTop: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
            {tabs.map(({ id, label, icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => { if (id === "chat") { openChat(); } else { setTab(id); } }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 2, padding: "10px 0",
                  fontSize: 10, fontWeight: 500, border: "none", background: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  color: tab === id ? C.accent : "#9ca3af",
                  transition: "color 0.15s",
                }}
              >
                <TabIcon />
                {label}
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
