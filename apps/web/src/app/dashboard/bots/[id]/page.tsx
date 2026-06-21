"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, KeyRound } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EmbedModal } from "@/components/bot/embed-modal"

import { PageSkeleton } from "@/components/bot/page-skeleton"
import { OverviewTab } from "@/components/bot/overview-tab"
import { KnowledgeTab } from "@/components/bot/knowledge-tab"
import { FlowTab } from "@/components/bot/flow-tab"
import { WidgetTab } from "@/components/bot/widget-tab"
import { SettingsTab } from "@/components/bot/settings-tab"
import { LiveChatWidget } from "@/components/bot/live-chat-widget"
import type { Bot } from "@/components/bot/types"
import { formatDate, typeBadgeLabel } from "@/components/bot/utils"

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [bot, setBot] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingActive, setTogglingActive] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [regenKey, setRegenKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Determine default tab from URL ?tab= param
  function resolveDefaultTab() {
    const t = searchParams.get("tab")
    if (t === "flows") return "Flows"
    if (t === "settings") return "Settings"
    if (t === "widget") return "Widget"
    if (t === "knowledge") return "Knowledge"
    return "Overview"
  }
  const [activeTab, setActiveTab] = useState(resolveDefaultTab)

  // Sliding tab indicator
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = tabRefs.current[activeTab]
    const bar = tabBarRef.current
    if (!el || !bar) return
    const barRect = bar.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setIndicator({ left: elRect.left - barRect.left, width: elRect.width })
  }, [activeTab, bot])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get<Bot>(`/projects/${id}`)
      .then((r) => {
        const data = (r.data as any)?.data ?? r.data
        setBot(data)
      })
      .catch(() => {
        setError("Failed to load assistant. Please try again.")
      })
      .finally(() => setLoading(false))
  }, [id])

  // Make <main> a positioned, non-scrolling container so page fills it absolutely
  useEffect(() => {
    const main = document.querySelector("main")
    if (!main) return
    const prevOverflow = main.style.overflow
    const prevPosition = main.style.position
    main.style.overflow = "hidden"
    main.style.position = "relative"
    return () => {
      main.style.overflow = prevOverflow
      main.style.position = prevPosition
    }
  }, [])

  function handleBotUpdate(updated: Partial<Bot>) {
    setBot((prev) => (prev ? { ...prev, ...updated } : prev))
  }

  async function toggleActive() {
    if (!bot) return
    setTogglingActive(true)
    try {
      await api.patch(`/projects/${bot.id}`, { isActive: !bot.isActive })
      setBot((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev))
    } catch {
      // silently ignore
    } finally {
      setTogglingActive(false)
    }
  }


  if (loading) return <PageSkeleton />

  if (error || !bot) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">{error ?? "Assistant not found."}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/bots")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assistants
        </Button>
      </div>
    )
  }

  // Determine which tabs to show
  const tabs = [
    "Overview",
    ...(bot.assistantType !== "flow" ? ["Knowledge"] : []),
    "Flows",
    "Widget",
    "Settings",
  ]

  const embedKeyDisplay = bot.apiKey ? `${bot.apiKey.keyPrefix}••••••••••` : "No API key"
  const fullSnippet = regenKey
    ? `<script src="https://cdn.askbase.io/widget.iife.js" data-key="${regenKey}" async></script>`
    : null

  return (
    <>
    <EmbedModal
      open={embedOpen}
      onOpenChange={setEmbedOpen}
      projectId={bot.id}
      maskedKey={embedKeyDisplay}
    />

    <div className="absolute inset-0 overflow-hidden flex flex-col max-w-5xl mx-auto px-6">

      {/* ── Fixed header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-5 pb-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/dashboard/bots")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Assistants
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold">{bot.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Created {formatDate(bot.createdAt)}</span>
              <span>·</span>
              <Badge variant="secondary" className="text-xs">
                {typeBadgeLabel(bot.assistantType)}
              </Badge>
            </div>
          </div>
          <Badge variant={bot.isActive ? "success" : "secondary"} className="shrink-0 mt-1">
            {bot.isActive ? "Active" : "Paused"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <code className="text-sm text-muted-foreground font-mono">{embedKeyDisplay}</code>
          <Button size="sm" variant="outline" onClick={() => { setEmbedOpen(true); setRegenKey(null); setCopied(false); }}>
            <KeyRound className="mr-2 h-3 w-3" />Embed script
          </Button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Tab bar — pill background, fits content width */}
        <div ref={tabBarRef} className="relative flex items-center w-fit shrink-0 bg-muted rounded-xl p-1 gap-0 mb-5">
          {/* Sliding active pill */}
          <span
            className="absolute top-1 bottom-1 bg-background rounded-lg shadow-sm transition-all duration-200 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
          {tabs.map((tab) => (
            <button
              key={tab}
              ref={(el) => { tabRefs.current[tab] = el }}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative z-10 px-4 py-1.5 text-sm font-medium transition-colors duration-150 select-none outline-none rounded-lg",
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content — keyed so CSS animate-in fires on every switch */}
        <div key={activeTab} className="flex-1 min-h-0 overflow-y-auto pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {activeTab === "Overview" && (
            <OverviewTab bot={bot} onToggleActive={toggleActive} togglingActive={togglingActive} onNavigateTab={setActiveTab} />
          )}
          {activeTab === "Knowledge" && bot.assistantType !== "flow" && (
            <KnowledgeTab bot={bot} onBotUpdate={handleBotUpdate} />
          )}
          {activeTab === "Flows" && (
            <FlowTab bot={bot} onBotUpdate={handleBotUpdate} />
          )}
          {activeTab === "Widget" && (
            <WidgetTab bot={bot} onBotUpdate={handleBotUpdate} />
          )}
          {activeTab === "Settings" && (
            <SettingsTab bot={bot} onBotUpdate={handleBotUpdate} />
          )}
        </div>

      </div>
    </div>

    <LiveChatWidget bot={bot} />
    </>
  )
}
