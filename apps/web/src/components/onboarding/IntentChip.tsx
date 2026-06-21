"use client"

import * as React from "react"
import { Check, Pencil, X, Sparkles, ChevronDown } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { FlowFieldEditor } from "./FlowFieldEditor"
import type { IntentField } from "./OnboardingState"

interface IntentChipProps {
  label: string
  triggers: string[]
  fields: IntentField[]
  successMessage: string
  enabled: boolean
  showTriggers?: boolean
  onToggle: () => void
  onEdit: (updated: {
    label: string
    triggers: string[]
    fields: IntentField[]
    successMessage: string
  }) => void
  onRemove?: () => void
}

const TYPE_LABEL: Record<string, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  date: "Date",
  number: "Number",
  longtext: "Long text",
  select: "Select",
  url: "URL",
}

const TYPE_COLOR: Record<string, string> = {
  text: "bg-slate-500/10 text-slate-500",
  email: "bg-violet-500/10 text-violet-500",
  phone: "bg-emerald-500/10 text-emerald-500",
  date: "bg-amber-500/10 text-amber-500",
  number: "bg-blue-500/10 text-blue-500",
  longtext: "bg-rose-500/10 text-rose-500",
  select: "bg-orange-500/10 text-orange-500",
  url: "bg-cyan-500/10 text-cyan-500",
}

export function IntentChip({
  label,
  triggers,
  fields,
  successMessage,
  enabled,
  showTriggers = true,
  onToggle,
  onEdit,
  onRemove,
}: IntentChipProps) {
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState(enabled)

  React.useEffect(() => {
    if (enabled) setExpanded(true)
  }, [enabled])

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        enabled
          ? "border-primary/30 bg-primary/[0.03] shadow-sm"
          : "border-border/60 bg-card/40 opacity-70"
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all",
            enabled
              ? "bg-primary border-primary text-primary-foreground shadow-sm"
              : "bg-transparent border-border hover:border-muted-foreground"
          )}
        >
          {enabled && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>

        {/* Label */}
        <span
          className={cn(
            "text-sm font-semibold flex-1 truncate cursor-pointer select-none",
            enabled ? "text-foreground" : "text-muted-foreground"
          )}
          onClick={onToggle}
        >
          {label}
        </span>

        {/* Field count badge */}
        {fields.length > 0 && (
          <span className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
            enabled ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {fields.length} {fields.length === 1 ? "field" : "fields"}
          </span>
        )}

        {/* Edit */}
        <Popover open={editorOpen} onOpenChange={setEditorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Edit ${label}`}
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="w-[480px] p-4" onClick={(e) => e.stopPropagation()}>
            <FlowFieldEditor
              label={label}
              triggers={triggers}
              fields={fields}
              successMessage={successMessage}
              showTriggers={showTriggers}
              onSave={(updated) => { onEdit(updated); setEditorOpen(false) }}
              onCancel={() => setEditorOpen(false)}
            />
          </PopoverContent>
        </Popover>

        {/* Remove */}
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Expand toggle */}
        {enabled && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </div>

      {/* ── Expanded body ── */}
      {enabled && expanded && (
        <div className="border-t border-primary/10 px-3.5 py-3 flex flex-col gap-3">
          {/* Fields */}
          {fields.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {fields.map((f, idx) => (
                <div key={f.key || idx} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-[12px] text-foreground/80 font-medium truncate flex-1">{f.label}</span>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", TYPE_COLOR[f.type] ?? "bg-muted text-muted-foreground")}>
                    {TYPE_LABEL[f.type] ?? f.type}
                  </span>
                  {f.required && <span className="text-primary text-[10px] font-bold shrink-0">*</span>}
                </div>
              ))}
            </div>
          )}

          {/* Triggers */}
          {showTriggers && triggers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                <Sparkles className="w-3 h-3" />
                Triggered by
              </div>
              <div className="flex flex-wrap gap-1">
                {triggers.map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] rounded-full bg-background border border-border/60 text-muted-foreground px-2 py-0.5 truncate max-w-[200px]"
                  >
                    &ldquo;{t}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
