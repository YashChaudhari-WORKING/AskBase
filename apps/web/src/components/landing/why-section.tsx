"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

const rows = [
  {
    label: "Response time",
    without: "Hours or next business day",
    with: "Under 2 seconds, every time",
  },
  {
    label: "Availability",
    without: "Business hours only",
    with: "24/7 — no shifts, no holidays",
  },
  {
    label: "Answer accuracy",
    without: "Depends on the agent",
    with: "Grounded in your docs. Source-cited.",
  },
  {
    label: "Lead capture",
    without: "Missed after hours",
    with: "Flows save leads to Google Sheets automatically",
  },
  {
    label: "Integrations",
    without: "Dev work required per system",
    with: "Webhook node fires to any URL — CRM, Slack, Notion",
  },
  {
    label: "Setup time",
    without: "Weeks of configuration",
    with: "Live in under 60 seconds",
  },
  {
    label: "Hallucinations",
    without: "Risk of wrong answers",
    with: "None — AI only answers from your uploaded content",
  },
  {
    label: "Price to start",
    without: "Enterprise contract or paid trial",
    with: "Free forever. 100 conversations/day. No card.",
  },
];

export function WhySection() {
  const last = rows.length - 1;

  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-12 text-center"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Why AskBase
        </p>
        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
          What changes when
          <br />You use AskBase.
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Flat 3-col grid — cells at the same row index share height automatically */}
        <div className="grid grid-cols-[160px_1fr_1fr] items-stretch">

          {/* ── Header ── */}
          <div className="pb-4" />
          <div className="pb-4 px-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Traditional support
            </span>
          </div>
          <div className="pb-4 px-5">
            <span className="text-base font-bold text-foreground tracking-tight">
              Ask<span className="text-primary">Base</span>
            </span>
          </div>

          {/* ── Data rows ── */}
          {rows.map(({ label, without, with: solution }, i) => (
            <>
              {/* Label */}
              <div
                key={`l-${i}`}
                className={`py-3.5 pr-4 flex items-center ${i !== last ? "border-b border-border" : ""}`}
              >
                <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">
                  {label}
                </span>
              </div>

              {/* Without */}
              <div
                key={`w-${i}`}
                className={`py-3.5 px-4 flex items-center ${i !== last ? "border-b border-border" : ""}`}
              >
                <span className="text-sm text-muted-foreground">
                  {without}
                </span>
              </div>

              {/* With AskBase — unified card column */}
              <div
                key={`a-${i}`}
                className={[
                  "py-3.5 px-5 flex items-center bg-card border-x border-border",
                  i === 0    ? "border-t rounded-tl-2xl rounded-tr-2xl" : "",
                  i === last ? "border-b rounded-bl-2xl rounded-br-2xl" : "border-b border-border/50",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center size-[18px] rounded-full bg-green-500 shrink-0">
                    <Check className="size-2.5 text-white stroke-[3]" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {solution}
                  </span>
                </div>
              </div>
            </>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
