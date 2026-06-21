"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const items = [
  {
    lottie: "/lottie-cubes.lottie",
    tag: "No developer needed",
    heading: "Your team ships it.",
    body: "Marketing deploys it. Support updates the docs. Engineering never needs to know it exists. No sprint, no ticket, no waiting.",
  },
  {
    lottie: "/lottie-extrude.lottie",
    tag: "Zero hallucinations",
    heading: "Every answer. Sourced.",
    body: "The AI only answers from what you upload. When it isn't confident it says so and routes to a human. It never invents an answer.",
  },
  {
    lottie: "/lottie-ladder.lottie",
    tag: "60-second setup",
    heading: "From sentence to live.",
    body: "Describe your assistant once. AI writes the config. One script tag deploys the widget. No onboarding call. No implementation sprint.",
  },
  {
    lottie: "/lottie-arrange.lottie",
    tag: "No credit card",
    heading: "Free. Not a trial.",
    body: "100 conversations every day. Free forever. No watermark, no 14-day window, no hidden upgrade prompt. One limit — nothing else.",
  },
];

export function IsometricSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-14"
      >
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
          Why AskBase
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.07]">
          Different by design.
          <br />
          <span className="text-muted-foreground font-normal">
            Not just another chatbot builder.
          </span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10 items-stretch">

        {/* Left 40% — Lottie animation */}
        <div
          className="overflow-hidden relative"
          style={{ minHeight: 420 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DotLottieReact
                src={items[active].lottie}
                autoplay
                loop={false}
                style={{
                  width: "100%",
                  height: "100%",
                  transform: "scale(1.2)",
                  filter: "sepia(3) hue-rotate(190deg) saturate(8) brightness(1.05)",
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right 40% — clickable points */}
        <div className="space-y-1 flex flex-col justify-center">
          {items.map((item, i) => {
            const isActive = active === i;
            return (
              <button
                key={item.heading}
                onClick={() => setActive(i)}
                className="w-full text-left"
              >
                <div className={`flex gap-5 px-5 py-5 rounded-2xl transition-colors duration-200 ${isActive ? "bg-card border border-border" : "hover:bg-muted/30"}`}>

                  {/* Indicator line */}
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <motion.div
                      className="w-[2px] rounded-full bg-primary"
                      animate={{ height: isActive ? 48 : 16 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground/50"}`}>
                      {item.tag}
                    </p>
                    <p className={`text-xl font-bold tracking-tight transition-colors duration-200 ${isActive ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {item.heading}
                    </p>

                    <AnimatePresence>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-[15px] text-foreground/70 leading-relaxed overflow-hidden"
                        >
                          {item.body}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
