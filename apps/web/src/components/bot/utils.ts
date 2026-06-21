import type { Bot } from "./types"

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "just now"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "just now"
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function typeBadgeLabel(type: Bot["assistantType"]) {
  if (type === "flow") return "Flow"
  return "AI Agent"
}

export function getSetupHints(bot: Bot): { kbHint: string; flowHint: string } {
  // Try AI-generated hints stored during onboarding install
  try {
    const stored = sessionStorage.getItem(`askbase_setup_hints_${bot.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.kbHint && parsed?.flowHint) {
        return { kbHint: parsed.kbHint, flowHint: parsed.flowHint };
      }
    }
  } catch {}

  // Fallback: derive from system prompt keywords
  const p = (bot.systemPrompt ?? "").toLowerCase();
  const n = bot.name;

  let kbHint = `Upload FAQs, product pages, and help articles so ${n} can answer visitors accurately.`;
  if (p.includes("support") || p.includes("help desk") || p.includes("helpdesk")) {
    kbHint = `Upload your help articles, troubleshooting guides, and FAQs so ${n} can resolve issues without a human agent.`;
  } else if (p.includes("sales") || p.includes("pricing") || p.includes("product")) {
    kbHint = `Upload product pages, pricing sheets, and feature docs so ${n} can handle pre-sales questions and qualify leads.`;
  } else if (p.includes("onboard") || p.includes("getting started") || p.includes("tutorial")) {
    kbHint = `Upload your onboarding guides, quick-start docs, and how-to articles so ${n} helps new users get set up fast.`;
  } else if (p.includes("hr") || p.includes("employee") || p.includes("people ops")) {
    kbHint = `Upload your HR policies, employee handbook, and benefits info so ${n} handles common HR questions instantly.`;
  } else if (p.includes("legal") || p.includes("policy") || p.includes("compliance")) {
    kbHint = `Upload your policy docs, terms of service, and compliance guides so ${n} only surfaces approved information.`;
  }

  let flowHint = `Add a lead capture flow so visitors can book or enquire directly from the chat.`;
  if (p.includes("demo") || p.includes("trial")) {
    flowHint = `Add a "Book a Demo" flow — visitors can schedule a call from chat without leaving the page.`;
  } else if (p.includes("support") || p.includes("ticket") || p.includes("escalat")) {
    flowHint = `Add a "Contact Support" flow for issues the AI can't resolve — every request stays tracked.`;
  } else if (p.includes("quote") || p.includes("pricing")) {
    flowHint = `Add a "Request a Quote" flow so visitors ready to buy can submit their details in seconds.`;
  }

  return { kbHint, flowHint };
}
