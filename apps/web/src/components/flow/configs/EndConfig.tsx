"use client";

import type { EndData } from "../types";
import { FormField, FieldTextarea, FieldSelect, FieldInput } from "./FormField";

interface Props {
  data: EndData;
  onChange: (data: EndData) => void;
}

const ACTION_OPTIONS = [
  { value: "close",    label: "Close widget" },
  { value: "stay",     label: "Stay open" },
  { value: "redirect", label: "Redirect to URL" },
];

export function EndConfig({ data, onChange }: Props) {
  const set = (patch: Partial<EndData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-4">
      <FormField label="Closing message">
        <FieldTextarea
          value={data.message}
          onChange={v => set({ message: v })}
          placeholder="Thanks! We'll be in touch soon."
          rows={3}
        />
      </FormField>

      <FormField label="After message">
        <FieldSelect
          value={data.action}
          onChange={v => set({ action: v as EndData["action"] })}
          options={ACTION_OPTIONS}
        />
      </FormField>

      {data.action === "redirect" && (
        <FormField label="Redirect URL">
          <FieldInput
            type="url"
            value={data.redirectUrl}
            onChange={v => set({ redirectUrl: v })}
            placeholder="https://yoursite.com/thank-you"
          />
        </FormField>
      )}
    </div>
  );
}
