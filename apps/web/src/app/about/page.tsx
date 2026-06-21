import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32">

        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">About</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.07] mb-6">
          We built the thing<br />
          <span className="text-muted-foreground font-normal">we kept being asked to build.</span>
        </h1>

        <div className="space-y-6 text-[16px] text-foreground/70 leading-relaxed">
          <p>
            AskBase started with a single frustration: every AI chatbot builder we tried required a developer, a three-week setup, and a six-figure contract. Meanwhile, the people who actually knew the product — support leads, marketing managers, operations teams — were locked out.
          </p>
          <p>
            We built AskBase so that the person who knows the product best is also the person who deploys the AI. One sentence describes what your assistant should do. The platform writes the config. One script tag puts it live. No tickets. No sprints. No waiting.
          </p>
          <p>
            Under the hood, AskBase uses hybrid vector and keyword search with a reranker to make sure every answer comes from your actual documents — not from the model guessing. When the AI isn't confident, it says so and routes to a human. We call it knowledge-grounded support.
          </p>
          <p>
            We are a small team. We move fast, we ship often, and we care obsessively about the person trying to help their customer in under two seconds.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-6">
          {[
            { stat: "100", label: "Conversations free, every day" },
            { stat: "60s", label: "From sentence to live widget" },
            { stat: "0", label: "Engineers required to deploy" },
          ].map(({ stat, label }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-6">
              <p className="text-4xl font-bold text-foreground mb-1">{stat}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}
