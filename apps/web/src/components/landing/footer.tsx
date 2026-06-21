"use client";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

export function Footer() {
  const svgRef = useRef<SVGTextElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <footer className="border-t border-border overflow-hidden bg-background">

      {/* Top links */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-12 flex flex-col sm:flex-row sm:items-start justify-between gap-10">
        <div className="space-y-4">
          {[
            { name: "Pricing", href: "/pricing" },
            { name: "About", href: "/about" },
            { name: "Contact", href: "/contact" },
          ].map(({ name, href }) => (
            <div key={name}>
              <Link href={href} className="text-xl font-semibold text-foreground/30 hover:text-foreground transition-colors duration-300 tracking-tight">
                {name}
              </Link>
            </div>
          ))}
        </div>
        <div className="space-y-4 sm:text-right">
          {[
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
            { name: "LinkedIn", href: "https://linkedin.com" },
            { name: "Twitter / X", href: "https://twitter.com" },
          ].map(({ name, href }) => (
            <div key={name}>
              <Link href={href} className="text-xl font-semibold text-foreground/30 hover:text-foreground transition-colors duration-300 tracking-tight">
                {name}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Brand watermark */}
      <div
        className="overflow-hidden select-none pointer-events-none w-full"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      >
        <svg
          viewBox="0 0 1400 220"
          width="110%"
          style={{ marginLeft: "-5%" }}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            ref={svgRef}
            x="50%" y="90%"
            textAnchor="middle"
            fontFamily="Inter, ui-sans-serif, sans-serif"
            fontWeight="900"
            fontSize="220"
            letterSpacing="-8"
          >
            <tspan fill="white" fillOpacity="0.06">Ask</tspan>
            <tspan
              style={{
                fill: inView ? "oklch(0.5774 0.2091 273.8504)" : "white",
                fillOpacity: inView ? 0.18 : 0.06,
                transition: "fill 1.8s ease, fill-opacity 1.8s ease",
              }}
            >Base</tspan>
          </text>
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-1.5 rounded-full bg-primary" />
          <span className="text-[13px] font-semibold text-foreground tracking-wide">AskBase</span>
          <span className="text-[12px] text-foreground/30 ml-1">© {new Date().getFullYear()} All Rights Reserved</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="https://linkedin.com" className="text-[12px] text-foreground/30 hover:text-foreground transition-colors tracking-wide">LinkedIn</Link>
          <Link href="https://twitter.com" className="text-[12px] text-foreground/30 hover:text-foreground transition-colors tracking-wide">X</Link>
        </div>
      </div>

    </footer>
  );
}
