"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "@/components/onboarding";
import api from "@/lib/api";

export default function DescribePage() {
  const router = useRouter();
  const ctx = useOnboarding();
  const [text, setText] = useState(ctx.description ?? "");
  const [generating, setGenerating] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  // Keep textarea in sync with context if user hits back/forward
  useEffect(() => {
    if (ctx.description && !text) setText(ctx.description);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.description]);

  async function handleBuild() {
    const trimmed = text.trim();
    if (!trimmed || generating) return;
    setGenerating(true);
    try {
      ctx.setDescription(trimmed);
      const res = await api.post("/projects/generate-config", {
        description: trimmed,
      });
      const raw = res.data?.data ?? res.data;
      const config = {
        ...raw,
        primaryMode: raw.primaryMode === "ai" ? "ai_agent" : raw.primaryMode,
      };
      ctx.setConfig(config);
      router.push("/dashboard/bots/new/build");
    } catch {
      setGenerating(false);
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center px-6">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/bots/new")}
          className="self-start text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            What should your assistant help with?
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Describe it in plain English — we&apos;ll handle the rest.
          </p>
        </div>

        {/* Textarea */}
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Answer billing questions for my SaaS, book demo calls, handle returns..."
          className="min-h-[160px] rounded-xl text-base w-full p-4"
          disabled={generating}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleBuild();
            }
          }}
        />

        {/* Build button */}
        <Button
          size="lg"
          className={`w-full rounded-xl gap-2 transition-all duration-300 ${
            generating ? "animate-pulse" : ""
          }`}
          disabled={!text.trim() || generating}
          onClick={handleBuild}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building...
            </>
          ) : (
            <>
              Build it
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {/* Disclosure */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowDisclosure((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                showDisclosure ? "rotate-0" : "-rotate-90"
              }`}
            />
            When to use AI vs Flow vs Hybrid?
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              showDisclosure
                ? "max-h-40 opacity-100 mt-3"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p>
                <span className="font-semibold text-foreground">AI</span> — best
                for open-ended Q&amp;A grounded in your docs and knowledge base.
              </p>
              <p>
                <span className="font-semibold text-foreground">Flow</span> —
                best for structured tasks like booking, lead capture, and
                step-by-step intake.
              </p>
              <p>
                <span className="font-semibold text-foreground">Hybrid</span> —
                combines both: free chat plus guided flows for specific intents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
