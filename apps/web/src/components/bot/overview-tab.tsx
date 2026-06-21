"use client"

import {
  ArrowRight,
  Database,
  GitBranch,
  Loader2,
  Palette,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Bot } from "./types"
import { getSetupHints } from "./utils"

export function OverviewTab({
  bot,
  onToggleActive,
  togglingActive,
  onNavigateTab,
}: {
  bot: Bot
  onToggleActive: () => void
  togglingActive: boolean
  onNavigateTab: (tab: string) => void
}) {
  const systemPromptSet = Boolean(bot.systemPrompt && bot.systemPrompt.trim().length > 0)
  const kbAttached = Boolean(bot.knowledgeBase)
  const attachedFlowCount = (bot.attachedFlows ?? []).length
  const flowAttached = attachedFlowCount > 0
  const colorCustomized = bot.primaryColor !== "#6366f1" || bot.widgetThemeId !== null
  const needsKb = bot.assistantType !== "flow"

  const checks = [
    { ok: systemPromptSet, label: "System prompt configured" },
    ...(needsKb ? [{ ok: kbAttached, label: "Knowledge base attached" }] : []),
    { ok: colorCustomized, label: "Widget appearance set" },
  ]
  const completedCount = checks.filter((c) => c.ok).length

  const hints = getSetupHints(bot)
  const nextStepItems = [
    ...(needsKb && !kbAttached ? [{
      label: "Add your knowledge base",
      hint: hints.kbHint,
      tab: "Knowledge",
      icon: Database,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    }] : []),
    ...(!systemPromptSet ? [{
      label: "Configure system prompt",
      hint: "Tell the AI how to behave — its role, tone, and what it should never say.",
      tab: "Settings",
      icon: Terminal,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    }] : []),
    ...(!colorCustomized ? [{
      label: "Set your brand color",
      hint: "Pick a theme or custom color — visitors notice it instantly.",
      tab: "Widget",
      icon: Palette,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    }] : []),
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Next steps (shown first when incomplete) ── */}
      {nextStepItems.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between border-b border-amber-500/15">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm font-semibold text-foreground">Setup not complete</p>
            </div>
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
              {completedCount}/{checks.length} done
            </span>
          </div>
          <div className="divide-y divide-amber-500/10">
            {nextStepItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-amber-500/5 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{item.hint}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Status card ── */}
      <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${
        bot.isActive
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            bot.isActive ? "bg-emerald-500/15" : "bg-muted"
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              bot.isActive ? "bg-emerald-400 shadow-[0_0_10px_#4ade80]" : "bg-muted-foreground/50"
            }`} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {bot.isActive ? "Live — accepting visitors" : "Paused"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bot.isActive
                ? "Responding to all incoming chats"
                : "Not responding to new conversations"}
            </p>
          </div>
        </div>
        <Button
          variant={bot.isActive ? "outline" : "default"}
          size="sm"
          onClick={onToggleActive}
          disabled={togglingActive}
          className="shrink-0 h-8 px-4 text-xs"
        >
          {togglingActive && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          {bot.isActive ? "Pause" : "Go live"}
        </Button>
      </div>

      {/* ── Config rows ── */}
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50 bg-card">
        <div className="px-5 py-3 bg-muted/30 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Configuration</p>
        </div>

        {/* Knowledge base */}
        {needsKb && (
          <div className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/20 ${!kbAttached ? "bg-amber-500/[0.02]" : ""}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              kbAttached ? "bg-blue-500/10" : "bg-amber-500/10"
            }`}>
              <Database className={`w-4 h-4 ${kbAttached ? "text-blue-500" : "text-amber-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{kbAttached ? bot.knowledgeBase!.name : "Knowledge base"}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {kbAttached ? "Attached — AI answers from these documents" : "Not attached — AI has no documents to reference"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                kbAttached
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}>
                {kbAttached ? "✓ Attached" : "Missing"}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab("Knowledge")}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent"
              >
                {kbAttached ? "Manage →" : "Attach →"}
              </button>
            </div>
          </div>
        )}

        {/* Flows */}
        <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/20">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            flowAttached ? "bg-emerald-500/10" : "bg-muted"
          }`}>
            <GitBranch className={`w-4 h-4 ${flowAttached ? "text-emerald-500" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Flows</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {flowAttached
                ? `${attachedFlowCount} flow${attachedFlowCount !== 1 ? "s" : ""} — trigger phrases route visitors to forms`
                : "No flows — add one to capture leads or bookings"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              flowAttached
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {flowAttached ? `✓ ${attachedFlowCount} active` : "Optional"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("Flows")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent"
            >
              {flowAttached ? "Manage →" : "Add →"}
            </button>
          </div>
        </div>

        {/* System prompt */}
        <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/20">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            systemPromptSet ? "bg-violet-500/10" : "bg-amber-500/10"
          }`}>
            <Terminal className={`w-4 h-4 ${systemPromptSet ? "text-violet-500" : "text-amber-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">System prompt</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {systemPromptSet ? "Configured — controls tone, role, and behavior" : "Not set — using generic defaults"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              systemPromptSet
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {systemPromptSet ? "✓ Set" : "Missing"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("Settings")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent"
            >
              Edit →
            </button>
          </div>
        </div>

        {/* Brand color */}
        <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/20">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border/60 relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundColor: bot.primaryColor, opacity: 0.25 }} />
            <span className="w-4 h-4 rounded-full border-2 border-white/20 relative z-10" style={{ backgroundColor: bot.primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Brand color</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {colorCustomized ? `${bot.primaryColor} — applied to widget accents` : "Using default — set your brand color"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              colorCustomized
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {colorCustomized ? "✓ Custom" : "Default"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("Widget")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent"
            >
              Edit →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
