"use client";

import { Handle, Position } from "@xyflow/react";
import { NODE_META } from "../constants";
import type { FlowNodeType } from "../types";

interface Props {
  nodeType: FlowNodeType;
  selected?: boolean;
  hasTarget?: boolean;
  hasSource?: boolean;
  children: React.ReactNode;
}

const HANDLE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  background: "var(--primary)",
  border: "2px solid var(--card)",
};

export function BaseNode({ nodeType, selected, hasTarget = true, hasSource = true, children }: Props) {
  const meta = NODE_META[nodeType];
  const Icon = meta.icon;

  return (
    <div
      className={`bg-card rounded-xl overflow-hidden shadow-sm w-[220px] transition-all ${
        selected
          ? "border-2 border-primary/60 shadow-md"
          : "border border-border hover:border-border/60"
      }`}
    >
      {hasTarget && (
        <Handle type="target" position={Position.Top} style={{ ...HANDLE_STYLE, top: -5 }} />
      )}

      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b border-border"
        style={{ borderLeft: `3px solid ${meta.color}` }}
      >
        <Icon size={26} />
        <span className="text-sm font-semibold text-foreground">{meta.label}</span>
      </div>

      <div className="px-3 py-3 text-xs text-muted-foreground leading-relaxed">
        {children}
      </div>

      {hasSource && (
        <Handle type="source" position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -5 }} />
      )}
    </div>
  );
}
