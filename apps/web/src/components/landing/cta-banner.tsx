"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center py-24 px-6 border-t border-border"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">
          Your first assistant
          <br />
          is free. Always.
        </h2>

        <p className="mt-5 text-base text-muted-foreground max-w-sm mx-auto">
          Not a trial. Not 14 days. 100 conversations every day —
          no card, no watermark, no catch.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button className="rounded-lg h-10 px-7 text-sm font-semibold gap-2" asChild>
            <Link href="/register">
              Start building free
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button variant="outline" className="rounded-lg h-10 px-7 text-sm font-medium" asChild>
            <Link href="/dashboard">Explore the product</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
