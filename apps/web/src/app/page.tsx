import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AlternatingFeatures } from "@/components/landing/alternating-features";
import { IsometricSection } from "@/components/landing/isometric-section";
import { WhySection } from "@/components/landing/why-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";
import { AskBaseWidget } from "@/components/askbase-widget";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background antialiased scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <AlternatingFeatures />
        <IsometricSection />
        <WhySection />
        <CtaBanner />
      </main>
      <Footer />
      {/* Live AskBase concierge bot — the home page demos itself */}
      <AskBaseWidget />
    </div>
  );
}
