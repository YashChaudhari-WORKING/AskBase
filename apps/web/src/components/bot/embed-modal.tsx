"use client"

import { useState } from "react"
import { AlertTriangle, Check, Copy, KeyRound, Loader2, RefreshCw } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EmbedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  maskedKey: string
}

export function EmbedModal({ open, onOpenChange, projectId, maskedKey }: EmbedModalProps) {
  const [regenKey, setRegenKey] = useState<string | null>(null)
  const [regenLoading, setRegenLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleClose(open: boolean) {
    if (!open) { setRegenKey(null); setCopied(false) }
    onOpenChange(open)
  }

  async function handleRegen() {
    setRegenLoading(true)
    try {
      const r = await api.post(`/projects/${projectId}/regenerate-key`)
      const data = (r.data as any)?.data ?? r.data
      setRegenKey(data.rawKey)
    } catch {
      // silently ignore — user can retry
    } finally {
      setRegenLoading(false)
    }
  }

  function copySnippet() {
    if (!regenKey) return
    const snippet = `<script src="https://cdn.askbase.io/widget.iife.js" data-key="${regenKey}" async></script>`
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fullSnippet = regenKey
    ? `<script src="https://cdn.askbase.io/widget.iife.js" data-key="${regenKey}" async></script>`
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-base">Embed script</DialogTitle>
          </div>
          <DialogDescription className="text-sm pl-12">
            Paste this snippet into your website's{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">&lt;body&gt;</code>{" "}
            to embed the chat widget.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {!regenKey ? (
            <>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Current key</p>
                <code className="text-sm font-mono text-foreground">{maskedKey}</code>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3.5 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400 leading-snug">
                  The full key is only shown once at creation. Generate a new key to get a copyable embed script.{" "}
                  <span className="font-semibold">This revokes the old key</span> — update existing embeds after.
                </p>
              </div>

              <Button onClick={handleRegen} disabled={regenLoading} className="w-full gap-2">
                {regenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {regenLoading ? "Generating…" : "Generate new key"}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    New key generated — copy before closing
                  </p>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <code className="block text-xs font-mono text-foreground break-all leading-relaxed bg-background rounded-md px-3 py-2.5 border border-border">
                  {fullSnippet}
                </code>
              </div>

              <Button
                onClick={copySnippet}
                className="w-full gap-2"
                variant={copied ? "outline" : "default"}
              >
                {copied
                  ? <><Check className="w-4 h-4" />Copied!</>
                  : <><Copy className="w-4 h-4" />Copy embed script</>
                }
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
