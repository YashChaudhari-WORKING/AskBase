"use client"

import { cn } from "@/lib/utils"

interface ToneCardProps {
  value: string
  icon: string
  label: string
  selected: boolean
  onClick: () => void
  compact?: boolean
}

export function ToneCard({ icon, label, selected, onClick, compact }: ToneCardProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected
            ? "border-primary bg-primary/10 text-primary"
            : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <div
          className="w-3.5 h-3.5 shrink-0"
          style={{
            maskImage: `url(${icon})`,
            WebkitMaskImage: `url(${icon})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            backgroundColor: "currentColor",
          }}
        />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3.5 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <div
        className="w-[22px] h-[22px] shrink-0 transition-all"
        style={{
          maskImage: `url(${icon})`,
          WebkitMaskImage: `url(${icon})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          backgroundColor: "currentColor",
        }}
      />
      <span className="text-xs font-medium leading-none">{label}</span>
    </button>
  )
}
