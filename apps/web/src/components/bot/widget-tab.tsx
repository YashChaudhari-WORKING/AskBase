"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check, ExternalLink,
  Loader2, Palette, Plus, Settings2, Upload, X,
} from "lucide-react"
import api from "@/lib/api"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Bot, WidgetThemeSummary } from "./types"

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-20 shrink-0 text-xs text-muted-foreground">{children}</span>
  )
}

function SaveRow({
  onSave, saving, saved, label = "Save",
}: {
  onSave: () => void; saving: boolean; saved: boolean; label?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onSave} disabled={saving} size="sm" className="gap-2 h-8 px-4 text-sm">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
        {saved ? "Saved" : label}
      </Button>
      {saved && <p className="text-xs text-muted-foreground">Changes saved</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-muted-foreground/25",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  )
}

function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-background">
      {children}
    </div>
  )
}

function ListRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-3 min-h-[40px]", className)}>
      {children}
    </div>
  )
}

function InlineInput({
  value, onChange, placeholder, mono,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/40 min-w-0 py-2.5",
        mono && "font-mono text-xs",
      )}
    />
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border-t border-border"
    >
      <span className="w-5 h-5 rounded-md border border-border bg-background flex items-center justify-center shrink-0">
        <Plus className="w-3 h-3" />
      </span>
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main WidgetTab
// ---------------------------------------------------------------------------

export function WidgetTab({
  bot,
  onBotUpdate,
}: {
  bot: Bot
  onBotUpdate: (updated: Partial<Bot>) => void
}) {
  const router = useRouter()

  // ── Appearance ──────────────────────────────────────────────────────────
  const [themes, setThemes] = useState<WidgetThemeSummary[]>([])
  const [loadingThemes, setLoadingThemes] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(bot.widgetThemeId ?? null)
  const [themeSaving, setThemeSaving] = useState(false)

  useEffect(() => {
    api
      .get("/widget-themes")
      .then((r) => setThemes((r.data as any)?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingThemes(false))
  }, [])

  async function applyTheme(themeId: string | null) {
    setSelectedTheme(themeId)
    setThemeSaving(true)
    try {
      await api.patch(`/projects/${bot.id}`, { widgetThemeId: themeId })
      onBotUpdate({ widgetThemeId: themeId })
    } catch {
      setSelectedTheme(bot.widgetThemeId ?? null)
    } finally {
      setThemeSaving(false)
    }
  }

  // ── Content ─────────────────────────────────────────────────────────────
  const [homeGreeting, setHomeGreeting] = useState(bot.homeGreeting || "How can we help?")
  const [homeSubgreeting, setHomeSubgreeting] = useState(bot.homeSubgreeting || "We usually reply in a few minutes.")
  const [starters, setStarters] = useState<Array<{ label: string; message?: string }>>(bot.conversationStarters ?? [])
  const [quickReplies, setQuickReplies] = useState<Array<{ label: string }>>(bot.widgetQuickReplies ?? [])
  const [showHelp, setShowHelp] = useState(bot.showHelpCenter ?? false)
  const [helpTitle, setHelpTitle] = useState(bot.helpCenterTitle || "Help & Resources")
  const [helpArticles, setHelpArticles] = useState<Array<{ title: string; url?: string }>>(bot.helpArticles ?? [])
  const [helpUrl, setHelpUrl] = useState(bot.helpCenterUrl || "")
  const [contentSaving, setContentSaving] = useState(false)
  const [contentSaved, setContentSaved] = useState(false)

  async function saveContent() {
    setContentSaving(true)
    try {
      const payload = {
        homeGreeting,
        homeSubgreeting,
        conversationStarters: starters.filter((s) => s.label.trim()),
        widgetQuickReplies: quickReplies.filter((q) => q.label.trim()),
        showHelpCenter: showHelp,
        helpCenterTitle: helpTitle,
        helpArticles: helpArticles.filter((a) => a.title.trim()),
        helpCenterUrl: helpUrl.trim() || null,
      }
      await api.patch(`/projects/${bot.id}`, payload)
      onBotUpdate(payload as Partial<Bot>)
      setContentSaved(true)
      setTimeout(() => setContentSaved(false), 2000)
    } catch {
    } finally {
      setContentSaving(false)
    }
  }

  // ── Auto trigger ─────────────────────────────────────────────────────────
  const [openingMessages, setOpeningMessages] = useState<Array<{ text: string; delaySeconds: number }>>(bot.openingMessages ?? [])
  const [repeatMessages, setRepeatMessages] = useState(bot.repeatMessages ?? false)
  const [triggerSaving, setTriggerSaving] = useState(false)
  const [triggerSaved, setTriggerSaved] = useState(false)
  const [triggerError, setTriggerError] = useState<string | null>(null)

  useEffect(() => {
    setOpeningMessages(bot.openingMessages ?? [])
    setRepeatMessages(bot.repeatMessages ?? false)
  }, [bot.id])

  async function saveTrigger() {
    setTriggerSaving(true)
    setTriggerError(null)
    try {
      const payload = {
        openingMessages: openingMessages.filter((m) => m.text.trim()),
        repeatMessages,
      }
      await api.patch(`/projects/${bot.id}`, payload)
      onBotUpdate(payload as Partial<Bot>)
      setTriggerSaved(true)
      setTimeout(() => setTriggerSaved(false), 2000)
    } catch (err: any) {
      setTriggerError(err?.response?.data?.error || err?.message || "Failed to save.")
    } finally {
      setTriggerSaving(false)
    }
  }

  // ── Window ───────────────────────────────────────────────────────────────
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">(bot.widgetPosition ?? "bottom-right")
  const [windowSaving, setWindowSaving] = useState(false)
  const [windowSaved, setWindowSaved] = useState(false)

  async function saveWindow() {
    setWindowSaving(true)
    try {
      await api.patch(`/projects/${bot.id}`, { widgetPosition })
      onBotUpdate({ widgetPosition })
      setWindowSaved(true)
      setTimeout(() => setWindowSaved(false), 2000)
    } catch {
    } finally {
      setWindowSaving(false)
    }
  }

  // ── Identity & Branding ─────────────────────────────────────────────────
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarEmoji, setAvatarEmoji] = useState(bot.botAvatarEmoji || "💬")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(bot.botAvatarUrl ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [botSubtitle, setBotSubtitle] = useState(bot.botSubtitle || "")
  const [businessHours, setBusinessHours] = useState(bot.businessHoursText || "")
  const [inputPlaceholder, setInputPlaceholder] = useState(bot.inputPlaceholder || "Type a message…")
  const [allowAttachments, setAllowAttachments] = useState(bot.allowAttachments ?? false)
  const [showPoweredBy, setShowPoweredBy] = useState(bot.showPoweredBy ?? true)
  const [footerText, setFooterText] = useState(bot.footerText || "")
  const [footerLinkUrl, setFooterLinkUrl] = useState(bot.footerLinkUrl || "")
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingSaved, setBrandingSaved] = useState(false)

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setAvatarUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setAvatarUrl(url)
    } catch { } finally {
      setAvatarUploading(false)
    }
  }

  async function saveBranding() {
    setBrandingSaving(true)
    try {
      const payload = {
        botAvatarEmoji: avatarEmoji,
        botAvatarUrl: avatarUrl,
        botSubtitle: botSubtitle.trim() || null,
        businessHoursText: businessHours.trim() || null,
        inputPlaceholder: inputPlaceholder.trim() || "Type a message…",
        allowAttachments,
        showPoweredBy,
        footerText: footerText.trim() || null,
        footerLinkUrl: footerLinkUrl.trim() || null,
      }
      await api.patch(`/projects/${bot.id}`, payload)
      onBotUpdate(payload as Partial<Bot>)
      setBrandingSaved(true)
      setTimeout(() => setBrandingSaved(false), 2000)
    } catch {
    } finally {
      setBrandingSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">

      {/* ══ APPEARANCE ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="Appearance" description="Choose a theme or use your brand color." />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/widgets")}
            className="h-8 gap-1.5 text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New theme
          </Button>
        </div>

        {loadingThemes ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((n) => <Skeleton key={n} className="w-[160px] h-[130px] rounded-xl shrink-0" />)}
          </div>
        ) : themes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center flex flex-col items-center gap-3">
            <Palette className="w-6 h-6 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-foreground">No themes yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a theme to match your brand</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/widgets")} className="h-8 text-sm gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create theme
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">

            {/* No theme card */}
            <button
              type="button"
              onClick={() => applyTheme(null)}
              className={cn(
                "w-[160px] flex flex-col rounded-xl border text-left transition-all overflow-hidden",
                selectedTheme === null
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-border/80",
              )}
            >
              <div className="w-full h-[84px] flex items-center justify-center bg-muted/30 border-b border-border/50">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 bg-card">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">No theme</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Brand color only</p>
                </div>
                {selectedTheme === null && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-2">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </span>
                )}
              </div>
            </button>

            {/* Theme cards */}
            {themes.map((theme) => {
              const isActive = selectedTheme === theme.id
              return (
                <div
                  key={theme.id}
                  className={cn(
                    "w-[160px] rounded-xl border overflow-hidden transition-all flex flex-col",
                    isActive ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-border/80",
                  )}
                >
                  {/* Preview */}
                  <button type="button" onClick={() => applyTheme(theme.id)} className="w-full text-left block">
                    <div className="h-[84px] flex flex-col" style={{ backgroundColor: theme.chatBgColor }}>
                      {/* Header bar */}
                      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ backgroundColor: theme.headerBgColor }}>
                        <span className="text-xs leading-none">{theme.botAvatarEmoji || "⚡"}</span>
                        <span className="text-[10px] font-semibold text-white/90 truncate">{theme.botName || "Assistant"}</span>
                      </div>
                      {/* Chat area */}
                      <div className="flex flex-col gap-1.5 px-3 py-2 flex-1">
                        <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: theme.botBubbleBg, opacity: 0.9 }} />
                        <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: theme.botBubbleBg, opacity: 0.6 }} />
                      </div>
                      {/* User reply */}
                      <div className="flex justify-end px-3 pb-2">
                        <div className="h-2 rounded-full w-2/5" style={{ backgroundColor: theme.userBubbleBg, opacity: 0.85 }} />
                      </div>
                    </div>
                  </button>

                  {/* Footer */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-card border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => applyTheme(theme.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-semibold text-foreground truncate">{theme.name}</p>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/widgets/${theme.id}`) }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="Edit theme"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {themeSaving && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying theme…
          </p>
        )}
      </div>

      {/* ══ IDENTITY & BRANDING ════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4">
        <SectionTitle title="Identity & Branding" description="Avatar, subtitle, powered by, and work hours shown in the widget." />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Left: Avatar + subtitle + hours */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Bot identity</p>
            <ListCard>
              {/* Avatar row */}
              <ListRow className="gap-3 py-2.5">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border">
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-border hover:border-primary/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="sr-only" />
                </div>
                <input
                  value={avatarEmoji}
                  onChange={(e) => { setAvatarEmoji(e.target.value); setAvatarUrl(null) }}
                  disabled={!!avatarUrl}
                  placeholder="💬"
                  maxLength={4}
                  className="w-14 text-center text-xl bg-transparent border border-border rounded-lg h-9 outline-none disabled:opacity-40 focus:ring-1 focus:ring-primary/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">Avatar</p>
                  <p className="text-[11px] text-muted-foreground">Upload image or use emoji</p>
                </div>
              </ListRow>
              <ListRow>
                <FieldLabel>Subtitle</FieldLabel>
                <InlineInput value={botSubtitle} onChange={setBotSubtitle} placeholder="We reply in minutes" />
              </ListRow>
              <ListRow>
                <FieldLabel>Work hours</FieldLabel>
                <InlineInput value={businessHours} onChange={setBusinessHours} placeholder="Mon–Fri, 9am–5pm" />
              </ListRow>
            </ListCard>
          </div>

          {/* Right: Input + Powered by */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Input</p>
              <ListCard>
                <ListRow>
                  <FieldLabel>Placeholder</FieldLabel>
                  <InlineInput value={inputPlaceholder} onChange={setInputPlaceholder} placeholder="Type a message…" />
                </ListRow>
                <ListRow>
                  <span className="flex-1 text-sm font-medium text-foreground">Allow attachments</span>
                  <Toggle checked={allowAttachments} onChange={setAllowAttachments} />
                </ListRow>
              </ListCard>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Powered by</p>
              <ListCard>
                <ListRow>
                  <span className="flex-1 text-sm font-medium text-foreground">Show powered by</span>
                  <Toggle checked={showPoweredBy} onChange={setShowPoweredBy} />
                </ListRow>
                {showPoweredBy && (
                  <>
                    <ListRow>
                      <FieldLabel>Text</FieldLabel>
                      <InlineInput value={footerText} onChange={setFooterText} placeholder="Powered by AskBase" />
                    </ListRow>
                    <ListRow>
                      <FieldLabel>Link URL</FieldLabel>
                      <InlineInput value={footerLinkUrl} onChange={setFooterLinkUrl} placeholder="https://askbase.io" mono />
                    </ListRow>
                  </>
                )}
              </ListCard>
            </div>
          </div>
        </div>

        <SaveRow onSave={saveBranding} saving={brandingSaving} saved={brandingSaved} label="Save branding" />
      </div>

      {/* ══ TWO EQUAL COLUMNS ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── LEFT: Content ── */}
        <div className="flex flex-col gap-4">
          <SectionTitle title="Content" description="Text and options visitors see in the widget." />

          {/* Home screen */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Home screen</p>
            <ListCard>
              <ListRow>
                <FieldLabel>Greeting</FieldLabel>
                <InlineInput value={homeGreeting} onChange={setHomeGreeting} placeholder="How can we help?" />
              </ListRow>
              <ListRow>
                <FieldLabel>Sub-text</FieldLabel>
                <InlineInput value={homeSubgreeting} onChange={setHomeSubgreeting} placeholder="We reply in minutes" />
              </ListRow>
            </ListCard>
          </div>

          {/* Conversation starters */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Conversation starters</p>
            <ListCard>
              {starters.map((s, i) => (
                <ListRow key={i}>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <InlineInput
                    value={s.label}
                    onChange={(v) => setStarters((p) => p.map((x, j) => j === i ? { ...x, label: v } : x))}
                    placeholder="Question visitors often ask…"
                  />
                  <DeleteBtn onClick={() => setStarters((p) => p.filter((_, j) => j !== i))} />
                </ListRow>
              ))}
              <AddBtn onClick={() => setStarters((p) => [...p, { label: "" }])} label="Add starter" />
            </ListCard>
          </div>

          {/* Quick replies */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Quick replies</p>
            <ListCard>
              {quickReplies.map((q, i) => (
                <ListRow key={i}>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <InlineInput
                    value={q.label}
                    onChange={(v) => setQuickReplies((p) => p.map((x, j) => j === i ? { label: v } : x))}
                    placeholder="Button label…"
                  />
                  <DeleteBtn onClick={() => setQuickReplies((p) => p.filter((_, j) => j !== i))} />
                </ListRow>
              ))}
              <AddBtn onClick={() => setQuickReplies((p) => [...p, { label: "" }])} label="Add reply" />
            </ListCard>
          </div>

          {/* Help center */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">Help center</p>
            <ListCard>
              <ListRow>
                <span className="flex-1 text-sm font-medium text-foreground">Show help tab</span>
                <Toggle checked={showHelp} onChange={setShowHelp} />
              </ListRow>
              {showHelp && (
                <>
                  <ListRow>
                    <FieldLabel>Title</FieldLabel>
                    <InlineInput value={helpTitle} onChange={setHelpTitle} placeholder="Help & Resources" />
                  </ListRow>
                  <ListRow>
                    <FieldLabel>URL</FieldLabel>
                    <InlineInput value={helpUrl} onChange={setHelpUrl} placeholder="https://docs.example.com" mono />
                    {helpUrl && (
                      <a href={helpUrl} target="_blank" rel="noopener" className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </ListRow>
                  {helpArticles.map((a, i) => (
                    <ListRow key={i}>
                      <InlineInput
                        value={a.title}
                        onChange={(v) => setHelpArticles((p) => p.map((x, j) => j === i ? { ...x, title: v } : x))}
                        placeholder="Article title"
                      />
                      <span className="w-px h-4 bg-border shrink-0" />
                      <input
                        value={a.url ?? ""}
                        onChange={(e) => setHelpArticles((p) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                        placeholder="URL"
                        className="w-28 bg-transparent text-xs font-mono text-muted-foreground outline-none placeholder:text-muted-foreground/30 py-2.5"
                      />
                      <DeleteBtn onClick={() => setHelpArticles((p) => p.filter((_, j) => j !== i))} />
                    </ListRow>
                  ))}
                  <AddBtn onClick={() => setHelpArticles((p) => [...p, { title: "", url: "" }])} label="Add article" />
                </>
              )}
            </ListCard>
          </div>

          <SaveRow onSave={saveContent} saving={contentSaving} saved={contentSaved} label="Save content" />
        </div>{/* end LEFT */}

        {/* ── RIGHT: Auto Trigger + Window ── */}
        <div className="flex flex-col gap-8">

          {/* Auto Trigger */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title="Auto trigger"
              description="Proactive messages shown above the launcher before visitors open the chat."
            />

            <ListCard>
              {openingMessages.map((msg, i) => (
                <ListRow key={i} className="gap-3 min-h-[44px] py-1">
                  <InlineInput
                    value={msg.text}
                    onChange={(v) => setOpeningMessages((p) => p.map((m, j) => j === i ? { ...m, text: v } : m))}
                    placeholder="👋 Need help getting started?"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">after</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={msg.delaySeconds}
                      onChange={(e) => setOpeningMessages((p) => p.map((m, j) => j === i ? { ...m, delaySeconds: Math.max(1, Number(e.target.value)) } : m))}
                      className="w-10 h-6 text-center text-xs bg-muted rounded-md outline-none tabular-nums border border-border/50"
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                  </div>
                  <DeleteBtn onClick={() => setOpeningMessages((p) => p.filter((_, j) => j !== i))} />
                </ListRow>
              ))}
              <AddBtn
                onClick={() => setOpeningMessages((p) => [...p, { text: "", delaySeconds: p.length === 0 ? 5 : (p[p.length - 1]?.delaySeconds ?? 5) + 10 }])}
                label="Add message"
              />
            </ListCard>

            {openingMessages.length > 0 && (
              <ListCard>
                <ListRow>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Repeat sequence</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Restart messages after the last one</p>
                  </div>
                  <Toggle checked={repeatMessages} onChange={setRepeatMessages} />
                </ListRow>
              </ListCard>
            )}

            {triggerError && <p className="text-xs text-destructive">{triggerError}</p>}
            <SaveRow onSave={saveTrigger} saving={triggerSaving} saved={triggerSaved} label="Save trigger" />
          </div>

          {/* Window */}
          <div className="flex flex-col gap-4">
            <SectionTitle title="Window" description="Widget launcher position on the page." />

            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Position</p>
              <div className="grid grid-cols-2 gap-2">
                {(["bottom-right", "bottom-left"] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setWidgetPosition(pos)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 rounded-xl border text-sm font-medium transition-all",
                      widgetPosition === pos
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <div className="w-14 h-10 rounded-lg border border-current/20 relative bg-muted/20">
                      <span
                        className={cn(
                          "absolute bottom-1.5 w-4 h-4 rounded-full bg-current opacity-60",
                          pos === "bottom-right" ? "right-1.5" : "left-1.5",
                        )}
                      />
                    </div>
                    {pos === "bottom-right" ? "Bottom right" : "Bottom left"}
                  </button>
                ))}
              </div>
            </div>

            <SaveRow onSave={saveWindow} saving={windowSaving} saved={windowSaved} label="Save position" />
          </div>

        </div>{/* end RIGHT */}

      </div>{/* end grid */}
    </div>
  )
}
