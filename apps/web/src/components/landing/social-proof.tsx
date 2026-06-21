"use client";

import { motion } from "motion/react";
import { MessageCircle, ClipboardList, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    icon: Zap,
    title: "Hybrid — AI + Flow",
    description: "Answers questions from your docs AND runs automation flows. One assistant that knows when to talk and when to act — switches automatically based on intent.",
    tag: "Most powerful",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    hoverBorder: "hover:border-violet-500/50",
    tagClass: "bg-violet-500/10 text-violet-500",
    arrowColor: "text-violet-500",
  },
  {
    icon: MessageCircle,
    title: "AI Agent",
    description: "Upload your docs, FAQs, and help articles. Your assistant reads everything and answers every question from it — source-cited, confidence-scored, 24/7. Hands off to a human when it's not confident.",
    tag: null,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    hoverBorder: "hover:border-blue-500/40",
    tagClass: "",
    arrowColor: "text-blue-500",
  },
  {
    icon: ClipboardList,
    title: "Flow",
    description: "Ask questions in sequence. Save answers to Google Sheets. Fire webhooks to your CRM or Slack. Branch on responses. No AI tokens consumed — pure scripted automation that runs itself.",
    tag: null,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/40",
    tagClass: "",
    arrowColor: "text-emerald-500",
  },
];

export function SocialProof() {
  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Three assistant types
        </p>
        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
          Pick what your
          <br />assistant does.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
          Choose a type — or combine them. You can switch anytime from the settings tab.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {options.map(({ icon: Icon, title, description, tag, iconBg, iconColor, hoverBorder, tagClass, arrowColor }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className={cn(
              "group flex items-center gap-5 px-5 py-4 rounded-2xl border border-border bg-card cursor-pointer transition-all duration-200 hover:shadow-sm",
              hoverBorder
            )}
          >
            <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
              <Icon className={cn("size-5", iconColor)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-foreground">{title}</span>
                {tag && (
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", tagClass)}>
                    {tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>

            <ArrowRight className={cn("size-4 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200", arrowColor)} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
