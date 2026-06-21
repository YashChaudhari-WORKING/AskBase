"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individuals getting started with AI support.",
    cta: "Get started",
    href: "/register",
    features: ["500 messages / month", "1 AI assistant", "50-page knowledge base", "1 widget", "Community support"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For growing teams that need power and control.",
    cta: "Start free trial",
    href: "/register",
    features: ["10,000 messages / month", "5 AI assistants", "Unlimited knowledge base", "5 widgets", "Flow builder", "Advanced analytics", "Priority support"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with enterprise requirements.",
    cta: "Contact sales",
    href: "/register",
    features: ["Unlimited messages", "Unlimited assistants", "Custom integrations", "SSO & RBAC", "99.9% SLA", "Dedicated success manager"],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-3xl font-bold text-foreground">Simple, transparent pricing</h2>
        <p className="mt-2 text-sm text-muted-foreground">Start free. Scale when you&apos;re ready.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 items-start">
        {plans.map(({ name, price, period, description, cta, href, features, highlight }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className={cn("rounded-2xl p-6 flex flex-col gap-5", highlight && "ring-1 ring-border")}>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-foreground">{price}</span>
                  {period && <span className="text-sm text-muted-foreground mb-0.5">{period}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>

              <Button
                variant={highlight ? "default" : "outline"}
                size="sm"
                className="w-full rounded-full"
                asChild
              >
                <Link href={href}>{cta}</Link>
              </Button>

              <Separator />

              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
