"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  GitBranch,
  HelpCircle,
  Layers,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import type { Bot, FlowItem } from "./types"
import { getSetupHints } from "./utils"

export function FallbackFlowSection({
  bot,
  attached,
  onBotUpdate,
}: {
  bot: Bot
  attached: Array<{ flowId: string; flowName: string; trigger: string }>
  onBotUpdate: (updated: Partial<Bot>) => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selected, setSelected] = useState(bot.fallbackFlowId ?? "")

  async function save() {
    setSaving(true)
    try {
      await api.patch(`/projects/${bot.id}`, { fallbackFlowId: selected || null })
      onBotUpdate({ fallbackFlowId: selected || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 flex items-center gap-3">
      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">Fallback flow</p>
        <p className="text-[11px] text-muted-foreground">Runs when the AI can't help or confidence is too low.</p>
      </div>
      <select
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaved(false) }}
        className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground min-w-[180px]"
      >
        <option value="">None — fallback message only</option>
        {attached.map((f) => (
          <option key={f.flowId} value={f.flowId}>{f.flowName}</option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={save}
        disabled={saving || selected === (bot.fallbackFlowId ?? "")}
        className="h-8 text-xs gap-1.5 shrink-0"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  )
}

export function FlowTab({
  bot,
  onBotUpdate,
}: {
  bot: Bot
  onBotUpdate: (updated: Partial<Bot>) => void
}) {
  const router = useRouter()
  const [allFlows, setAllFlows] = useState<FlowItem[]>([])
  const [loadingFlows, setLoadingFlows] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createText, setCreateText] = useState("")
  const [createGenerating, setCreateGenerating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createQuestions, setCreateQuestions] = useState<string[] | null>(null)
  const [createAnswers, setCreateAnswers] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [localTriggers, setLocalTriggers] = useState<Record<string, string>>({})
  const [newPhraseMap, setNewPhraseMap] = useState<Record<string, string>>({})
  const [attachingAll, setAttachingAll] = useState(false)

  const FLOW_STORAGE_KEY = "askbase_flow_bot_payload"
  const FLOW_EXAMPLES = [
    "SaaS company. Book a product demo — collect name, work email, company name, and preferred date.",
    "Restaurant. Book a table — collect name, phone, party size, and preferred date and time.",
    "Real estate. Capture buyer inquiries — name, email, phone, budget range, and property interest.",
    "Private school. Collect parent name, email, phone, and which class they're enquiring about.",
    "Collect feedback — a 1-5 rating, what they liked most, and what we can improve.",
  ]

  async function handleCreateBuild() {
    const trimmed = createText.trim()
    if (!trimmed || createGenerating) return
    setCreateGenerating(true)
    setCreateError(null)
    try {
      const res = await api.post("/projects/generate-flow-bot", { description: trimmed })
      const data = res.data?.data ?? res.data
      if (data?.needsClarification && Array.isArray(data.questions) && data.questions.length > 0) {
        setCreateQuestions(data.questions)
        setCreateAnswers({})
        setCreateGenerating(false)
        return
      }
      sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ description: trimmed, config: data }))
      sessionStorage.setItem("askbase_attach_to_bot_id", bot.id)
      sessionStorage.setItem("askbase_attach_to_bot_name", bot.name)
      router.push("/dashboard/bots/new/flow/build")
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.message || "Failed to generate. Try rephrasing.")
      setCreateGenerating(false)
    }
  }

  async function handleCreateSubmitAnswers() {
    if (!createQuestions) return
    const trimmed = createText.trim()
    if (!trimmed) return
    setCreateGenerating(true)
    setCreateError(null)
    try {
      const clarificationAnswers: Record<string, string> = {}
      createQuestions.forEach((q, i) => {
        const a = createAnswers[i]?.trim()
        if (a) clarificationAnswers[q] = a
      })
      const res = await api.post("/projects/generate-flow-bot", { description: trimmed, clarificationAnswers })
      const data = res.data?.data ?? res.data
      if (data?.needsClarification && Array.isArray(data.questions)) {
        setCreateQuestions(data.questions)
        setCreateAnswers({})
        setCreateGenerating(false)
        return
      }
      sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ description: trimmed, config: data }))
      sessionStorage.setItem("askbase_attach_to_bot_id", bot.id)
      sessionStorage.setItem("askbase_attach_to_bot_name", bot.name)
      router.push("/dashboard/bots/new/flow/build")
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.message || "Failed to generate.")
      setCreateGenerating(false)
    }
  }

  function openCreate() {
    setShowCreate(true)
    setShowPicker(false)
    setCreateText("")
    setCreateError(null)
    setCreateQuestions(null)
    setCreateAnswers({})
  }

  function closeCreate() {
    setShowCreate(false)
    setCreateGenerating(false)
    setCreateError(null)
    setCreateQuestions(null)
  }

  const attached = bot.attachedFlows ?? []
  const attachedIds = new Set(attached.map((f) => f.flowId))

  useEffect(() => {
    setLoadingFlows(true)
    api
      .get("/flows")
      .then((r) => setAllFlows(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadingFlows(false))
  }, [])

  useEffect(() => {
    const map: Record<string, string> = {}
    attached.forEach((f) => { map[f.flowId] = f.trigger })
    setLocalTriggers(map)
  }, [bot.attachedFlows])

  async function attachFlow(flow: FlowItem) {
    const next = [...attached, { flowId: flow.id, flowName: flow.name, trigger: "" }]
    await saveFlows(next)
    setExpandedId(flow.id)
  }

  async function detachFlow(flowId: string) {
    const next = attached.filter((f) => f.flowId !== flowId)
    await saveFlows(next)
  }

  async function saveTrigger(flowId: string) {
    setSavingId(flowId)
    const next = attached.map((f) =>
      f.flowId === flowId ? { ...f, trigger: localTriggers[flowId] ?? f.trigger } : f
    )
    await saveFlows(next)
    setSavingId(null)
  }

  async function saveFlows(next: typeof attached) {
    try {
      await api.patch(`/projects/${bot.id}`, { attachedFlows: next })
      onBotUpdate({ attachedFlows: next })
    } catch {
      // silently ignore
    }
  }

  async function attachAllFlows(flows: FlowItem[]) {
    if (!flows.length || attachingAll) return
    setAttachingAll(true)
    try {
      // Generate triggers for all flows in parallel, then attach in one PATCH
      const withTriggers = await Promise.all(
        flows.map(async (flow) => {
          let trigger = ""
          try {
            const res = await api.post("/projects/generate-trigger", {
              flowName: flow.name,
              botContext: bot.systemPrompt ?? bot.name,
            })
            trigger = res.data?.data?.trigger ?? res.data?.trigger ?? ""
          } catch { /* non-fatal */ }
          return { flowId: flow.id, flowName: flow.name, trigger }
        })
      )
      const next = [...attached, ...withTriggers]
      await saveFlows(next)
    } finally {
      setAttachingAll(false)
    }
  }

  async function generateTrigger(flowId: string, flowName: string) {
    setGeneratingId(flowId)
    try {
      const res = await api.post("/projects/generate-trigger", {
        flowName,
        botContext: bot.systemPrompt ?? bot.name,
      })
      const trigger = res.data?.data?.trigger ?? res.data?.trigger ?? ""
      setLocalTriggers((prev) => ({ ...prev, [flowId]: trigger }))
      // auto-save
      const next = attached.map((f) =>
        f.flowId === flowId ? { ...f, trigger } : f
      )
      await saveFlows(next)
    } catch {
      // silently ignore
    } finally {
      setGeneratingId(null)
    }
  }

  const availableFlows = allFlows.filter((f) => !attachedIds.has(f.id))

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold tracking-tight">Flows</p>
          <p className="text-sm text-muted-foreground">
            Attach flows with trigger phrases — the AI fires the right one when a visitor matches.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={openCreate} className="gap-1.5 h-9">
            <Sparkles className="w-3.5 h-3.5" />
            Create with AI
          </Button>
          <Button size="sm" onClick={() => { setShowPicker((p) => !p); setShowCreate(false) }} className="gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" />
            Attach existing
          </Button>
        </div>
      </div>

      {/* Builder hint */}
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Automate in the Flow Builder</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add nodes to collect inputs, branch on conditions, send to Google Sheets, trigger webhooks, and more.
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 shrink-0 text-primary hover:text-primary" onClick={() => router.push("/dashboard/flows")}>
          Open builder <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Inline create-flow panel */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">Create a new flow with AI</p>
            </div>
            <button type="button" onClick={closeCreate}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <Textarea
              autoFocus
              rows={3}
              value={createText}
              onChange={(e) => {
                setCreateText(e.target.value)
                if (createQuestions) { setCreateQuestions(null); setCreateAnswers({}) }
              }}
              placeholder="Describe what the flow should collect or do — e.g. Book a product demo, collect name, email, and preferred date."
              className="text-sm resize-none"
              disabled={createGenerating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  if (createQuestions) handleCreateSubmitAnswers()
                  else handleCreateBuild()
                }
              }}
            />

            {/* Example chips */}
            {!createQuestions && (
              <div className="flex flex-wrap gap-1.5">
                {FLOW_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={createGenerating}
                    onClick={() => { setCreateText(ex); setCreateQuestions(null); setCreateAnswers({}) }}
                    className="text-[11px] px-2 py-1 rounded-md border border-border/60 bg-muted/40 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {ex.split(".")[0]}
                  </button>
                ))}
              </div>
            )}

            {createError && <p className="text-xs text-destructive">{createError}</p>}

            {/* Clarification Q&A */}
            {createQuestions && createQuestions.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">A few quick questions</p>
                    <p className="text-xs text-muted-foreground">Answer so the flow is built correctly.</p>
                  </div>
                </div>
                {createQuestions.map((q, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <label className="text-xs text-foreground">{q}</label>
                    <Textarea
                      rows={2}
                      value={createAnswers[i] ?? ""}
                      onChange={(e) => setCreateAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="Your answer…"
                      className="text-sm resize-none"
                      disabled={createGenerating}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setCreateQuestions(null); setCreateAnswers({}) }}
                    disabled={createGenerating}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip — let AI guess
                  </button>
                  <Button
                    size="sm"
                    disabled={!createQuestions.every((_, i) => (createAnswers[i] ?? "").trim()) || createGenerating}
                    onClick={handleCreateSubmitAnswers}
                    className="gap-1.5"
                  >
                    {createGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    {createGenerating ? "Building…" : "Build flow"}
                  </Button>
                </div>
              </div>
            )}

            {!createQuestions && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">⌘</kbd>{" "}
                  <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">↵</kbd>
                  {" "}to continue
                </span>
                <Button
                  size="sm"
                  disabled={!createText.trim() || createGenerating}
                  onClick={handleCreateBuild}
                  className="gap-1.5"
                >
                  {createGenerating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : <>Continue <ArrowRight className="w-3.5 h-3.5" /></>
                  }
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flow picker */}
      {showPicker && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold">Select a flow to attach</p>
            <button type="button" onClick={() => setShowPicker(false)}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          {loadingFlows ? (
            <div className="p-4 flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : availableFlows.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {allFlows.length === 0 ? "No flows yet." : "All flows are already attached."}
              </p>
              {allFlows.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1.5"
                  onClick={() => router.push("/dashboard/flows")}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create your first flow
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {availableFlows.map((flow) => (
                <div key={flow.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{flow.name}</p>
                    {flow.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{flow.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { attachFlow(flow); setShowPicker(false) }}
                    className="shrink-0 ml-4 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attached flows list */}
      {attached.length === 0 ? (
        availableFlows.length > 0 ? (
          /* User has flows in library but none attached — show them inline */
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/60 bg-muted/30 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {availableFlows.length} flow{availableFlows.length !== 1 ? "s" : ""} in your library — not attached yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attach flows so the AI fires them when a visitor matches their trigger phrases.
                </p>
              </div>
              <Button
                size="sm"
                disabled={attachingAll}
                onClick={() => attachAllFlows(availableFlows)}
                className="shrink-0 gap-1.5 h-8 text-xs"
              >
                {attachingAll
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Attaching…</>
                  : <><Zap className="w-3.5 h-3.5" /> Attach all</>
                }
              </Button>
            </div>
            <div className="divide-y divide-border/50">
              {availableFlows.map((flow) => (
                <div key={flow.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <GitBranch className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{flow.name}</p>
                    {flow.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{flow.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { attachFlow(flow) }}
                    className="shrink-0 gap-1.5 h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach
                  </Button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Want to configure fields or data storage first?
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/flows")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open flow builder →
              </button>
            </div>
          </div>
        ) : (
          /* Truly no flows at all */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-14 gap-4 text-center bg-muted/10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-emerald-500/70" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm">No flows attached yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">{getSetupHints(bot).flowHint}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openCreate}>
                <Sparkles className="w-3.5 h-3.5" /> Create with AI
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowPicker(true)}>
                <Plus className="w-3.5 h-3.5" /> Attach existing
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {attached.map((af) => {
            const isExpanded = expandedId === af.flowId
            const isGenerating = generatingId === af.flowId
            const isSaving = savingId === af.flowId
            const trigger = localTriggers[af.flowId] ?? af.trigger
            const triggerPhrases = af.trigger
              ? af.trigger.split("|").map((t) => t.trim()).filter(Boolean)
              : []

            return (
              <div
                key={af.flowId}
                className={`rounded-2xl border bg-card overflow-hidden transition-all duration-200 ${
                  isExpanded ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5" : "border-border hover:border-border/80"
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-0.5 w-full ${isExpanded ? "bg-gradient-to-r from-emerald-500/60 to-emerald-500/10" : "bg-transparent"}`} />

                {/* Flow header row */}
                <div
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer group"
                  onClick={() => setExpandedId(isExpanded ? null : af.flowId)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isExpanded
                      ? "bg-emerald-500/15 border border-emerald-500/30"
                      : "bg-muted border border-border group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20"
                  }`}>
                    <GitBranch className={`w-4 h-4 transition-colors ${isExpanded ? "text-emerald-500" : "text-muted-foreground group-hover:text-emerald-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{af.flowName}</p>
                      {!af.trigger && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                          Needs trigger
                        </span>
                      )}
                      {triggerPhrases.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                          {triggerPhrases.length} trigger{triggerPhrases.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {triggerPhrases.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {triggerPhrases.map((phrase, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-0.5 rounded-full bg-muted/80 border border-border/60 text-muted-foreground"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-500/80 mt-1">No triggers set — the AI won't know when to activate this flow</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => router.push(`/dashboard/flows/${af.flowId}`)}
                    >
                      Open
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : af.flowId)}
                      className="h-8 w-8 rounded-lg hover:bg-accent transition-colors flex items-center justify-center"
                    >
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                  </div>
                </div>

                {/* Expandable trigger editor */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/10 px-5 py-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold">Trigger phrases</p>
                        <p className="text-xs text-muted-foreground">
                          Separate phrases with <code className="bg-muted border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono">|</code> — the AI fires this flow when any phrase matches
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs shrink-0"
                        disabled={isGenerating}
                        onClick={() => generateTrigger(af.flowId, af.flowName)}
                      >
                        {isGenerating
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Wand2 className="w-3 h-3" />
                        }
                        {isGenerating ? "Generating…" : "Generate with AI"}
                      </Button>
                    </div>
                    {/* Tag-style trigger builder */}
                    {(() => {
                      const phrases = trigger ? trigger.split("|").map((t) => t.trim()).filter(Boolean) : []
                      const newPhrase = newPhraseMap[af.flowId] ?? ""
                      function addPhrase() {
                        const p = newPhrase.trim()
                        if (!p || phrases.includes(p)) {
                          setNewPhraseMap((prev) => ({ ...prev, [af.flowId]: "" }))
                          return
                        }
                        const next = [...phrases, p].join(" | ")
                        setLocalTriggers((prev) => ({ ...prev, [af.flowId]: next }))
                        setNewPhraseMap((prev) => ({ ...prev, [af.flowId]: "" }))
                      }
                      function removePhrase(idx: number) {
                        const next = phrases.filter((_, i) => i !== idx).join(" | ")
                        setLocalTriggers((prev) => ({ ...prev, [af.flowId]: next }))
                      }
                      return (
                        <>
                          {/* Existing phrase pills with remove */}
                          {phrases.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-muted/30 border border-border/40 min-h-[44px]">
                              {phrases.map((phrase, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium"
                                >
                                  {phrase}
                                  <button
                                    type="button"
                                    onClick={() => removePhrase(i)}
                                    className="ml-0.5 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Add new phrase inline */}
                          <div className="flex gap-2">
                            <Input
                              value={newPhrase}
                              onChange={(e) => setNewPhraseMap((prev) => ({ ...prev, [af.flowId]: e.target.value }))}
                              placeholder="Type a trigger phrase and press Enter…"
                              className="text-sm h-9 flex-1"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); addPhrase() }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-9 px-3 gap-1.5 shrink-0"
                              onClick={addPhrase}
                              disabled={!newPhrase.trim()}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </Button>
                          </div>
                        </>
                      )
                    })()}

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        onClick={() => saveTrigger(af.flowId)}
                        disabled={isSaving || trigger === af.trigger}
                        className="gap-1.5"
                      >
                        {isSaving
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Check className="w-3 h-3" />
                        }
                        Save triggers
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                        onClick={() => detachFlow(af.flowId)}
                      >
                        <X className="w-3 h-3" />
                        Detach flow
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => router.push("/dashboard/flows")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors text-left px-1"
          >
            Configure fields, webhooks, or success messages in the flow builder →
          </button>
        </div>
      )}

      {/* Fallback flow — always at bottom */}
      {attached.length > 0 && (
        <FallbackFlowSection bot={bot} attached={attached} onBotUpdate={onBotUpdate} />
      )}
    </div>
  )
}
