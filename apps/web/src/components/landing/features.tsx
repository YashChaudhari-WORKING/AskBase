"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Circle, Zap, Brain } from "lucide-react";
import Link from "next/link";

function LearnMore({ href = "#" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-auto pt-5"
    >
      Learn more <ArrowRight className="size-3" />
    </Link>
  );
}

/* ── Visual mockups ─────────────────────────── */

function InboxMockup() {
  const rows = [
    { name: "Sarah M.", msg: "How do I reset my password?", ok: true, time: "2m" },
    { name: "James K.", msg: "Billing question about my plan", ok: true, time: "5m" },
    { name: "Alice R.", msg: "Order hasn't arrived", ok: false, time: "9m" },
    { name: "David L.", msg: "Can I get a refund?", ok: true, time: "14m" },
  ];
  return (
    <div className="rounded-xl border border-border overflow-hidden text-xs mt-4">
      {rows.map(({ name, msg, ok, time }, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 bg-card">
          <div className="size-6 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground shrink-0">
            {name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{name}</p>
            <p className="text-muted-foreground truncate">{msg}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-muted-foreground mb-0.5">{time} ago</p>
            {ok
              ? <CheckCircle className="size-3 text-green-500 ml-auto" />
              : <Circle className="size-3 text-yellow-500 ml-auto" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResolveMockup() {
  return (
    <div className="space-y-3 mt-4">
      <Card className="px-4 py-3 rounded-xl">
        <div className="flex items-start gap-2.5">
          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">U</div>
          <div>
            <p className="text-xs text-muted-foreground">Sarah M. · 2 min ago</p>
            <p className="text-xs text-foreground mt-0.5">How do I reset my password?</p>
          </div>
        </div>
      </Card>
      <Card className="px-4 py-3 rounded-xl border-primary/20">
        <div className="flex items-start gap-2.5">
          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="size-3 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary font-medium">AskBase AI · 1.2s</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Go to <span className="text-foreground">Settings → Security → Reset password</span>. You&apos;ll receive an email within 2 minutes. Let me know if you need help!
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5">Source: password-reset-guide.pdf · p.4</p>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-2 text-[10px] text-green-600">
        <CheckCircle className="size-3" />
        Resolved without human intervention
      </div>
    </div>
  );
}

function FlowMockup() {
  return (
    <div className="mt-4 space-y-2 text-xs">
      {[
        { label: "User opens chat", type: "start" },
        { label: "Collect name + email", type: "ai" },
        { label: "Interested in a demo?", type: "branch" },
        { label: "→ Yes  Save to Google Sheets + fire webhook", type: "yes" },
        { label: "→ No   Share docs link → End", type: "no" },
      ].map(({ label, type }, i) => (
        <div
          key={i}
          className={`px-3 py-2 rounded-lg border text-xs ${
            type === "start"
              ? "border-border bg-card text-foreground"
              : type === "ai"
              ? "border-primary/20 bg-primary/5 text-primary"
              : type === "branch"
              ? "border-border bg-muted/40 text-foreground font-medium"
              : type === "yes"
              ? "border-green-500/20 bg-green-500/5 text-green-600 ml-4"
              : "border-yellow-500/20 bg-yellow-500/5 text-yellow-600 ml-4"
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function KbMockup() {
  return (
    <div className="mt-4 space-y-2">
      {[
        { name: "product-guide.pdf", pages: "48 pages", chunks: "312 chunks", fresh: true },
        { name: "billing-faq.md", pages: "12 pages", chunks: "89 chunks", fresh: true },
        { name: "shipping-policy.docx", pages: "6 pages", chunks: "41 chunks", fresh: false },
        { name: "docs.yoursite.com", pages: "142 pages", chunks: "1,024 chunks", fresh: true },
      ].map(({ name, pages, chunks, fresh }) => (
        <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="size-3 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-foreground font-medium truncate">{name}</p>
              <p className="text-muted-foreground">{pages} · {chunks}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] rounded-full shrink-0 ml-2 ${fresh ? "text-green-600 border-green-500/30" : "text-yellow-600 border-yellow-500/30"}`}
          >
            {fresh ? "Live" : "Updating"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [65, 80, 55, 90, 72, 98, 88];
  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <p className="text-muted-foreground">Resolution rate</p>
          <p className="text-xl font-bold text-foreground">98.2%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg. response</p>
          <p className="text-xl font-bold text-foreground">1.4s</p>
        </div>
      </div>
      <div className="flex items-end gap-1 h-12">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/30 hover:bg-primary/60 transition-colors"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
      </div>
    </div>
  );
}

/* ── Bento layout ───────────────────────────── */

export function Features() {
  return (
    <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Features
        </p>
        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
          Every small thing
          <br />that actually matters.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          Not a list of big promises. Every feature that makes the product feel real — from
          source citations to Google Sheets rows written automatically.
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Card className="rounded-2xl p-6 flex flex-col min-h-[280px]">
            <h3 className="text-lg font-semibold text-foreground">Unified Inbox</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Every conversation across every channel — in one place. See at a glance what AI resolved, what&apos;s still pending, and what needs a human. No more tab-switching.
            </p>
            <InboxMockup />
            <LearnMore />
          </Card>

          <Card className="rounded-2xl p-6 flex flex-col min-h-[280px] bg-muted/20">
            <h3 className="text-lg font-semibold text-foreground">Source-cited AI answers</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Every answer includes a confidence score and the exact source doc it came from. No hallucinations — the AI only responds from content you uploaded. Sub-2-second, 24/7.
            </p>
            <ResolveMockup />
          </Card>
        </motion.div>

        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.07 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Card className="rounded-2xl p-6 flex flex-col min-h-[280px] bg-muted/20">
            <h3 className="text-lg font-semibold text-foreground">Visual flow builder</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Drag, connect, deploy. Each node does something real: ask a question, branch on the answer, write a row to Google Sheets, fire a webhook to your CRM or Slack, or hand off to a human. No code.
            </p>
            <FlowMockup />
            <LearnMore />
          </Card>

          <Card className="rounded-2xl p-6 flex flex-col min-h-[280px]">
            <h3 className="text-lg font-semibold text-foreground">Upload anything. It reads everything.</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              PDF, DOCX, TXT, or paste a URL — your assistant reads it all, chunks it, embeds it, and answers from it. Paste a URL and it reads the live page. Every answer shows exactly which doc it came from.
            </p>
            <KbMockup />
            <LearnMore />
          </Card>
        </motion.div>

        {/* Row 3 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Card className="rounded-2xl p-6 flex flex-col min-h-[240px]">
            <h3 className="text-lg font-semibold text-foreground">Analytics that tell you what to fix</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Resolution rate, response times, handoff triggers — and the metric that actually matters: <span className="text-foreground font-medium">top unanswered questions</span>. It tells you exactly what to add to your knowledge base next.
            </p>
            <AnalyticsMockup />
          </Card>

          <Card className="rounded-2xl p-6 flex flex-col min-h-[240px] bg-muted/20">
            <h3 className="text-lg font-semibold text-foreground">Handoff that doesn't waste the customer</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Set how cautious your AI should be — Relaxed, Balanced, or Strict. When a human steps in, the full transcript is already loaded. No repeating themselves. No lost context.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              {[
                { user: "Sarah M.", status: "AI handling", dot: "bg-green-500" },
                { user: "James K.", status: "AI handling", dot: "bg-green-500" },
                { user: "Alice R.", status: "Waiting for human", dot: "bg-yellow-500" },
                { user: "David L.", status: "Resolved", dot: "bg-muted-foreground" },
              ].map(({ user, status, dot }) => (
                <div key={user} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
                  <span className={`size-1.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-foreground font-medium flex-1">{user}</span>
                  <span className="text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
            <LearnMore />
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
