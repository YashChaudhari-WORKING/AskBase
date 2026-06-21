"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Code, CreditCard, Stethoscope, GraduationCap, Building2 } from "lucide-react";

const useCases = [
  {
    icon: ShoppingBag,
    industry: "E-commerce & Retail",
    headline: "Resolve order & returns questions instantly",
    description:
      "Customers ask the same order-status, return-policy, and shipping questions thousands of times a day. AskBase answers all of them from your policy docs — before your team even opens their inbox.",
    examples: ["Where is my order?", "How do I start a return?", "What's your refund policy?", "Do you ship internationally?"],
  },
  {
    icon: Code,
    headline: "Deflect L1 tickets before they reach engineering",
    industry: "SaaS & Developer Tools",
    description:
      "Onboarding questions, API errors, billing confusion — AskBase answers them from your docs and changelogs in real-time, freeing engineers for actual engineering.",
    examples: ["How do I set up webhooks?", "Why is my API key invalid?", "How do I upgrade my plan?", "Where are the rate limits?"],
  },
  {
    icon: CreditCard,
    headline: "Compliance-safe support at global scale",
    industry: "Fintech & Payments",
    description:
      "AskBase answers from your vetted, approved content only — no hallucinations, full source citations. Run it across 40+ countries without worrying about inconsistent or non-compliant answers.",
    examples: ["How do I link my bank account?", "Why was my transaction declined?", "How long do transfers take?", "Is my data secure?"],
  },
  {
    icon: Stethoscope,
    headline: "Patient-facing support that's always accurate",
    industry: "Healthcare",
    description:
      "Answer appointment, insurance, and billing questions from your approved FAQs. AskBase never guesses — it only answers from content you've verified and uploaded.",
    examples: ["How do I reschedule?", "What insurance do you accept?", "How do I access my records?", "What are your hours?"],
  },
  {
    icon: GraduationCap,
    headline: "24/7 student support without 24/7 staff",
    industry: "Education",
    description:
      "Students ask about enrollment, deadlines, course requirements, and financial aid at all hours. AskBase handles the entire FAQ layer so your advisors focus on real counseling.",
    examples: ["When is the enrollment deadline?", "How do I apply for aid?", "What are the course requirements?", "How do I drop a class?"],
  },
  {
    icon: Building2,
    headline: "Enterprise support that scales without headcount",
    industry: "Enterprise",
    description:
      "Deploy AskBase across multiple product lines, departments, or brands from a single dashboard. Each gets its own knowledge base, flows, and widget — all managed centrally.",
    examples: ["HR policy questions", "IT helpdesk first response", "Procurement & vendor FAQs", "Multi-brand deployments"],
  },
];

export function WhereSection() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          Industries
        </p>
        <h2 className="text-4xl font-bold text-foreground tracking-tight leading-tight">
          Built for every team
          <br />that has customers.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          If your customers ask questions, AskBase can answer them — from your verified
          content, in your voice, on your website.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {useCases.map(({ icon: Icon, industry, headline, description, examples }, i) => (
          <motion.div
            key={industry}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Card className="p-5 rounded-2xl flex flex-col gap-4 h-full">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-7 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{industry}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug mb-2">{headline}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
                  Questions it handles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {examples.map((ex) => (
                    <Badge
                      key={ex}
                      variant="secondary"
                      className="text-[10px] font-normal rounded-full py-0.5"
                    >
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
