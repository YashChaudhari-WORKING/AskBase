"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Describe it in one sentence. AI writes the rest.",
    body: "Type what your assistant should do. AskBase generates the name, system prompt, tone, welcome message, and quick links. You review. You deploy.",
    span: "col-span-2",
    badge: null,
  },
  {
    title: "No step 1 of 5.",
    body: "There is no step counter. There is no required field. You can deploy the moment the assistant looks right — not when a wizard says you're done.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "See it live as you build.",
    body: "The widget preview updates on every keystroke. Change the name — widget header changes. Pick a color — button color changes. Change the tone — welcome message rewrites itself. No save. No refresh.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "One <script> tag.",
    body: "Paste it before </body>. That's the entire installation. No npm. No SDK. No configuration file.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Upload a PDF.",
    body: "Your assistant reads it. All of it. Answers from it. References it.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Paste a URL.",
    body: "Your assistant reads the page and answers from it like it wrote the content itself.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Answers that show their work.",
    body: "Every response shows which document it came from. Your customers see confidence. Your team sees exactly what the AI used.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Knows when it doesn't know.",
    body: "If the AI isn't confident, it doesn't guess. It says so and connects the customer to a human. You control how strict that is — Relaxed, Balanced, or Strict.",
    span: "col-span-2",
    badge: null,
  },
  {
    title: "Google Sheets node.",
    body: "When a visitor completes your flow, a new row writes itself to your spreadsheet. Name, email, company, answers — whatever you collected. Automatic. No Zapier. No middleware.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Webhook node.",
    body: "Fire an HTTP POST to any URL the moment a flow ends. Your CRM, your Slack, your backend — it receives the full payload instantly.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "If this, then that.",
    body: 'A visitor says "I\'m interested in enterprise." Flow goes one way. They say "Just browsing." It goes another. Conditional branches mean every conversation routes itself.',
    span: "col-span-1",
    badge: null,
  },
  {
    title: "One sentence to trigger a flow.",
    body: 'Write one line — "Start the booking flow when the user wants to schedule a demo." That\'s the entire condition. The AI reads every message and decides when that moment is.',
    span: "col-span-2",
    badge: null,
  },
  {
    title: "Handoff queue.",
    body: "When a human needs to step in, the conversation appears in your Live Console. No email. No notification lag. The transcript is already there.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "5 color presets. Or pick your own.",
    body: "Indigo, sky blue, emerald, amber, red. Or paste a hex code. Your brand, your widget.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Tone cards.",
    body: "Friendly. Formal. Technical. Concise. Pick one. The welcome message rewrites itself to match. The system prompt adjusts. Four clicks, not a paragraph to write.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Response time text.",
    body: "That small line under the widget heading — \"We typically reply in under 10 minutes\" — is yours to write. Or remove. One field.",
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Quick links on the widget home.",
    body: '"Help docs ↗" "Pricing ↗" "Getting Started ↗" — short URLs on the widget home screen. Customers click. New tab opens. Zero friction.',
    span: "col-span-1",
    badge: null,
  },
  {
    title: "Top unanswered questions.",
    body: "The metric that tells you what to do next. Not how many chats happened — what your assistant couldn't answer. Add those docs. Close the gap.",
    span: "col-span-1",
    badge: "Coming soon",
  },
  {
    title: "100 conversations a day. Free.",
    body: "No credit card. No trial. No watermark. No \"upgrade to remove branding.\" One limit. Everything else is yours.",
    span: "col-span-3",
    badge: null,
    highlight: true,
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
          Every feature
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.08]">
          Everything that makes it
          <br />
          <span className="text-muted-foreground font-normal">feel real.</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-lg">
          Not a list of big promises. Every small thing — each one an aha moment on its own.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {features.map(({ title, body, span, badge, highlight }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
            className={`
              ${span === "col-span-2" ? "sm:col-span-2" : ""}
              ${span === "col-span-3" ? "sm:col-span-2 lg:col-span-3" : ""}
              ${highlight
                ? "bg-foreground text-background rounded-2xl p-6 flex flex-col justify-between"
                : "bg-card border border-border rounded-2xl p-6 flex flex-col justify-between"
              }
            `}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className={`text-base font-semibold leading-snug ${highlight ? "text-background" : "text-foreground"}`}>
                  {title}
                </p>
                {badge && (
                  <Badge variant="secondary" className="text-[10px] rounded-full shrink-0 mt-0.5">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${highlight ? "text-background/70" : "text-muted-foreground"}`}>
                {body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
