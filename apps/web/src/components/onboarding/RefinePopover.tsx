"use client"

import * as React from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RefinePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegenerate: (refinement: string) => Promise<void>
  trigger: React.ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RefinePopover({
  open,
  onOpenChange,
  onRegenerate,
  trigger,
}: RefinePopoverProps) {
  const [refinement, setRefinement] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Autofocus when popover opens.
  React.useEffect(() => {
    if (open) {
      // wait for content to mount + position before focusing
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [open])

  async function handleRegenerate() {
    const value = refinement.trim()
    if (!value || loading) return

    setLoading(true)
    try {
      await onRegenerate(value)
      setRefinement("")
      onOpenChange(false)
    } catch {
      // keep popover open so user can retry; surface nothing here
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    if (loading) return
    setRefinement("")
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[340px] p-3">
        <div className="flex flex-col gap-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground">What&apos;s off about this?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Describe what you&apos;d like to change and we&apos;ll regenerate.
            </p>
          </div>

          <Textarea
            ref={textareaRef}
            value={refinement}
            onChange={(e) => setRefinement(e.target.value)}
            placeholder="e.g. Make the tone more casual, drop the formal intro…"
            className="min-h-[80px] text-sm"
            disabled={loading}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                handleRegenerate()
              }
            }}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRegenerate}
              disabled={loading || !refinement.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  Regenerate
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
