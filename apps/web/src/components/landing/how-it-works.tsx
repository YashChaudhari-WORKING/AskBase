"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, GitBranch, Code2, BarChart3 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Connect your knowledge",
    summary: "Upload once. Stay current automatically.",
    detail:
      "AskBase ingests PDFs, Word docs, help center articles, and any URL. It chunks the content, embeds it into a vector database, and re-syncs whenever your source changes. Your AI is always answering from the latest version of your docs.",
    bullets: [
      "PDF, DOCX, TXT, Markdown, CSV",
      "Live URL crawling & re-indexing",
      "Automatic deduplication",
      "Source citations in every answer",
    ],
    visual: (
      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
        {[
          { name: "product-guide.pdf", size: "2.4 MB", status: "Indexed" },
          { name: "billing-faq.md", size: "38 KB", status: "Indexed" },
          { name: "https://docs.yoursite.com", size: "142 pages", status: "Syncing…" },
          { name: "onboarding-flow.docx", size: "890 KB", status: "Indexed" },
        ].map(({ name, size, status }) => (
          <div key={name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <div>
              <p className="text-foreground font-medium">{name}</p>
              <p className="text-muted-foreground">{size}</p>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] rounded-full ${
                status === "Indexed"
                  ? "text-green-600 border-green-500/30"
                  : "text-yellow-600 border-yellow-500/30"
              }`}
            >
              {status}
            </Badge>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: "02",
    icon: GitBranch,
    title: "Describe it — AI pre-fills the rest",
    summary: "One sentence. Your assistant is configured.",
    detail:
      "Type what your assistant should do. AskBase uses AI to generate a name, system prompt, tone, and welcome message automatically. Pick your type — AI Agent for Q&A, Flow for automation, Hybrid for both. Then build your flow visually: add Google Sheets nodes, webhooks, conditional branches, and multi-step question sequences.",
    bullets: [
      "AI generates name, system prompt & tone from your description",
      "Three types: AI Agent, Flow, Hybrid",
      "Google Sheets node — write rows on flow completion",
      "Webhook node — POST to any URL instantly",
    ],
    visual: (
      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { label: "Start", color: "bg-primary/10 text-primary border-primary/20" },
            { label: "→", plain: true },
            { label: "Detect intent", color: "bg-card text-foreground border-border" },
            { label: "→", plain: true },
            { label: "Order question?", color: "bg-card text-foreground border-border" },
          ].map(({ label, color, plain }, i) =>
            plain ? (
              <span key={i} className="text-muted-foreground">{label}</span>
            ) : (
              <Badge key={i} variant="outline" className={`rounded-lg px-2.5 py-1 text-xs ${color}`}>
                {label}
              </Badge>
            )
          )}
        </div>
        <div className="mt-3 ml-6 border-l-2 border-border pl-4 space-y-2 text-xs">
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-green-600 border-green-500/30">Yes → Save to Google Sheets + Webhook</Badge>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-yellow-600 border-yellow-500/30">No → Answer from KB → End</Badge>
          </div>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    icon: Code2,
    title: "Deploy in 60 seconds",
    summary: "One script tag. Any website.",
    detail:
      "Copy a single `<script>` tag into your HTML. The fully branded chat widget appears instantly — no framework required, no build step, no backend to configure. Works on Webflow, WordPress, Shopify, React, or plain HTML.",
    bullets: [
      "No framework dependency",
      "Custom brand colors & name",
      "Mobile-responsive out of the box",
      "Works on any domain",
    ],
    visual: (
      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs text-muted-foreground">
        <p className="text-green-500 mb-1">{"<!-- Add to your <head> -->"}</p>
        <p>
          <span className="text-primary">{"<script"}</span>
          {" "}
          <span className="text-foreground">src</span>
          <span className="text-muted-foreground">{"=\""}</span>
          <span className="text-yellow-500">{"https://cdn.askbase.ai/widget.js"}</span>
          <span className="text-muted-foreground">{"\" "}</span>
        </p>
        <p className="pl-4">
          <span className="text-foreground">data-bot-id</span>
          <span className="text-muted-foreground">{"=\""}</span>
          <span className="text-yellow-500">bot_abc123</span>
          <span className="text-muted-foreground">{"\" "}</span>
        </p>
        <p>
          <span className="text-primary">{">"}</span>
          <span className="text-primary">{"</script>"}</span>
        </p>
        <p className="mt-3 text-green-500 text-[10px]">✓ Widget is live · 847 users online</p>
      </div>
    ),
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Monitor & improve",
    summary: "See exactly where your AI wins — and where it doesn't.",
    detail:
      "The analytics dashboard shows resolution rates, unanswered questions, handoff reasons, and response times — by flow, by channel, by time. Use the Live Console to watch conversations in real-time and retrain with one click.",
    bullets: [
      "Resolution rate per flow & channel",
      "Unanswered question reports",
      "Human handoff triggers & reasons",
      "One-click retraining from failed answers",
    ],
    visual: (
      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-xs">
        {[
          { label: "Resolution rate", value: "98.2%", bar: 98, color: "bg-green-500" },
          { label: "Avg. response time", value: "1.4s", bar: 80, color: "bg-primary" },
          { label: "Human handoff rate", value: "1.8%", bar: 2, color: "bg-yellow-500" },
        ].map(({ label, value, bar, color }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground font-semibold">{value}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${bar}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-12 text-center"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          How it works
        </p>
        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
          From zero to live
          <br />in 60 seconds.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          No engineering. No configuration forms. Four steps from your first
          doc to a fully deployed, source-cited assistant on your site.
        </p>
      </motion.div>

      <div className="space-y-5">
        {steps.map(({ step, icon: Icon, title, summary, detail, bullets, visual }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
          >
            <Card className="rounded-2xl p-6 grid md:grid-cols-2 gap-8">
              {/* Left — explanation */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-muted-foreground tracking-widest">{step}</span>
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="size-4 text-foreground" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground mb-3 font-medium">{summary}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{detail}</p>

                <ul className="space-y-2 mt-auto">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-1 rounded-full bg-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — visual */}
              <div className="flex flex-col justify-center">{visual}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
