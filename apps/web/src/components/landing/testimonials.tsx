"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "AskBase cut our first-response time from 4 hours to under 5 seconds. Our support team now focuses entirely on edge cases — the AI handles everything else.",
    name: "Priya Mehta",
    role: "Head of Support, CloudFlow",
    initials: "PM",
    featured: true,
  },
  {
    quote:
      "The flow builder is exceptional. We went from scattered Intercom flows to a unified, maintainable architecture in a single afternoon.",
    name: "Marcus Chen",
    role: "CTO, Arweave Studio",
    initials: "MC",
    featured: false,
  },
  {
    quote:
      "The knowledge base sync is seamless — our docs update, the AI updates. Zero manual work across 3 product lines.",
    name: "Lena Fischer",
    role: "VP Product, Dataplex",
    initials: "LF",
    featured: false,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-3xl font-bold text-foreground">
          Trusted by founders on the frontier
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Conversations with leaders shaping the future of support, powered by AskBase.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map(({ quote, name, role, initials, featured }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.09 }}
            className={featured ? "md:row-span-1" : ""}
          >
            <Card className={`p-6 rounded-2xl flex flex-col gap-4 h-full ${featured ? "bg-muted/30" : ""}`}>
              {/* Avatar area — styled like a photo card */}
              <div className={`rounded-xl flex items-center justify-center ${featured ? "h-32 bg-muted" : "h-20 bg-muted/50"}`}>
                <Avatar className={featured ? "size-16" : "size-12"}>
                  <AvatarFallback className="text-base font-bold">{initials}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
