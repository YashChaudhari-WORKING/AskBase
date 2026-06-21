"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Plus, Loader2, CheckCircle, AlertCircle,
  Trash2, BookOpen, FileText, Clock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  primaryColor: string;
  documentCount: number;
  readyCount: number;
  processingCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

function etaLabel(processingCount: number) {
  if (!processingCount) return null;
  const secs = processingCount * 21;
  if (secs < 60) return `~${secs}s`;
  return `~${Math.ceil(secs / 60)}m`;
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const router = useRouter();
  const eta = etaLabel(project.processingCount);
  const initials = project.name.slice(0, 2).toUpperCase();

  return (
    <div
      className="group relative flex flex-col bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-border/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
      onClick={() => router.push(`/dashboard/knowledge/projects/${project.id}`)}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(project.id); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold tracking-wide shadow-sm"
          style={{ backgroundColor: project.primaryColor }}
        >
          {initials}
        </div>
        <div className="min-w-0 pr-6">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">{project.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {project.description ?? "No description"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground">
          <FileText className="w-3 h-3" />
          {project.documentCount} doc{project.documentCount !== 1 ? "s" : ""}
        </span>
        {project.readyCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />{project.readyCount} ready
          </span>
        )}
        {project.processingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-700 dark:text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />{project.processingCount} processing{eta && ` ${eta}`}
          </span>
        )}
        {project.failedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />{project.failedCount} failed
          </span>
        )}
        {project.documentCount === 0 && (
          <span className="text-xs text-muted-foreground/40 italic">No documents yet</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/knowledge-bases");
      setProjects(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/knowledge-bases", { name: name.trim(), description: description.trim() || undefined });
      setProjects(prev => [res.data.data, ...prev]);
      setName(""); setDescription("");
      setCreateOpen(false);
      toast.success("Project created", { description: `"${name.trim()}" is ready to add documents.` });
    } catch (err: any) {
      toast.error("Failed to create project", { description: err.response?.data?.message ?? err.message });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its documents?")) return;
    try {
      await api.delete(`/knowledge-bases/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  }

  const totalDocs = projects.reduce((s, p) => s + p.documentCount, 0);
  const totalProcessing = projects.reduce((s, p) => s + p.processingCount, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {totalDocs > 0 && ` · ${totalDocs} documents`}
            {totalProcessing > 0 && ` · ${totalProcessing} processing`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground border border-dashed border-border rounded-2xl">
          <BookOpen className="w-12 h-12 mb-4 opacity-15" />
          <p className="font-semibold text-sm text-foreground">No projects yet</p>
          <p className="text-xs mt-1 text-muted-foreground mb-6">Create a project to start organizing your knowledge base</p>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
          ))}
          <button
            onClick={() => setCreateOpen(true)}
            className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-accent/50 transition-all duration-200"
          >
            <Plus className="w-7 h-7 opacity-40" />
            <span className="text-sm font-medium">New Project</span>
          </button>
        </div>
      )}

      {/* Create project dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Knowledge Project</DialogTitle>
            <DialogDescription>
              A project groups related documents into one searchable knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Customer Support FAQ"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !creating && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Description <span className="text-muted-foreground/50 font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="What topics does this knowledge base cover?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
