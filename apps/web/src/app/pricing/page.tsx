import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Everything you need to get started. No credit card. No expiry.",
    features: [
      "100 conversations per day",
      "1 AI assistant",
      "PDF & URL knowledge base",
      "Hybrid search + reranker",
      "Embeddable widget",
      "Source citations",
      "Community support",
    ],
    cta: "Get started free",
    href: "/auth/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "€49",
    period: "per month",
    description: "For teams that need more volume, more assistants, and priority support.",
    features: [
      "5,000 conversations per month",
      "5 AI assistants",
      "Everything in Free",
      "Flows — visual conversation builder",
      "Live Console — real-time handoff queue",
      "Google Sheets & webhook nodes",
      "Conditional branches",
      "Email support",
    ],
    cta: "Start Pro trial",
    href: "/auth/register?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "€199",
    period: "per month",
    description: "For companies deploying AI support across multiple products or clients.",
    features: [
      "Unlimited conversations",
      "Unlimited assistants",
      "Everything in Pro",
      "Custom domain widget",
      "SSO / SAML",
      "Audit logs",
      "SLA guarantee",
      "Dedicated Slack channel",
    ],
    cta: "Contact us",
    href: "/contact",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-32">

        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.07] mb-4">
            Simple pricing.<br />
            <span className="text-muted-foreground font-normal">No surprises.</span>
          </h1>
          <p className="text-[16px] text-foreground/60 max-w-lg mx-auto">
            Start free and scale when you need to. Every plan includes the full feature set — no artificial limits on what you can build.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
            >
              <div className="mb-6">
                <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-3">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className={`mt-0.5 shrink-0 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`text-sm ${plan.highlight ? "text-primary-foreground/80" : "text-foreground/70"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          All prices in EUR. Billed monthly. Annual billing available at 20% off. Cancel any time.
        </p>

      </main>
      <Footer />
    </div>
  );
}
