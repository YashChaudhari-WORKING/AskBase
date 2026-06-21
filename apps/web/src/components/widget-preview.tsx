"use client"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WidgetPreviewProps {
  name: string
  tone: "friendly" | "formal" | "technical" | "concise"
  primaryColor: string
  welcomeMessage?: string
  responseTimeText?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TONE_WELCOME: Record<string, string> = {
  friendly:  "Hi there 👋 How can we help?",
  formal:    "Hello. How may I assist you today?",
  technical: "Hi! Describe your issue in detail.",
  concise:   "Hey — what do you need?",
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** The three macOS-style traffic-light dots in the browser chrome */
function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
    </div>
  )
}

/** Fake URL bar in the center of the browser chrome */
function FakeUrlBar() {
  return (
    <div className="flex items-center gap-1.5 px-3 h-5 rounded-full bg-card border border-border min-w-0 max-w-[180px] w-full">
      {/* lock icon */}
      <svg className="w-2.5 h-2.5 shrink-0 text-muted-foreground" viewBox="0 0 12 12" fill="currentColor">
        <path d="M9 5V4a3 3 0 1 0-6 0v1H2v6h8V5H9ZM5 4a1 1 0 1 1 2 0v1H5V4Z" />
      </svg>
      <span className="text-[10px] text-muted-foreground truncate tracking-tight">yoursite.com</span>
    </div>
  )
}

/** Skeletal fake webpage content — neutral bars that simulate real copy */
function FakePageContent() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fake nav */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border shrink-0">
        <div className="w-16 h-2.5 rounded-full bg-muted" />
        <div className="flex gap-2">
          <div className="w-8 h-2 rounded-full bg-muted" />
          <div className="w-8 h-2 rounded-full bg-muted" />
          <div className="w-8 h-2 rounded-full bg-muted" />
        </div>
        <div className="w-12 h-5 rounded-md bg-muted" />
      </div>

      {/* Hero-ish area */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="w-2/3 h-3 rounded-full bg-muted/80 mb-2" />
        <div className="w-1/2 h-2.5 rounded-full bg-muted/60 mb-3" />
        <div className="w-20 h-5 rounded-md bg-muted/70" />
      </div>

      {/* Fake image block */}
      <div className="mx-5 mb-3 h-14 rounded-lg bg-muted/50 shrink-0" />

      {/* Paragraph lines */}
      <div className="px-5 space-y-1.5 shrink-0">
        <div className="w-full h-2 rounded-full bg-muted/50" />
        <div className="w-5/6 h-2 rounded-full bg-muted/40" />
        <div className="w-4/6 h-2 rounded-full bg-muted/40" />
      </div>

      {/* Two-col cards */}
      <div className="flex gap-2 mx-5 mt-3 shrink-0">
        <div className="flex-1 h-12 rounded-lg bg-muted/40 border border-border" />
        <div className="flex-1 h-12 rounded-lg bg-muted/40 border border-border" />
      </div>
    </div>
  )
}

/** The floating chat widget in the bottom-right corner */
function ChatWidget({
  name,
  primaryColor,
  welcomeMessage,
  responseTimeText,
}: {
  name: string
  primaryColor: string
  welcomeMessage: string
  responseTimeText?: string
}) {
  const displayName = (name ?? "").trim() || "Assistant"

  return (
    <div
      className={cn(
        "absolute bottom-3 right-3 w-[200px] rounded-2xl shadow-2xl overflow-hidden",
        "border border-border transition-all duration-200"
      )}
    >
      {/* Widget header */}
      <div
        className="flex items-center gap-1.5 px-3 py-2.5 transition-colors duration-200"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Bot / lightning icon */}
        <span className="text-white text-xs leading-none">⚡</span>
        <span className="text-white text-[11px] font-semibold truncate leading-none flex-1">
          {displayName}
        </span>
        {/* Online indicator */}
        <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
      </div>

      {/* Widget body */}
      <div className="bg-card px-3 pt-3 pb-2">
        {/* Inbound bubble */}
        <div className="flex items-start gap-1.5 mb-3">
          {/* Bot avatar dot */}
          <div
            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 transition-colors duration-200"
            style={{ backgroundColor: primaryColor + "22" }}
          >
            <span style={{ color: primaryColor }} className="text-[9px] leading-none font-bold transition-colors duration-200">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            {/* Welcome bubble — keyed on content so it re-renders on tone change */}
            <div
              key={welcomeMessage}
              className="bg-muted rounded-xl rounded-tl-none px-2.5 py-1.5 max-w-[140px]"
            >
              <p className="text-[10px] text-foreground leading-snug">{welcomeMessage}</p>
            </div>

            {responseTimeText && (
              <p className="text-[9px] text-muted-foreground pl-0.5">{responseTimeText}</p>
            )}
          </div>
        </div>

        {/* Fake user message */}
        <div className="flex justify-end mb-3">
          <div
            className="rounded-xl rounded-tr-none px-2.5 py-1.5 max-w-[110px] transition-colors duration-200"
            style={{ backgroundColor: primaryColor + "18" }}
          >
            <p className="text-[10px] leading-snug" style={{ color: primaryColor }}>
              How does this work?
            </p>
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-start gap-1.5 mb-3">
          <div
            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 transition-colors duration-200"
            style={{ backgroundColor: primaryColor + "22" }}
          >
            <span style={{ color: primaryColor }} className="text-[9px] leading-none font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="bg-muted rounded-xl rounded-tl-none px-2.5 py-2 flex items-center gap-0.5">
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: primaryColor, animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: primaryColor, animationDelay: "120ms" }}
            />
            <span
              className="w-1 h-1 rounded-full animate-bounce"
              style={{ backgroundColor: primaryColor, animationDelay: "240ms" }}
            />
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground flex-1 truncate">
            Type a message…
          </span>
          {/* Send button */}
          <button
            aria-label="Send"
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
            style={{ backgroundColor: primaryColor }}
          >
            <svg
              className="w-2.5 h-2.5 text-white"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 1 1 5.5l4 1.5 2 4 4-10Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function WidgetPreview({
  name,
  tone,
  primaryColor,
  welcomeMessage,
  responseTimeText,
}: WidgetPreviewProps) {
  const resolvedWelcome = welcomeMessage ?? TONE_WELCOME[tone] ?? TONE_WELCOME.friendly

  return (
    /* Outer card wrapper — the whole browser mockup */
    <div className="rounded-2xl border border-border shadow-lg overflow-hidden bg-card w-full select-none">

      {/* ── Browser chrome ── */}
      <div className="flex items-center gap-3 px-3 h-8 bg-muted border-b border-border">
        <TrafficLights />

        {/* Spacer so URL bar is visually centred */}
        <div className="flex-1 flex justify-center">
          <FakeUrlBar />
        </div>

        {/* Right-side chrome controls placeholder */}
        <div className="flex items-center gap-1 opacity-40">
          <div className="w-3 h-1.5 rounded-sm bg-muted-foreground/60" />
          <div className="w-3 h-1.5 rounded-sm bg-muted-foreground/60" />
        </div>
      </div>

      {/* ── Simulated webpage ── */}
      <div className="relative bg-background" style={{ minHeight: 260 }}>
        <FakePageContent />

        {/* The floating widget */}
        <ChatWidget
          name={name}
          primaryColor={primaryColor}
          welcomeMessage={resolvedWelcome}
          responseTimeText={responseTimeText}
        />
      </div>
    </div>
  )
}
