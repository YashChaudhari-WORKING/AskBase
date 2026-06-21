"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function LeadSaveNode({ data, selected }: NodeProps) {
  const email = (data as any).notifyEmail as string;
  return (
    <BaseNode nodeType="lead_save" selected={selected}>
      {email
        ? <p className="truncate">Notify: {email}</p>
        : <p className="italic opacity-40">Saves all collected fields</p>}
    </BaseNode>
  );
}
