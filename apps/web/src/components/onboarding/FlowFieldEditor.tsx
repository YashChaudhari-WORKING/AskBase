"use client"

import * as React from "react"
import { Plus, X, ChevronDown, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { FieldType, IntentField } from "./OnboardingState"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorPayload {
  label: string
  triggers: string[]
  fields: IntentField[]
  successMessage: string
}

interface FlowFieldEditorProps {
  label: string
  triggers: string[]
  fields: IntentField[]
  successMessage: string
  showTriggers?: boolean
  onSave: (updated: EditorPayload) => void
  onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text",     label: "Text"      },
  { value: "email",    label: "Email"     },
  { value: "phone",    label: "Phone"     },
  { value: "date",     label: "Date"      },
  { value: "number",   label: "Number"    },
  { value: "longtext", label: "Long text" },
  { value: "select",   label: "Select"    },
]

const DATE_PRESETS = [
  { value: "",         label: "Any date"    },
  { value: "today",    label: "Today onward" },
  { value: "future",   label: "Future only"  },
  { value: "past",     label: "Past only"    },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

let _autoId = 0
function nextKey(label: string) {
  const base = slugify(label) || "field"
  _autoId += 1
  return `${base}_${_autoId}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FlowFieldEditor({
  label: initialLabel,
  triggers: initialTriggers,
  fields: initialFields,
  successMessage: initialSuccess,
  showTriggers = true,
  onSave,
  onCancel,
}: FlowFieldEditorProps) {
  const [label, setLabel] = React.useState(initialLabel)
  const [triggers, setTriggers] = React.useState<string[]>(initialTriggers ?? [])
  const [newTrigger, setNewTrigger] = React.useState("")
  const [fields, setFields] = React.useState<IntentField[]>(initialFields)
  const [successMessage, setSuccessMessage] = React.useState(initialSuccess)
  const [expandedField, setExpandedField] = React.useState<number | null>(null)

  function patchField(idx: number, patch: Partial<IntentField>) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  function removeField(idx: number) {
    setFields((prev) => prev.filter((_, i) => i !== idx))
    if (expandedField === idx) setExpandedField(null)
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      { key: nextKey("field"), label: "New field", type: "text", required: false },
    ])
    setExpandedField(fields.length)
  }

  function handleSave() {
    const cleanedTriggers = triggers.map((t) => t.trim()).filter(Boolean)
    onSave({
      label: label.trim() || initialLabel,
      triggers: cleanedTriggers,
      fields: fields.map((f) => ({
        ...f,
        key: f.key || slugify(f.label) || nextKey(f.label),
        label: f.label.trim() || "Untitled",
      })),
      successMessage: successMessage.trim(),
    })
  }

  function addTrigger() {
    const t = newTrigger.trim()
    if (!t || triggers.includes(t)) return
    setTriggers((prev) => [...prev, t])
    setNewTrigger("")
  }

  function removeTrigger(idx: number) {
    setTriggers((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-muted-foreground">Flow name</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Book a demo"
          className="h-8 text-sm"
        />
      </div>

      {/* Triggers */}
      {showTriggers && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">
            Trigger phrases
          </label>

          <div className="flex flex-wrap gap-1.5">
            {triggers.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-muted border border-border text-foreground text-[11px] pl-2 pr-1 py-0.5"
              >
                <span>&ldquo;{t}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => removeTrigger(idx)}
                  aria-label="Remove trigger"
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-accent"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {triggers.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">
                None yet — add what visitors might type.
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTrigger()
                }
              }}
              placeholder='e.g. "I want admission"'
              className="h-7 text-xs flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addTrigger}
              disabled={!newTrigger.trim()}
              className="h-7 px-2 text-xs"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-muted-foreground">Fields to capture</label>

        <div className="flex flex-col gap-2">
          {fields.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No fields yet — add one below.
            </p>
          )}

          {fields.map((field, idx) => (
            <FieldRow
              key={field.key || idx}
              field={field}
              isOpen={expandedField === idx}
              onToggle={() => setExpandedField((prev) => (prev === idx ? null : idx))}
              onPatch={(patch) => patchField(idx, patch)}
              onRemove={() => removeField(idx)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addField}
          className="self-start h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          Add field
        </Button>
      </div>

      {/* Success message */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-muted-foreground">
          Shown after capture
        </label>
        <Textarea
          value={successMessage}
          onChange={(e) => setSuccessMessage(e.target.value)}
          placeholder="e.g. Thanks! We'll be in touch within 24 hours."
          className="min-h-[52px] text-xs"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="button" size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FieldRow — primary row + expandable validation panel
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  isOpen,
  onToggle,
  onPatch,
  onRemove,
}: {
  field: IntentField
  isOpen: boolean
  onToggle: () => void
  onPatch: (patch: Partial<IntentField>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card overflow-hidden">
      {/* Primary row */}
      <div className="flex items-center gap-2 p-2">
        <Input
          value={field.label}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder="Label"
          className="h-8 text-xs flex-1 min-w-0"
        />

        <Select
          value={field.type}
          onValueChange={(v) => {
            const next: Partial<IntentField> = { type: v as FieldType }
            if (v === "select" && (!field.options || field.options.length === 0)) {
              next.options = [
                { label: "Option 1", value: "option_1" },
                { label: "Option 2", value: "option_2" },
              ]
            }
            onPatch(next)
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[88px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => onPatch({ required: !field.required })}
          title={field.required ? "Required" : "Optional"}
          aria-label={field.required ? "Required" : "Optional"}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md border text-xs font-semibold transition-colors shrink-0",
            field.required
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border hover:bg-accent"
          )}
        >
          *
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse options" : "Expand options"}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 transition-all",
            isOpen && "bg-accent text-foreground"
          )}
        >
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove field"
          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded validation panel */}
      {isOpen && (
        <div className="border-t border-border/60 bg-muted/30 p-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <ValidationPanel field={field} onPatch={onPatch} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ValidationPanel — fields based on field.type
// ─────────────────────────────────────────────────────────────────────────────

function ValidationPanel({
  field,
  onPatch,
}: {
  field: IntentField
  onPatch: (patch: Partial<IntentField>) => void
}) {
  return (
    <>
      {/* Common — placeholder + help text */}
      <div className="grid grid-cols-2 gap-2">
        <MiniField label="Placeholder">
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onPatch({ placeholder: e.target.value })}
            placeholder='e.g. "you@company.com"'
            className="h-7 text-xs"
          />
        </MiniField>
        <MiniField label="Help text">
          <Input
            value={field.helpText ?? ""}
            onChange={(e) => onPatch({ helpText: e.target.value })}
            placeholder="Hint shown below"
            className="h-7 text-xs"
          />
        </MiniField>
      </div>

      {/* Per-type validation */}
      {(field.type === "text" || field.type === "longtext") && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <MiniField label="Min length">
              <Input
                type="number"
                value={field.minLength ?? ""}
                onChange={(e) =>
                  onPatch({ minLength: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="0"
                className="h-7 text-xs"
              />
            </MiniField>
            <MiniField label="Max length">
              <Input
                type="number"
                value={field.maxLength ?? ""}
                onChange={(e) =>
                  onPatch({ maxLength: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="∞"
                className="h-7 text-xs"
              />
            </MiniField>
          </div>
          <MiniField label="Pattern (regex, advanced)">
            <Input
              value={field.pattern ?? ""}
              onChange={(e) => onPatch({ pattern: e.target.value })}
              placeholder="e.g. ^[A-Za-z ]+$"
              className="h-7 text-xs font-mono"
            />
          </MiniField>
        </>
      )}

      {field.type === "number" && (
        <div className="grid grid-cols-3 gap-2">
          <MiniField label="Min">
            <Input
              type="number"
              value={field.min ?? ""}
              onChange={(e) =>
                onPatch({ min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="—"
              className="h-7 text-xs"
            />
          </MiniField>
          <MiniField label="Max">
            <Input
              type="number"
              value={field.max ?? ""}
              onChange={(e) =>
                onPatch({ max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="—"
              className="h-7 text-xs"
            />
          </MiniField>
          <MiniField label="Step">
            <Input
              type="number"
              value={field.step ?? ""}
              onChange={(e) =>
                onPatch({ step: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="1"
              className="h-7 text-xs"
            />
          </MiniField>
        </div>
      )}

      {field.type === "date" && (
        <div className="grid grid-cols-2 gap-2">
          <MiniField label="Constraint">
            <Select
              value={field.minDate ?? ""}
              onValueChange={(v) => onPatch({ minDate: v || undefined })}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Any date" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((d) => (
                  <SelectItem key={d.value || "any"} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MiniField>
          <MiniField label="Latest accepted">
            <Input
              type="date"
              value={field.maxDate && /^\d{4}-\d{2}-\d{2}$/.test(field.maxDate) ? field.maxDate : ""}
              onChange={(e) => onPatch({ maxDate: e.target.value || undefined })}
              className="h-7 text-xs"
            />
          </MiniField>
        </div>
      )}

      {(field.type === "email" || field.type === "phone") && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <MiniField label="Min length">
              <Input
                type="number"
                value={field.minLength ?? ""}
                onChange={(e) =>
                  onPatch({ minLength: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder={field.type === "phone" ? "7" : "5"}
                className="h-7 text-xs"
              />
            </MiniField>
            <MiniField label="Max length">
              <Input
                type="number"
                value={field.maxLength ?? ""}
                onChange={(e) =>
                  onPatch({ maxLength: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder={field.type === "phone" ? "20" : "254"}
                className="h-7 text-xs"
              />
            </MiniField>
          </div>
          <MiniField label="Pattern (regex)">
            <Input
              value={field.pattern ?? ""}
              onChange={(e) => onPatch({ pattern: e.target.value })}
              placeholder={
                field.type === "email"
                  ? "^[\\w.+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
                  : "^[+]?[0-9 ()\\-]{7,20}$"
              }
              className="h-7 text-xs font-mono"
            />
          </MiniField>
        </>
      )}

      {/* Select-specific — multiple + options editor */}
      {field.type === "select" && (
        <>
          <label className="inline-flex items-center gap-2 text-[11px] text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={!!field.multiple}
              onChange={(e) => onPatch({ multiple: e.target.checked })}
              className="rounded border-border"
            />
            Allow choosing multiple
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Options</span>
            {(field.options ?? []).map((opt, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                <Input
                  value={opt.label}
                  onChange={(e) => {
                    const next = [...(field.options ?? [])]
                    next[oi] = { ...next[oi], label: e.target.value, value: slugify(e.target.value) }
                    onPatch({ options: next })
                  }}
                  placeholder="Option label"
                  className="h-7 text-xs flex-1 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (field.options ?? []).filter((_, i) => i !== oi)
                    onPatch({ options: next })
                  }}
                  aria-label="Remove option"
                  className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(field.options ?? []), { label: "", value: "" }]
                onPatch({ options: next })
              }}
              className="self-start inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3 h-3" />
              Add option
            </button>
          </div>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
