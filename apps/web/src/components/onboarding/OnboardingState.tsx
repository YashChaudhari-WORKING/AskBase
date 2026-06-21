"use client"

import * as React from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FieldType = "text" | "email" | "phone" | "date" | "number" | "longtext" | "select"

export interface IntentFieldOption {
  label: string
  value: string
}

export interface IntentField {
  key: string
  label: string
  type: FieldType
  required: boolean
  options?: IntentFieldOption[]

  /** Validation & presentation — all optional, depend on field type */
  placeholder?: string
  helpText?: string
  /** text / longtext */
  minLength?: number
  maxLength?: number
  /** number */
  min?: number
  max?: number
  /** number */
  step?: number
  /** date — ISO yyyy-mm-dd or sentinel "today" / "tomorrow" / "future" / "past" */
  minDate?: string
  maxDate?: string
  /** regex pattern for free-text validation */
  pattern?: string
  /** select — allow choosing multiple */
  multiple?: boolean

  /** AI-generated sample answers — used by preview replay. All optional. */
  sampleGoodAnswer?: string
  sampleBadAnswer?: string
  sampleErrorMessage?: string
}

export interface SuggestedIntent {
  label: string
  /** Multiple natural-language triggers — visitor messages that match any of these route to this flow. */
  triggers: string[]
  /** @deprecated kept for backward compat — use triggers[] */
  trigger?: string
  fields: IntentField[]
  successMessage: string
}

export interface EnabledIntent extends SuggestedIntent {
  enabled: boolean
}

export type Tone = "friendly" | "formal" | "technical" | "concise" | "compact" | "custom"
export type PrimaryMode = "ai_agent" | "flow" | "hybrid"

export interface GeneratedConfig {
  name: string
  systemPrompt: string
  tone: Tone
  primaryMode: PrimaryMode
  primaryColor: string
  welcomeMessage: string
  suggestedIntents: SuggestedIntent[]
  responseTimeText?: string
  botSubtitle?: string
  inputPlaceholder?: string
  botAvatarEmoji?: string
  homeGreeting?: string
  homeSubgreeting?: string
  businessHoursText?: string
  conversationStarters?: Array<{ label: string; message: string }>
  widgetQuickReplies?: Array<{ label: string }>
  openingMessages?: Array<{ text: string; delaySeconds: number }>
  kbHints?: string[]
}

interface OnboardingCtx {
  description: string
  setDescription: (s: string) => void

  config: GeneratedConfig | null
  setConfig: (c: GeneratedConfig) => void
  /** Shallow-merge a partial update into `config`. No-op if no config yet. */
  patchConfig: (updates: Partial<GeneratedConfig>) => void

  intents: EnabledIntent[]
  setIntents: (intents: EnabledIntent[]) => void
  toggleIntent: (label: string) => void
  updateIntent: (label: string, updates: Partial<SuggestedIntent>) => void
  addIntent: (intent: SuggestedIntent & { enabled?: boolean }) => void
  removeIntent: (label: string) => void

  primaryColor: string
  setPrimaryColor: (c: string) => void

  welcomeMessage: string
  setWelcomeMessage: (s: string) => void

  name: string
  setName: (s: string) => void

  reset: () => void
}

const Ctx = React.createContext<OnboardingCtx | null>(null)

// ---------------------------------------------------------------------------
// SessionStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "askbase_onboarding_state_v1"

interface Persisted {
  description: string
  config: GeneratedConfig | null
  intents: EnabledIntent[]
  primaryColor: string
  welcomeMessage: string
  name: string
}

function loadPersisted(): Partial<Persisted> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<Persisted>
  } catch {
    return null
  }
}

function savePersisted(p: Persisted) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // ignore quota / serialization errors
  }
}

const DEFAULTS: Persisted = {
  description: "",
  config: null,
  intents: [],
  primaryColor: "#6366f1",
  welcomeMessage: "",
  name: "",
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false)

  const [description, setDescription] = React.useState(DEFAULTS.description)
  const [config, setConfigState] = React.useState<GeneratedConfig | null>(DEFAULTS.config)
  const [intents, setIntents] = React.useState<EnabledIntent[]>(DEFAULTS.intents)
  const [primaryColor, setPrimaryColor] = React.useState(DEFAULTS.primaryColor)
  const [welcomeMessage, setWelcomeMessage] = React.useState(DEFAULTS.welcomeMessage)
  const [name, setName] = React.useState(DEFAULTS.name)

  // Hydrate from sessionStorage on mount.
  React.useEffect(() => {
    const persisted = loadPersisted()
    if (persisted) {
      if (persisted.description !== undefined) setDescription(persisted.description)
      if (persisted.config !== undefined) setConfigState(persisted.config)
      if (persisted.intents !== undefined) setIntents(persisted.intents)
      if (persisted.primaryColor !== undefined) setPrimaryColor(persisted.primaryColor)
      if (persisted.welcomeMessage !== undefined) setWelcomeMessage(persisted.welcomeMessage)
      if (persisted.name !== undefined) setName(persisted.name)
    }
    setHydrated(true)
  }, [])

  // Persist on any change (post-hydration).
  React.useEffect(() => {
    if (!hydrated) return
    savePersisted({ description, config, intents, primaryColor, welcomeMessage, name })
  }, [hydrated, description, config, intents, primaryColor, welcomeMessage, name])

  // setConfig — when a fresh config lands, seed all related fields.
  const setConfig = React.useCallback((c: GeneratedConfig) => {
    setConfigState(c)
    setName((prev) => prev || c.name)
    setPrimaryColor((prev) => (prev && prev !== DEFAULTS.primaryColor ? prev : c.primaryColor))
    setWelcomeMessage((prev) => prev || c.welcomeMessage)
    setIntents(
      (c.suggestedIntents ?? []).map((i) => ({
        ...i,
        // Normalize: backend may send singular `trigger` OR triggers array
        triggers: Array.isArray((i as any).triggers) && (i as any).triggers.length > 0
          ? (i as any).triggers
          : (i.trigger ? [i.trigger] : []),
        enabled: true,
      }))
    )
  }, [])

  const patchConfig = React.useCallback((updates: Partial<GeneratedConfig>) => {
    setConfigState((prev) => (prev ? { ...prev, ...updates } : prev))
    // Mirror common fields into top-level state so other screens stay in sync.
    if (updates.name !== undefined) setName(updates.name)
    if (updates.primaryColor !== undefined) setPrimaryColor(updates.primaryColor)
    if (updates.welcomeMessage !== undefined) setWelcomeMessage(updates.welcomeMessage)
  }, [])

  const toggleIntent = React.useCallback((label: string) => {
    setIntents((prev) =>
      prev.map((i) => (i.label === label ? { ...i, enabled: !i.enabled } : i))
    )
  }, [])

  const updateIntent = React.useCallback(
    (label: string, updates: Partial<SuggestedIntent>) => {
      setIntents((prev) =>
        prev.map((i) => (i.label === label ? { ...i, ...updates } : i))
      )
    },
    []
  )

  const addIntent = React.useCallback((intent: SuggestedIntent & { enabled?: boolean }) => {
    setIntents((prev) => {
      if (prev.some((i) => i.label === intent.label)) return prev
      return [...prev, { ...intent, enabled: intent.enabled ?? true }]
    })
  }, [])

  const removeIntent = React.useCallback((label: string) => {
    setIntents((prev) => prev.filter((i) => i.label !== label))
  }, [])

  const reset = React.useCallback(() => {
    setDescription(DEFAULTS.description)
    setConfigState(DEFAULTS.config)
    setIntents(DEFAULTS.intents)
    setPrimaryColor(DEFAULTS.primaryColor)
    setWelcomeMessage(DEFAULTS.welcomeMessage)
    setName(DEFAULTS.name)
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const value = React.useMemo<OnboardingCtx>(
    () => ({
      description,
      setDescription,
      config,
      setConfig,
      patchConfig,
      intents,
      setIntents,
      toggleIntent,
      updateIntent,
      addIntent,
      removeIntent,
      primaryColor,
      setPrimaryColor,
      welcomeMessage,
      setWelcomeMessage,
      name,
      setName,
      reset,
    }),
    [
      description,
      config,
      intents,
      primaryColor,
      welcomeMessage,
      name,
      setConfig,
      patchConfig,
      toggleIntent,
      updateIntent,
      addIntent,
      removeIntent,
      reset,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboarding(): OnboardingCtx {
  const ctx = React.useContext(Ctx)
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>")
  }
  return ctx
}
