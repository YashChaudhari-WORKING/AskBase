"use client";

import { NODE_META, PALETTE_ORDER } from "../constants";
import type { FlowNodeType } from "../types";

export function NodePalette({ width }: { width: number }) {
  function onDragStart(e: React.DragEvent, nodeType: FlowNodeType) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="flex-shrink-0 border-r border-border bg-background overflow-y-auto flex flex-col" style={{ width }}>
      <div className="px-4 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Nodes
        </p>
      </div>

      <div className="px-3 pb-4 space-y-1 flex-1">
        {PALETTE_ORDER.map(type => {
          const meta = NODE_META[type];
          const Icon = meta.icon;

          return (
            <div
              key={type}
              draggable
              onDragStart={e => onDragStart(e, type)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border cursor-grab active:cursor-grabbing hover:bg-accent hover:border-primary/20 hover:shadow-sm transition-all duration-200 group select-none"
            >
              <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5">
                <Icon size={36} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-200">{meta.label}</p>
                <p className="text-xs text-muted-foreground/50 truncate mt-0.5">{meta.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground/40 leading-relaxed">
          Drag nodes onto the canvas to build your flow
        </p>
      </div>
    </div>
  );
}
