"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InstallStepStatus = "pending" | "running" | "done"

interface InstallStepProps {
  label: string
  detail?: string
  status: InstallStepStatus
  durationMs?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 10) return `${seconds.toFixed(1)}s`
  return `${Math.round(seconds)}s`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InstallStep({ label, detail, status, durationMs }: InstallStepProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-2 transition-all duration-300",
        status === "pending" ? "opacity-60" : "opacity-100"
      )}
    >
      {/* Status indicator */}
      <div className="mt-0.5 w-5 h-5 flex items-center justify-center shrink-0">
        {status === "pending" && (
          <span
            className={cn(
              "w-3.5 h-3.5 rounded-full border border-border bg-muted",
              "transition-colors duration-300"
            )}
          />
        )}
        {status === "running" && (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        )}
        {status === "done" && (
          <span
            className={cn(
              "w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center",
              "transition-colors duration-300"
            )}
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-sm transition-colors duration-300",
              status === "pending" ? "text-muted-foreground" : "text-foreground font-medium"
            )}
          >
            {label}
          </span>
          {status === "done" && durationMs !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              ({formatDuration(durationMs)})
            </span>
          )}
        </div>

        {detail && (
          <p
            className={cn(
              "text-xs text-muted-foreground mt-0.5 truncate transition-opacity duration-300",
              status === "pending" ? "opacity-60" : "opacity-100"
            )}
            title={detail}
          >
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
