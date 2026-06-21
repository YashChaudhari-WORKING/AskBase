"use client"

import { useEffect, useRef, useState } from "react"
import { BookOpen, ChevronRight, ChevronUp, Home, MessageSquare, Send, X } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Bot, ChatMsg, FlowNode } from "./types"

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "16px",
  "2xl": "20px",
}

interface TC {
  headerBg: string
  headerText: string
  chatBg: string
  botBg: string
  botText: string
  userBg: string
  userText: string
  accent: string
  name: string
  emoji: string
  avatarUrl: string | null
  launcherBg: string
  launcherIconUrl: string | null
  radius: string
  fontSize: string
  showTimestamps: boolean
}

// ---------------------------------------------------------------------------
// Tiny markdown renderer — no external dependency
// ---------------------------------------------------------------------------

function MdText({ text, color, fontSize = "14px" }: { text: string; color: string; fontSize?: string }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let i = 0
  let k = 0

  function parseInline(s: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index))
      if (m[1]) parts.push(<strong key={m.index}>{m[2]}</strong>)
      else if (m[3]) parts.push(<em key={m.index}>{m[4]}</em>)
      else if (m[5]) parts.push(<a key={m.index} href={m[7]} target="_blank" rel="noopener noreferrer" style={{ color, textDecoration: "underline" }}>{m[6]}</a>)
      last = m.index + m[0].length
    }
    if (last < s.length) parts.push(s.slice(last))
    return parts
  }

  while (i < lines.length) {
    const line = lines[i]
    const olMatch = line.match(/^(\d+)\.\s+(.*)/)
    const ulMatch = line.match(/^[-*]\s+(.*)/)

    if (olMatch || ulMatch) {
      const isOl = !!olMatch
      const items: React.ReactNode[] = []
      let lk = 0
      while (i < lines.length) {
        const l = lines[i]
        const om = l.match(/^(\d+)\.\s+(.*)/)
        const um = l.match(/^[-*]\s+(.*)/)
        if (isOl && om) { items.push(<li key={lk++}>{parseInline(om[2])}</li>); i++ }
        else if (!isOl && um) { items.push(<li key={lk++}>{parseInline(um[1])}</li>); i++ }
        else break
      }
      nodes.push(isOl
        ? <ol key={k++} style={{ paddingLeft: 16, margin: "4px 0" }}>{items}</ol>
        : <ul key={k++} style={{ paddingLeft: 16, margin: "4px 0" }}>{items}</ul>)
      continue
    }

    if (line.trim() === "") { nodes.push(<br key={k++} />); i++; continue }
    nodes.push(<p key={k++} style={{ margin: "2px 0" }}>{parseInline(line)}</p>)
    i++
  }

  return <div style={{ fontSize, lineHeight: 1.5 }}>{nodes}</div>
}

// ---------------------------------------------------------------------------
// Notification sound (Web Audio API — no file required)
// ---------------------------------------------------------------------------

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

// ---------------------------------------------------------------------------
// LiveChatWidget
// ---------------------------------------------------------------------------

export function LiveChatWidget({ bot }: { bot: Bot }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"home" | "chat" | "help">("chat")
  const [tc, setTc] = useState<TC | null>(null)

  // Proactive message bubbles
  const [proactiveBubbles, setProactiveBubbles] = useState<string[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Quick reply chips visibility toggle
  const [showQuickReplies, setShowQuickReplies] = useState(false)

  // Chat state
  const [input, setInput] = useState("")
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [convId, setConvId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Flow state
  const [flowId, setFlowId] = useState<string | null>(null)
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([])
  const [flowFieldValue, setFlowFieldValue] = useState("")
  const [flowFieldError, setFlowFieldError] = useState<string | null>(null)
  const [flowNodeIdx, setFlowNodeIdx] = useState(0)
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({})
  const [flowDone, setFlowDone] = useState(false)

  const messagesEnd = useRef<HTMLDivElement>(null)

  // Load theme when widget opens or theme changes
  useEffect(() => {
    if (!bot.widgetThemeId) return
    api
      .get(`/widget-themes/${bot.widgetThemeId}`)
      .then((r) => {
        const d = (r.data as any)?.data ?? r.data
        if (!d) return
        setTc({
          headerBg: d.headerBgColor ?? bot.primaryColor,
          headerText: d.headerTextColor ?? "#ffffff",
          chatBg: d.chatBgColor ?? "#f9fafb",
          botBg: d.botBubbleBg ?? "#f3f4f6",
          botText: d.botBubbleText ?? "#111827",
          userBg: d.userBubbleBg ?? bot.primaryColor,
          userText: d.userBubbleText ?? "#ffffff",
          accent: d.primaryColor ?? bot.primaryColor,
          name: bot.name,
          emoji: bot.botAvatarEmoji || "💬",
          avatarUrl: bot.botAvatarUrl ?? null,
          launcherBg: d.launcherBgColor ?? bot.primaryColor,
          launcherIconUrl: d.launcherIconUrl ?? null,
          radius: RADIUS_MAP[d.borderRadius] ?? "16px",
          fontSize: d.fontSize ?? "14px",
          showTimestamps: d.showTimestamps ?? false,
        })
      })
      .catch(() => {})
  }, [bot.widgetThemeId, bot.primaryColor, bot.name])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, sending])

  // ── Auto trigger ──────────────────────────────────────────────────────────

  function scheduleProactive(openingMsgs: Array<{ text: string; delaySeconds: number }>, repeat: boolean) {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (cycleRef.current) clearTimeout(cycleRef.current)

    openingMsgs.forEach(({ text, delaySeconds }) => {
      const t = setTimeout(() => {
        setProactiveBubbles((prev) => [...prev, text])
        playNotificationSound()
      }, delaySeconds * 1000)
      timersRef.current.push(t)
    })

    if (repeat && openingMsgs.length > 0) {
      const lastDelay = Math.max(...openingMsgs.map((m) => m.delaySeconds))
      cycleRef.current = setTimeout(() => {
        setProactiveBubbles([])
        scheduleProactive(openingMsgs, repeat)
      }, (lastDelay + 2) * 1000)
    }
  }

  useEffect(() => {
    const msgs = bot.openingMessages ?? []
    if (msgs.length === 0 || open) return
    scheduleProactive(msgs, bot.repeatMessages ?? false)
    return () => {
      timersRef.current.forEach(clearTimeout)
      if (cycleRef.current) clearTimeout(cycleRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot.openingMessages, bot.repeatMessages])

  function openWidget() {
    setOpen(true)
    setTab("chat")
    if (msgs.length === 0) addBotMsg(bot.welcomeMessage || "Hi! How can I help?")
    setProactiveBubbles([])
    timersRef.current.forEach(clearTimeout)
    if (cycleRef.current) clearTimeout(cycleRef.current)
  }

  // Resolved colors — fallback to bot.primaryColor when no theme
  const C: TC = {
    headerBg: tc?.headerBg ?? bot.primaryColor,
    headerText: tc?.headerText ?? "#ffffff",
    chatBg: tc?.chatBg ?? "#f8fafc",
    botBg: tc?.botBg ?? "#f1f5f9",
    botText: tc?.botText ?? "#1e293b",
    userBg: tc?.userBg ?? bot.primaryColor,
    userText: tc?.userText ?? "#ffffff",
    accent: tc?.accent ?? bot.primaryColor,
    name: bot.name,
    emoji: bot.botAvatarEmoji || "💬",
    avatarUrl: bot.botAvatarUrl ?? null,
    launcherBg: tc?.launcherBg ?? bot.primaryColor,
    launcherIconUrl: tc?.launcherIconUrl ?? null,
    radius: tc?.radius ?? "16px",
    fontSize: tc?.fontSize ?? "14px",
    showTimestamps: tc?.showTimestamps ?? false,
  }

  // Content from bot
  const greeting = bot.homeGreeting || "Hi! How can we help?"
  const subGreeting = bot.homeSubgreeting || "We usually reply in a few minutes."
  const starters = (bot.conversationStarters ?? []).filter((s) => s.label?.trim())
  const qr = (bot.widgetQuickReplies ?? []).filter((q) => q.label?.trim())
  const showHelp = bot.showHelpCenter
  const helpTitle = bot.helpCenterTitle || "Help & Resources"
  const articles = (bot.helpArticles ?? []).filter((a) => a.title?.trim())
  const helpUrl = bot.helpCenterUrl
  const botSubtitle = bot.botSubtitle || ""
  const inputPlaceholder = bot.inputPlaceholder || "Type a message…"
  const showPoweredBy = bot.showPoweredBy ?? true
  const footerText = bot.footerText || "Powered by AskBase"
  const footerLinkUrl = bot.footerLinkUrl || ""
  const businessHoursText = bot.businessHoursText || ""
  const allowAttachments = bot.allowAttachments ?? false

  const inFlow = !!flowId && !flowDone
  const posStyle: React.CSSProperties =
    bot.widgetPosition === "bottom-left" ? { left: 24 } : { right: 24 }

  // ── Chat/flow logic (preserved from original) ──────────────────────────

  function addBotMsg(content: string, choices?: ChatMsg["choices"]) {
    setMsgs((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", content, choices }])
  }

  async function advanceFlow(userAnswer?: string, fieldName?: string) {
    const nodes = flowNodes
    let idx = flowNodeIdx
    const answers = { ...flowAnswers }

    if (userAnswer !== undefined && fieldName) {
      answers[fieldName] = userAnswer
      setFlowAnswers(answers)
    }

    while (idx < nodes.length) {
      const node = nodes[idx]
      idx++

      if (node.type === "start") continue

      if (node.type === "message") {
        addBotMsg(node.data.message || "")
        continue
      }

      if (node.type === "collect") {
        setFlowNodeIdx(idx)
        setFlowFieldValue("")
        setFlowFieldError(null)
        addBotMsg(
          node.data.question ||
            `Please enter your ${node.data.fieldName || "answer"}`,
        )
        return
      }

      if (node.type === "choice") {
        setFlowNodeIdx(idx)
        setMsgs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "bot",
            content: node.data.question || "Please choose an option:",
            choices: node.data.options ?? [],
          },
        ])
        return
      }

      if (
        node.type === "lead_save" ||
        node.type === "webhook" ||
        node.type === "google_sheet"
      ) {
        try {
          await api.post(`/flows/public/${flowId}/submit`, { data: answers })
        } catch {}
        continue
      }

      if (node.type === "end") {
        addBotMsg(node.data.message || "Thanks! We'll be in touch soon.")
        setFlowDone(true)
        setFlowId(null)
        setFlowNodes([])
        return
      }
    }

    setFlowDone(true)
    setFlowId(null)
    setFlowNodes([])
  }

  async function startFlow(fId: string) {
    try {
      const res = await api.get(`/flows/${fId}`)
      const data = res.data?.data ?? res.data
      const nodes: FlowNode[] = data.nodes ?? []
      setFlowId(fId)
      setFlowNodes(nodes)
      setFlowNodeIdx(0)
      setFlowAnswers({})
      setFlowDone(false)

      let idx = 0
      while (idx < nodes.length) {
        const node = nodes[idx]
        idx++
        if (node.type === "start") continue
        if (node.type === "message") {
          addBotMsg(node.data.message || "")
          continue
        }
        if (node.type === "collect") {
          setFlowNodeIdx(idx)
          addBotMsg(
            node.data.question ||
              `Please enter your ${node.data.fieldName || "answer"}`,
          )
          return
        }
        if (node.type === "choice") {
          setFlowNodeIdx(idx)
          setMsgs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "bot",
              content: node.data.question || "Please choose:",
              choices: node.data.options ?? [],
            },
          ])
          return
        }
        if (node.type === "end") {
          addBotMsg(node.data.message || "Thanks!")
          setFlowDone(true)
          return
        }
      }
    } catch {
      addBotMsg("I wasn't able to load that flow. Please try again.")
    }
  }

  function validateFlowInput(value: string, node: FlowNode): string | null {
    const { fieldType = "text", required = false, minLength, maxLength, min, max, step, minDate, maxDate, pattern, fieldName } = node.data ?? {}
    const trimmed = value.trim()

    if (required && !trimmed) return "This field is required."
    if (!trimmed && !required) return null

    if (minLength !== undefined && trimmed.length < minLength)
      return `Must be at least ${minLength} character${minLength === 1 ? "" : "s"}.`
    if (maxLength !== undefined && trimmed.length > maxLength)
      return `Must be at most ${maxLength} character${maxLength === 1 ? "" : "s"}.`

    if (fieldType === "number") {
      const num = Number(trimmed)
      if (Number.isNaN(num)) return "Please enter a valid number."
      if (min !== undefined && num < min)
        return max !== undefined ? `Must be between ${min} and ${max}.` : `Must be at least ${min}.`
      if (max !== undefined && num > max)
        return min !== undefined ? `Must be between ${min} and ${max}.` : `Must be at most ${max}.`
      if (step !== undefined && step > 0) {
        const adj = (num - (min ?? 0)) / step
        if (Math.abs(adj - Math.round(adj)) > 1e-6) return `Must be a multiple of ${step}.`
      }
    }

    if (fieldType === "email" && !pattern) {
      if (!/^[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed))
        return "Please enter a valid email address."
    }
    if (fieldType === "phone" && !pattern) {
      if (!/^[+]?[0-9 ()\-]{7,20}$/.test(trimmed))
        return "Please enter a valid phone number."
    }
    if (fieldType === "url" && !pattern) {
      if (!/^https?:\/\/[^\s]+$/.test(trimmed))
        return "Please enter a valid URL (start with http:// or https://)."
    }

    if (pattern) {
      try {
        if (!new RegExp(pattern).test(trimmed))
          return `${fieldName ?? "Value"} doesn't match the expected format.`
      } catch {}
    }

    if (fieldType === "date") {
      const d = new Date(trimmed)
      if (Number.isNaN(d.getTime())) return "Please enter a valid date."
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (minDate === "future" && d <= today) return "Please pick a future date."
      if (minDate === "today" && d < today) return "Date can't be in the past."
      if (minDate === "past" && d >= today) return "Please pick a past date."
      if (minDate && /^\d{4}-\d{2}-\d{2}$/.test(minDate) && d < new Date(minDate))
        return `Earliest allowed: ${minDate}.`
      if (maxDate && /^\d{4}-\d{2}-\d{2}$/.test(maxDate) && d > new Date(maxDate))
        return `Latest allowed: ${maxDate}.`
    }

    return null
  }

  async function send(text?: string) {
    const raw = (text ?? input).trim()
    if (!raw || sending) return

    if (tab !== "chat") setTab("chat")
    setInput("")

    if (flowId && flowNodes.length > 0) {
      const currentNode = flowNodes[flowNodeIdx - 1]
      if (currentNode?.type === "collect") {
        const err = validateFlowInput(raw, currentNode)
        if (err) {
          setFlowFieldError(err)
          return
        }
        setFlowFieldError(null)
      }
      setMsgs((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: raw }])
      const fieldName = currentNode?.data?.fieldName ?? "answer"
      await advanceFlow(raw, fieldName)
      return
    }

    setMsgs((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: raw }])

    setSending(true)
    try {
      const res = await api.post(`/projects/${bot.id}/live-preview`, {
        content: raw,
        conversationId: convId ?? undefined,
      })
      const data = res.data?.data ?? res.data
      if (data?.conversationId) setConvId(data.conversationId)

      if (data?.action === "invoke_flow" && data?.flowId) {
        await startFlow(data.flowId)
      } else {
        const reply = data?.message?.content ?? data?.content ?? "…"
        addBotMsg(reply)
      }
    } catch {
      addBotMsg("Something went wrong. Try again.")
    } finally {
      setSending(false)
    }
  }

  async function pickChoice(option: { id: string; label: string; value: string }) {
    setMsgs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: option.label },
    ])
    const currentNode = flowNodes[flowNodeIdx - 1]
    const fieldName = currentNode?.data?.fieldName ?? "choice"
    await advanceFlow(option.value, fieldName)
  }

  function openChat() {
    setTab("chat")
    if (msgs.length === 0) {
      addBotMsg(bot.welcomeMessage || "Hi! How can I help?")
    }
  }

  // ── Tab config ─────────────────────────────────────────────────────────

  const tabs = [
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "home" as const, label: "Home", icon: Home },
    ...(showHelp ? [{ id: "help" as const, label: "Help", icon: BookOpen }] : []),
  ]

  // ── Bot avatar ─────────────────────────────────────────────────────────

  function BotAvatar({ size = 7 }: { size?: number }) {
    const px = size * 4
    return C.avatarUrl ? (
      <img
        src={C.avatarUrl}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: px, height: px }}
      />
    ) : (
      <div
        className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm shrink-0`}
        style={{ backgroundColor: C.accent + "20" }}
      >
        <span className="text-sm">{C.emoji}</span>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Proactive bubbles */}
      {!open && proactiveBubbles.length > 0 && (
        <div
          className="fixed z-50 flex flex-col gap-2 items-end"
          style={{ ...posStyle, bottom: 88, maxWidth: 280 }}
        >
          {proactiveBubbles.map((text, i) => (
            <button
              key={i}
              onClick={openWidget}
              className="bg-card border border-border/80 rounded-2xl px-4 py-2.5 text-sm text-foreground text-left shadow-lg hover:shadow-xl transition-shadow"
              style={{ animation: "lw-pop 0.22s ease" }}
            >
              {text}
            </button>
          ))}
          <button
            onClick={() => {
              setProactiveBubbles([])
              timersRef.current.forEach(clearTimeout)
              if (cycleRef.current) clearTimeout(cycleRef.current)
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}


      {/* Launcher button */}
      <button
        onClick={() => { if (open) { setOpen(false) } else { openWidget() } }}
        className="fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ ...posStyle, backgroundColor: C.launcherBg, position: "fixed" }}
        title={open ? "Close preview" : "Test bot live"}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : C.launcherIconUrl ? (
          <img src={C.launcherIconUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="text-2xl">{C.emoji}</span>
        )}
        {!open && proactiveBubbles.length > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white text-[8px] text-white font-bold flex items-center justify-center"
          >
            {proactiveBubbles.length}
          </span>
        )}
      </button>

      <style>{`
        @keyframes lw-pop {
          from { opacity: 0; transform: translateY(6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Widget panel */}
      {open && (
        <div
          className="fixed bottom-24 z-50 w-[360px] flex flex-col overflow-hidden shadow-2xl border border-border/60"
          style={{ ...posStyle, height: "560px", borderRadius: "20px" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ backgroundColor: C.headerBg }}
          >
            {C.avatarUrl ? (
              <img
                src={C.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: C.headerText + "25" }}
              >
                {C.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: C.headerText }}
              >
                {C.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] opacity-75" style={{ color: C.headerText }}>
                  {botSubtitle || "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="transition-opacity opacity-70 hover:opacity-100"
              style={{ color: C.headerText }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── HOME TAB ── */}
          {tab === "home" && (
            <div
              className="flex-1 overflow-y-auto"
              style={{ backgroundColor: C.chatBg }}
            >
              {/* Greeting hero */}
              <div
                className="px-5 pt-6 pb-5"
                style={{ backgroundColor: C.headerBg + "12" }}
              >
                <p className="text-lg font-bold text-foreground leading-snug">
                  {greeting}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">{subGreeting}</p>
              </div>

              <div className="p-4 flex flex-col gap-2">
                {/* Start chat CTA */}
                <button
                  onClick={openChat}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                  style={{ backgroundColor: C.accent }}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Start a conversation
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-80" />
                </button>

                {/* Conversation starters */}
                {starters.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mt-3 mb-1 px-1">
                      Ask us anything
                    </p>
                    {starters.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s.message || s.label)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm text-foreground border border-border bg-card hover:bg-accent transition-colors text-left"
                      >
                        <span>{s.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </>
                )}

                {/* Help preview */}
                {showHelp && articles.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mt-3 mb-1 px-1 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> {helpTitle}
                    </p>
                    {articles.slice(0, 3).map((a, i) => (
                      <a
                        key={i}
                        href={a.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm text-foreground border border-border bg-card hover:bg-accent transition-colors"
                      >
                        <span>{a.title}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                    {helpUrl && (
                      <a
                        href={helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium mt-1 px-1 flex items-center gap-1"
                        style={{ color: C.accent }}
                      >
                        View all articles
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === "chat" && (
            <div
              className="flex-1 flex flex-col min-h-0"
              style={{ backgroundColor: C.chatBg }}
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                {msgs.length === 0 && (
                  <div className="flex items-start gap-2.5">
                    <BotAvatar />
                    <div
                      className="rounded-2xl rounded-tl-none px-3 py-2.5 max-w-[80%]"
                      style={{ backgroundColor: C.botBg }}
                    >
                      <MdText text={bot.welcomeMessage || "Hi! How can I help?"} color={C.accent} fontSize={C.fontSize} />
                    </div>
                  </div>
                )}

                {msgs.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2">
                    <div
                      className={cn(
                        "flex gap-2.5",
                        m.role === "user"
                          ? "justify-end"
                          : "justify-start items-start",
                      )}
                    >
                      {m.role === "bot" && <BotAvatar />}
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                            m.role === "user" ? "rounded-tr-none" : "rounded-tl-none",
                          )}
                          style={
                            m.role === "user"
                              ? { backgroundColor: C.userBg, color: C.userText }
                              : { backgroundColor: C.botBg, color: C.botText }
                          }
                        >
                          {m.role === "bot"
                            ? <MdText text={m.content} color={C.accent} fontSize={C.fontSize} />
                            : m.content}
                        </div>
                        {C.showTimestamps && (
                          <p className={cn("text-[10px] text-muted-foreground opacity-50 px-1", m.role === "user" ? "text-right" : "text-left")}>
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>

                    {m.choices && m.choices.length > 0 && inFlow && (
                      <div className="flex flex-col gap-1.5 pl-9">
                        {m.choices.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => pickChoice(opt)}
                            className="text-left text-sm px-3 py-2 rounded-xl border transition-colors hover:bg-accent"
                            style={{ borderColor: C.accent + "60", color: C.accent }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-start gap-2.5">
                    <BotAvatar />
                    <div
                      className="rounded-2xl rounded-tl-none px-3 py-3 flex items-center gap-1"
                      style={{ backgroundColor: C.botBg }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          backgroundColor: C.botText + "80",
                          animationDelay: "0ms",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          backgroundColor: C.botText + "80",
                          animationDelay: "120ms",
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          backgroundColor: C.botText + "80",
                          animationDelay: "240ms",
                        }}
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>


              {/* ── Flow collect field — replaces main input during flow ── */}
              {(() => {
                const currentNode = inFlow ? flowNodes[flowNodeIdx - 1] : null
                if (!currentNode || currentNode.type !== "collect") return null
                const { fieldType = "text", placeholder, helpText } = currentNode.data ?? {}
                const isLong = fieldType === "longtext"

                const inputClass = "w-full bg-background border border-input rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"

                function submitFlowField() {
                  send(flowFieldValue)
                }

                return (
                  <div className="px-3 pb-3 pt-2 shrink-0 border-t border-border bg-card flex flex-col gap-1.5">
                    {isLong ? (
                      <textarea
                        autoFocus
                        rows={3}
                        value={flowFieldValue}
                        onChange={(e) => { setFlowFieldValue(e.target.value); setFlowFieldError(null) }}
                        placeholder={placeholder || "Type your answer…"}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        autoFocus
                        type={
                          fieldType === "email" ? "email"
                          : fieldType === "phone" ? "tel"
                          : fieldType === "number" ? "number"
                          : fieldType === "url" ? "url"
                          : fieldType === "date" ? "date"
                          : "text"
                        }
                        value={flowFieldValue}
                        onChange={(e) => { setFlowFieldValue(e.target.value); setFlowFieldError(null) }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitFlowField() } }}
                        placeholder={placeholder || "Type your answer…"}
                        min={currentNode.data?.min}
                        max={currentNode.data?.max}
                        step={currentNode.data?.step}
                        className={inputClass}
                      />
                    )}
                    {flowFieldError && (
                      <p className="text-[11px] text-destructive px-1">{flowFieldError}</p>
                    )}
                    {helpText && !flowFieldError && (
                      <p className="text-[11px] text-muted-foreground px-1">{helpText}</p>
                    )}
                    <button
                      onClick={submitFlowField}
                      disabled={!flowFieldValue.trim()}
                      className="h-8 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: C.accent }}
                    >
                      Continue →
                    </button>
                  </div>
                )
              })()}

              {/* Quick reply chips — collapsible, hidden during flows */}
              {qr.length > 0 && !inFlow && msgs.length > 0 && showQuickReplies && (
                <div className="px-3 pt-2 pb-1 flex gap-1.5 flex-wrap border-t border-border/50">
                  {qr.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { send(q.label); setShowQuickReplies(false) }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors hover:opacity-70"
                      style={{ borderColor: C.accent + "60", color: C.accent }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Main chat input — hidden during flow collect steps */}
              {!inFlow && (
                <div className="px-3 pb-3 pt-2 shrink-0 border-t border-border bg-card">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                    {qr.length > 0 && msgs.length > 0 && (
                      <button
                        onClick={() => setShowQuickReplies(v => !v)}
                        className="shrink-0 transition-colors text-muted-foreground hover:text-foreground"
                        title="Quick replies"
                      >
                        <ChevronUp className={`w-4 h-4 transition-transform ${showQuickReplies ? "" : "rotate-180"}`} />
                      </button>
                    )}
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          send()
                        }
                      }}
                      placeholder={inputPlaceholder}
                      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                      disabled={sending}
                    />
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || sending}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
                      style={{ backgroundColor: C.accent }}
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HELP TAB ── */}
          {tab === "help" && showHelp && (
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
              style={{ backgroundColor: C.chatBg }}
            >
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: C.accent }} />
                {helpTitle}
              </p>

              {articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No articles added yet.</p>
                </div>
              ) : (
                articles.map((a, i) => (
                  <a
                    key={i}
                    href={a.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-sm text-foreground"
                  >
                    <span>{a.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </a>
                ))
              )}

              {helpUrl && (
                <a
                  href={helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium mt-2 px-1"
                  style={{ color: C.accent }}
                >
                  View all articles
                  <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* ── Powered by / business hours footer ── */}
          {(showPoweredBy || businessHoursText) && (
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-1.5 border-t border-border bg-card">
              {businessHoursText && (
                <span className="text-[10px] text-muted-foreground truncate">{businessHoursText}</span>
              )}
              {showPoweredBy && (
                <a
                  href={footerLinkUrl || "#"}
                  target={footerLinkUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-auto shrink-0"
                >
                  {footerText}
                </a>
              )}
            </div>
          )}

          {/* ── Tab bar ── */}
          <div className="shrink-0 flex border-t border-border bg-card">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === "chat") {
                    openChat()
                  } else {
                    setTab(id)
                  }
                }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  tab === id ? "" : "text-muted-foreground hover:text-foreground",
                )}
                style={tab === id ? { color: C.accent } : {}}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
