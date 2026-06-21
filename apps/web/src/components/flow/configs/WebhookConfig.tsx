"use client";

import type { WebhookData } from "../types";
import { FormField, FieldInput, FieldSelect } from "./FormField";

interface Props {
  data: WebhookData;
  onChange: (data: WebhookData) => void;
}

export function WebhookConfig({ data, onChange }: Props) {
  const set = (patch: Partial<WebhookData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-4">
      <FormField label="Webhook URL">
        <FieldInput
          type="url"
          value={data.url}
          onChange={v => set({ url: v })}
          placeholder="https://hooks.zapier.com/..."
        />
      </FormField>

      <FormField label="Method">
        <FieldSelect
          value={data.method}
          onChange={v => set({ method: v as "POST" | "GET" })}
          options={[
            { value: "POST", label: "POST" },
            { value: "GET",  label: "GET" },
          ]}
        />
      </FormField>

      <FormField label="Secret (optional)">
        <FieldInput
          value={data.secret}
          onChange={v => set({ secret: v })}
          placeholder="Sent as X-Webhook-Secret header"
        />
      </FormField>

      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          All collected fields are sent as JSON body. Works with Zapier, Make, HubSpot, and any REST endpoint.
        </p>
      </div>
    </div>
  );
}
