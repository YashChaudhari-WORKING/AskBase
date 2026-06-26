"use client"

import { Bot as BotIcon } from "lucide-react"

import { OverviewTab } from "../overview-tab"
import { KnowledgeTab } from "../knowledge-tab"
import { FlowTab } from "../flow-tab"
import { WidgetTab } from "../widget-tab"
import { SettingsTab } from "../settings-tab"
import type { Bot } from "../types"

import { ResizablePanel } from "./ResizablePanel"
import { SERVICE_META, TAB_TO_KIND, type NodeKind } from "./service-meta"

interface Props {
  kind: NodeKind | null
  bot: Bot
  containerRef: React.RefObject<HTMLElement | null>
  onBotUpdate: (updated: Partial<Bot>) => void
  onToggleActive: () => void
  togglingActive: boolean
  onClose: () => void
  onNavigate: (kind: NodeKind) => void
}

function chrome(kind: NodeKind, bot: Bot) {
  if (kind === "core") {
    return {
      title: bot.name,
      subtitle: "Overview & status",
      accent: bot.primaryColor,
      icon: <BotIcon className="w-4 h-4" style={{ color: bot.primaryColor }} />,
    }
  }
  const m = SERVICE_META[kind]
  const Icon = m.icon
  return {
    title: m.label,
    subtitle: "Configure this service",
    accent: m.accent,
    icon: <Icon className="w-4 h-4" style={{ color: m.accent }} />,
  }
}

/** Floating, resizable config panel for the selected canvas node. */
export function NodePanel({
  kind,
  bot,
  containerRef,
  onBotUpdate,
  onToggleActive,
  togglingActive,
  onClose,
  onNavigate,
}: Props) {
  if (!kind) return null
  const { title, subtitle, accent, icon } = chrome(kind, bot)

  return (
    <ResizablePanel
      key={kind}
      title={title}
      subtitle={subtitle}
      accent={accent}
      icon={icon}
      containerRef={containerRef}
      onClose={onClose}
    >
      {kind === "core" && (
        <OverviewTab
          bot={bot}
          onToggleActive={onToggleActive}
          togglingActive={togglingActive}
          onNavigateTab={(tab) => onNavigate(TAB_TO_KIND[tab] ?? "core")}
        />
      )}
      {kind === "knowledge" && <KnowledgeTab bot={bot} onBotUpdate={onBotUpdate} />}
      {kind === "flows" && <FlowTab bot={bot} onBotUpdate={onBotUpdate} />}
      {kind === "widget" && <WidgetTab bot={bot} onBotUpdate={onBotUpdate} />}
      {kind === "settings" && <SettingsTab bot={bot} onBotUpdate={onBotUpdate} />}
    </ResizablePanel>
  )
}
