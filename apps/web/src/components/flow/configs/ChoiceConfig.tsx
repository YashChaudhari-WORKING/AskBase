"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import type { ChoiceData, ChoiceOption } from "../types";
import { FormField, FieldInput, FieldCheckbox } from "./FormField";

interface Props {
  data: ChoiceData;
  onChange: (data: ChoiceData) => void;
}

export function ChoiceConfig({ data, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const set = (patch: Partial<ChoiceData>) => onChange({ ...data, ...patch });

  function updateOption(id: string, patch: Partial<ChoiceOption>) {
    set({
      options: data.options.map(o => o.id === id ? { ...o, ...patch } : o),
    });
  }

  function addOption() {
    const next = data.options.length + 1;
    set({
      options: [
        ...data.options,
        { id: `opt_${Date.now()}`, label: `Option ${next}`, value: `option_${next}` },
      ],
    });
  }

  function removeOption(id: string) {
    set({ options: data.options.filter(o => o.id !== id) });
  }

  return (
    <div className="space-y-4">
      <FormField label="Question">
        <FieldInput
          value={data.question}
          onChange={v => set({ question: v })}
          placeholder="What are you interested in?"
        />
      </FormField>

      <FormField label="Field name (key)">
        <FieldInput
          value={data.fieldName}
          onChange={v => set({ fieldName: v.toLowerCase().replace(/\s+/g, "_") })}
          placeholder="interest"
          className="font-mono"
        />
      </FormField>

      <FormField label="Options">
        <div className="space-y-2">
          {data.options.map(opt => (
            <div key={opt.id} className="flex items-center gap-1.5">
              <FieldInput
                value={opt.label}
                onChange={v => updateOption(opt.id, {
                  label: v,
                  value: v.toLowerCase().replace(/\s+/g, "_"),
                })}
                placeholder="Option label"
                className="flex-1"
              />
              <button
                onClick={() => removeOption(opt.id)}
                disabled={data.options.length <= 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add option
          </button>
        </div>
      </FormField>

      <FieldCheckbox
        label="Allow multiple selections"
        checked={data.multiple}
        onChange={v => set({ multiple: v })}
      />

      <FieldCheckbox
        label="Required"
        checked={data.required ?? true}
        onChange={v => set({ required: v })}
      />

      {/* ── Validation toggle ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Validation
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 px-3 pt-1 pb-1 border-l-2 border-border/40 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <FormField label="Help text">
            <FieldInput
              value={data.helpText ?? ""}
              onChange={v => set({ helpText: v })}
              placeholder="Hint shown below"
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
