"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Check, Database, Loader2, Plus, Sparkles, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ToneCard } from "@/components/tone-card";
import { ColorSwatch } from "@/components/color-swatch";
import { IntentChip, TryItPanel, useOnboarding } from "@/components/onboarding";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const TONE_OPTIONS: {
  value: "friendly" | "formal" | "technical" | "concise" | "compact" | "custom";
  icon: string;
  label: string;
}[] = [
  { value: "friendly",  icon: "/icons/tone-friendly.svg",  label: "Friendly"  },
  { value: "formal",    icon: "/icons/tone-formal.svg",    label: "Formal"    },
  { value: "technical", icon: "/icons/tone-technical.svg", label: "Technical" },
  { value: "concise",   icon: "/icons/tone-concise.svg",   label: "Concise"   },
  { value: "compact",   icon: "/icons/tone-compact.svg",   label: "Compact"   },
  { value: "custom",    icon: "/icons/tone-custom.svg",    label: "Custom"    },
];

export default function BuildPage() {
  const router = useRouter();
  const ctx = useOnboarding();
  const [building, setBuilding] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const widgetStyle = "modern";
  const [addIntentOpen, setAddIntentOpen] = useState(false);
  const [aiDescribe, setAiDescribe] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx.config) router.replace("/dashboard/bots/new/describe");
  }, [ctx.config, router]);

  const cfg = ctx.config;
  const intents = ctx.intents ?? [];
  const enabledIntents = useMemo(() => intents.filter((i) => i.enabled), [intents]);
  const showTone = cfg?.primaryMode === "ai_agent" || cfg?.primaryMode === "hybrid";
  const showTriggers = cfg?.primaryMode !== "flow";

  async function handleGenerateIntent() {
    const description = aiDescribe.trim();
    if (!description || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await api.post("/projects/generate-intent", {
        description,
        botContext: cfg?.systemPrompt ?? ctx.description,
      });
      const raw = res.data?.data ?? res.data;
      ctx.addIntent({
        label: String(raw.label ?? "New flow").slice(0, 60),
        triggers: Array.isArray(raw.triggers) ? raw.triggers : (raw.trigger ? [raw.trigger] : []),
        fields: Array.isArray(raw.fields) ? raw.fields : [],
        successMessage: String(raw.successMessage ?? "Thanks — we'll be in touch."),
        enabled: true,
      });
      setAiDescribe("");
      setAddIntentOpen(false);
    } catch (err: any) {
      setAiError(err?.response?.data?.error || err?.message || "Failed to generate.");
    } finally {
      setAiBusy(false);
    }
  }

  function handleBuild() {
    setWarning(null);
    if (!cfg?.name?.trim()) { setWarning("Give your assistant a name first."); return; }
    const allowZero = cfg?.primaryMode === "ai_agent";
    if (!allowZero && enabledIntents.length === 0) {
      setWarning("Enable at least one capability.");
      return;
    }
    setBuilding(true);
    try {
      sessionStorage.setItem("askbase_install_payload", JSON.stringify({ config: cfg, intents: enabledIntents, widgetStyle }));
      sessionStorage.setItem("askbase_install_config_snapshot", JSON.stringify(cfg));
    } catch {}
    router.push("/dashboard/bots/new/installing");
  }

  if (!cfg) return null;

  const draftConfig = {
    name: cfg.name,
    systemPrompt: cfg.systemPrompt ?? "",
    tone: cfg.tone,
    primaryMode: cfg.primaryMode,
    primaryColor: cfg.primaryColor,
    welcomeMessage: cfg.welcomeMessage,
    suggestedIntents: enabledIntents,
    botAvatarEmoji: cfg.botAvatarEmoji,
    botSubtitle: cfg.botSubtitle,
    inputPlaceholder: cfg.inputPlaceholder,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* ── LEFT: scrollable config ─────────────────────────────────────── */}
      <aside className="w-[480px] flex-shrink-0 h-screen flex flex-col border-r border-border">

        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-border/60 shrink-0 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/bots/new/ai")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold tracking-tight truncate">Review your assistant</h2>
            <p className="text-xs text-muted-foreground mt-0.5">AI pre-filled everything — edit anything you'd like</p>
          </div>
          <Button
            className="h-9 px-5 gap-1.5 font-semibold shrink-0"
            disabled={building}
            onClick={handleBuild}
          >
            {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {building ? "Building…" : "Create"}
          </Button>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-7"
          style={{ scrollbarWidth: "none" }}
        >

          {warning && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 flex items-center gap-2">
              <X className="w-3.5 h-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{warning}</p>
            </div>
          )}

          {/* ── Name ── */}
          <Section label="Assistant name">
            <input
              value={cfg.name}
              onChange={(e) => ctx.patchConfig?.({ name: e.target.value })}
              placeholder="Untitled"
              className="w-full h-11 px-3 rounded-xl border border-border bg-card text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </Section>

          {/* ── System prompt ── */}
          {cfg.systemPrompt && (
            <Section label="System prompt">
              <Textarea
                value={cfg.systemPrompt}
                onChange={(e) => ctx.patchConfig?.({ systemPrompt: e.target.value })}
                rows={5}
                className="text-sm resize-none rounded-xl leading-relaxed"
              />
            </Section>
          )}

          {/* ── Widget identity ── */}
          <Section label="Widget identity">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={cfg.botAvatarEmoji ?? "💬"}
                  onChange={(e) => ctx.patchConfig?.({ botAvatarEmoji: e.target.value })}
                  maxLength={2}
                  className="w-14 h-10 text-center text-xl rounded-xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
                <input
                  value={cfg.botSubtitle ?? ""}
                  onChange={(e) => ctx.patchConfig?.({ botSubtitle: e.target.value })}
                  placeholder="Always here to help"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
              <input
                value={cfg.inputPlaceholder ?? ""}
                onChange={(e) => ctx.patchConfig?.({ inputPlaceholder: e.target.value })}
                placeholder="Type a message…"
                className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              />
              <p className="text-[11px] text-muted-foreground px-0.5">Emoji · subtitle · chat input placeholder</p>
            </div>
          </Section>

          {/* ── Welcome message ── */}
          <Section label="Welcome message">
            <Textarea
              value={cfg.welcomeMessage ?? ""}
              onChange={(e) => ctx.patchConfig?.({ welcomeMessage: e.target.value })}
              placeholder="Hi there 👋 How can we help?"
              rows={2}
              className="text-sm resize-none rounded-xl"
            />
          </Section>

          {/* ── Brand color ── */}
          <Section label="Brand color">
            <ColorSwatch
              value={cfg.primaryColor}
              onChange={(color) => ctx.patchConfig?.({ primaryColor: color })}
            />
          </Section>

          {/* ── Tone ── */}
          {showTone && (
            <Section label="Tone">
              <div className="grid grid-cols-3 gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <ToneCard
                    key={opt.value}
                    value={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    selected={cfg.tone === opt.value}
                    onClick={() => ctx.patchConfig?.({ tone: opt.value })}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ── Capabilities ── */}
          <Section label="Capabilities">
            <div className="flex flex-col gap-2">
              {intents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {cfg.primaryMode === "ai_agent"
                      ? "No structured flows — AI answers open questions freely."
                      : "Add at least one capability."}
                  </p>
                </div>
              ) : (
                intents.map((intent, idx) => (
                  <IntentChip
                    key={intent.label + idx}
                    label={intent.label}
                    triggers={Array.isArray(intent.triggers) ? intent.triggers : (intent.trigger ? [intent.trigger] : [])}
                    fields={intent.fields ?? []}
                    successMessage={intent.successMessage ?? ""}
                    enabled={!!intent.enabled}
                    showTriggers={showTriggers}
                    onToggle={() => ctx.toggleIntent(intent.label)}
                    onEdit={(patch) => ctx.updateIntent(intent.label, patch)}
                    onRemove={() => ctx.removeIntent(intent.label)}
                  />
                ))
              )}
              <button
                type="button"
                onClick={() => setAddIntentOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border transition-all"
              >
                <Plus className="w-4 h-4" />
                Add a capability with AI
              </button>
            </div>
          </Section>

          {/* ── Knowledge base hints ── */}
          {cfg.kbHints && cfg.kbHints.length > 0 && (
            <Section label="Knowledge base">
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-xs font-medium text-foreground">Add this content so your assistant answers well</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cfg.kbHints.map((hint, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/60">You can upload documents after creating your assistant.</p>
              </div>
            </Section>
          )}

        </div>
      </aside>

      {/* ── RIGHT: live preview ─────────────────────────────────────────────── */}
      <main className="flex-1 h-screen overflow-hidden bg-muted/15 flex flex-col items-center justify-center gap-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">Live preview</p>
        <div className="w-full max-w-[420px] px-6 h-[calc(100%-6rem)]">
          <TryItPanel draftConfig={draftConfig} className="h-full shadow-2xl shadow-black/10" />
        </div>
      </main>

      {/* ── Add capability dialog ── */}
      <Dialog open={addIntentOpen} onOpenChange={(open) => { setAddIntentOpen(open); if (!open) { setAiDescribe(""); setAiError(null); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Add a capability
            </DialogTitle>
            <DialogDescription>
              Describe what visitors should be able to do — AI builds the form, triggers, and success message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={3}
            value={aiDescribe}
            onChange={(e) => setAiDescribe(e.target.value)}
            placeholder="e.g. Book a consultation — collect name, email, and preferred date"
            className="text-sm resize-none"
            disabled={aiBusy}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerateIntent(); }}
          />
          {aiError && <p className="text-xs text-destructive">{aiError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIntentOpen(false)}>Cancel</Button>
            <Button disabled={!aiDescribe.trim() || aiBusy} onClick={handleGenerateIntent} className="gap-1.5">
              {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {aiBusy ? "Building…" : "Build capability"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}
