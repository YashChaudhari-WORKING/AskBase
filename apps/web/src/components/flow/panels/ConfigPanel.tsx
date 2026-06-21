"use client";

import { X, AlertCircle } from "lucide-react";
import type { Node } from "@xyflow/react";
import { NODE_META } from "../constants";
import type { FlowNodeType } from "../types";
import type { ValidationError } from "../hooks/useFlowValidation";
import { StartConfig } from "../configs/StartConfig";
import { MessageConfig } from "../configs/MessageConfig";
import { CollectConfig } from "../configs/CollectConfig";
import { ChoiceConfig } from "../configs/ChoiceConfig";
import { LeadSaveConfig } from "../configs/LeadSaveConfig";
import { WebhookConfig } from "../configs/WebhookConfig";
import { GoogleSheetConfig } from "../configs/GoogleSheetConfig";
import { EndConfig } from "../configs/EndConfig";

interface Props {
  node: Node;
  width: number;
  errors: ValidationError[];
  onChange: (nodeId: string, data: Record<string, any>) => void;
  onClose: () => void;
}

function ConfigBody({ nodeType, data, onChange }: {
  nodeType: FlowNodeType;
  data: any;
  onChange: (data: any) => void;
}) {
  switch (nodeType) {
    case "start":     return <StartConfig     data={data} onChange={onChange} />;
    case "message":   return <MessageConfig   data={data} onChange={onChange} />;
    case "collect":   return <CollectConfig   data={data} onChange={onChange} />;
    case "choice":    return <ChoiceConfig    data={data} onChange={onChange} />;
    case "lead_save": return <LeadSaveConfig  data={data} onChange={onChange} />;
    case "webhook":       return <WebhookConfig      data={data} onChange={onChange} />;
    case "google_sheet":  return <GoogleSheetConfig  data={data} onChange={onChange} />;
    case "end":           return <EndConfig           data={data} onChange={onChange} />;
  }
}

export function ConfigPanel({ node, width, errors, onChange, onClose }: Props) {
  const nodeType = node.type as FlowNodeType;
  const meta = NODE_META[nodeType];
  const Icon = meta.icon;
  const hasErrors = errors.length > 0;

  return (
    <div className="flex-shrink-0 border-l border-border bg-background flex flex-col overflow-hidden" style={{ width }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0"
        style={{ borderLeft: `3px solid ${meta.color}` }}
      >
        <div className="flex items-center gap-2">
          <Icon size={26} />
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
          {hasErrors && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" />
              {errors.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Validation errors */}
      {hasErrors && (
        <div className="mx-4 mt-4 space-y-1.5">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Config body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <ConfigBody
          nodeType={nodeType}
          data={node.data}
          onChange={(newData) => onChange(node.id, newData)}
        />
      </div>
    </div>
  );
}
