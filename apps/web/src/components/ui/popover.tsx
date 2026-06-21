"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Minimal shadcn-style Popover (no Radix dependency).
// API mirrors shadcn/ui:
//   <Popover open={open} onOpenChange={setOpen}>
//     <PopoverTrigger asChild><Button>Open</Button></PopoverTrigger>
//     <PopoverContent align="start">…</PopoverContent>
//   </Popover>
// ---------------------------------------------------------------------------

type Align = "start" | "center" | "end"
type Side = "top" | "bottom" | "left" | "right"

interface PopoverCtx {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentId: string
}

const Ctx = React.createContext<PopoverCtx | null>(null)

function usePopover() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("Popover.* must be used inside <Popover>")
  return ctx
}

interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open: openProp, defaultOpen, onOpenChange, children }: PopoverProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const isControlled = openProp !== undefined
  const open = isControlled ? !!openProp : uncontrolled

  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolled(v)
      onOpenChange?.(v)
    },
    [isControlled, onOpenChange]
  )

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentId = React.useId()

  return (
    <Ctx.Provider value={{ open, setOpen, triggerRef, contentId }}>
      {children}
    </Ctx.Provider>
  )
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
  children: React.ReactNode
}

export const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild, children, onClick, ...rest }, forwardedRef) => {
    const { open, setOpen, triggerRef, contentId } = usePopover()

    const mergedRef = (node: HTMLElement | null) => {
      // attach to context ref
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
    }

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      onClick?.(e as React.MouseEvent<HTMLElement>)
      if (!e.defaultPrevented) setOpen(!open)
    }

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>
      return React.cloneElement(child, {
        ref: mergedRef,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          const existing = child.props.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined
          existing?.(e)
          handleClick(e)
        },
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": contentId,
        ...rest,
      })
    }

    return (
      <button
        type="button"
        ref={mergedRef as React.Ref<HTMLButtonElement>}
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={contentId}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align
  side?: Side
  sideOffset?: number
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", side = "bottom", sideOffset = 6, style, children, ...rest }, forwardedRef) => {
    const { open, setOpen, triggerRef, contentId } = usePopover()
    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)

    const mergedRef = (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }

    // Position the popover relative to the trigger.
    React.useLayoutEffect(() => {
      if (!open) return
      const trigger = triggerRef.current
      const content = contentRef.current
      if (!trigger || !content) return

      const compute = () => {
        const t = trigger.getBoundingClientRect()
        const c = content.getBoundingClientRect()

        let top = 0
        let left = 0

        if (side === "bottom") {
          top = t.bottom + sideOffset
        } else if (side === "top") {
          top = t.top - c.height - sideOffset
        } else if (side === "left") {
          top = t.top
          left = t.left - c.width - sideOffset
        } else {
          top = t.top
          left = t.right + sideOffset
        }

        if (side === "top" || side === "bottom") {
          if (align === "start") left = t.left
          else if (align === "end") left = t.right - c.width
          else left = t.left + t.width / 2 - c.width / 2
        } else {
          if (align === "start") top = t.top
          else if (align === "end") top = t.bottom - c.height
          else top = t.top + t.height / 2 - c.height / 2
        }

        // Clamp to viewport
        const pad = 8
        const maxLeft = window.innerWidth - c.width - pad
        const maxTop = window.innerHeight - c.height - pad
        if (left > maxLeft) left = maxLeft
        if (left < pad) left = pad
        if (top > maxTop) top = maxTop
        if (top < pad) top = pad

        setPos({ top: top + window.scrollY, left: left + window.scrollX })
      }

      compute()
      window.addEventListener("resize", compute)
      window.addEventListener("scroll", compute, true)
      return () => {
        window.removeEventListener("resize", compute)
        window.removeEventListener("scroll", compute, true)
      }
    }, [open, side, align, sideOffset, triggerRef])

    // Outside click + escape to close.
    React.useEffect(() => {
      if (!open) return

      const onPointerDown = (e: MouseEvent) => {
        const target = e.target as Node
        if (contentRef.current?.contains(target)) return
        if (triggerRef.current?.contains(target)) return
        setOpen(false)
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false)
      }

      document.addEventListener("mousedown", onPointerDown)
      document.addEventListener("keydown", onKey)
      return () => {
        document.removeEventListener("mousedown", onPointerDown)
        document.removeEventListener("keydown", onKey)
      }
    }, [open, setOpen, triggerRef])

    if (!open) return null

    return (
      <div
        ref={mergedRef}
        id={contentId}
        role="dialog"
        data-state={open ? "open" : "closed"}
        className={cn(
          "fixed z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          visibility: pos ? "visible" : "hidden",
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"
