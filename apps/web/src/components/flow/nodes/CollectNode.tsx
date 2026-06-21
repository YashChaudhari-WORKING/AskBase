"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function CollectNode({ data, selected }: NodeProps) {
  const d = data as any;
  return (
    <BaseNode nodeType="collect" selected={selected}>
      <p className="line-clamp-1 mb-1">{d.question || <span className="italic opacity-40">No question set</span>}</p>
      {d.fieldName && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-mono">
          {d.fieldName} · {d.fieldType}
          {d.required && " *"}
        </span>
      )}
    </BaseNode>
  );
}
