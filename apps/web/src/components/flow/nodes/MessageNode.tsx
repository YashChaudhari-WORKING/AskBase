"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function MessageNode({ data, selected }: NodeProps) {
  const msg = (data as any).message as string;
  return (
    <BaseNode nodeType="message" selected={selected}>
      <p className="line-clamp-2">{msg || <span className="italic opacity-40">No message set</span>}</p>
    </BaseNode>
  );
}
