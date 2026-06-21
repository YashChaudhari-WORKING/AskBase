"use client";

import type { StartData } from "../types";
import { FormField, FieldSelect, FieldInput } from "./FormField";

interface Props {
  data: StartData;
  onChange: (data: StartData) => void;
}

export function StartConfig({ data, onChange }: Props) {
  const set = (patch: Partial<StartData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-4">
      <FormField label="Trigger">
        <FieldSelect
          value={data.trigger}
          onChange={v => set({ trigger: v as StartData["trigger"] })}
          options={[
            { value: "widget_open", label: "When widget opens" },
            { value: "delay", label: "After a delay" },
          ]}
        />
      </FormField>

      {data.trigger === "delay" && (
        <FormField label="Delay (seconds)">
          <FieldInput
            type="number"
            value={String(data.delaySeconds)}
            onChange={v => set({ delaySeconds: Number(v) })}
            placeholder="3"
          />
        </FormField>
      )}
    </div>
  );
}
