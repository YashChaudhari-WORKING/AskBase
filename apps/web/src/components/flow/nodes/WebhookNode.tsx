"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function WebhookNode({ data, selected }: NodeProps) {
  const d = data as any;
  let domain = "";
  try { domain = new URL(d.url).hostname; } catch {}
  return (
    <BaseNode nodeType="webhook" selected={selected}>
      <p className="font-mono truncate">
        <span className="text-rose-500 dark:text-rose-400">{d.method}</span>
        {" "}
        {domain || <span className="italic opacity-40">No URL set</span>}
      </p>
    </BaseNode>
  );
}
