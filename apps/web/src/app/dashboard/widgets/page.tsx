"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Plus, Paintbrush2, Trash2, Loader2, ArrowRight } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WidgetTheme {
  id: string
  name: string
  primaryColor: string
  headerBgColor: string
  chatBgColor: string
  botName: string
  botAvatarEmoji: string
  launcherBgColor: string
  borderRadius: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Theme preview card
// ---------------------------------------------------------------------------

function ThemeCard({ theme, onDelete }: { theme: WidgetTheme; onDelete: (id: string) => void }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await api.delete(`/widget-themes/${theme.id}`)
      onDelete(theme.id)
    } catch {
      setDeleting(false)
    }
  }

  const radius = {
    none: "0px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px",
  }[theme.borderRadius] ?? "16px"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/dashboard/widgets/${theme.id}`)}
      className="relative rounded-2xl border border-border bg-card p-0 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg hover:border-border/80 group"
    >
      {/* Preview swatch strip */}
      <div className="h-3 w-full" style={{ backgroundColor: theme.headerBgColor }} />

      {/* Mini widget preview */}
      <div
        className="mx-4 -mt-0.5 mb-4 mt-3 h-24 overflow-hidden shadow-md"
        style={{ borderRadius: radius, backgroundColor: theme.chatBgColor }}
      >
        {/* Mini header */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          style={{ backgroundColor: theme.headerBgColor }}
        >
          <span className="text-xs">{theme.botAvatarEmoji || "⚡"}</span>
          <span className="text-[10px] font-semibold text-white/90 truncate">{theme.botName || "Assistant"}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto" />
        </div>
        {/* Mini messages */}
        <div className="px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-start gap-1">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: theme.headerBgColor + "33" }} />
            <div className="h-2.5 rounded-full bg-muted/80 flex-1" />
          </div>
          <div className="flex justify-end">
            <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: theme.primaryColor + "40" }} />
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="px-4 pb-4 flex flex-col gap-3">
        <div>
          <p className="font-semibold text-sm truncate">{theme.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{theme.botName || "Assistant"}</p>
        </div>

        {/* Color chips */}
        <div className="flex items-center gap-1.5">
          {[theme.headerBgColor, theme.primaryColor, theme.chatBgColor, theme.launcherBgColor].map((c, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-border/40 shrink-0"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{theme.primaryColor}</span>
        </div>

        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5 gap-1"
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/widgets/${theme.id}`) }}
          >
            Edit theme
            <ArrowRight className="w-3 h-3" />
          </Button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-primary/30"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-20 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Paintbrush2 className="w-8 h-8 text-primary" />
      </motion.div>
      <div>
        <p className="font-semibold text-base">No widget themes yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a theme to customize your chatbot's look and feel.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="mr-2 w-4 h-4" />
        Create your first theme
      </Button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WidgetThemesPage() {
  const router = useRouter()
  const [themes, setThemes] = useState<WidgetTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api
      .get("/widget-themes")
      .then((r) => setThemes((r.data as any)?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function createTheme() {
    setCreating(true)
    try {
      const res = await api.post("/widget-themes", { name: "New Theme" })
      const theme = (res.data as any)?.data ?? res.data
      router.push(`/dashboard/widgets/${theme.id}`)
    } catch {
      setCreating(false)
    }
  }

  function removeTheme(id: string) {
    setThemes((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Widget Themes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create reusable themes and attach them to any assistant or flow bot.
          </p>
        </div>
        <Button onClick={createTheme} disabled={creating}>
          {creating ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Plus className="mr-2 w-4 h-4" />}
          New theme
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
              <Skeleton className="h-3 w-full" />
              <div className="p-4 flex flex-col gap-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : themes.length === 0 ? (
        <EmptyState onCreate={createTheme} />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} onDelete={removeTheme} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
