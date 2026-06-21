"use client";

import type { LeadSaveData } from "../types";
import { FormField, FieldInput } from "./FormField";

interface Props {
  data: LeadSaveData;
  onChange: (data: LeadSaveData) => void;
}

export function LeadSaveConfig({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
          All collected fields are saved automatically
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Name, email, phone, and any other fields captured before this node are stored as a lead.
        </p>
      </div>

      <FormField label="Notify email (optional)">
        <FieldInput
          type="email"
          value={data.notifyEmail}
          onChange={v => onChange({ ...data, notifyEmail: v })}
          placeholder="team@yourcompany.com"
        />
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Send an email notification when a new lead is captured
        </p>
      </FormField>
    </div>
  );
}
