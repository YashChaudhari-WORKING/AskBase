"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

/* ── Small bullet SVGs — 20×20 viewBox, stroke only ── */

const IcoSparkle = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="10" y1="1" x2="10" y2="5"/><line x1="10" y1="15" x2="10" y2="19"/>
    <line x1="1" y1="10" x2="5" y2="10"/><line x1="15" y1="10" x2="19" y2="10"/>
    <line x1="3.5" y1="3.5" x2="6.5" y2="6.5"/><line x1="13.5" y1="13.5" x2="16.5" y2="16.5"/>
    <line x1="16.5" y1="3.5" x2="13.5" y2="6.5"/><line x1="3.5" y1="16.5" x2="6.5" y2="13.5"/>
  </svg>
);

const IcoEye = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M1 10C1 10 4.5 3 10 3C15.5 3 19 10 19 10C19 10 15.5 17 10 17C4.5 17 1 10 1 10Z"/>
    <circle cx="10" cy="10" r="2.5"/>
    <line x1="15" y1="5" x2="17" y2="3"/>
  </svg>
);

const IcoRocket = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 1C10 1 15 5 15 11L10 16L5 11C5 5 10 1 10 1Z"/>
    <circle cx="10" cy="8.5" r="1.5"/>
    <path d="M5 13L3 18"/><path d="M15 13L17 18"/>
  </svg>
);

const IcoSearch = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="8.5" cy="8.5" r="5.5"/>
    <line x1="13" y1="13" x2="18" y2="18"/>
    <line x1="5.5" y1="8.5" x2="11.5" y2="8.5"/>
    <line x1="8.5" y1="5.5" x2="8.5" y2="11.5"/>
  </svg>
);

const IcoDoc = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2H13L17 6V18H5V2Z"/>
    <path d="M13 2V6H17"/>
    <line x1="8" y1="10" x2="14" y2="10"/>
    <line x1="8" y1="13" x2="11" y2="13"/>
    <path d="M6 10L7 11L9 9"/>
  </svg>
);

const IcoSlider = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="6" x2="19" y2="6"/>
    <circle cx="7" cy="6" r="2.5"/>
    <line x1="1" y1="14" x2="19" y2="14"/>
    <circle cx="13" cy="14" r="2.5"/>
  </svg>
);

const IcoBolt = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1L5 11H10L8 19L15 9H10L12 1Z"/>
  </svg>
);

const IcoConsole = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="18" height="14" rx="2"/>
    <path d="M5 9L8 12L5 15"/>
    <line x1="10" y1="15" x2="15" y2="15"/>
    <line x1="1" y1="7" x2="19" y2="7"/>
    <circle cx="4" cy="5" r="0.8"/>
    <circle cx="7" cy="5" r="0.8"/>
  </svg>
);

const IcoChart = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="13" width="3.5" height="6" rx="1"/>
    <rect x="8" y="8" width="3.5" height="11" rx="1"/>
    <rect x="14" y="3" width="3.5" height="16" rx="1"/>
    <path d="M2 11L8 6L14 1" strokeDasharray="2 2"/>
  </svg>
);

const IcoNodes = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="7.5" width="5" height="5" rx="1.5"/>
    <rect x="14" y="3" width="5" height="5" rx="1.5"/>
    <rect x="14" y="12" width="5" height="5" rx="1.5"/>
    <path d="M6 10H10.5L10.5 5.5H14"/>
    <path d="M10.5 10L10.5 14.5H14"/>
  </svg>
);

const IcoBranch = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="10" y1="1" x2="10" y2="8"/>
    <path d="M10 8L4 14"/>
    <path d="M10 8L16 14"/>
    <circle cx="10" cy="8" r="2"/>
    <circle cx="4" cy="16" r="2"/>
    <circle cx="16" cy="16" r="2"/>
  </svg>
);

const IcoGrid = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="32" height="32" rx="2"/>
    <line x1="7.5" y1="1" x2="7.5" y2="19"/>
    <line x1="13.5" y1="1" x2="13.5" y2="19"/>
    <line x1="1" y1="7.5" x2="19" y2="7.5"/>
    <line x1="1" y1="13.5" x2="19" y2="13.5"/>
  </svg>
);

const IcoSend = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 1L1 7.5L8 10.5L11 18L19 1Z"/>
    <line x1="8" y1="10.5" x2="19" y2="1"/>
  </svg>
);

const IcoFork = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="10" y1="1" x2="10" y2="6"/>
    <path d="M10 6C10 6 5 8 4 12"/>
    <path d="M10 6C10 6 15 8 16 12"/>
    <line x1="4" y1="12" x2="4" y2="19"/>
    <line x1="16" y1="12" x2="16" y2="19"/>
    <circle cx="10" cy="6" r="1.5"/>
  </svg>
);

const IcoDatabase = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <ellipse cx="10" cy="5" rx="8" ry="3"/>
    <path d="M2 5V10C2 11.66 5.58 13 10 13C14.42 13 18 11.66 18 10V5"/>
    <path d="M2 10V15C2 16.66 5.58 18 10 18C14.42 18 18 16.66 18 15V10"/>
  </svg>
);

const IcoRoute = () => (
  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="3" cy="10" r="2"/>
    <circle cx="17" cy="10" r="2"/>
    <path d="M5 10H8"/>
    <path d="M12 10H15"/>
    <circle cx="10" cy="10" r="2"/>
    <path d="M10 8V5L14 3"/>
    <path d="M10 12V15L6 17"/>
  </svg>
);

/* ── Types ─────────────────────────────────────── */

interface BulletItem {
  text: string;
  Svg: () => JSX.Element;
}

interface Card {
  heading: string;
  bullets: BulletItem[];
  image: string | null;
  imagePlaceholder: string;
  imageRight: boolean;
}

interface Tab {
  key: string;
  label: string;
  cards: Card[];
}

/* ── Content ────────────────────────────────────── */

const tabs: Tab[] = [
  {
    key: "ai",
    label: "AI Agent",
    cards: [
      {
        heading: "One sentence.\nAI builds everything.",
        bullets: [
          { text: "Name, system prompt, tone, welcome message, response time text, and quick links — generated from one sentence. Review in 30 seconds.", Svg: IcoSparkle },
          { text: "Live widget preview updates on every keystroke. Pick a tone card — Friendly, Formal, Technical, Concise — welcome message rewrites itself. 5 color presets or your hex code.", Svg: IcoEye },
          { text: "No forms, no wizard, no step counter. Deploy the moment it looks right — not when a progress bar says you're done.", Svg: IcoRocket },
        ],
        image: "/assets/homepage/dashboard.png",
        imagePlaceholder: "dashboard.png",
        imageRight: true,
      },
      {
        heading: "Upload anything.\nExact answers every time.",
        bullets: [
          { text: "PDF, DOCX, TXT, or any URL. Every question runs through hybrid vector + keyword search combined — then a reranker picks the best match from your content.", Svg: IcoSearch },
          { text: "Every response shows the exact source document and page. Confidence score on every answer. No black box — your team sees what the AI used.", Svg: IcoDoc },
          { text: "Handoff presets — Relaxed, Balanced, Strict. When the AI isn't confident it says so and routes to a human. It never guesses.", Svg: IcoSlider },
        ],
        image: null,
        imagePlaceholder: "/assets/homepage/ai-knowledge.png",
        imageRight: false,
      },
      {
        heading: "Captures leads.\nMid-conversation.",
        bullets: [
          { text: "Write one line: when should the AI switch to a flow. The AI reads every message and switches at exactly that moment — the customer never sees the transition.", Svg: IcoBolt },
          { text: "Live Console: when a human steps in, the full conversation transcript is already loaded — sources shown per message. The customer repeats nothing.", Svg: IcoConsole },
          { text: "Top unanswered questions shows you exactly what your assistant couldn't answer. Add those docs. Close the gap. Never miss the same question twice.", Svg: IcoChart },
        ],
        image: null,
        imagePlaceholder: "/assets/homepage/ai-handoff.png",
        imageRight: true,
      },
    ],
  },
  {
    key: "flow",
    label: "Flow",
    cards: [
      {
        heading: "One sentence.\nFlow builds itself.",
        bullets: [
          { text: "Same start as AI Agent — describe your flow and AskBase generates the trigger condition, tone, and welcome message. No blank canvas. No decisions to make first.", Svg: IcoSparkle },
          { text: "Drag nodes onto a canvas, connect them, deploy. Each node does one thing: ask a question, collect name, email, or phone, check an answer. Questions appear one at a time — never a form.", Svg: IcoNodes },
          { text: "Conditional branches route every conversation. A visitor says 'enterprise' — flow goes one way. 'Just browsing' — goes another. All based on any answer they give.", Svg: IcoBranch },
        ],
        image: null,
        imagePlaceholder: "/assets/homepage/flow-builder.png",
        imageRight: true,
      },
      {
        heading: "Collect. Branch.\nSave automatically.",
        bullets: [
          { text: "Every completed flow writes a row to your Google Sheet — name, email, every answer, every field. No Zapier. No middleware. No polling. It's already there when you open Sheets.", Svg: IcoGrid },
          { text: "A webhook fires to any URL the moment a flow ends. Your CRM, Slack, or backend receives the full payload instantly. No delay, no batch processing.", Svg: IcoSend },
          { text: "Branch routes send to different sheets and trigger different webhooks. Enterprise leads hit one CRM endpoint. General inquiries hit another. Fully automatic.", Svg: IcoFork },
        ],
        image: null,
        imagePlaceholder: "/assets/homepage/flow-sheets.png",
        imageRight: false,
      },
      {
        heading: "Every lead. Tracked.\nRouted. Notified.",
        bullets: [
          { text: "Lead management shows every submission — every field, every answer, every path taken. Nothing lost, nothing in an inbox. One place for the whole team.", Svg: IcoDatabase },
          { text: "Advanced analytics: completion rates, drop-off points by node, path breakdown by branch. See exactly where visitors leave and fix it.", Svg: IcoChart },
          { text: "Webhook payload hits your CRM the moment a lead submits. Different visitor types route to completely separate systems automatically — no manual sorting.", Svg: IcoRoute },
        ],
        image: null,
        imagePlaceholder: "/assets/homepage/flow-leads.png",
        imageRight: true,
      },
    ],
  },
];

/* ── Subcomponents ──────────────────────────────── */

function Visual({ card }: { card: Card }) {
  // Only render real images for now; skip missing screenshots (no placeholder boxes).
  if (!card.image) return null;
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-xl shadow-black/8">
      <Image
        src={card.image}
        alt="AskBase"
        width={1400}
        height={900}
        className="w-full h-auto block"
        priority
      />
    </div>
  );
}

/* ── Main component ─────────────────────────────── */

export function AlternatingFeatures() {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active)!;

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">

      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
          End to end
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.08]">
          From your first sentence
          <br />
          <span className="text-muted-foreground font-normal">To a live assistant on your site.</span>
        </h2>
      </motion.div>

      {/* Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex justify-center mb-20"
      >
        <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`relative px-6 py-2.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                active === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active === tab.key && (
                <motion.span
                  layoutId="pill"
                  className="absolute inset-0 bg-background rounded-full shadow-sm border border-border"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-28"
        >
          {current.cards.map((card, i) => (
            <motion.div
              key={card.heading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`grid gap-12 lg:gap-20 items-center ${
                card.image
                  ? card.imageRight
                    ? "md:grid-cols-2"
                    : "md:grid-cols-2 md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1"
                  : "md:grid-cols-1 max-w-2xl"
              }`}
            >
              {/* Text */}
              <div>
                <h3 className="text-4xl sm:text-[2.6rem] font-bold text-foreground tracking-tight leading-[1.08] whitespace-pre-line">
                  {card.heading}
                </h3>

                <ul className="mt-8 space-y-6">
                  {card.bullets.map((b) => (
                    <li key={b.text} className="flex items-start gap-5">
                      <span className="mt-0.5 shrink-0 text-primary">
                        <b.Svg />
                      </span>
                      <span className="text-[15px] text-foreground/75 leading-relaxed">
                        {b.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <Visual card={card} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

    </section>
  );
}
