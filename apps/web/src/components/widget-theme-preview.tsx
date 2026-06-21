"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Monitor, Smartphone, Send, Paperclip, ChevronRight,
  Home, MessageSquare, BookOpen, Search, ArrowLeft, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WidgetThemeConfig {
  botName: string
  botSubtitle: string
  botAvatarEmoji: string
  botAvatarUrl?: string | null
  primaryColor: string
  headerBgColor: string
  headerTextColor: string
  chatBgColor: string
  borderRadius: string
  botBubbleBg: string
  botBubbleText: string
  userBubbleBg: string
  userBubbleText: string
  showTimestamps: boolean
  launcherPosition: string
  launcherBgColor: string
  launcherIconEmoji: string
  launcherIconUrl?: string | null
  fontSize?: string | null
  inputPlaceholder: string
  sendButtonColor: string
  allowAttachments: boolean
  showPoweredBy: boolean
  footerText?: string | null
  footerLinkUrl?: string | null
  quickReplies: Array<{ label: string }>
  homeGreeting: string
  homeSubgreeting: string
  conversationStarters: Array<{ label: string; message?: string }>
  showHelpCenter: boolean
  helpCenterTitle: string
  helpArticles: Array<{ title: string; url?: string }>
  helpCenterUrl?: string | null
  businessHoursText?: string | null
}

const RADIUS_PX: Record<string, string> = {
  none: "0px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px",
}

type InnerTab = "home" | "chat" | "help"

// ---------------------------------------------------------------------------
// Bot Avatar
// ---------------------------------------------------------------------------

function BotAvatar({
  theme, size, chatVariant = false,
}: {
  theme: WidgetThemeConfig
  size: number
  chatVariant?: boolean
}) {
  if (theme.botAvatarUrl) {
    return (
      <img
        src={theme.botAvatarUrl}
        alt={theme.botName}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: chatVariant ? theme.headerBgColor + "22" : "rgba(255,255,255,0.2)",
        color: chatVariant ? theme.headerBgColor : theme.headerTextColor,
        fontSize: size * 0.45,
      }}
    >
      {theme.botAvatarEmoji || "⚡"}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Widget Header
// ---------------------------------------------------------------------------

function WidgetHeader({
  theme, onBack, compact = false,
}: {
  theme: WidgetThemeConfig
  onBack?: () => void
  compact?: boolean
}) {
  return (
    <motion.div
      animate={{ backgroundColor: theme.headerBgColor }}
      transition={{ duration: 0.35 }}
      className={cn("flex items-center gap-2.5 shrink-0", compact ? "px-3 py-2.5" : "px-4 py-3.5")}
    >
      {onBack && (
        <button className="shrink-0 opacity-70">
          <ArrowLeft style={{ width: compact ? 12 : 14, height: compact ? 12 : 14, color: theme.headerTextColor }} />
        </button>
      )}
      <BotAvatar theme={theme} size={compact ? 26 : 34} />
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate leading-tight" style={{ color: theme.headerTextColor, fontSize: compact ? 11 : 13 }}>
          {theme.botName || "Assistant"}
        </p>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="leading-tight opacity-75" style={{ color: theme.headerTextColor, fontSize: compact ? 8 : 10 }}>
            {theme.businessHoursText || theme.botSubtitle || "Online now"}
          </p>
        </div>
      </div>
      <button className="opacity-60 shrink-0">
        <X style={{ width: compact ? 12 : 14, height: compact ? 12 : 14, color: theme.headerTextColor }} />
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Input bar
// ---------------------------------------------------------------------------

function ChatInputBar({ theme, compact = false }: { theme: WidgetThemeConfig; compact?: boolean }) {
  return (
    <div className={cn("border-t border-black/5 shrink-0", compact ? "px-2 pb-1.5 pt-1.5" : "px-3 pb-2.5 pt-2")}>
      <div className={cn(
        "flex items-center gap-1.5 rounded-full border border-border/50 bg-white/70",
        compact ? "px-2 py-1" : "px-3 py-1.5"
      )}>
        {theme.allowAttachments && (
          <Paperclip className="shrink-0 text-muted-foreground" style={{ width: compact ? 8 : 11, height: compact ? 8 : 11 }} />
        )}
        <span className="flex-1 truncate text-muted-foreground/60" style={{ fontSize: compact ? 8 : 10 }}>
          {theme.inputPlaceholder || "Type a message…"}
        </span>
        <motion.div
          animate={{ backgroundColor: theme.sendButtonColor }}
          transition={{ duration: 0.35 }}
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: compact ? 16 : 22, height: compact ? 16 : 22 }}
        >
          <Send className="text-white" style={{ width: compact ? 7 : 10, height: compact ? 7 : 10 }} />
        </motion.div>
      </div>
      {theme.showPoweredBy && (
        <p className="text-muted-foreground/40 text-center mt-1" style={{ fontSize: compact ? 7 : 8 }}>
          {theme.footerText || "Powered by AskBase"}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HOME tab
// ---------------------------------------------------------------------------

function HomeTab({ theme, onChatClick, compact = false }: {
  theme: WidgetThemeConfig
  onChatClick: () => void
  compact?: boolean
}) {
  const px = compact ? "px-3" : "px-4"
  const validStarters = (theme.conversationStarters ?? []).filter(s => s.label.trim())
  const validArticles = (theme.helpArticles ?? []).filter(a => a.title.trim())
  const fakeTeam = ["A", "B", "C"].map((l, i) => ({
    letter: l,
    color: [theme.primaryColor, theme.headerBgColor + "cc", theme.primaryColor + "aa"][i],
  }))

  return (
    <motion.div
      animate={{ backgroundColor: theme.chatBgColor }}
      transition={{ duration: 0.35 }}
      className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}
    >
      <motion.div
        animate={{ backgroundColor: theme.headerBgColor }}
        transition={{ duration: 0.35 }}
        className={cn("pb-5 pt-1", px)}
      >
        <p className="font-bold leading-tight" style={{ color: theme.headerTextColor, fontSize: compact ? 14 : 18 }}>
          {theme.homeGreeting || "How can we help?"}
        </p>
        <p className="mt-0.5 opacity-70 leading-snug" style={{ color: theme.headerTextColor, fontSize: compact ? 8 : 10 }}>
          {theme.homeSubgreeting || "We usually reply in a few minutes."}
        </p>
        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="flex -space-x-1.5">
            {fakeTeam.map((m, i) => (
              <div key={i} className="rounded-full border-2 border-white/30 flex items-center justify-center font-semibold"
                style={{ width: compact ? 16 : 22, height: compact ? 16 : 22, backgroundColor: m.color, color: "#fff", fontSize: compact ? 7 : 9 }}>
                {m.letter}
              </div>
            ))}
          </div>
          <p className="opacity-60" style={{ color: theme.headerTextColor, fontSize: compact ? 7 : 9 }}>Our team</p>
        </div>
      </motion.div>

      <div className={cn("flex flex-col", compact ? "gap-2 py-2.5 px-3" : "gap-3 py-3 px-4")}>
        <motion.button
          type="button"
          onClick={onChatClick}
          animate={{ backgroundColor: theme.primaryColor }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-xl flex items-center justify-between font-semibold text-white"
          style={{ padding: compact ? "8px 12px" : "10px 14px", fontSize: compact ? 10 : 12 }}
        >
          <span>Start a conversation</span>
          <ChevronRight style={{ width: compact ? 10 : 13, height: compact ? 10 : 13 }} />
        </motion.button>

        {validStarters.length > 0 && (
          <div className="flex flex-col" style={{ gap: compact ? 4 : 6 }}>
            <p className="font-semibold text-muted-foreground" style={{ fontSize: compact ? 8 : 10 }}>Or ask a question</p>
            {validStarters.slice(0, 3).map((s, i) => (
              <motion.button key={i} type="button" whileHover={{ x: 2 }}
                className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-card text-left"
                style={{ padding: compact ? "5px 10px" : "7px 12px", fontSize: compact ? 9 : 11 }}>
                <span className="text-foreground font-medium truncate">{s.label}</span>
                <ChevronRight className="shrink-0 text-muted-foreground" style={{ width: compact ? 9 : 11, height: compact ? 9 : 11 }} />
              </motion.button>
            ))}
          </div>
        )}

        {theme.showHelpCenter && validArticles.length > 0 && (
          <div className="flex flex-col" style={{ gap: compact ? 4 : 6 }}>
            <p className="font-semibold text-muted-foreground" style={{ fontSize: compact ? 8 : 10 }}>
              {theme.helpCenterTitle || "Help & Resources"}
            </p>
            {validArticles.slice(0, 3).map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card"
                style={{ padding: compact ? "5px 10px" : "7px 12px" }}>
                <BookOpen className="shrink-0 text-muted-foreground" style={{ width: compact ? 8 : 11, height: compact ? 8 : 11 }} />
                <span className="flex-1 truncate text-foreground" style={{ fontSize: compact ? 8 : 10 }}>{a.title}</span>
                <ChevronRight className="shrink-0 text-muted-foreground" style={{ width: compact ? 8 : 10, height: compact ? 8 : 10 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// CHAT tab
// ---------------------------------------------------------------------------

function ChatTab({ theme, compact = false }: { theme: WidgetThemeConfig; compact?: boolean }) {
  const avatarSize = compact ? 18 : 22
  const validReplies = (theme.quickReplies ?? []).filter(q => q.label.trim())

  return (
    <motion.div
      animate={{ backgroundColor: theme.chatBgColor }}
      transition={{ duration: 0.35 }}
      className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}
      style={{ padding: compact ? "8px 10px" : "12px 14px", gap: compact ? 6 : 9 }}
    >
      <div className="flex items-start gap-1.5">
        <BotAvatar theme={theme} size={avatarSize} chatVariant />
        <motion.div
          animate={{ backgroundColor: theme.botBubbleBg }}
          transition={{ duration: 0.35 }}
          className="rounded-xl rounded-tl-none"
          style={{ padding: compact ? "5px 8px" : "7px 11px" }}
        >
          <p style={{ color: theme.botBubbleText, fontSize: compact ? 9 : 11, lineHeight: 1.4 }}>
            Hi! How can I help you today?
          </p>
          {theme.showTimestamps && (
            <p style={{ color: theme.botBubbleText, fontSize: compact ? 7 : 8, opacity: 0.4, marginTop: 2 }}>2:30 PM</p>
          )}
        </motion.div>
      </div>

      <div className="flex justify-end">
        <motion.div
          animate={{ backgroundColor: theme.userBubbleBg }}
          transition={{ duration: 0.35 }}
          className="rounded-xl rounded-tr-none"
          style={{ padding: compact ? "5px 8px" : "7px 11px", maxWidth: "75%" }}
        >
          <p style={{ color: theme.userBubbleText, fontSize: compact ? 9 : 11, lineHeight: 1.4 }}>
            What are your pricing plans?
          </p>
          {theme.showTimestamps && (
            <p style={{ color: theme.userBubbleText, fontSize: compact ? 7 : 8, opacity: 0.4, marginTop: 2, textAlign: "right" }}>2:31 PM</p>
          )}
        </motion.div>
      </div>

      <div className="flex items-start gap-1.5">
        <BotAvatar theme={theme} size={avatarSize} chatVariant />
        <motion.div
          animate={{ backgroundColor: theme.botBubbleBg }}
          transition={{ duration: 0.35 }}
          className="rounded-xl rounded-tl-none flex items-center"
          style={{ padding: compact ? "6px 9px" : "8px 12px", gap: compact ? 3 : 4 }}
        >
          {[0, 0.12, 0.24].map((d) => (
            <motion.span
              key={d}
              className="rounded-full inline-block"
              animate={{ y: [0, compact ? -2 : -3, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: d }}
              style={{ width: compact ? 4 : 5, height: compact ? 4 : 5, backgroundColor: theme.botBubbleText }}
            />
          ))}
        </motion.div>
      </div>

      {validReplies.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: compact ? 4 : 5 }}>
          {validReplies.slice(0, 3).map((qr, i) => (
            <motion.div
              key={i}
              animate={{ borderColor: theme.primaryColor + "80", color: theme.primaryColor }}
              transition={{ duration: 0.35 }}
              className="rounded-full border bg-transparent cursor-pointer"
              style={{ fontSize: compact ? 8 : 10, padding: compact ? "3px 8px" : "4px 10px" }}
            >
              {qr.label}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// HELP tab
// ---------------------------------------------------------------------------

function HelpTab({ theme, compact = false }: { theme: WidgetThemeConfig; compact?: boolean }) {
  const validArticles = (theme.helpArticles ?? []).filter(a => a.title.trim())
  const articles = validArticles.length > 0 ? validArticles : [
    { title: "Getting started guide" },
    { title: "How to customize your widget" },
    { title: "Integrations & API" },
  ]

  return (
    <motion.div
      animate={{ backgroundColor: theme.chatBgColor }}
      transition={{ duration: 0.35 }}
      className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}
      style={{ padding: compact ? "8px 10px" : "12px 14px" }}
    >
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card"
        style={{ padding: compact ? "5px 10px" : "7px 12px", marginBottom: compact ? 8 : 12 }}>
        <Search className="shrink-0 text-muted-foreground" style={{ width: compact ? 9 : 12, height: compact ? 9 : 12 }} />
        <span className="text-muted-foreground/50" style={{ fontSize: compact ? 8 : 10 }}>Search articles…</span>
      </div>
      <p className="font-semibold text-muted-foreground" style={{ fontSize: compact ? 8 : 10, marginBottom: compact ? 6 : 8 }}>
        {theme.helpCenterTitle || "Help & Resources"}
      </p>
      <div className="flex flex-col" style={{ gap: compact ? 4 : 6 }}>
        {articles.map((a, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card cursor-pointer"
            style={{ padding: compact ? "6px 10px" : "8px 12px" }}>
            <BookOpen className="shrink-0 text-muted-foreground" style={{ width: compact ? 9 : 11, height: compact ? 9 : 11 }} />
            <span className="flex-1 truncate" style={{ fontSize: compact ? 9 : 11 }}>{a.title}</span>
            <ChevronRight className="shrink-0 text-muted-foreground" style={{ width: compact ? 8 : 10, height: compact ? 8 : 10 }} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

function TabBar({ active, onChange, theme, showHelp, compact }: {
  active: InnerTab
  onChange: (t: InnerTab) => void
  theme: WidgetThemeConfig
  showHelp: boolean
  compact: boolean
}) {
  const tabs = [
    { key: "chat" as const, Icon: MessageSquare, label: "Chat" },
    { key: "home" as const, Icon: Home, label: "Home" },
    ...(showHelp ? [{ key: "help" as const, Icon: BookOpen, label: "Help" }] : []),
  ]

  return (
    <div className="flex items-center border-t border-border/40 bg-background/95 shrink-0"
      style={{ padding: compact ? "4px 6px" : "6px 10px" }}>
      {tabs.map(({ key, Icon, label }) => {
        const isActive = active === key
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className="flex-1 flex flex-col items-center"
            style={{ gap: compact ? 1 : 2 }}>
            <Icon
              className={cn(!isActive && "text-muted-foreground/50")}
              style={{
                width: compact ? 11 : 14, height: compact ? 11 : 14,
                color: isActive ? theme.primaryColor : undefined,
              }}
            />
            <span
              className={cn("font-medium", !isActive && "text-muted-foreground/50")}
              style={{ fontSize: compact ? 7 : 8, color: isActive ? theme.primaryColor : undefined }}
            >
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="rounded-full"
                style={{ width: compact ? 12 : 16, height: 2, backgroundColor: theme.primaryColor }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phone mockup
// ---------------------------------------------------------------------------

function PhoneView({ theme, large = false, innerTab, setInnerTab }: {
  theme: WidgetThemeConfig
  large?: boolean
  innerTab: InnerTab
  setInnerTab: (t: InnerTab) => void
}) {
  const radius = RADIUS_PX[theme.borderRadius] ?? "16px"
  const W = large ? 300 : 250
  const H = large ? 520 : 430
  const compact = !large

  return (
    <div className="flex justify-center select-none">
      <div className="relative" style={{ width: W }}>
        <div className="absolute inset-0 rounded-[40px] border-[6px] border-foreground/[0.08] pointer-events-none z-10 shadow-[0_24px_70px_rgba(0,0,0,0.22)]" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-16 h-5 rounded-full bg-foreground/[0.07]" />

        <div className="px-6 pt-6 pb-1.5 flex items-center justify-between">
          <span className="text-[8px] font-semibold text-muted-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex items-end gap-0.5">
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} className="w-0.5 rounded-full bg-muted-foreground/60" style={{ height: h }} />
              ))}
            </div>
            <svg className="text-muted-foreground/70" width="12" height="9" fill="currentColor" viewBox="0 0 16 12">
              <path d="M8 0C5.4 0 3 1 1.2 2.8L0 1.6C2.2.6 5 0 8 0s5.8.6 8 1.6l-1.2 1.2C13 1 10.6 0 8 0Z" />
              <path d="M8 4C6.2 4 4.5 4.7 3.3 5.8L2 4.5C3.6 3.1 5.7 2.2 8 2.2s4.4.9 6 2.3l-1.3 1.3C11.5 4.7 9.8 4 8 4Z" />
              <path d="M8 8c-.9 0-1.7.4-2.3.9L4.4 7.6C5.4 6.6 6.6 6 8 6s2.6.6 3.6 1.6l-1.3 1.3C9.7 8.4 8.9 8 8 8Z" />
              <circle cx="8" cy="11" r="1.5" />
            </svg>
            <div className="w-4 h-2 rounded-[3px] border border-muted-foreground/50 flex items-center px-0.5">
              <div className="h-1 rounded-sm bg-muted-foreground/60" style={{ width: "60%" }} />
            </div>
          </div>
        </div>

        <div className="mx-3 mb-5 flex flex-col overflow-hidden shadow-2xl" style={{ borderRadius: radius, height: H }}>
          <WidgetHeader theme={theme} compact={compact} />
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {innerTab === "home" && (
                <motion.div key="home" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                  className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <HomeTab theme={theme} onChatClick={() => setInnerTab("chat")} compact={compact} />
                </motion.div>
              )}
              {innerTab === "chat" && (
                <motion.div key="chat" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                  className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <ChatTab theme={theme} compact={compact} />
                  <ChatInputBar theme={theme} compact={compact} />
                </motion.div>
              )}
              {innerTab === "help" && (
                <motion.div key="help" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
                  className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <HelpTab theme={theme} compact={compact} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <TabBar active={innerTab} onChange={setInnerTab} theme={theme} showHelp={theme.showHelpCenter} compact={compact} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Desktop full-height view
// ---------------------------------------------------------------------------

function WebsiteViewFull({ theme, innerTab, setInnerTab }: {
  theme: WidgetThemeConfig
  innerTab: InnerTab
  setInnerTab: (t: InnerTab) => void
}) {
  const isRight = theme.launcherPosition !== "bottom-left"
  const radius = RADIUS_PX[theme.borderRadius] ?? "16px"

  return (
    <div className="h-full flex flex-col select-none bg-card">
      {/* Browser chrome */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-10 bg-muted border-b border-border/60">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
          <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
        </div>
        <div className="flex-1 flex justify-center px-6">
          <div className="flex items-center gap-1.5 px-3 h-6 rounded-full bg-background border border-border/60 w-full max-w-xs">
            <svg className="w-3 h-3 shrink-0 text-muted-foreground/60" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 5V4a3 3 0 1 0-6 0v1H2v6h8V5H9ZM5 4a1 1 0 1 1 2 0v1H5V4Z" />
            </svg>
            <span className="text-xs text-muted-foreground truncate">yoursite.com</span>
          </div>
        </div>
      </div>

      {/* Page + floating widget */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Fake page skeleton */}
        <div className="px-8 pt-5 flex flex-col gap-3 pointer-events-none">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <div className="w-14 h-3 rounded bg-muted/70" />
            <div className="flex items-center gap-3">
              {["", "", ""].map((_, i) => <div key={i} className="w-8 h-1.5 rounded bg-muted/40" />)}
              <motion.div className="h-6 w-16 rounded-lg" animate={{ backgroundColor: theme.primaryColor + "35" }} transition={{ duration: 0.35 }} />
            </div>
          </div>
          {/* Hero */}
          <div className="flex flex-col gap-2 pt-3">
            <div className="w-3/5 h-5 rounded-md bg-muted/70" />
            <div className="w-2/5 h-3 rounded bg-muted/50" />
            <div className="w-1/3 h-2.5 rounded bg-muted/35" />
            <div className="flex gap-2.5 pt-1">
              <motion.div className="h-7 w-20 rounded-lg" animate={{ backgroundColor: theme.primaryColor }} transition={{ duration: 0.35 }} />
              <div className="h-7 w-20 rounded-lg bg-muted/20 border border-border/50" />
            </div>
          </div>
          {/* Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl border border-border/40 bg-card">
                <motion.div className="w-7 h-7 rounded-lg" animate={{ backgroundColor: theme.primaryColor + "20" }} transition={{ duration: 0.35 }} />
                <div className="w-4/5 h-2 rounded bg-muted/60" />
                <div className="w-full h-1.5 rounded bg-muted/40" />
                <div className="w-5/6 h-1.5 rounded bg-muted/30" />
                <div className="w-2/3 h-1.5 rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Floating widget */}
        <div className={cn("absolute bottom-5 flex flex-col gap-3", isRight ? "right-5 items-end" : "left-5 items-start")}>
          <div className="overflow-hidden shadow-2xl border border-black/5 flex flex-col" style={{ borderRadius: radius, width: 210, height: 290 }}>
            <WidgetHeader theme={theme} compact />
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {innerTab === "home" && (
                  <motion.div key="home-d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <HomeTab theme={theme} onChatClick={() => setInnerTab("chat")} compact />
                  </motion.div>
                )}
                {innerTab === "chat" && (
                  <motion.div key="chat-d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ChatTab theme={theme} compact />
                    <ChatInputBar theme={theme} compact />
                  </motion.div>
                )}
                {innerTab === "help" && (
                  <motion.div key="help-d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <HelpTab theme={theme} compact />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <TabBar active={innerTab} onChange={setInnerTab} theme={theme} showHelp={theme.showHelpCenter} compact />
          </div>
          <motion.button
            type="button"
            animate={{ backgroundColor: theme.launcherBgColor }}
            transition={{ duration: 0.35 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.93 }}
            className={cn("rounded-full shadow-2xl flex items-center justify-center text-xl cursor-pointer shrink-0 overflow-hidden", isRight ? "self-end" : "self-start")}
            style={{ width: 46, height: 46 }}
          >
            {theme.launcherIconUrl
              ? <img src={theme.launcherIconUrl} alt="" className="w-full h-full object-cover" />
              : (theme.launcherIconEmoji || "💬")}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compact website view (for small previews)
// ---------------------------------------------------------------------------

function WebsiteView({ theme }: { theme: WidgetThemeConfig }) {
  const isRight = theme.launcherPosition !== "bottom-left"
  const radius = RADIUS_PX[theme.borderRadius] ?? "16px"

  return (
    <div className="rounded-2xl border border-border shadow-lg overflow-hidden bg-card w-full select-none">
      <div className="flex items-center gap-3 px-3 h-8 bg-muted border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 px-3 h-5 rounded-full bg-card border border-border min-w-0 max-w-[180px] w-full">
            <svg className="w-2.5 h-2.5 shrink-0 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 5V4a3 3 0 1 0-6 0v1H2v6h8V5H9ZM5 4a1 1 0 1 1 2 0v1H5V4Z" />
            </svg>
            <span className="text-[10px] text-muted-foreground truncate">yoursite.com</span>
          </div>
        </div>
      </div>
      <div className="relative bg-background" style={{ minHeight: 280 }}>
        <div className="flex flex-col gap-2 p-4">
          <div className="w-2/3 h-2.5 rounded-full bg-muted/80" />
          <div className="w-1/2 h-2 rounded-full bg-muted/60" />
          <div className="h-10 rounded-lg bg-muted/40 mt-1" />
          <div className="space-y-1.5 mt-1">
            <div className="w-full h-1.5 rounded-full bg-muted/40" />
            <div className="w-5/6 h-1.5 rounded-full bg-muted/30" />
          </div>
        </div>
        <div className={cn("absolute bottom-3 flex flex-col gap-2", isRight ? "right-3 items-end" : "left-3 items-start")}>
          <div className="overflow-hidden shadow-2xl border border-black/5" style={{ borderRadius: radius, width: 188 }}>
            <WidgetHeader theme={theme} compact />
            <ChatTab theme={theme} compact />
            <ChatInputBar theme={theme} compact />
          </div>
          <motion.button
            type="button"
            animate={{ backgroundColor: theme.launcherBgColor }}
            transition={{ duration: 0.35 }}
            className="rounded-full shadow-xl flex items-center justify-center text-lg cursor-pointer overflow-hidden"
            style={{ width: 40, height: 40 }}
          >
            {theme.launcherIconUrl
              ? <img src={theme.launcherIconUrl} alt="" className="w-full h-full object-cover" />
              : (theme.launcherIconEmoji || "💬")}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface WidgetThemePreviewProps {
  theme: WidgetThemeConfig
  className?: string
  large?: boolean
  fullHeight?: boolean
}

export function WidgetThemePreview({ theme, className, large = false, fullHeight = false }: WidgetThemePreviewProps) {
  const [mode, setMode] = useState<"website" | "widget">("website")
  const [innerTab, setInnerTab] = useState<InnerTab>("home")
  const previewBodyRef = useRef<HTMLDivElement>(null)
  const [phoneScale, setPhoneScale] = useState(1)

  useEffect(() => {
    if (!fullHeight) return
    const el = previewBodyRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const scaleByW = (width * 0.82) / 300
      const scaleByH = (height * 0.88) / 520
      setPhoneScale(Math.min(scaleByW, scaleByH, 1.6))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fullHeight])

  const INNER_TABS: { key: InnerTab; label: string }[] = [
    { key: "home", label: "Home" },
    { key: "chat", label: "Chat" },
    ...(theme.showHelpCenter ? [{ key: "help" as InnerTab, label: "Help" }] : []),
  ]

  if (fullHeight) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header: mode toggle + inner tab switcher */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-border/30">
          {/* Inner tab switcher */}
          <div className="flex items-center gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/40">
            {INNER_TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setInnerTab(key)}
                className="relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors">
                {innerTab === key && (
                  <motion.div layoutId="inner-tab-pill" className="absolute inset-0 bg-background rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <span className={cn("relative z-10 transition-colors", innerTab === key ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
          {/* Mode toggle */}
          <div className="flex p-0.5 bg-muted/60 rounded-lg border border-border/40">
            {(["website", "widget"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="relative flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium">
                {mode === m && (
                  <motion.div layoutId="fh-mode-pill" className="absolute inset-0 bg-background rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <span className={cn("relative flex items-center gap-1.5 z-10 transition-colors",
                  mode === m ? "text-foreground" : "text-muted-foreground")}>
                  {m === "website" ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                  {m === "website" ? "Desktop" : "Widget"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview body */}
        <div ref={previewBodyRef} className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === "website" ? (
              <motion.div key="desk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="h-full">
                <WebsiteViewFull theme={theme} innerTab={innerTab} setInnerTab={setInnerTab} />
              </motion.div>
            ) : (
              <motion.div key="phone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="h-full flex items-center justify-center"
                style={{
                  backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.07) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}>
                <div style={{ transform: `scale(${phoneScale})`, transformOrigin: "center center" }}>
                  <PhoneView theme={theme} large innerTab={innerTab} setInnerTab={setInnerTab} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Compact mode
  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <div className="flex items-center gap-0.5 p-1 bg-muted/80 rounded-xl w-fit self-center border border-border/40">
        {(["website", "widget"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium">
            {mode === m && (
              <motion.div layoutId="preview-mode-pill" className="absolute inset-0 bg-background rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }} />
            )}
            <span className={cn("relative z-10 flex items-center gap-1.5 transition-colors", mode === m ? "text-foreground" : "text-muted-foreground")}>
              {m === "website" ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              {m === "website" ? "Website" : "Widget"}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {mode === "website" ? (
          <motion.div key="website" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="w-full">
            <WebsiteView theme={theme} />
          </motion.div>
        ) : (
          <motion.div key="widget" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <PhoneView theme={theme} large={large} innerTab={innerTab} setInnerTab={setInnerTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
