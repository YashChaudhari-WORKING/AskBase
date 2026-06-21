import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-32">

        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Contact</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.07] mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-[16px] text-foreground/60 mb-12">
          Sales questions, partnership inquiries, or just want to see a live demo — reach out and we reply within one business day.
        </p>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest block mb-2">First name</label>
              <input
                type="text"
                placeholder="Jan"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest block mb-2">Last name</label>
              <input
                type="text"
                placeholder="Novak"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest block mb-2">Work email</label>
            <input
              type="email"
              placeholder="jan@company.com"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest block mb-2">Company</label>
            <input
              type="text"
              placeholder="Acme Corp"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest block mb-2">How can we help?</label>
            <textarea
              rows={5}
              placeholder="Tell us what you're building or what you need..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors">
            Send message
          </button>
        </div>

        <div className="mt-14 pt-10 border-t border-border">
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-widest mb-5">Or reach us directly</p>
          <div className="space-y-3">
            {[
              { label: "General", value: "hello@askbase.io" },
              { label: "Sales", value: "sales@askbase.io" },
              { label: "Support", value: "support@askbase.io" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-16">{label}</span>
                <a href={`mailto:${value}`} className="text-sm text-foreground hover:text-primary transition-colors">{value}</a>
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
