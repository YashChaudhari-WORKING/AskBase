"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function GoogleSheetNode({ data, selected }: NodeProps) {
  const d = data as any;
  const hasUrl = !!d.webAppUrl?.trim();
  return (
    <BaseNode nodeType="google_sheet" selected={selected}>
      {hasUrl ? (
        <p className="text-[11px] font-mono truncate text-emerald-500 dark:text-emerald-400">
          ✓ Web App connected
        </p>
      ) : (
        <p className="italic opacity-40 text-[11px]">Paste Apps Script URL</p>
      )}
    </BaseNode>
  );
}
