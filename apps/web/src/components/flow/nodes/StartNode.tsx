"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function StartNode({ data, selected }: NodeProps) {
  return (
    <BaseNode nodeType="start" selected={selected} hasTarget={false}>
      {(data as any).trigger === "delay"
        ? `Starts after ${(data as any).delaySeconds}s`
        : "Triggers when widget opens"}
    </BaseNode>
  );
}
