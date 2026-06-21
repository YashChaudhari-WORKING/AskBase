"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="pt-36 pb-0 px-6 max-w-7xl mx-auto">

      {/* Hero text — left aligned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl"
      >
        <Badge
          variant="outline"
          className="mb-7 gap-2 text-xs font-normal py-1.5 px-4 rounded-full border-border text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-green-500 inline-block" />
          Free forever · 100 conversations/day · No credit card
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-[64px] font-bold tracking-[-0.03em] leading-[1.04] text-foreground">
          From your docs
          <br />
          To a live AI assistant.
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
          Type what your assistant should do. AskBase writes the system prompt,
          reads your docs, and hands you an embed code.
          Paste it once — your customers get answers from your content, not guesswork.
          Free. No card. No engineers.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Button
            className="h-10 px-6 text-sm font-semibold gap-2 rounded-lg shadow-sm"
            asChild
          >
            <Link href="/register">
              Start building free
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-10 px-6 text-sm font-medium rounded-lg"
            asChild
          >
            <Link href="/dashboard">Explore the product</Link>
          </Button>
        </div>
      </motion.div>

      {/* Full-width product screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 44 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/10">
          {/* Browser chrome */}
          <div className="flex items-center gap-2.5 px-4 h-10 border-b border-border bg-muted/40 shrink-0">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-destructive/40" />
              <div className="size-2.5 rounded-full bg-yellow-400/40" />
              <div className="size-2.5 rounded-full bg-green-400/40" />
            </div>
            <div className="flex-1 max-w-xs mx-auto">
              <div className="bg-background border border-border rounded-md px-3 py-0.5 text-[11px] text-muted-foreground text-center tracking-tight">
                app.askbase.ai
              </div>
            </div>
          </div>

          {/* Real dashboard screenshot */}
          <Image
            src="/assets/homepage/dashboard.png"
            alt="AskBase dashboard — conversations, analytics, and assistant management"
            width={1400}
            height={900}
            className="w-full h-auto block"
            priority
          />
        </div>
      </motion.div>
    </section>
  );
}
