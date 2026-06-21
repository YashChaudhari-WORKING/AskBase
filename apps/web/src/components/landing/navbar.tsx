"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignalLogo } from "@/components/signal-animation";

const navLinks = [
  { label: "Products", href: "#features" },
  { label: "Industries", href: "#industries" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Company", href: "#" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <SignalLogo size={36} />
          <span className="font-bold text-xl tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
            AskBase
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-4 py-2 text-[15px] font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-5 text-[15px] font-medium text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/login">Log in</Link>
          </Button>

          <Button
            size="sm"
            className="h-10 px-6 text-[15px] font-semibold gap-2 rounded-lg"
            asChild
          >
            <Link href="/register">
              Get started
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-border bg-background/98 backdrop-blur-xl"
          >
            <div className="px-6 pt-4 pb-2 space-y-0.5">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="px-6 pb-5 pt-3 flex flex-col gap-2 border-t border-border mt-2">
              <Button variant="outline" size="sm" asChild className="w-full h-10 font-medium">
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild className="w-full h-10 font-semibold gap-1.5">
                <Link href="/register">
                  Get started
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
