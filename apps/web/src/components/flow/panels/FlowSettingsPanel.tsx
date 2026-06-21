"use client";

import { X, Settings2, Info, Wrench } from "lucide-react";
import { FormField, FieldInput, FieldTextarea, FieldSelect, FieldCheckbox } from "../configs/FormField";

export interface FlowSettings {
  description: string;
  mode: "standalone" | "ai_tool";
  toolDescription: string;
}

interface Props {
  settings: FlowSettings;
  onChange: (s: FlowSettings) => void;
  onClose: () => void;
}

export function FlowSettingsPanel({ settings, onChange, onClose }: Props) {
  const set = (patch: Partial<FlowSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Flow Settings</p>
              <p className="text-xs text-muted-foreground">Configure flow behaviour and metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Description</p>
            </div>
            <FieldTextarea
              value={settings.description}
              onChange={v => set({ description: v })}
              placeholder="Describe what this flow does…"
              rows={2}
            />
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground/60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Mode</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["standalone", "ai_tool"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => set({ mode: m })}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    settings.mode === m
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <p className="font-semibold">{m === "standalone" ? "Standalone" : "AI Tool"}</p>
                  <p className="text-[10px] font-normal mt-0.5 opacity-70">
                    {m === "standalone" ? "Runs as a widget flow" : "Called by AI mid-chat"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tool description — only shown when mode = ai_tool */}
          {settings.mode === "ai_tool" && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Tool description
              </p>
              <FieldTextarea
                value={settings.toolDescription}
                onChange={v => set({ toolDescription: v })}
                placeholder="Describe when the AI should invoke this flow, e.g. 'Use this to collect a lead when the user asks to book a demo'"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground/50">
                This description is shown to the AI so it knows when to call this flow.
              </p>
            </div>
          )}

          {/* Info box */}
          <div className="px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Settings are saved with the flow when you click Save in the builder.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
