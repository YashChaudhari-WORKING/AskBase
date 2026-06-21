"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, Loader2, Sparkles, Trash2 } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToneCard } from "@/components/tone-card"
import { cn } from "@/lib/utils"
import type { Bot, SettingsState } from "./types"

const CONFIDENCE_PRESETS = [
  { label: "Relaxed",  value: 25, color: "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500" },
  { label: "Balanced", value: 45, color: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500"           },
  { label: "Strict",   value: 70, color: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500"                     },
]

const TONE_OPTIONS: Array<{ value: Bot["tone"]; icon: string; label: string }> = [
  { value: "friendly",  icon: "/icons/tone-friendly.svg",  label: "Friendly"  },
  { value: "formal",    icon: "/icons/tone-formal.svg",    label: "Formal"    },
  { value: "technical", icon: "/icons/tone-technical.svg", label: "Technical" },
  { value: "concise",   icon: "/icons/tone-concise.svg",   label: "Concise"   },
  { value: "compact",   icon: "/icons/tone-compact.svg",   label: "Compact"   },
  { value: "custom",    icon: "/icons/tone-custom.svg",    label: "Custom"    },
]

export function SettingsTab({
  bot,
  onBotUpdate,
}: {
  bot: Bot
  onBotUpdate: (updated: Partial<Bot>) => void
}) {
  const [form, setForm] = useState<SettingsState>({
    systemPrompt: bot.systemPrompt ?? "",
    tone: bot.tone,
    fallbackMessage: bot.fallbackMessage,
    confidenceThreshold: bot.confidenceThreshold,
    isCustomConfidence: !CONFIDENCE_PRESETS.some((p) => p.value === bot.confidenceThreshold),
    notificationEmail: bot.notificationEmail ?? "",
    notificationWebhook: bot.notificationWebhook ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const [togglingActive, setTogglingActive] = useState(false)

  async function generatePrompt() {
    setGeneratingPrompt(true)
    try {
      const res = await api.post<{ prompt: string }>("/projects/generate-prompt", {
        name: bot.name,
        tone: form.tone,
        assistantType: bot.assistantType,
      })
      setForm((prev) => ({ ...prev, systemPrompt: res.data.prompt }))
    } catch {
      // silently ignore
    } finally {
      setGeneratingPrompt(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        tone: form.tone,
        fallbackMessage: form.fallbackMessage,
        confidenceThreshold: form.confidenceThreshold,
        notificationEmail: form.notificationEmail || null,
        notificationWebhook: form.notificationWebhook || null,
      }
      if (bot.assistantType !== "flow") {
        payload.systemPrompt = form.systemPrompt || null
      }
      await api.patch(`/projects/${bot.id}`, payload)
      onBotUpdate(payload as Partial<Bot>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive() {
    setTogglingActive(true)
    try {
      await api.patch(`/projects/${bot.id}`, { isActive: !bot.isActive })
      onBotUpdate({ isActive: !bot.isActive })
    } catch {
      // silently ignore
    } finally {
      setTogglingActive(false)
    }
  }

  async function deletePermanently() {
    if (deleteInput !== bot.name) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${bot.id}/permanent`)
      router.push("/dashboard/bots")
    } catch {
      setDeleting(false)
    }
  }

  const isAiOrHybrid = bot.assistantType !== "flow"

  return (
    <div className="flex flex-col gap-4 w-full">
      {isAiOrHybrid && (
        <>
          {/* System prompt */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                System Prompt
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={generatePrompt}
                disabled={generatingPrompt}
                className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {generatingPrompt
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Sparkles className="h-3 w-3" />}
                Regenerate
              </Button>
            </div>
            <Textarea
              rows={7}
              value={form.systemPrompt}
              onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="You are a helpful assistant for..."
              className="border-0 rounded-none resize-y text-base focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-5 py-4 leading-relaxed min-h-[140px]"
            />
          </div>

          {/* Tone */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tone of voice
              </p>
            </div>
            <div className="px-5 py-4 flex flex-wrap gap-2.5">
              {TONE_OPTIONS.map((t) => (
                <ToneCard
                  key={t.value}
                  value={t.value}
                  icon={t.icon}
                  label={t.label}
                  selected={form.tone === t.value}
                  onClick={() => setForm((prev) => ({ ...prev, tone: t.value }))}
                  compact
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Fallback message */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            When it can't help, say…
          </p>
        </div>
        <div className="px-5 py-4">
          <Input
            value={form.fallbackMessage}
            onChange={(e) => setForm((prev) => ({ ...prev, fallbackMessage: e.target.value }))}
            className="h-10 text-sm border-border/60"
          />
        </div>
      </div>

      {/* Handoff sensitivity */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            When to connect to a human
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2.5">
            {CONFIDENCE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    confidenceThreshold: preset.value,
                    isCustomConfidence: false,
                  }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !form.isCustomConfidence && form.confidenceThreshold === preset.value
                    ? preset.color + " ring-1"
                    : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="font-bold tabular-nums">{preset.value}%</span>
                <span className="opacity-70">{preset.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isCustomConfidence: true }))}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                form.isCustomConfidence
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500"
                  : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="font-bold tabular-nums">
                {form.isCustomConfidence ? `${form.confidenceThreshold}%` : "—"}
              </span>
              <span className="opacity-70">Custom</span>
            </button>
          </div>

          {form.isCustomConfidence && (
            <div className="flex flex-col gap-2 pt-1">
              <input
                type="range"
                min={1}
                max={100}
                value={form.confidenceThreshold}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    confidenceThreshold: Number(e.target.value),
                  }))
                }
                className="w-full accent-violet-500 h-1.5"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rarely escalates</span>
                <span className="tabular-nums font-semibold text-violet-600 dark:text-violet-400">
                  {form.confidenceThreshold}%
                </span>
                <span>Always escalates</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-fit h-9 px-5 text-sm font-semibold"
      >
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {saved ? (
          <>
            <Check className="mr-2 h-3.5 w-3.5" />
            Saved
          </>
        ) : (
          "Save settings"
        )}
      </Button>

      {/* Notifications */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-muted/20">
          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Notifications
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Get notified when a lead is captured or a visitor requests a human agent.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Email
              </label>
              <Input
                type="email"
                value={form.notificationEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, notificationEmail: e.target.value }))}
                placeholder="team@company.com"
                className="h-9 text-sm border-border/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Webhook URL
              </label>
              <Input
                value={form.notificationWebhook}
                onChange={(e) => setForm((prev) => ({ ...prev, notificationWebhook: e.target.value }))}
                placeholder="https://hooks.slack.com/…"
                className="h-9 text-sm border-border/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/[0.03] overflow-hidden">
        <div className="px-5 py-3 border-b border-destructive/15 bg-destructive/[0.04]">
          <p className="text-xs font-semibold uppercase tracking-widest text-destructive/60">
            Danger zone
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {bot.isActive ? "Pause assistant" : "Activate assistant"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {bot.isActive
                  ? "The assistant will stop responding to new messages."
                  : "Resume responding to messages."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleActive}
              disabled={togglingActive}
              className="shrink-0 h-8 text-sm px-4"
            >
              {togglingActive && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {bot.isActive ? "Pause" : "Activate"}
            </Button>
          </div>

          <div className="border-t border-destructive/15 pt-4 flex flex-col gap-2.5">
            <div>
              <p className="text-sm font-medium text-destructive">Delete permanently</p>
              <p className="text-xs text-muted-foreground mt-1">
                This action cannot be undone. All data will be lost.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                size="sm"
                variant="outline"
                className="w-fit h-8 text-sm px-4 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete permanently
              </Button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <p className="text-sm text-muted-foreground">
                  Type{" "}
                  <span className="font-mono font-semibold text-foreground">{bot.name}</span>{" "}
                  to confirm
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={bot.name}
                    className="max-w-[220px] h-9 text-sm border-border/60"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deletePermanently}
                    disabled={deleteInput !== bot.name || deleting}
                    className="h-9 text-sm"
                  >
                    {deleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Confirm delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteInput("")
                    }}
                    className="h-9 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
