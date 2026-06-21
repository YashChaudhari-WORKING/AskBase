"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft, Check, Loader2, Plus, RotateCcw, Upload, X,
  Fingerprint, Palette, SlidersHorizontal, Settings2, Wand2,
} from "lucide-react"
import api from "@/lib/api"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetThemePreview, type WidgetThemeConfig } from "@/components/widget-theme-preview"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ThemeForm = WidgetThemeConfig & { name: string }

const DEFAULT_THEME: ThemeForm = {
  name: "My Theme",
  botName: "Assistant",
  botSubtitle: "We reply in minutes",
  botAvatarEmoji: "⚡",
  botAvatarUrl: null,
  primaryColor: "#6366f1",
  headerBgColor: "#6366f1",
  headerTextColor: "#ffffff",
  chatBgColor: "#f9fafb",
  borderRadius: "xl",
  botBubbleBg: "#f3f4f6",
  botBubbleText: "#111827",
  userBubbleBg: "#6366f1",
  userBubbleText: "#ffffff",
  showTimestamps: false,
  launcherPosition: "bottom-right",
  launcherBgColor: "#6366f1",
  launcherIconEmoji: "💬",
  launcherIconUrl: null,
  fontSize: "14px",
  inputPlaceholder: "Type a message…",
  sendButtonColor: "#6366f1",
  allowAttachments: false,
  showPoweredBy: true,
  footerText: null,
  footerLinkUrl: null,
  quickReplies: [],
  homeGreeting: "How can we help?",
  homeSubgreeting: "We usually reply in a few minutes.",
  conversationStarters: [],
  showHelpCenter: false,
  helpCenterTitle: "Help & Resources",
  helpArticles: [],
  helpCenterUrl: null,
  businessHoursText: null,
}

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#0ea5e9", "#14b8a6",
]

const TABS = [
  { id: "colors" as const, label: "Colors", icon: Palette },
  { id: "style" as const, label: "Style", icon: SlidersHorizontal },
  { id: "settings" as const, label: "Settings", icon: Settings2 },
]

type TabId = "colors" | "style" | "settings"
type UpdateFn = <K extends keyof ThemeForm>(key: K, value: ThemeForm[K]) => void

// ---------------------------------------------------------------------------
// Shared atoms
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground leading-none">{children}</label>
}

function FieldGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-0.5">{label}</p>
      )}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40">
        {children}
      </div>
    </div>
  )
}

function FieldRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-4 py-3.5", className)}>{children}</div>
}

function ColorField({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const nativeRef = useRef<HTMLInputElement>(null)
  const [hex, setHex] = useState(value)

  useEffect(() => { setHex(value) }, [value])

  function handleHex(raw: string) {
    setHex(raw)
    const n = raw.startsWith("#") ? raw : `#${raw}`
    if (/^#[0-9A-Fa-f]{6}$/.test(n)) onChange(n)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => nativeRef.current?.click()}
          className="w-9 h-9 rounded-xl border border-border shadow-sm shrink-0 hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
        />
        <input
          ref={nativeRef}
          type="color"
          value={value}
          onChange={(e) => { setHex(e.target.value); onChange(e.target.value) }}
          className="sr-only"
        />
        <Input
          value={hex}
          onChange={(e) => handleHex(e.target.value)}
          className="h-9 font-mono text-sm flex-1"
          maxLength={7}
          placeholder="#6366f1"
        />
      </div>
      <div className="flex gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { onChange(c); setHex(c) }}
            className={cn(
              "w-5 h-5 rounded-full transition-all border-2",
              value === c
                ? "border-foreground/50 ring-2 ring-offset-1 ring-offset-background ring-foreground/20 scale-110"
                : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}

function Toggle({ label, description, value, onChange }: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn("relative rounded-full transition-colors shrink-0", value ? "bg-primary" : "bg-muted-foreground/25")}
        style={{ width: 40, height: 22 }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 600, damping: 38 }}
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  )
}

function CloudinaryUpload({
  value,
  onChange,
  label = "Image",
  hint = "Shown in the widget header",
  size = 16,
}: {
  value: string | null | undefined
  onChange: (v: string | null) => void
  label?: string
  hint?: string
  size?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setErr(null)
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      onChange(url)
    } catch (ex: any) {
      setErr(ex.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const dim = `w-${size} h-${size}`

  return (
    <div className="flex items-center gap-4">
      {value ? (
        <div className={`relative ${dim} rounded-2xl overflow-hidden border border-border bg-muted shrink-0`}>
          <img src={value} alt="uploaded" className="w-full h-full object-contain p-1.5" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${dim} rounded-2xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors gap-1 shrink-0 disabled:opacity-60`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span className="text-[9px] font-semibold">{uploading ? "Uploading…" : "Upload"}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif" onChange={handleFile} className="sr-only" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        {err ? (
          <p className="text-[10px] text-destructive mt-0.5">{err}</p>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, SVG, WebP — stored on Cloudinary</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function BrandingTab({ form, update }: { form: ThemeForm; update: UpdateFn }) {
  return (
    <>
      <FieldGroup label="Identity">
        <FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <CloudinaryUpload
              value={form.botAvatarUrl}
              onChange={(v) => update("botAvatarUrl", v)}
              label="Bot avatar image"
              hint="Overrides emoji"
              size={12}
            />
            <CloudinaryUpload
              value={form.launcherIconUrl}
              onChange={(v) => update("launcherIconUrl", v)}
              label="Launcher icon image"
              hint="Overrides launcher emoji"
              size={12}
            />
          </div>
        </FieldRow>
        <FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Display name</FieldLabel>
              <Input value={form.botName} onChange={(e) => update("botName", e.target.value)} placeholder="Assistant" className="h-9 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Avatar emoji</FieldLabel>
              <Input
                value={form.botAvatarEmoji}
                onChange={(e) => { update("botAvatarEmoji", e.target.value); update("botAvatarUrl", null) }}
                placeholder="⚡"
                className="h-9 text-center text-lg"
                maxLength={4}
                disabled={!!form.botAvatarUrl}
              />
              {!!form.botAvatarUrl && (
                <p className="text-[10px] text-muted-foreground">Image active — clear to use emoji</p>
              )}
            </div>
          </div>
        </FieldRow>
        <FieldRow>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Status subtitle</FieldLabel>
            <Input value={form.botSubtitle} onChange={(e) => update("botSubtitle", e.target.value)} placeholder="We reply in minutes" className="h-9 text-sm" />
          </div>
        </FieldRow>
        <FieldRow>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>
              Business hours{" "}
              <span className="text-muted-foreground/50 text-[10px] font-normal">(optional)</span>
            </FieldLabel>
            <Input
              value={form.businessHoursText ?? ""}
              onChange={(e) => update("businessHoursText", e.target.value || null)}
              placeholder="Mon – Fri, 9 am – 5 pm"
              className="h-9 text-sm"
            />
          </div>
        </FieldRow>
      </FieldGroup>
    </>
  )
}

function ColorsTab({ form, update }: { form: ThemeForm; update: UpdateFn }) {
  return (
    <>
      <FieldGroup label="Brand">
        <FieldRow>
          <ColorField label="Primary color" value={form.primaryColor} onChange={(v) => update("primaryColor", v)} />
        </FieldRow>
      </FieldGroup>
      <FieldGroup label="Header">
        <FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Background" value={form.headerBgColor} onChange={(v) => update("headerBgColor", v)} />
            <ColorField label="Text color" value={form.headerTextColor} onChange={(v) => update("headerTextColor", v)} />
          </div>
        </FieldRow>
      </FieldGroup>
      <FieldGroup label="Chat">
        <FieldRow>
          <ColorField label="Chat background" value={form.chatBgColor} onChange={(v) => update("chatBgColor", v)} />
        </FieldRow>
        <FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Bot bubble" value={form.botBubbleBg} onChange={(v) => update("botBubbleBg", v)} />
            <ColorField label="Bot text" value={form.botBubbleText} onChange={(v) => update("botBubbleText", v)} />
          </div>
        </FieldRow>
        <FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="User bubble" value={form.userBubbleBg} onChange={(v) => update("userBubbleBg", v)} />
            <ColorField label="User text" value={form.userBubbleText} onChange={(v) => update("userBubbleText", v)} />
          </div>
        </FieldRow>
      </FieldGroup>
    </>
  )
}

function StyleTab({ form, update }: { form: ThemeForm; update: UpdateFn }) {
  const RADII = [
    { v: "none" as const, label: "None", px: "0px" },
    { v: "md" as const, label: "Sm", px: "6px" },
    { v: "lg" as const, label: "Md", px: "10px" },
    { v: "xl" as const, label: "Lg", px: "14px" },
    { v: "2xl" as const, label: "XL", px: "20px" },
  ]

  return (
    <>
      <FieldGroup label="Shape">
        <FieldRow>
          <FieldLabel>Border radius</FieldLabel>
          <div className="grid grid-cols-5 gap-1.5 mt-3">
            {RADII.map(({ v, label, px }) => (
              <button
                key={v}
                type="button"
                onClick={() => update("borderRadius", v)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-xl border text-[11px] font-medium transition-all",
                  form.borderRadius === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                <div className="w-5 h-5 border-2 border-current" style={{ borderRadius: px }} />
                {label}
              </button>
            ))}
          </div>
        </FieldRow>
      </FieldGroup>

      <FieldGroup label="Launcher">
        <FieldRow>
          <FieldLabel>Position</FieldLabel>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(["bottom-right", "bottom-left"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => update("launcherPosition", pos)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all",
                  form.launcherPosition === pos
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                <div className="w-8 h-5 rounded border border-current relative shrink-0">
                  <div className={cn("absolute bottom-0.5 w-2 h-2 rounded-full bg-current", pos === "bottom-right" ? "right-0.5" : "left-0.5")} />
                </div>
                {pos === "bottom-right" ? "Bottom Right" : "Bottom Left"}
              </button>
            ))}
          </div>
        </FieldRow>
        <FieldRow>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Icon emoji</FieldLabel>
              <Input
                value={form.launcherIconEmoji}
                onChange={(e) => { update("launcherIconEmoji", e.target.value); update("launcherIconUrl", null) }}
                placeholder="💬"
                className="h-9 text-center text-xl"
                maxLength={4}
                disabled={!!form.launcherIconUrl}
              />
            </div>
            <ColorField label="Color" value={form.launcherBgColor} onChange={(v) => update("launcherBgColor", v)} />
          </div>
        </FieldRow>
        <FieldRow>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Font size</FieldLabel>
            <div className="flex gap-2">
              {(["12px", "13px", "14px", "15px", "16px"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update("fontSize", s)}
                  className={cn(
                    "flex-1 h-9 rounded-lg border text-sm font-medium transition-colors",
                    form.fontSize === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FieldRow>
      </FieldGroup>
    </>
  )
}

function ContentTab({ form, update }: { form: ThemeForm; update: UpdateFn }) {
  return (
    <>
      <FieldGroup label="Home Screen">
        <FieldRow>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Greeting headline</FieldLabel>
            <Input
              value={form.homeGreeting}
              onChange={(e) => update("homeGreeting", e.target.value)}
              placeholder="How can we help?"
              className="h-9 text-sm"
            />
          </div>
        </FieldRow>
        <FieldRow>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Sub-greeting</FieldLabel>
            <Input
              value={form.homeSubgreeting}
              onChange={(e) => update("homeSubgreeting", e.target.value)}
              placeholder="We usually reply in a few minutes."
              className="h-9 text-sm"
            />
          </div>
        </FieldRow>
      </FieldGroup>

      <FieldGroup label="Conversation Starters">
        <FieldRow>
          <p className="text-xs text-muted-foreground mb-3">Suggested questions shown on the home screen.</p>
          <div className="flex flex-col gap-2">
            {(form.conversationStarters ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={s.label}
                  onChange={(e) => {
                    const arr = [...(form.conversationStarters ?? [])]
                    arr[i] = { ...arr[i], label: e.target.value }
                    update("conversationStarters", arr)
                  }}
                  placeholder={`Starter ${i + 1}`}
                  className="h-9 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => update("conversationStarters", (form.conversationStarters ?? []).filter((_, idx) => idx !== i))}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(form.conversationStarters ?? []).length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs w-fit mt-1"
                onClick={() => update("conversationStarters", [...(form.conversationStarters ?? []), { label: "" }])}
              >
                <Plus className="w-3 h-3 mr-1.5" />Add starter
              </Button>
            )}
          </div>
        </FieldRow>
      </FieldGroup>

      <FieldGroup label="Help Center">
        <FieldRow>
          <Toggle
            label="Enable Help Center tab"
            description="Shows a Help tab with articles in the widget"
            value={form.showHelpCenter}
            onChange={(v) => update("showHelpCenter", v)}
          />
        </FieldRow>
        {form.showHelpCenter && (
          <>
            <FieldRow>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Section title</FieldLabel>
                <Input
                  value={form.helpCenterTitle}
                  onChange={(e) => update("helpCenterTitle", e.target.value)}
                  placeholder="Help & Resources"
                  className="h-9 text-sm"
                />
              </div>
            </FieldRow>
            <FieldRow>
              <FieldLabel>
                Articles{" "}
                <span className="text-muted-foreground/50 text-[10px] font-normal">(up to 5)</span>
              </FieldLabel>
              <div className="flex flex-col gap-2 mt-2">
                {(form.helpArticles ?? []).map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={a.title}
                      onChange={(e) => {
                        const arr = [...(form.helpArticles ?? [])]
                        arr[i] = { ...arr[i], title: e.target.value }
                        update("helpArticles", arr)
                      }}
                      placeholder="Article title"
                      className="h-9 text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => update("helpArticles", (form.helpArticles ?? []).filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(form.helpArticles ?? []).length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs w-fit mt-1"
                    onClick={() => update("helpArticles", [...(form.helpArticles ?? []), { title: "" }])}
                  >
                    <Plus className="w-3 h-3 mr-1.5" />Add article
                  </Button>
                )}
              </div>
            </FieldRow>
            <FieldRow>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>
                  Help center URL{" "}
                  <span className="text-muted-foreground/50 text-[10px] font-normal">(optional)</span>
                </FieldLabel>
                <Input
                  value={form.helpCenterUrl ?? ""}
                  onChange={(e) => update("helpCenterUrl", e.target.value || null)}
                  placeholder="https://help.yoursite.com"
                  className="h-9 text-sm"
                />
              </div>
            </FieldRow>
          </>
        )}
      </FieldGroup>

      <FieldGroup label="Quick Replies">
        <FieldRow>
          <p className="text-xs text-muted-foreground mb-3">Tappable chips shown above the input bar in chat.</p>
          <div className="flex flex-col gap-2">
            {(form.quickReplies ?? []).map((qr, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={qr.label}
                  onChange={(e) => {
                    const arr = [...(form.quickReplies ?? [])]
                    arr[i] = { label: e.target.value }
                    update("quickReplies", arr)
                  }}
                  placeholder="e.g. Book a demo"
                  className="h-9 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => update("quickReplies", (form.quickReplies ?? []).filter((_, idx) => idx !== i))}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(form.quickReplies ?? []).length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs w-fit mt-1"
                onClick={() => update("quickReplies", [...(form.quickReplies ?? []), { label: "" }])}
              >
                <Plus className="w-3 h-3 mr-1.5" />Add reply
              </Button>
            )}
          </div>
        </FieldRow>
      </FieldGroup>
    </>
  )
}

function SettingsTab({ form, update, onReset }: { form: ThemeForm; update: UpdateFn; onReset: () => void }) {
  return (
    <>
      <FieldGroup label="Input">
        <FieldRow>
          <ColorField label="Send button color" value={form.sendButtonColor} onChange={(v) => update("sendButtonColor", v)} />
        </FieldRow>
      </FieldGroup>

      <FieldGroup label="Messages">
        <FieldRow>
          <Toggle
            label="Show timestamps"
            description="Display time below each message bubble"
            value={form.showTimestamps}
            onChange={(v) => update("showTimestamps", v)}
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup>
        <FieldRow>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
        </FieldRow>
      </FieldGroup>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WidgetBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [form, setForm] = useState<ThemeForm>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("colors")

  // Make <main> a fixed container so this full-page editor fills it exactly
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

  // AI generation dialog
  const [aiOpen, setAiOpen] = useState(false)
  const [aiForm, setAiForm] = useState({ businessName: "", description: "", style: "modern" as "modern" | "minimal" | "playful" | "bold" })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get(`/widget-themes/${id}`)
      .then((r) => {
        const data = (r.data as any)?.data ?? r.data
        setForm({ ...DEFAULT_THEME, ...data })
      })
      .catch(() => router.push("/dashboard/widgets"))
      .finally(() => setLoading(false))
  }, [id, router])

  function update<K extends keyof ThemeForm>(key: K, value: ThemeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    // Only send known ThemeForm fields — strip id/tenantId/createdAt/updatedAt that come back from the API
    const payload = {
      name: form.name,
      primaryColor: form.primaryColor,
      headerBgColor: form.headerBgColor,
      headerTextColor: form.headerTextColor,
      chatBgColor: form.chatBgColor,
      borderRadius: form.borderRadius,
      botBubbleBg: form.botBubbleBg,
      botBubbleText: form.botBubbleText,
      userBubbleBg: form.userBubbleBg,
      userBubbleText: form.userBubbleText,
      showTimestamps: form.showTimestamps,
      launcherPosition: form.launcherPosition,
      launcherBgColor: form.launcherBgColor,
      launcherIconEmoji: form.launcherIconEmoji,
      launcherIconUrl: form.launcherIconUrl ?? null,
      fontSize: form.fontSize ?? "14px",
      sendButtonColor: form.sendButtonColor,
    }
    try {
      await api.patch(`/widget-themes/${id}`, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      console.error("Theme save failed:", e?.response?.data ?? e.message)
    } finally { setSaving(false) }
  }

  async function generateTheme() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await api.post("/widget-themes/generate", aiForm)
      const data = (res.data as any)?.data ?? res.data
      setForm((prev) => ({
        ...prev,
        name: data.themeName ?? prev.name,
        botName: data.botName ?? prev.botName,
        botSubtitle: data.botSubtitle ?? prev.botSubtitle,
        botAvatarEmoji: data.botAvatarEmoji ?? prev.botAvatarEmoji,
        primaryColor: data.primaryColor ?? prev.primaryColor,
        headerBgColor: data.headerBgColor ?? prev.headerBgColor,
        headerTextColor: data.headerTextColor ?? prev.headerTextColor,
        chatBgColor: data.chatBgColor ?? prev.chatBgColor,
        botBubbleBg: data.botBubbleBg ?? prev.botBubbleBg,
        botBubbleText: data.botBubbleText ?? prev.botBubbleText,
        userBubbleBg: data.userBubbleBg ?? prev.userBubbleBg,
        userBubbleText: data.userBubbleText ?? prev.userBubbleText,
        launcherBgColor: data.launcherBgColor ?? prev.launcherBgColor,
        sendButtonColor: data.sendButtonColor ?? prev.sendButtonColor,
        launcherIconEmoji: data.launcherIconEmoji ?? prev.launcherIconEmoji,
        launcherIconUrl: data.launcherIconUrl ?? prev.launcherIconUrl,
        fontSize: data.fontSize ?? prev.fontSize,
        inputPlaceholder: data.inputPlaceholder ?? prev.inputPlaceholder,
        homeGreeting: data.homeGreeting ?? prev.homeGreeting,
        homeSubgreeting: data.homeSubgreeting ?? prev.homeSubgreeting,
      }))
      setAiOpen(false)
    } catch (ex: any) {
      setAiError(ex?.response?.data?.message ?? ex.message ?? "Generation failed")
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex overflow-hidden">
        <div className="w-[60%] shrink-0 flex flex-col gap-3 p-5 border-r border-border">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-[530px] w-[300px] rounded-[40px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex overflow-hidden">

      {/* ── Left 60%: form ── */}
      <div className="w-[60%] shrink-0 flex flex-col h-full border-r border-border">

        {/* Header bar */}
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => router.push("/dashboard/widgets")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="flex-1 h-8 text-sm font-semibold border-transparent bg-transparent shadow-none px-1 focus-visible:border-border focus-visible:bg-card"
            placeholder="Theme name"
          />
          <Button size="sm" variant="outline" onClick={() => { setAiOpen(true); setAiError(null) }} className="h-8 px-3 gap-1.5 shrink-0 text-xs">
            <Wand2 className="w-3.5 h-3.5" />
            Generate with AI
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="h-8 px-4 shrink-0 gap-1.5">
            {saving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : saved
              ? <><Check className="w-3.5 h-3.5" />Saved</>
              : "Save"}
          </Button>
        </div>

        {/* Tab nav */}
        <div className="shrink-0 flex gap-0.5 px-2 py-2 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-accent rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <tab.icon className="relative w-3.5 h-3.5 shrink-0" />
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4 p-4 pb-10"
            >
              {activeTab === "colors" && <ColorsTab form={form} update={update} />}
              {activeTab === "style" && <StyleTab form={form} update={update} />}
              {activeTab === "settings" && <SettingsTab form={form} update={update} onReset={() => setForm(DEFAULT_THEME)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right 40%: live preview ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <WidgetThemePreview theme={form} fullHeight />
      </div>

      {/* ── AI generation dialog ── */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              key="ai-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setAiOpen(false)}
            />
            <motion.div
              key="ai-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-base flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" /> Generate theme with AI
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Describe your brand and AI will generate a cohesive theme</p>
                  </div>
                  <button type="button" onClick={() => setAiOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business name</label>
                    <Input
                      value={aiForm.businessName}
                      onChange={(e) => setAiForm((p) => ({ ...p, businessName: e.target.value }))}
                      placeholder="e.g. AcmeCorp, HealthFirst Clinic…"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What does your business do?</label>
                    <textarea
                      value={aiForm.description}
                      onChange={(e) => setAiForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="e.g. We sell eco-friendly home products and help customers find sustainable alternatives…"
                      className="h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Style</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["modern", "minimal", "playful", "bold"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAiForm((p) => ({ ...p, style: s }))}
                          className={cn(
                            "py-2 rounded-xl border text-xs font-medium capitalize transition-all",
                            aiForm.style === s
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {aiError && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{aiError}</p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAiOpen(false)} className="h-9 px-4">Cancel</Button>
                  <Button size="sm" disabled={aiLoading || !aiForm.businessName.trim()} onClick={generateTheme} className="h-9 px-5 gap-2">
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {aiLoading ? "Generating…" : "Generate theme"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
