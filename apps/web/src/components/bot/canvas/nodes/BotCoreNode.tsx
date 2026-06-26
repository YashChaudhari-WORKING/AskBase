"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Bot } from "../../types"
import { typeBadgeLabel } from "../../utils"
import { SERVICE_META, type ServiceKind } from "../service-meta"

const HANDLE_STYLE: React.CSSProperties = {
  width: 9,
  height: 9,
  border: "2px solid var(--card)",
}

/**
 * The bot itself — the "root service". Premium card: brand-tinted wash, app-icon
 * avatar, status pill, and one colour-matched output port per connected service.
 */
export function BotCoreNode({ data, selected }: NodeProps) {
  const { bot, services = [] } = data as { bot: Bot; services?: ServiceKind[] }
  const accent = bot.primaryColor

  return (
    <div
      className={cn(
        "group relative w-[272px] rounded-2xl bg-card border cursor-pointer overflow-hidden transition-all duration-150 hover:-translate-y-0.5",
        selected ? "border-transparent" : "",
      )}
      style={{
        borderColor: selected ? accent : accent + "44",
        boxShadow: selected
          ? `0 16px 44px -12px ${accent}88, 0 0 0 1.5px ${accent}`
          : `0 8px 28px -14px ${accent}66`,
      }}
    >
      {/* Brand wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(130% 90% at 0% 0%, ${accent}24, transparent 58%)` }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3.5">
          {bot.botAvatarUrl ? (
            <img
              src={bot.botAvatarUrl}
              alt=""
              className="w-11 h-11 rounded-xl object-cover shrink-0 ring-2 ring-white/10 shadow-md"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ring-2 ring-white/10 shadow-md"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}
            >
              {bot.botAvatarEmoji || "💬"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-foreground truncate leading-tight">{bot.name}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{typeBadgeLabel(bot.assistantType)}</p>
          </div>
        </div>

        <div className="h-px mx-4" style={{ background: accent + "22" }} />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              bot.isActive ? "bg-emerald-500/12 text-emerald-500" : "bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                bot.isActive ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/70" : "bg-muted-foreground/50",
              )}
            />
            {bot.isActive ? "Live" : "Paused"}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Open
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* One output port per service, spread along the bottom, colour-matched */}
      {services.map((kind, i) => (
        <Handle
          key={kind}
          id={`src-${kind}`}
          type="source"
          position={Position.Bottom}
          style={{
            ...HANDLE_STYLE,
            background: SERVICE_META[kind].accent,
            bottom: -5,
            left: `${((i + 1) / (services.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
