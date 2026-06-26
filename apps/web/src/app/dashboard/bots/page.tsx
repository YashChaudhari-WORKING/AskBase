"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Plus, Bot, Settings2,
  BookOpen, X, Search, Workflow,
  MessageCircle, ClipboardList, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmbedModal } from "@/components/bot/embed-modal";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface Project {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  tone: string;
  confidenceThreshold: number;
  flowTrigger: string | null;
  isActive: boolean;
  createdAt: string;
  assistantType?: "ai_agent" | "flow" | "hybrid";
  knowledgeBase: { id: string; name: string } | null;
  flow: { id: string; name: string } | null;
  apiKey: { id: string; keyPrefix: string } | null;
}

type TypeMeta = {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  badgeBg: string;
  badgeText: string;
};

const TYPE_META: Record<"ai_agent" | "flow" | "hybrid", TypeMeta> = {
  flow: {
    label: "Flow Bot",
    shortLabel: "Flow",
    icon: ClipboardList,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconBorder: "border-emerald-500/20",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-500",
  },
  ai_agent: {
    label: "AI Bot",
    shortLabel: "AI",
    icon: MessageCircle,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-500/20",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-500",
  },
  hybrid: {
    label: "Hybrid",
    shortLabel: "Hybrid",
    icon: Bot,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    iconBorder: "border-violet-500/20",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-500",
  },
};

function getTypeMeta(p: Project): TypeMeta {
  const t = (p.assistantType ?? "ai_agent") as keyof typeof TYPE_META;
  return TYPE_META[t] ?? TYPE_META.ai_agent;
}

const PRESETS = {
  relaxed:  { label: "Relaxed",  pct: 25,  desc: "AI handles almost everything. Escalates only when no context found.", border: "border-emerald-400/60", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  balanced: { label: "Balanced", pct: 45,  desc: "AI answers confident questions. Escalates when unsure.",            border: "border-amber-400/60",   bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500"   },
  strict:   { label: "Strict",   pct: 70,  desc: "Human reviews most conversations. Best for high-stakes support.",   border: "border-red-400/60",     bg: "bg-red-500/10",     text: "text-red-600 dark:text-red-400",     dot: "bg-red-500"     },
  custom:   { label: "Custom",   pct: -1,  desc: "Set your own confidence threshold.",                                border: "border-violet-400/60",  bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-500"  },
};

function BotCard({ p, onClick }: { p: Project; onClick: (id: string) => void }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const embedKeyDisplay = p.apiKey ? `${p.apiKey.keyPrefix}••••••••` : "—";
  const preset = Object.entries(PRESETS).find(
    ([k, v]) => k !== "custom" && v.pct === Math.round(p.confidenceThreshold * 100)
  );
  const pi = preset ? preset[1] : PRESETS.custom;
  const tm = getTypeMeta(p);
  const TypeIcon = tm.icon;

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 hover:shadow-md hover:shadow-black/8 transition-all duration-200 group cursor-pointer"
      onClick={() => onClick(p.id)}
    >
      {/* Top accent */}
      <div className={`h-0.5 w-full ${pi.dot}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tm.iconBg} ${tm.iconBorder}`}>
              <TypeIcon className={`w-5 h-5 ${tm.iconColor}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-base font-semibold text-foreground truncate">{p.name}</p>
                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${tm.badgeBg} ${tm.badgeText}`}>
                  {tm.shortLabel}
                </span>
                {!p.isActive && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Paused
                  </span>
                )}
              </div>
              {p.description && (
                <p className="text-sm text-muted-foreground/60 line-clamp-1 mt-0.5">{p.description}</p>
              )}
            </div>
          </div>
          {/* Only Settings — no delete on card */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
            <button
              onClick={e => { e.stopPropagation(); router.push(`/dashboard/bots/${p.id}?tab=settings`); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground flex-wrap">
          <span className={`flex items-center gap-1.5 font-medium ${pi.text}`}>
            <span className={`w-2 h-2 rounded-full ${pi.dot}`} />
            {preset ? preset[1].label : `${Math.round(p.confidenceThreshold * 100)}%`} handoff
          </span>
          <span className="w-px h-3.5 bg-border" />
          <span className="capitalize">{p.tone}</span>
          {p.knowledgeBase && (
            <>
              <span className="w-px h-3.5 bg-border" />
              <span className="flex items-center gap-1 truncate">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                {p.knowledgeBase.name}
              </span>
            </>
          )}
          {p.flow && (
            <>
              <span className="w-px h-3.5 bg-border" />
              <span className="flex items-center gap-1 truncate text-violet-500">
                <Workflow className="w-3.5 h-3.5 shrink-0" />
                {p.flow.name}
              </span>
            </>
          )}
        </div>

        {/* Embed key */}
        {p.apiKey && (
          <>
            <EmbedModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              projectId={p.id}
              maskedKey={embedKeyDisplay}
            />
            <div
              className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2.5 border border-border"
              onClick={e => e.stopPropagation()}
            >
              <code className="text-sm text-emerald-600 dark:text-emerald-400 font-mono flex-1 truncate">{embedKeyDisplay}</code>
              <button
                onClick={e => { e.stopPropagation(); setModalOpen(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Get embed script"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const br = await api.get("/projects").catch(() => ({ data: { data: [] } }));
    setBots(br.data.data ?? []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const visibleBots = showAll ? bots : bots.filter(b => b.isActive);
  const filtered = visibleBots.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  usePageHeader(
    <PageHeaderBar
      icon={Bot}
      tone="blue"
      title="Assistants"
      stats={[{ icon: Bot, value: visibleBots.length, label: visibleBots.length === 1 ? "assistant" : "assistants" }]}
      actions={
        <>
        {/* Active / All toggle */}
        <div className="flex items-center h-9 rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${
              !showAll
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`h-8 px-3 rounded-md text-xs font-semibold transition-all ${
              showAll
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search assistants…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 w-48 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Button onClick={() => router.push('/dashboard/bots/new')} className="gap-2">
          <Plus className="w-4 h-4" /> New Assistant
        </Button>
        </>
      }
    />,
    [visibleBots.length, search, showAll],
  );

  return (
    <div className="p-6">
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed rounded-2xl text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold mb-1">No assistants yet</p>
          <p className="text-sm opacity-60 mb-5">Create your first AI assistant with custom knowledge and behavior</p>
          <Button onClick={() => router.push('/dashboard/bots/new')} className="gap-2"><Plus className="w-4 h-4" />Create your first assistant</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="w-8 h-8 mb-3 opacity-25" />
          <p className="font-semibold text-sm text-foreground">No results found</p>
          <p className="text-xs mt-1 opacity-60">Try adjusting your search</p>
          <button onClick={() => setSearch("")} className="text-xs text-primary mt-3 hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(p => (
            <BotCard
              key={p.id}
              p={p}
              onClick={(id) => router.push(`/dashboard/bots/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
