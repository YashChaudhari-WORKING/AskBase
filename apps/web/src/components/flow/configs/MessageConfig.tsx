"use client";

import type { MessageData } from "../types";
import { FormField, FieldTextarea } from "./FormField";

interface Props {
  data: MessageData;
  onChange: (data: MessageData) => void;
}

export function MessageConfig({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <FormField label="Message">
        <FieldTextarea
          value={data.message}
          onChange={v => onChange({ ...data, message: v })}
          placeholder="Hi! What can I help you with today?"
          rows={4}
        />
      </FormField>
      <p className="text-[10px] text-muted-foreground/50">
        Supports plain text. Keep messages short for mobile.
      </p>
    </div>
  );
}
