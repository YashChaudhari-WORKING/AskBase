"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ChoiceNode({ data, selected }: NodeProps) {
  const d = data as any;
  const opts = (d.options ?? []) as Array<{ label: string }>;
  return (
    <BaseNode nodeType="choice" selected={selected}>
      <p className="line-clamp-1 mb-1.5">{d.question || <span className="italic opacity-40">No question set</span>}</p>
      <div className="flex flex-wrap gap-1">
        {opts.slice(0, 3).map((o, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] border border-amber-500/20">
            {o.label}
          </span>
        ))}
        {opts.length > 3 && (
          <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
            +{opts.length - 3}
          </span>
        )}
      </div>
    </BaseNode>
  );
}
