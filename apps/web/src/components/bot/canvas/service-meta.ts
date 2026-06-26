import { Database, GitBranch, Palette, SlidersHorizontal, type LucideIcon } from "lucide-react"
import type { Bot } from "../types"

// Every interactive surface on the bot canvas is a "service" node, Railway-style.
export type NodeKind = "core" | "knowledge" | "flows" | "widget" | "settings"
export type ServiceKind = Exclude<NodeKind, "core">

// Status tone shown as a dot in each node header + badge in the drawer.
export type StatusTone = "ok" | "warn" | "muted"

export interface ServiceMeta {
  kind: ServiceKind
  label: string
  icon: LucideIcon
  /** Raw accent used for the node border / handle / edge stroke. */
  accent: string
  /** Tailwind tint for the header icon chip. */
  tint: string
  iconColor: string
}

export const SERVICE_META: Record<ServiceKind, ServiceMeta> = {
  knowledge: {
    kind: "knowledge",
    label: "Knowledge",
    icon: Database,
    accent: "#3b82f6",
    tint: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  flows: {
    kind: "flows",
    label: "Flows",
    icon: GitBranch,
    accent: "#10b981",
    tint: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  widget: {
    kind: "widget",
    label: "Widget",
    icon: Palette,
    accent: "#ec4899",
    tint: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  settings: {
    kind: "settings",
    label: "Settings",
    icon: SlidersHorizontal,
    accent: "#8b5cf6",
    tint: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
}

// Map the OverviewTab's tab labels back to canvas node kinds so "Manage →"
// links open the matching service drawer.
export const TAB_TO_KIND: Record<string, NodeKind> = {
  Overview: "core",
  Knowledge: "knowledge",
  Flows: "flows",
  Widget: "widget",
  Settings: "settings",
}

export function colorCustomized(bot: Bot): boolean {
  return bot.primaryColor !== "#6366f1" || bot.widgetThemeId !== null
}

export function systemPromptSet(bot: Bot): boolean {
  return Boolean(bot.systemPrompt && bot.systemPrompt.trim().length > 0)
}

// Which service nodes are present for this bot (flow-only bots have no KB).
export function serviceKindsFor(bot: Bot): ServiceKind[] {
  return [
    ...(bot.assistantType !== "flow" ? (["knowledge"] as ServiceKind[]) : []),
    "flows",
    "widget",
    "settings",
  ]
}
