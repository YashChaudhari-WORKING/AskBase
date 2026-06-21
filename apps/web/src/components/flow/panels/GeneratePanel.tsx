"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface Props {
  flowId: string;
  onGenerated: (nodes: any[], edges: any[]) => void;
  onClose: () => void;
}

const EXAMPLES = [
  "Collect visitor's name, email and company, then save as a lead",
  "Book a demo: ask name, email, preferred date, then save and send webhook",
  "Support ticket: ask issue type via choice, collect description and email, save lead",
  "Qualify leads: ask budget range via choice, then collect name and email",
];

export function GeneratePanel({ flowId, onGenerated, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/flows/generate", { prompt });
      const { nodes, edges } = r.data.data;
      onGenerated(nodes, edges);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Generate Flow with AI</p>
              <p className="text-xs text-muted-foreground">Describe what you want — AI builds the nodes</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Describe your flow
            </label>
            <textarea
              autoFocus
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
              placeholder="e.g. Collect visitor's name, email, and company, then save as a lead and send to our CRM webhook"
              rows={4}
              disabled={loading}
              className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none disabled:opacity-50"
            />
            <p className="text-[11px] text-muted-foreground/40">Tip: Ctrl+Enter to generate</p>
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Examples</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  disabled={loading}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/20 transition-all disabled:opacity-40 truncate"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              This will replace your current flow canvas. Save your work first if needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building flow…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Flow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
