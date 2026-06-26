"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, Maximize2, Minimize2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

const MIN_W = 380
const MIN_H = 320
const MARGIN = 16

type Rect = { x: number; y: number; w: number; h: number }
type DragMode = "move" | "e" | "s" | "se" | "w" | "n"
type DragState = { mode: DragMode; sx: number; sy: number; orig: Rect } | null

interface Props {
  title: string
  subtitle?: string
  icon: React.ReactNode
  accent: string
  /** Bounds the panel is dragged/resized within (the canvas wrapper). */
  containerRef: React.RefObject<HTMLElement | null>
  onClose: () => void
  children: React.ReactNode
}

/**
 * A floating, draggable, freely-resizable panel that lives over the canvas.
 * Drag the header to move; drag any edge/corner to resize width and height.
 */
export function ResizablePanel({ title, subtitle, icon, accent, containerRef, onClose, children }: Props) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [maximized, setMaximized] = useState(false)
  const prevRect = useRef<Rect | null>(null)
  const drag = useRef<DragState>(null)

  // Initial size/position — top-right of the canvas.
  useEffect(() => {
    const c = containerRef.current
    const cw = c?.clientWidth ?? 1200
    const ch = c?.clientHeight ?? 700
    const w = Math.min(540, cw - MARGIN * 2)
    const h = Math.min(ch - MARGIN * 2, 640)
    setRect({ x: Math.max(MARGIN, cw - w - MARGIN), y: MARGIN, w, h })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = drag.current
    const c = containerRef.current
    if (!d || !c) return
    const cw = c.clientWidth
    const ch = c.clientHeight
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    const o = d.orig
    let { x, y, w, h } = o

    if (d.mode === "move") {
      x = Math.min(Math.max(MARGIN, o.x + dx), cw - o.w - MARGIN)
      y = Math.min(Math.max(MARGIN, o.y + dy), ch - o.h - MARGIN)
    }
    if (d.mode === "e" || d.mode === "se") w = Math.min(Math.max(MIN_W, o.w + dx), cw - o.x - MARGIN)
    if (d.mode === "s" || d.mode === "se") h = Math.min(Math.max(MIN_H, o.h + dy), ch - o.y - MARGIN)
    if (d.mode === "w") {
      const nw = Math.min(Math.max(MIN_W, o.w - dx), o.x + o.w - MARGIN)
      x = o.x + (o.w - nw)
      w = nw
    }
    if (d.mode === "n") {
      const nh = Math.min(Math.max(MIN_H, o.h - dy), o.y + o.h - MARGIN)
      y = o.y + (o.h - nh)
      h = nh
    }
    setRect({ x, y, w, h })
  }, [containerRef])

  const stop = useCallback(() => {
    drag.current = null
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", stop)
  }, [onPointerMove])

  const start = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      if (maximized || !rect) return
      e.preventDefault()
      drag.current = { mode, sx: e.clientX, sy: e.clientY, orig: rect }
      window.addEventListener("pointermove", onPointerMove)
      window.addEventListener("pointerup", stop)
    },
    [maximized, rect, onPointerMove, stop],
  )

  useEffect(() => () => stop(), [stop])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function toggleMaximize() {
    if (maximized) {
      setMaximized(false)
    } else {
      prevRect.current = rect
      setMaximized(true)
    }
  }

  if (!rect) return null

  const style: React.CSSProperties = maximized
    ? { left: MARGIN, top: MARGIN, right: MARGIN, bottom: MARGIN }
    : { left: rect.x, top: rect.y, width: rect.w, height: rect.h }

  return (
    <div
      className="absolute z-30 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={style}
    >
      {/* Accent strip */}
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />

      {/* Header (drag handle) */}
      <div
        onPointerDown={start("move")}
        className={cn(
          "flex items-center gap-2.5 pl-4 pr-2.5 py-3 border-b border-border bg-muted/30 shrink-0 select-none",
          maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "1f" }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-none">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={toggleMaximize}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5">{children}</div>

      {/* Resize handles (hidden when maximized) */}
      {!maximized && (
        <>
          <div onPointerDown={start("e")} className="absolute top-0 right-0 h-full w-1.5 cursor-ew-resize" style={{ touchAction: "none" }} />
          <div onPointerDown={start("w")} className="absolute top-0 left-0 h-full w-1.5 cursor-ew-resize" style={{ touchAction: "none" }} />
          <div onPointerDown={start("s")} className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize" style={{ touchAction: "none" }} />
          <div onPointerDown={start("n")} className="absolute top-0 left-0 w-full h-1.5 cursor-ns-resize" style={{ touchAction: "none" }} />
          <div
            onPointerDown={start("se")}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-end justify-end p-0.5"
            style={{ touchAction: "none" }}
          >
            <span className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground/40 rounded-br-sm" />
          </div>
        </>
      )}
    </div>
  )
}
