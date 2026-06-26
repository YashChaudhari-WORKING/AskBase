"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Plus, Workflow, Trash2, GitBranch,
  Loader2, Globe, FileText,
  Cpu, Layers, Search, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface Flow {
  id: string;
  name: string;
  description: string | null;
  mode: "standalone" | "ai_tool";
  isActive: boolean;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

function FlowCard({ flow, onDelete, onToggle }: {
  flow: Flow;
  onDelete: (flow: Flow) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const router = useRouter();
  const nodeCount = flow.nodes?.length ?? 0;
  const isAiTool = flow.mode === "ai_tool";

  return (
    <div
      onClick={() => router.push(`/dashboard/flows/${flow.id}`)}
      className="relative bg-card border border-border rounded-xl p-4 hover:border-primary/25 hover:shadow-md hover:shadow-black/8 transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${flow.isActive ? "bg-emerald-500" : "bg-border"}`} />

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isAiTool ? "bg-violet-500/10 border border-violet-500/20" : "bg-primary/10 border border-primary/20"
          }`}>
            {isAiTool ? <Cpu className="w-3.5 h-3.5 text-violet-500" /> : <Layers className="w-3.5 h-3.5 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate leading-tight">{flow.name}</p>
            {flow.description && (
              <p className="text-sm text-muted-foreground/70 truncate mt-0.5">{flow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(flow); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
          <GitBranch className="w-3.5 h-3.5" />{nodeCount} nodes
        </span>
        <span className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg font-medium ${
          isAiTool ? "bg-violet-500/10 text-violet-500" : "bg-primary/8 text-primary"
        }`}>
          {isAiTool ? <Cpu className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
          {isAiTool ? "AI Tool" : "Standalone"}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <button
          onClick={e => { e.stopPropagation(); onToggle(flow.id, !flow.isActive); }}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            flow.isActive ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {flow.isActive ? <Globe className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          {flow.isActive ? "Published" : "Draft"}
        </button>
        <span className="text-sm text-muted-foreground/50">
          {new Date(flow.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get("/flows").catch(() => ({ data: { data: [] } }));
    setFlows(r.data.data ?? []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  async function confirmDelete() {
    if (!flowToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/flows/${flowToDelete.id}`);
      setFlows(f => f.filter(x => x.id !== flowToDelete.id));
      setFlowToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleFlow(id: string, active: boolean) {
    await api.put(`/flows/${id}`, { isActive: active });
    setFlows(f => f.map(x => x.id === id ? { ...x, isActive: active } : x));
  }

  function createNew() {
    router.push("/dashboard/bots/new/flow");
  }

  const filtered = flows.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  usePageHeader(
    <PageHeaderBar
      icon={Workflow}
      tone="violet"
      title="Flows"
      stats={[
        { icon: GitBranch, value: flows.length, label: flows.length === 1 ? "flow" : "flows" },
        { icon: Cpu, value: flows.filter((f) => f.isActive).length, label: "active", tone: "emerald" },
      ]}
      actions={
        <>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search flows…"
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
        <Button onClick={createNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Flow Bot
        </Button>
        </>
      }
    />,
    [flows.length, search],
  );

  return (
    <div className="p-6">
      {/* Delete confirmation dialog */}
      <Dialog open={!!flowToDelete} onOpenChange={open => { if (!open) setFlowToDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <DialogTitle className="text-base">Delete flow?</DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed pl-12">
              <span className="font-semibold text-foreground">{flowToDelete?.name}</span> will be permanently deleted.
              Any assistants using this flow will lose the connection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setFlowToDelete(null)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : flows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed rounded-2xl text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Workflow className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold mb-1 text-foreground">No flows yet</p>
          <p className="text-sm opacity-70 mb-5 text-center max-w-sm">
            Flows are created automatically when you build a Flow Bot. Describe what you want to collect — AI does the rest.
          </p>
          <Button onClick={createNew} className="gap-2">
            <Plus className="w-4 h-4" /> Build a Flow Bot
          </Button>
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
          {filtered.map(f => (
            <FlowCard key={f.id} flow={f} onDelete={setFlowToDelete} onToggle={toggleFlow} />
          ))}
        </div>
      )}
    </div>
  );
}
