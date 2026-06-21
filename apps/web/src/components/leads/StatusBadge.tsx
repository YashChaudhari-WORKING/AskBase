"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { STATUS_CFG, ALL_STATUSES, type LeadStatus } from "./types";

interface Props {
  status: LeadStatus;
  onChange: (s: LeadStatus) => void;
}

export function StatusBadge({ status, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const cfg             = STATUS_CFG[status];

  function openDropdown(e: React.MouseEvent) {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
    setOpen(o => !o);
  }

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={openDropdown}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer select-none ${cfg.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
        {cfg.label}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[998]" onClick={e => { e.stopPropagation(); setOpen(false); }} />
          <div
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-[999] bg-popover border border-border rounded-xl shadow-2xl overflow-hidden min-w-[144px] p-1"
          >
            {ALL_STATUSES.map(s => {
              const c = STATUS_CFG[s];
              return (
                <button
                  key={s}
                  onClick={e => { e.stopPropagation(); onChange(s); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-accent ${s === status ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {c.label}
                  {s === status && <Check className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
