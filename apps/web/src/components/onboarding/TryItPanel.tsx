"use client"

import * as React from "react"
import { RotateCcw, Send, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { EnabledIntent, Tone, PrimaryMode } from "./OnboardingState"

interface DraftConfig {
  name: string
  systemPrompt: string
  tone: Tone
  primaryMode: PrimaryMode
  primaryColor: string
  welcomeMessage: string
  suggestedIntents: EnabledIntent[]
}

interface TryItPanelProps {
  draftConfig: DraftConfig
  className?: string
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  intent?: string
  matchedFlow?: { label: string } | null
}

interface PreviewChatResponse {
  reply?: string
  message?: string
  intent?: string
  matchedFlow?: { label: string } | null
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function extractReply(data: unknown): PreviewChatResponse {
  if (!data || typeof data !== "object") return {}
  const obj = data as Record<string, unknown>
  if (obj.data && typeof obj.data === "object") return obj.data as PreviewChatResponse
  return obj as PreviewChatResponse
}

function TypingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: color + "cc", animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

function BotAvatar({ name, primaryColor }: { name: string; primaryColor: string }) {
  const initial = (name.trim() || "A").charAt(0).toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold ring-2 ring-white/10"
      style={{ backgroundColor: primaryColor + "28", color: primaryColor }}
    >
      {initial}
    </div>
  )
}

export function TryItPanel({ draftConfig, className }: TryItPanelProps) {
  const enabledIntents = React.useMemo(
    () => draftConfig.suggestedIntents.filter((i) => i.enabled),
    [draftConfig.suggestedIntents]
  )

  const intentKey = React.useMemo(
    () => JSON.stringify(enabledIntents.map((i) => i.label)),
    [enabledIntents]
  )

  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [sending, setSending] = React.useState(false)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setMessages([])
    setInput("")
  }, [intentKey])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending])

  async function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed }
    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)

    try {
      const res = await api.post("/projects/preview-chat", {
        message: trimmed,
        history,
        draftConfig: {
          name: draftConfig.name,
          systemPrompt: draftConfig.systemPrompt,
          tone: draftConfig.tone,
          primaryMode: draftConfig.primaryMode,
          primaryColor: draftConfig.primaryColor,
          welcomeMessage: draftConfig.welcomeMessage,
          suggestedIntents: enabledIntents,
        },
      })

      const payload = extractReply(res.data)
      const reply = payload.reply ?? payload.message ?? "Sorry — I couldn't generate a reply right now."

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: reply,
          intent: payload.intent,
          matchedFlow: payload.matchedFlow ?? null,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: "Preview chat failed. Check your connection and try again." },
      ])
    } finally {
      setSending(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function handleReset() {
    setMessages([])
    setInput("")
    inputRef.current?.focus()
  }

  const { primaryColor, welcomeMessage, name } = draftConfig
  const displayName = name.trim() || "Assistant"

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full rounded-2xl border border-border/40 bg-card overflow-hidden",
        className
      )}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 shrink-0"
        style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${primaryColor}bb)` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white text-sm font-semibold truncate">{displayName}</span>
          <span className="text-white/70 text-[11px]">AI Assistant · Online</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset chat"
          title="Reset chat"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/15 hover:text-white transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-3 bg-muted/10">
        {/* Spacer pushes messages to the bottom */}
        <div className="flex-1" />

        {/* Welcome message */}
        <div className="flex items-end gap-2.5">
          <BotAvatar name={displayName} primaryColor={primaryColor} />
          <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[78%] shadow-sm">
            <p className="text-sm text-foreground leading-relaxed">
              {welcomeMessage || "Hi! How can I help?"}
            </p>
          </div>
        </div>

        {/* Quick intent chips */}
        {messages.length === 0 && enabledIntents.length > 0 && (
          <div className="pl-[42px] flex flex-col gap-2 pt-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">
              Quick actions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {enabledIntents.map((intent) => (
                <button
                  key={intent.label}
                  type="button"
                  onClick={() => send(intent.label)}
                  disabled={sending}
                  className="text-xs rounded-full px-3 py-1.5 border bg-background text-foreground hover:bg-accent transition-all disabled:opacity-50 shadow-sm"
                  style={{ borderColor: primaryColor + "44" }}
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div
                className="rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[78%] shadow-sm"
                style={{ backgroundColor: primaryColor + "1a", border: `1px solid ${primaryColor}33` }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: primaryColor }}>
                  {m.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2.5">
              <BotAvatar name={displayName} primaryColor={primaryColor} />
              <div className="flex flex-col gap-1.5 max-w-[78%]">
                <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
                {m.intent === "flow_trigger" && m.matchedFlow?.label && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-primary/8 border border-primary/20 rounded-full px-2.5 py-1 self-start">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>
                      Starts{" "}
                      <span className="font-semibold text-foreground">
                        &lsquo;{m.matchedFlow.label}&rsquo;
                      </span>{" "}
                      flow
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-end gap-2.5">
            <BotAvatar name={displayName} primaryColor={primaryColor} />
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm shadow-sm">
              <TypingDots color={primaryColor} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <form
        className="border-t border-border/60 bg-background px-4 py-3 flex items-center gap-2.5 shrink-0"
        onSubmit={(e) => { e.preventDefault(); send(input) }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 h-10 rounded-full bg-muted/60 px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 border border-border/40"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: primaryColor, color: "#fff" }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
