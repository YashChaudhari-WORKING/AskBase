"use client"

import { Handle, Position } from "@xyflow/react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceMeta, StatusTone } from "./service-meta"

const HANDLE_STYLE: React.CSSProperties = {
  width: 9,
  height: 9,
  border: "2px solid var(--card)",
}

const TONE_DOT: Record<StatusTone, string> = {
  ok: "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60",
  warn: "bg-amber-500 shadow-[0_0_8px] shadow-amber-500/60",
  muted: "bg-muted-foreground/40",
}

const TONE_BADGE: Record<StatusTone, string> = {
  ok: "bg-emerald-500/10 text-emerald-500",
  warn: "bg-amber-500/10 text-amber-500",
  muted: "bg-muted text-muted-foreground",
}

/** A small key→value line inside a service node body. */
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground truncate text-right">{children}</span>
    </div>
  )
}

/** Status pill used both in node headers (compact) and elsewhere. */
export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", TONE_BADGE[tone])}>
      {children}
    </span>
  )
}

interface ServiceNodeProps {
  meta: ServiceMeta
  selected?: boolean
  /** Connection target lives on the left edge (core links in from there). */
  status: StatusTone
  statusLabel: string
  children: React.ReactNode
}

/**
 * Shared Railway-style "service" shell. Each concrete node (Knowledge, Flows…)
 * renders its own summary rows as children; the chrome stays consistent.
 */
export function ServiceNode({ meta, selected, status, statusLabel, children }: ServiceNodeProps) {
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "group relative w-[256px] rounded-xl bg-card shadow-sm transition-all duration-150 cursor-pointer border-2 hover:-translate-y-0.5 hover:shadow-lg",
        selected ? "shadow-lg" : "border-border",
      )}
      style={selected ? { borderColor: meta.accent, boxShadow: `0 8px 30px -8px ${meta.accent}66` } : undefined}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...HANDLE_STYLE, background: meta.accent, top: -6 }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border/60">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta.tint)}>
          <Icon className={cn("w-4 h-4", meta.iconColor)} />
        </div>
        <p className="flex-1 min-w-0 text-sm font-semibold text-foreground leading-none">{meta.label}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("w-2 h-2 rounded-full", TONE_DOT[status])} />
          <span className="text-[10px] font-medium text-muted-foreground">{statusLabel}</span>
        </div>
      </div>

      {/* Summary rows */}
      <div className="px-3.5 py-3 flex flex-col gap-2">{children}</div>

      {/* Open affordance */}
      <div className="px-3.5 pb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Open
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  )
}
