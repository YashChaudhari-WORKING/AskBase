"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/components/onboarding";
import api from "@/lib/api";

const EXAMPLES = [
  { label: "SaaS support",      description: "Answer billing, plan, and feature questions for my project management SaaS." },
  { label: "E-commerce",        description: "Handle returns, shipping, and order status questions for an online clothing store." },
  { label: "Healthcare clinic", description: "Answer patient questions about services, timings, and insurance — and collect contact info for follow-ups." },
  { label: "Real estate",       description: "Answer property questions and book site visits for a Mumbai real estate agency." },
  { label: "EdTech",            description: "Answer course and admission queries for an online coding bootcamp." },
];

function useRotatingExample(intervalMs = 4000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % EXAMPLES.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return EXAMPLES[index];
}

export default function AiDescribePage() {
  const router = useRouter();
  const ctx = useOnboarding();
  const [text, setText] = useState(ctx.description ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rotating = useRotatingExample();

  async function handleBuild(description?: string) {
    const trimmed = (description ?? text).trim();
    if (!trimmed || generating) return;
    setGenerating(true);
    setError(null);
    try {
      ctx.setDescription(trimmed);
      let goal: string | null = null;
      try { goal = sessionStorage.getItem("askbase_goal"); } catch {}
      const res = await api.post("/projects/generate-config", { description: trimmed, goal });
      const raw = res.data?.data ?? res.data;
      // If user picked Flow card, force flow mode regardless of AI classification
      const forcedMode = goal === "flow" ? "flow" : (raw.primaryMode === "ai" ? "ai_agent" : raw.primaryMode);
      ctx.setConfig({
        ...raw,
        primaryMode: forcedMode,
        assistantType: goal === "flow" ? "flow" : (raw.assistantType ?? raw.primaryMode),
      });
      router.push("/dashboard/bots/new/build");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to generate. Try rephrasing.");
      setGenerating(false);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-background overflow-hidden">
      <div className="w-full max-w-xl flex flex-col gap-7">

        <button
          type="button"
          onClick={() => router.push("/dashboard/bots/new")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            What should your assistant help with?
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe your business and what visitors ask — AI sets everything up.
          </p>
        </div>

        {/* ── Manual describe ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <Textarea
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder={text ? "" : rotating.description}
            className="min-h-[120px] text-sm rounded-xl border-border/60 bg-card resize-none p-4 focus-visible:ring-1"
            disabled={generating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleBuild();
              }
            }}
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">⌘</kbd>{" "}
              <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">↵</kbd>
              {" "}to continue
            </span>
            <Button
              size="default"
              disabled={!text.trim() || generating}
              onClick={() => handleBuild()}
              className="rounded-xl gap-1.5 h-9 px-4 text-sm font-medium"
            >
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating</>
              ) : (
                <>Continue <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Example chips */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-muted-foreground">Examples</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => { setText(ex.description); textareaRef.current?.focus(); }}
                disabled={generating}
                className="rounded-lg border border-border/60 bg-card hover:bg-accent hover:border-border px-2.5 py-1 text-[11px] text-foreground transition-colors disabled:opacity-50"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
