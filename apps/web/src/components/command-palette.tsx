"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommandItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  hint?: string;
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: -28, scale: 0.9, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 26,
      mass: 0.85,
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.95, filter: "blur(4px)",
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 420, damping: 30 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 32,
      delay: 0.18 + i * 0.025,
    },
  }),
};

export function CommandPalette({ open, onClose, items }: {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const [firstRender, setFirstRender] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => { setIdx(0); }, [query, open]);
  useEffect(() => {
    if (!open) { setQuery(""); setFirstRender(true); }
  }, [open]);
  useEffect(() => { if (query) setFirstRender(false); }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")    { e.preventDefault(); onClose(); }
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[idx];
        if (item) { router.push(item.href); onClose(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, idx, router, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" } as any}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" } as any}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" } as any}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-foreground/25 flex items-start justify-center pt-[14vh] px-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden origin-top"
          >
            <motion.div
              variants={sectionVariants}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-border"
            >
              <Search className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, settings..."
                className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="text-[11px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">esc</kbd>
            </motion.div>

            <motion.div
              ref={listRef}
              variants={sectionVariants}
              className="max-h-[340px] overflow-y-auto p-2"
            >
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No results for &ldquo;{query}&rdquo;
                </motion.div>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  const selected = i === idx;
                  return (
                    <motion.button
                      key={item.href}
                      data-idx={i}
                      custom={i}
                      variants={firstRender ? itemVariants : undefined}
                      initial={firstRender ? "hidden" : false}
                      animate={firstRender ? "visible" : { opacity: 1, x: 0 }}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => { router.push(item.href); onClose(); }}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors",
                        selected ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-[18px] h-[18px] flex-shrink-0",
                        selected ? "text-foreground" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-[14px] font-medium flex-1",
                        selected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="text-[11px] text-muted-foreground">{item.hint}</span>
                      )}
                      {selected && (
                        <motion.span
                          layoutId="cmd-enter-hint"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        >
                          <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </motion.div>

            <motion.div
              variants={sectionVariants}
              className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/40"
            >
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background border border-border rounded px-1 py-0.5">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background border border-border rounded px-1 py-0.5">↵</kbd>
                  select
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{filtered.length} results</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
