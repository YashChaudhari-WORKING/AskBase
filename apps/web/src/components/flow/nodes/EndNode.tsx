"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function EndNode({ data, selected }: NodeProps) {
  const d = data as any;
  return (
    <BaseNode nodeType="end" selected={selected} hasSource={false}>
      <p className="line-clamp-2">{d.message || <span className="italic opacity-40">No message set</span>}</p>
      {d.action === "redirect" && d.redirectUrl && (
        <p className="mt-1 text-[10px] truncate opacity-60">↗ {d.redirectUrl}</p>
      )}
    </BaseNode>
  );
}
