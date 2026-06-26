"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, KeyRound } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmbedModal } from "@/components/bot/embed-modal"

import { PageSkeleton } from "@/components/bot/page-skeleton"
import { BotCanvas } from "@/components/bot/canvas/BotCanvas"
import { LiveChatWidget } from "@/components/bot/live-chat-widget"
import type { Bot } from "@/components/bot/types"
import { formatDate, typeBadgeLabel } from "@/components/bot/utils"
import { usePageHeader } from "@/components/dashboard/page-header"

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [bot, setBot] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingActive, setTogglingActive] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [regenKey, setRegenKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const embedKeyDisplay = bot?.apiKey ? `${bot.apiKey.keyPrefix}••••••••••` : "No API key"

  // Push the bot's title/info into the bare strip above the rounded frame.
  usePageHeader(
    bot ? (
      <div className="flex items-center gap-3 py-0.5 min-w-0">
        <button
          onClick={() => router.push("/dashboard/bots")}
          className="shrink-0 w-7 h-7 -ml-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Back to Assistants"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold leading-none shrink-0">{bot.name}</h1>
        <Badge variant="secondary" className="text-xs shrink-0">{typeBadgeLabel(bot.assistantType)}</Badge>
        <Badge variant={bot.isActive ? "success" : "secondary"} className="shrink-0">
          {bot.isActive ? "Active" : "Paused"}
        </Badge>
        <span className="text-sm text-muted-foreground shrink-0 hidden md:inline">Created {formatDate(bot.createdAt)}</span>
        <code className="text-xs text-muted-foreground font-mono truncate hidden lg:inline">{embedKeyDisplay}</code>
        <Button
          size="sm"
          variant="outline"
          className="h-8 ml-auto shrink-0"
          onClick={() => { setEmbedOpen(true); setRegenKey(null); setCopied(false) }}
        >
          <KeyRound className="mr-2 h-3 w-3" />Embed script
        </Button>
      </div>
    ) : null,
    [bot],
  )

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

  return (
    <>
    <EmbedModal
      open={embedOpen}
      onOpenChange={setEmbedOpen}
      projectId={bot.id}
      maskedKey={embedKeyDisplay}
    />

    {/* Frame holds the canvas only — title/info live in the bare strip above it. */}
    <div className="absolute inset-0 flex flex-col">
      <BotCanvas
        bot={bot}
        onBotUpdate={handleBotUpdate}
        onToggleActive={toggleActive}
        togglingActive={togglingActive}
      />
    </div>

    <LiveChatWidget bot={bot} />
    </>
  )
}
