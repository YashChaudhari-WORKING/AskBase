"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CollectData, FieldType } from "../types";
import { FormField, FieldInput, FieldSelect, FieldCheckbox } from "./FormField";

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text",     label: "Text"      },
  { value: "email",    label: "Email"     },
  { value: "phone",    label: "Phone"     },
  { value: "date",     label: "Date"      },
  { value: "number",   label: "Number"    },
  { value: "url",      label: "URL"       },
  { value: "longtext", label: "Long text" },
];

const DATE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "",       label: "Any date"    },
  { value: "today",  label: "Today onward" },
  { value: "future", label: "Future only"  },
  { value: "past",   label: "Past only"    },
];

interface Props {
  data: CollectData;
  onChange: (data: CollectData) => void;
}

export function CollectConfig({ data, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const set = (patch: Partial<CollectData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-4">
      {/* Basics */}
      <FormField label="Question">
        <FieldInput
          value={data.question}
          onChange={v => set({ question: v })}
          placeholder="What's your email address?"
        />
      </FormField>

      <FormField label="Field name (key)">
        <FieldInput
          value={data.fieldName}
          onChange={v => set({ fieldName: v.toLowerCase().replace(/\s+/g, "_") })}
          placeholder="email"
          className="font-mono"
        />
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Used as the key in saved lead data
        </p>
      </FormField>

      <FormField label="Field type">
        <FieldSelect
          value={data.fieldType}
          onChange={v => set({ fieldType: v as FieldType })}
          options={FIELD_TYPES}
        />
      </FormField>

      <FormField label="Placeholder">
        <FieldInput
          value={data.placeholder ?? ""}
          onChange={v => set({ placeholder: v })}
          placeholder="e.g. you@company.com"
        />
      </FormField>

      <FieldCheckbox
        label="Required field"
        checked={data.required}
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
          {/* Help text — always available */}
          <FormField label="Help text">
            <FieldInput
              value={data.helpText ?? ""}
              onChange={v => set({ helpText: v })}
              placeholder="Hint shown below the field"
            />
          </FormField>

          {/* text / longtext / email / phone / url — length + pattern */}
          {(data.fieldType === "text" ||
            data.fieldType === "longtext" ||
            data.fieldType === "email" ||
            data.fieldType === "phone" ||
            data.fieldType === "url") && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Min length">
                  <FieldInput
                    type="number"
                    value={data.minLength?.toString() ?? ""}
                    onChange={v => set({ minLength: v ? Number(v) : undefined })}
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Max length">
                  <FieldInput
                    type="number"
                    value={data.maxLength?.toString() ?? ""}
                    onChange={v => set({ maxLength: v ? Number(v) : undefined })}
                    placeholder="∞"
                  />
                </FormField>
              </div>
              <FormField label="Pattern (regex)">
                <FieldInput
                  value={data.pattern ?? ""}
                  onChange={v => set({ pattern: v })}
                  placeholder={
                    data.fieldType === "email"
                      ? "^[\\w.+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
                      : data.fieldType === "phone"
                      ? "^(\\+91[\\- ]?)?[6-9]\\d{9}$"
                      : "^[A-Za-z ]+$"
                  }
                  className="font-mono text-xs"
                />
              </FormField>
            </>
          )}

          {/* number — min / max / step */}
          {data.fieldType === "number" && (
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Min">
                <FieldInput
                  type="number"
                  value={data.min?.toString() ?? ""}
                  onChange={v => set({ min: v ? Number(v) : undefined })}
                  placeholder="—"
                />
              </FormField>
              <FormField label="Max">
                <FieldInput
                  type="number"
                  value={data.max?.toString() ?? ""}
                  onChange={v => set({ max: v ? Number(v) : undefined })}
                  placeholder="—"
                />
              </FormField>
              <FormField label="Step">
                <FieldInput
                  type="number"
                  value={data.step?.toString() ?? ""}
                  onChange={v => set({ step: v ? Number(v) : undefined })}
                  placeholder="1"
                />
              </FormField>
            </div>
          )}

          {/* date — preset constraint + max date */}
          {data.fieldType === "date" && (
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Constraint">
                <FieldSelect
                  value={data.minDate ?? ""}
                  onChange={v => set({ minDate: v || undefined })}
                  options={DATE_PRESETS}
                />
              </FormField>
              <FormField label="Latest accepted">
                <FieldInput
                  type="date"
                  value={data.maxDate && /^\d{4}-\d{2}-\d{2}$/.test(data.maxDate) ? data.maxDate : ""}
                  onChange={v => set({ maxDate: v || undefined })}
                />
              </FormField>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
