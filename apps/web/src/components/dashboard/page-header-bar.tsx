"use client"

import { ArrowLeft, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type HeaderTone = "primary" | "blue" | "emerald" | "violet" | "amber" | "pink" | "cyan" | "rose"

const TONE: Record<HeaderTone, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

export interface HeaderStat {
  icon?: LucideIcon
  /** Emphasised value, e.g. "3". */
  value?: string | number
  /** Trailing label, e.g. "projects". */
  label: string
  /** Optional accent for the value (e.g. processing/failed counts). */
  tone?: "muted" | "emerald" | "amber" | "rose"
}

const STAT_TONE: Record<NonNullable<HeaderStat["tone"]>, string> = {
  muted: "text-muted-foreground",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
}

interface Props {
  icon: LucideIcon
  tone?: HeaderTone
  title: string
  stats?: HeaderStat[]
  actions?: React.ReactNode
  /** Renders a back chevron before the icon. */
  onBack?: () => void
}

/**
 * Premium page header for the bare strip above the frame: an accented icon
 * chip, the title, a row of compact stat pills, and right-aligned actions.
 */
export function PageHeaderBar({ icon: Icon, tone = "primary", title, stats, actions, onBack }: Props) {
  return (
    <div className="flex items-center gap-3 py-1 min-w-0">
      {onBack && (
        <button
          onClick={onBack}
          className="shrink-0 w-8 h-8 -ml-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", TONE[tone])}>
        <Icon className="w-[18px] h-[18px]" />
      </div>

      <h1 className="text-lg font-bold tracking-tight text-foreground leading-none shrink-0">{title}</h1>

      {stats && stats.length > 0 && (
        <>
          <span className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {stats.map((s, i) => {
              const SIcon = s.icon
              return (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium rounded-md border border-border/50 bg-muted/50 px-1.5 py-1 shrink-0",
                    s.tone ? STAT_TONE[s.tone] : "text-muted-foreground",
                  )}
                >
                  {SIcon && <SIcon className="w-3 h-3" />}
                  {s.value != null && <span className="font-semibold text-foreground/90">{s.value}</span>}
                  {s.label}
                </span>
              )
            })}
          </div>
        </>
      )}

      {actions && <div className="ml-auto flex items-center gap-2 shrink-0 pl-2">{actions}</div>}
    </div>
  )
}
