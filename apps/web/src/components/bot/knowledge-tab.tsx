"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen, Check, ChevronRight, ExternalLink,
  FileText, Loader2, Plus, Search, SlidersHorizontal, Unlink,
} from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Bot, KnowledgeBase } from "./types"
import { getSetupHints } from "./utils"

const THRESHOLD_PRESETS = [
  { label: "Permissive", value: 0.20, description: "Answers even low-confidence matches" },
  { label: "Balanced", value: 0.35, description: "Good default for most bots" },
  { label: "Strict", value: 0.55, description: "Only answers when very confident" },
  { label: "Very strict", value: 0.75, description: "Rarely answers; handoffs most queries" },
]

export function KnowledgeTab({
  bot,
  onBotUpdate,
}: {
  bot: Bot
  onBotUpdate: (updated: Partial<Bot>) => void
}) {
  const router = useRouter()

  // KB list (shown when not attached)
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [loadingKbs, setLoadingKbs] = useState(false)
  const [kbsLoaded, setKbsLoaded] = useState(false)
  const [patchingKb, setPatchingKb] = useState<string | null>(null)
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)

  // Confidence threshold
  const [threshold, setThreshold] = useState(bot.confidenceThreshold ?? 0.35)
  const [thresholdSaving, setThresholdSaving] = useState(false)
  const [thresholdSaved, setThresholdSaved] = useState(false)

  // Test search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ content: string; score: number; source?: string }>>([])
  const [searching, setSearching] = useState(false)
  const [searchDone, setSearchDone] = useState(false)

  function loadKbs() {
    if (kbsLoaded) return
    setLoadingKbs(true)
    api
      .get("/knowledge-bases")
      .then((r) => {
        const data = (r.data as any)?.data ?? r.data
        setKbs(Array.isArray(data) ? data : [])
        setKbsLoaded(true)
      })
      .catch(() => {})
      .finally(() => setLoadingKbs(false))
  }

  async function attachKb(kbId: string) {
    setPatchingKb(kbId)
    try {
      await api.patch(`/projects/${bot.id}`, { knowledgeBaseId: kbId })
      const kb = kbs.find((k) => k.id === kbId)
      if (kb) onBotUpdate({ knowledgeBase: { id: kb.id, name: kb.name } })
    } catch {
    } finally {
      setPatchingKb(null)
    }
  }

  async function detachKb() {
    setPatchingKb("detach")
    try {
      await api.patch(`/projects/${bot.id}`, { knowledgeBaseId: null })
      onBotUpdate({ knowledgeBase: null })
    } catch {
    } finally {
      setPatchingKb(null)
    }
  }

  async function saveThreshold() {
    setThresholdSaving(true)
    try {
      await api.patch(`/projects/${bot.id}`, { confidenceThreshold: threshold })
      onBotUpdate({ confidenceThreshold: threshold })
      setThresholdSaved(true)
      setTimeout(() => setThresholdSaved(false), 2000)
    } catch {
    } finally {
      setThresholdSaving(false)
    }
  }

  async function runSearch() {
    if (!searchQuery.trim() || !bot.knowledgeBase) return
    setSearching(true)
    setSearchDone(false)
    try {
      const res = await api.post(`/knowledge-bases/${bot.knowledgeBase.id}/search`, {
        query: searchQuery.trim(),
        topK: 4,
      })
      const data = (res.data as any)?.data ?? res.data
      setSearchResults(Array.isArray(data) ? data : [])
      setSearchDone(true)
    } catch {
      setSearchResults([])
      setSearchDone(true)
    } finally {
      setSearching(false)
    }
  }

  const activePreset = THRESHOLD_PRESETS.find((p) => Math.abs(p.value - threshold) < 0.05)

  // ── ATTACHED STATE ──────────────────────────────────────────────────────

  if (bot.knowledgeBase) {
    return (
      <div className="flex flex-col gap-6">

        {/* KB card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{bot.knowledgeBase.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Attached knowledge base · answers sourced from these docs</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => router.push(`/dashboard/knowledge`)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground gap-1.5 hover:text-destructive"
                onClick={detachKb}
                disabled={patchingKb === "detach"}
              >
                {patchingKb === "detach"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Unlink className="h-3.5 w-3.5" />
                }
                Detach
              </Button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="border-t border-border/50 divide-x divide-border/50 flex">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/knowledge`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add documents
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/knowledge`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              View documents
            </button>
          </div>
        </div>

        {/* Switch KB */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Switch to another knowledge base</p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => router.push("/dashboard/knowledge/new")}
            >
              <Plus className="w-3 h-3" />
              Create KB project
            </Button>
          </div>
          {!kbsLoaded ? (
            <button
              type="button"
              onClick={loadKbs}
              className="flex items-center gap-2 text-xs text-primary hover:underline font-medium w-fit"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Show other knowledge bases
            </button>
          ) : loadingKbs ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : kbs.filter(k => k.id !== bot.knowledgeBase?.id).length === 0 ? (
            <p className="text-xs text-muted-foreground">No other knowledge bases.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {kbs.filter(k => k.id !== bot.knowledgeBase?.id).map((kb) => (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => attachKb(kb.id)}
                  disabled={!!patchingKb}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{kb.name}</p>
                    <p className="text-xs text-muted-foreground">{kb.documentCount} documents</p>
                  </div>
                  {patchingKb === kb.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── NOT ATTACHED STATE ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Warning banner */}
      <div className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{bot.name} has no knowledge yet</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {getSetupHints(bot).kbHint}
          </p>
        </div>
      </div>

      {/* KB list / empty */}
      {!kbsLoaded && !loadingKbs ? (
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 h-9" onClick={loadKbs}>
            <BookOpen className="w-3.5 h-3.5" />
            Browse knowledge bases
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-9" onClick={() => router.push("/dashboard/knowledge/new")}>
            <Plus className="w-3.5 h-3.5" />
            Create KB project
          </Button>
        </div>
      ) : loadingKbs ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : kbs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 py-10 text-center bg-muted/10">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500/70" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">No knowledge bases yet</p>
            <p className="text-xs text-muted-foreground">Create a KB and upload your docs, URLs, or FAQs.</p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/knowledge")}
            className="gap-1.5 h-8 text-xs mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Create knowledge base
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {kbs.map((kb) => {
              const selected = selectedKbId === kb.id
              return (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => setSelectedKbId(selected ? null : kb.id)}
                  className={cn(
                    "w-full text-left rounded-xl border px-4 py-3.5 transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        selected ? "border-primary bg-primary" : "border-border",
                      )}
                    >
                      {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kb.documentCount} document{kb.documentCount !== 1 ? "s" : ""}
                        {kb.description ? ` · ${kb.description}` : ""}
                      </p>
                    </div>
                    {selected && (
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium shrink-0">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button
              disabled={!selectedKbId || !!patchingKb}
              onClick={() => selectedKbId && attachKb(selectedKbId)}
              className="gap-1.5"
            >
              {patchingKb ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Attach selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/knowledge")}
              className="gap-1.5 text-muted-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
              New knowledge base
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
