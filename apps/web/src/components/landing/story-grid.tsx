"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────
   SVG components — positioned bottom-right, cropped by
   overflow-hidden on the card. opacity ~0.13.
───────────────────────────────────────────────────── */

/* Row 1 — "Describe it. AI configures everything." — inline UI mock */
function DescribeItVisual() {
  return (
    <div className="w-52 shrink-0 rounded-xl border border-border bg-muted/20 overflow-hidden text-xs select-none">
      {/* Prompt input */}
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">Your prompt</p>
        <p className="text-foreground/80 leading-snug">
          I need a support assistant for my SaaS
          <span className="inline-block w-[1.5px] h-[13px] bg-primary/80 align-middle ml-0.5 animate-pulse" />
        </p>
      </div>
      {/* AI generated output */}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[10px] text-primary/60 uppercase tracking-widest">✦ AI generated</p>
        {([
          ["Name",    "SupportBot"],
          ["Tone",    "Friendly"],
          ["Prompt",  "Answer using…"],
          ["Welcome", "Hi! How can I…"],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground/50 shrink-0">{k}</span>
            <span className="text-foreground/70 truncate">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Row 1 — "No step 1 of 5." — crossed-out wizard + deploy button */
const WIZARD_STEPS = [
  "Name your assistant",
  "Upload your docs",
  "Configure tone",
  "Set handoff rules",
  "Review and publish",
];

function NoWizardVisual() {
  return (
    <div className="mt-6 select-none">
      <div className="space-y-2 mb-4 opacity-[0.28]">
        {WIZARD_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <span className="size-5 rounded-full border border-border flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-muted-foreground line-through">{step}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-foreground">Ready to deploy</span>
        </div>
        <span className="text-xs font-semibold text-primary">Deploy →</span>
      </div>
    </div>
  );
}

/* Row 2 — "Your docs become instant answers." */
function SvgLayers() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      <rect x="30" y="80" width="90" height="54" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="18" y="62" width="90" height="54" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="6"  y="44" width="90" height="54" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* Text lines on top layer */}
      <line x1="18"  y1="60" x2="56"  y2="60" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="18"  y1="70" x2="48"  y2="70" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Search icon */}
      <circle cx="120" cy="60" r="16" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="131" y1="71" x2="145" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Search inner cross */}
      <line x1="112" y1="60" x2="128" y2="60" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="120" y1="52" x2="120" y2="68" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* Row 2 — "Every answer shows its source." */
function SvgCite() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Outer target ring */}
      <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="1.5"/>
      {/* Mid ring */}
      <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="1.5"/>
      {/* Inner ring */}
      <circle cx="80" cy="80" r="20" stroke="currentColor" strokeWidth="1.5"/>
      {/* Center dot */}
      <circle cx="80" cy="80" r="4"  stroke="currentColor" strokeWidth="1.5"/>
      {/* Tick marks on outer ring */}
      <line x1="80"  y1="14" x2="80"  y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="80"  y1="138" x2="80" y2="146" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14"  y1="80" x2="22"  y2="80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="138" y1="80" x2="146" y2="80" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* Row 2 — "Knows when to stop. Handoff done right." */
function SvgShield() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Shield outer */}
      <path d="M80 12 L130 32 L130 84 C130 118 80 148 80 148 C80 148 30 118 30 84 L30 32 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Shield inner */}
      <path d="M80 28 L116 44 L116 82 C116 106 80 128 80 128 C80 128 44 106 44 82 L44 44 Z"
        stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.4"/>
      {/* Check */}
      <path d="M58 82 L72 96 L102 66"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* Row 3 — "Build flows visually. Zero code." */
function SvgNodes() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Start node */}
      <rect x="8" y="66" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* Branch node top */}
      <rect x="64" y="28" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* Branch node bottom */}
      <rect x="64" y="104" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* End node top */}
      <rect x="120" y="28" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* End node bottom */}
      <rect x="120" y="104" width="32" height="28" rx="6" stroke="currentColor" strokeWidth="1.5"/>
      {/* Connector: start → branch fork */}
      <path d="M40 80 L52 80 L52 42 L64 42"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M52 80 L52 118 L64 118"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Connector: branch → end */}
      <line x1="96" y1="42"  x2="120" y2="42"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="96" y1="118" x2="120" y2="118" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* Row 3 — "Google Sheets. Webhooks. Both." */
function SvgGrid() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Sheet icon */}
      <rect x="8" y="16" width="60" height="72" rx="5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8"  y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="8"  y1="52" x2="68" y2="52" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="8"  y1="68" x2="68" y2="68" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="28" y1="36" x2="28" y2="88" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="48" y1="36" x2="48" y2="88" stroke="currentColor" strokeWidth="1.2"/>
      {/* Arrow right */}
      <path d="M80 52 L104 52 M96 44 L104 52 L96 60"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Webhook target circle */}
      <circle cx="128" cy="52" r="24" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="128" cy="52" r="10" stroke="currentColor" strokeWidth="1.5"/>
      {/* Webhook signal lines */}
      <path d="M112 104 C104 116 104 132 112 144"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M128 108 C116 118 116 136 128 146"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M144 104 C152 116 152 132 144 144"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* Row 4 — "AI + Flow. One sentence to switch." (full-width) */
function SvgBolt() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      <path d="M92 14 L54 80 L76 80 L60 146 L106 72 L82 72 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M88 28 L66 80 L80 80 L68 124 L98 78 L84 78 Z"
        stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.45"/>
      {/* Two merging paths (AI + Flow) */}
      <path d="M20 40 C20 40 40 40 52 72"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M20 120 C20 120 40 120 52 88"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="20" cy="40"  r="5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="120" r="5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

/* Row 5 — "Your brand. Live as you build." */
function SvgEye() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Eye outer */}
      <path d="M10 80 C10 80 40 20 80 20 C120 20 150 80 150 80 C150 80 120 140 80 140 C40 140 10 80 10 80Z"
        stroke="currentColor" strokeWidth="1.5"/>
      {/* Iris */}
      <circle cx="80" cy="80" r="24" stroke="currentColor" strokeWidth="1.5"/>
      {/* Pupil */}
      <circle cx="80" cy="80" r="10" stroke="currentColor" strokeWidth="1.5"/>
      {/* Highlight */}
      <circle cx="88" cy="72" r="4" stroke="currentColor" strokeWidth="1"/>
      {/* Color swatches below */}
      <circle cx="52"  cy="132" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="70"  cy="132" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="88"  cy="132" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="106" cy="132" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="124" cy="132" r="7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

/* Row 5 — "One script tag. Any website." */
function SvgCode() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Terminal window */}
      <rect x="8" y="20" width="144" height="100" rx="8" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="40" x2="152" y2="40" stroke="currentColor" strokeWidth="1"/>
      {/* Window dots */}
      <circle cx="24" cy="30" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="36" cy="30" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="48" cy="30" r="3" stroke="currentColor" strokeWidth="1.5"/>
      {/* < > brackets */}
      <path d="M38 68 L22 80 L38 92"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M62 68 L78 80 L62 92"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* script text line */}
      <line x1="88"  y1="72" x2="140" y2="72" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="88"  y1="82" x2="128" y2="82" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Cursor */}
      <line x1="132" y1="77" x2="132" y2="87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Embed snippet below window */}
      <path d="M30 140 L50 140 L50 152 L30 152 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M56 140 L130 140" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M56 148 L110 148" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

/* Row 5 — "Analytics that tell you what to fix next." */
function SvgChart() {
  return (
    <svg
      width="180" height="180" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-8 -right-8 text-foreground/[0.13]"
    >
      {/* Axes */}
      <line x1="20" y1="130" x2="150" y2="130" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="20"  x2="20"  y2="130" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Bars */}
      <rect x="34"  y="96"  width="22" height="34" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="66"  y="64"  width="22" height="66" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="98"  y="38"  width="22" height="92" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="130" y="18"  width="22" height="112" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      {/* Trend line */}
      <path d="M45 90 L77 58 L109 32 L141 12"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="4 3"/>
      {/* Y-axis ticks */}
      <line x1="16" y1="96"  x2="20" y2="96"  stroke="currentColor" strokeWidth="1.2"/>
      <line x1="16" y1="64"  x2="20" y2="64"  stroke="currentColor" strokeWidth="1.2"/>
      <line x1="16" y1="38"  x2="20" y2="38"  stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

/* Row 6 — "100 conversations a day. Free." (highlighted — white SVG) */
function SvgInfinity() {
  return (
    <svg
      width="220" height="220" viewBox="0 0 160 160" fill="none"
      className="absolute -bottom-10 -right-10 text-background/[0.10]"
    >
      {/* Infinity loops */}
      <path d="M80 80 C80 80 62 50 44 50 C28 50 18 62 18 80 C18 98 28 110 44 110 C62 110 80 80 80 80Z"
        stroke="currentColor" strokeWidth="2"/>
      <path d="M80 80 C80 80 98 110 116 110 C132 110 142 98 142 80 C142 62 132 50 116 50 C98 50 80 80 80 80Z"
        stroke="currentColor" strokeWidth="2"/>
      {/* Inner echo */}
      <path d="M80 80 C80 80 66 60 50 60 C38 60 32 68 32 80 C32 92 38 100 50 100 C66 100 80 80 80 80Z"
        stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <path d="M80 80 C80 80 94 100 110 100 C122 100 128 92 128 80 C128 68 122 60 110 60 C94 60 80 80 80 80Z"
        stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      {/* Center dot */}
      <circle cx="80" cy="80" r="4" stroke="currentColor" strokeWidth="2"/>
      {/* Outer ring */}
      <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4"/>
    </svg>
  );
}

/* ── Card data ──────────────────────────────────────── */

const cards = [
  {
    title: "Describe it. AI configures everything.",
    body: "Type what your assistant should do — one sentence. AskBase generates the name, system prompt, tone, welcome message, response time text, and suggested quick links. No blank forms, no step counter, no required fields. Review and deploy, or just deploy.",
    col: "lg:col-span-2",
    Svg: null,
    Visual: DescribeItVisual,
    badge: null,
    highlight: false,
  },
  {
    title: "No step 1 of 5.",
    body: "There is no wizard. There is no required field. You can deploy the moment the assistant looks right — not when a progress bar says you're done.",
    col: "lg:col-span-1",
    Svg: null,
    Visual: NoWizardVisual,
    badge: null,
    highlight: false,
  },
  {
    title: "Your docs become instant answers.",
    body: "Upload PDF, DOCX, TXT, or paste any URL. Every question runs through hybrid vector + keyword search, then a reranker picks the best match. Customers get accurate answers from your actual content — source doc and page shown on every response.",
    col: "lg:col-span-1",
    Svg: SvgLayers,
    badge: null,
    highlight: false,
  },
  {
    title: "Every answer shows its source.",
    body: "No black box. Each response shows the exact document it came from, with a confidence score. When it isn't sure — it says so, and connects the customer to a human instead of guessing.",
    col: "lg:col-span-1",
    Svg: SvgCite,
    badge: null,
    highlight: false,
  },
  {
    title: "Knows when to stop. Handoff done right.",
    body: "Set how cautious your assistant should be — Relaxed, Balanced, or Strict. When a human steps in, the full conversation appears in Live Console with the complete transcript already loaded. The customer repeats nothing.",
    col: "lg:col-span-1",
    Svg: SvgShield,
    badge: null,
    highlight: false,
  },
  {
    title: "Build flows visually. Zero code.",
    body: "Drag nodes onto a canvas, connect them, deploy. Each node does one thing — ask a question, collect name, email, or phone, check an answer, branch left or right. Questions appear one at a time. Never a form, always a conversation.",
    col: "lg:col-span-1",
    Svg: SvgNodes,
    badge: null,
    highlight: false,
  },
  {
    title: "Google Sheets. Webhooks. Both.",
    body: "Every completed flow writes a row to your spreadsheet automatically — no Zapier, no middleware. A webhook fires simultaneously to any URL: your CRM, Slack, or backend gets the full payload. Branch routes each send to different sheets or different webhooks.",
    col: "lg:col-span-2",
    Svg: SvgGrid,
    badge: null,
    highlight: false,
  },
  {
    title: "AI + Flow. One sentence to switch.",
    body: "Write one line: \"Start the booking flow when the user wants to schedule a demo.\" The AI reads every message and switches mid-conversation — exactly when intent matches. The flow takes over. Google Sheets fills. Webhook fires. The customer never sees the seam.",
    col: "lg:col-span-3",
    Svg: SvgBolt,
    badge: null,
    highlight: false,
  },
  {
    title: "Your brand. Live as you build.",
    body: "Five color presets or a custom hex code. Four tone cards — Friendly, Formal, Technical, Concise — the welcome message rewrites itself to match. Set response time text, add quick links to the widget home screen. The preview updates on every keystroke. No save needed.",
    col: "lg:col-span-1",
    Svg: SvgEye,
    badge: null,
    highlight: false,
  },
  {
    title: "One script tag. Any website.",
    body: "Copy a single script tag. Paste it before the closing body tag. Your branded assistant appears — no npm, no framework, no backend. Works on Webflow, Shopify, React, or plain HTML. Live in 60 seconds.",
    col: "lg:col-span-1",
    Svg: SvgCode,
    badge: null,
    highlight: false,
  },
  {
    title: "Analytics that tell you what to fix next.",
    body: "Resolution rate, response times, handoff triggers — and the metric that actually matters: top unanswered questions. It tells you exactly what to add to your knowledge base. Sources shown per message in every transcript.",
    col: "lg:col-span-1",
    Svg: SvgChart,
    badge: "Coming soon",
    highlight: false,
  },
  {
    title: "100 conversations a day. Free. No card. No catch.",
    body: "No credit card. No trial period. No watermark. No \"upgrade to remove branding.\" One limit — everything else is yours.",
    col: "lg:col-span-3",
    Svg: SvgInfinity,
    badge: null,
    highlight: true,
  },
];

/* ── Component ──────────────────────────────────────── */

export function StoryGrid() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mb-14"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
          The full picture
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.07]">
          From your first sentence.
          <br />
          <span className="text-muted-foreground font-normal">
            Every feature, every step.
          </span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(({ title, body, col, Svg, Visual, badge, highlight }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-32px" }}
            transition={{ duration: 0.38, delay: (i % 3) * 0.055 }}
            className={[
              "relative overflow-hidden rounded-2xl p-8",
              col === "lg:col-span-2" ? "sm:col-span-2" : "",
              col === "lg:col-span-3" ? "sm:col-span-2 lg:col-span-3" : "",
              highlight ? "bg-foreground" : "bg-card border border-border",
            ].join(" ")}
          >
            {/* Background SVG decoration — only for cards without a Visual */}
            {Svg && !Visual && <Svg />}

            {Visual ? (
              /* Cards with inline UI visual — wide = row, narrow = col */
              <div className={`relative z-10 flex gap-6 ${col === "lg:col-span-1" ? "flex-col" : "flex-row items-start"}`}>
                <div className={col !== "lg:col-span-1" ? "flex-1 min-w-0" : ""}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className={`text-[15px] font-semibold leading-snug ${highlight ? "text-background" : "text-foreground"}`}>
                      {title}
                    </p>
                    {badge && (
                      <Badge variant="secondary" className="text-[10px] rounded-full shrink-0 mt-0.5 whitespace-nowrap">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${highlight ? "text-background/65" : "text-muted-foreground"}`}>
                    {body}
                  </p>
                </div>
                <Visual />
              </div>
            ) : (
              /* Standard cards — text only, SVG behind */
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className={`text-[15px] font-semibold leading-snug ${highlight ? "text-background" : "text-foreground"}`}>
                    {title}
                  </p>
                  {badge && (
                    <Badge variant="secondary" className="text-[10px] rounded-full shrink-0 mt-0.5 whitespace-nowrap">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${highlight ? "text-background/65" : "text-muted-foreground"}`}>
                  {body}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
