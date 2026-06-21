"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

const DEFAULT_PRESETS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"]

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
  presets?: string[]
}

export function ColorSwatch({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: ColorSwatchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-2">
      {presets.map((color) => {
        const isSelected = value === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className={cn(
              "w-7 h-7 rounded-full cursor-pointer transition-all duration-150 focus-visible:outline-none",
              isSelected
                ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                : "hover:scale-105"
            )}
          />
        )
      })}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-7 h-7 rounded-full border-2 border-dashed border-border bg-card text-muted-foreground flex items-center justify-center text-sm cursor-pointer transition-all duration-150 hover:scale-105 focus-visible:outline-none"
      >
        +
      </button>

      <input
        ref={inputRef}
        type="color"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}
