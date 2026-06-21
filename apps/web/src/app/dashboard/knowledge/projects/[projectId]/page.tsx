"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Upload, Trash2, FileText, CheckCircle, XCircle, Globe,
  FileUp, Loader2, Plus, Search, File, FileType,
  Calendar, AlertCircle, BookOpen, Link2, Layers, ArrowRight,
  Clock, RotateCcw, ChevronRight, ChevronDown,
  FolderOpen, Folder as FolderIcon, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────
interface KBDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "processing" | "ready" | "failed";
  chunkCount: number;
  createdAt: string;
  metadata?: { description?: string };
}

interface DocProgress { stage: string; message: string; percent: number }

interface PageTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  url?: string;
  children?: PageTreeNode[];
}

interface ProjectMeta {
  id: string;
  name: string;
  description: string | null;
  primaryColor: string;
  processingCount: number;
}

// ── Helpers ──────────────────────────────────────────────
const stagePercent: Record<string, number> = {
  scraping: 10, parsing: 20, chunking: 40, embedding: 85, saving: 95, ready: 100,
};

function fileIcon(fileType: string, fileName: string) {
  if (fileType === "text/html" || fileName?.startsWith("http"))
    return { icon: Globe, bg: "bg-blue-50 dark:bg-blue-500/10", fg: "text-blue-600 dark:text-blue-400", label: "URL", accent: "border-blue-200 dark:border-blue-500/20" };
  if (fileType === "application/pdf")
    return { icon: FileText, bg: "bg-red-50 dark:bg-red-500/10", fg: "text-red-600 dark:text-red-400", label: "PDF", accent: "border-red-200 dark:border-red-500/20" };
  if (fileType?.includes("word") || fileName?.endsWith(".docx"))
    return { icon: FileType, bg: "bg-indigo-50 dark:bg-indigo-500/10", fg: "text-indigo-600 dark:text-indigo-400", label: "DOCX", accent: "border-indigo-200 dark:border-indigo-500/20" };
  if (fileType === "text/plain" || fileName?.endsWith(".txt"))
    return { icon: File, bg: "bg-amber-50 dark:bg-amber-500/10", fg: "text-amber-600 dark:text-amber-400", label: "TXT", accent: "border-amber-200 dark:border-amber-500/20" };
  return { icon: File, bg: "bg-muted", fg: "text-muted-foreground", label: "FILE", accent: "border-border" };
}

function formatSize(bytes: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status, prog }: { status: string; prog?: DocProgress }) {
  if (prog) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
      <Loader2 className="w-3 h-3 animate-spin" />{prog.stage}
    </span>
  );
  if (status === "ready") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
      <CheckCircle className="w-3 h-3" /> Ready
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
      <Clock className="w-3 h-3" /> Processing
    </span>
  );
}

// ── Sitemap tree ─────────────────────────────────────────
function collectAllUrls(nodes: PageTreeNode[]): string[] {
  const urls: string[] = [];
  for (const n of nodes) {
    if (n.url) urls.push(n.url);
    if (n.children) urls.push(...collectAllUrls(n.children));
  }
  return urls;
}

function SitemapTree({ nodes, selected, onToggle, depth = 0 }: {
  nodes: PageTreeNode[];
  selected: Set<string>;
  onToggle: (url: string, checked: boolean) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nodes.map(n => n.id)));

  return (
    <div className={cn("w-full min-w-0", depth > 0 && "ml-4 border-l border-border pl-2")}>
      {nodes.map(node => {
        const childUrls = node.children ? collectAllUrls(node.children) : [];
        const allSelected = childUrls.length > 0 && childUrls.every(u => selected.has(u));
        const someSelected = childUrls.some(u => selected.has(u));
        const isOpen = expanded.has(node.id);

        if (node.type === "folder") {
          return (
            <div key={node.id} className="w-full min-w-0">
              <div className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-muted/60 group min-w-0 w-full">
                <button
                  onClick={() => setExpanded(p => { const n = new Set(p); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; })}
                  className="text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0"
                >
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
                  onChange={e => {
                    const all = node.url ? [node.url, ...childUrls] : childUrls;
                    all.forEach(u => onToggle(u, e.target.checked));
                  }}
                  className="w-3.5 h-3.5 accent-indigo-500 flex-shrink-0 cursor-pointer"
                />
                {isOpen
                  ? <FolderOpen className="w-3.5 h-3.5 text-indigo-500/70 flex-shrink-0" />
                  : <FolderIcon className="w-3.5 h-3.5 text-indigo-500/50 flex-shrink-0" />}
                <span className="text-foreground/70 text-xs font-medium truncate">{node.name}</span>
                <span className="text-muted-foreground/50 text-[10px] ml-auto flex-shrink-0 tabular-nums">{childUrls.length}</span>
              </div>
              {isOpen && node.children && (
                <SitemapTree nodes={node.children} selected={selected} onToggle={onToggle} depth={depth + 1} />
              )}
            </div>
          );
        }

        const isChecked = node.url ? selected.has(node.url) : false;
        return (
          <label key={node.id} className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-muted/60 cursor-pointer group min-w-0 w-full">
            <span className="w-3.5 flex-shrink-0" />
            <input
              type="checkbox"
              checked={isChecked}
              onChange={e => node.url && onToggle(node.url, e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-500 flex-shrink-0 cursor-pointer"
            />
            <Globe className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
            <span className="text-muted-foreground text-xs truncate group-hover:text-foreground transition-colors">{node.name}</span>
          </label>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, DocProgress>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "processing" | "failed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const socketRef = useRef<Socket | null>(null);

  // file tab
  const [tab, setTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDesc, setFileDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // url / discover tab
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [discoverStep, setDiscoverStep] = useState<"input" | "tree" | "scraping">("input");
  const [discovering, setDiscovering] = useState(false);
  const [sitemapTree, setSitemapTree] = useState<PageTreeNode[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [scrapeQueue, setScrapeQueue] = useState<string[]>([]);
  const [scrapeIndex, setScrapeIndex] = useState(0);

  const loadDocs = useCallback(async () => {
    const res = await api.get(`/knowledge-bases/${projectId}/documents`);
    setDocs(res.data.data ?? []);
  }, [projectId]);

  const loadProject = useCallback(async () => {
    try {
      const res = await api.get(`/knowledge-bases`);
      const found = (res.data.data ?? []).find((p: any) => p.id === projectId);
      if (found) setProject(found);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    Promise.all([loadDocs(), loadProject()]).finally(() => setLoading(false));

    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000", { withCredentials: true });
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [loadDocs, loadProject]);

  function subscribeToDocument(docId: string) {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("join:document", docId);
    socket.on("document:stage", (data: any) => {
      if (data.documentId !== docId) return;
      setProgress(prev => ({
        ...prev,
        [docId]: { stage: data.stage, message: data.message, percent: stagePercent[data.stage] ?? prev[docId]?.percent ?? 0 },
      }));
    });
    socket.on("document:progress", (data: any) => {
      if (data.documentId !== docId) return;
      const pct = data.stage === "embedding" ? Math.round(40 + data.percent * 0.45) : stagePercent[data.stage] ?? 0;
      setProgress(prev => ({ ...prev, [docId]: { ...prev[docId], stage: data.stage, percent: pct } }));
    });
    socket.on("document:ready", (data: any) => {
      if (data.documentId !== docId) return;
      setProgress(prev => ({ ...prev, [docId]: { stage: "ready", message: "Processing complete!", percent: 100 } }));
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "ready", chunkCount: data.chunkCount } : d));
      setTimeout(() => {
        setProgress(prev => { const n = { ...prev }; delete n[docId]; return n; });
        setActiveDocId(null);
        setModalOpen(false);
      }, 2000);
    });
    socket.on("document:failed", (data: any) => {
      if (data.documentId !== docId) return;
      setProgress(prev => ({ ...prev, [docId]: { stage: "failed", message: data.message, percent: 0 } }));
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: "failed" } : d));
    });
  }

  // ── File ──
  function onFileSelect(file: File) {
    setSelectedFile(file);
    setFileTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  async function handleSubmitFile() {
    if (!selectedFile || !fileTitle.trim()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("knowledgeBaseId", projectId);
      if (fileDesc.trim()) form.append("description", fileDesc.trim());
      const res = await api.post("/knowledge/upload", form);
      const doc = res.data.data;
      setDocs(prev => [{ ...doc, title: fileTitle.trim() }, ...prev]);
      setActiveDocId(doc.id);
      setProgress(prev => ({ ...prev, [doc.id]: { stage: "queued", message: "Queued for processing…", percent: 3 } }));
      subscribeToDocument(doc.id);
      setSelectedFile(null); setFileTitle(""); setFileDesc("");
      if (fileRef.current) fileRef.current.value = "";
    } finally { setSubmitting(false); }
  }

  // ── Discover ──
  function resetDiscover() {
    setDiscoverStep("input");
    setSitemapTree([]);
    setTotalFound(0);
    setSelectedUrls(new Set());
    setScrapeQueue([]);
    setScrapeIndex(0);
    setUrlInput("");
    setUrlTitle("");
  }

  async function handleDiscover() {
    if (!urlInput.trim()) return;
    setDiscovering(true);
    const tid = toast.loading("Scanning website for pages…");
    try {
      const res = await api.post("/knowledge/discover", { url: urlInput.trim() });
      const { tree, pages, count } = res.data.data;
      toast.dismiss(tid);
      if (!count) {
        toast.error("No pages found", { description: "The site may block crawlers or has no sitemap." });
        return;
      }
      setSitemapTree(tree);
      setTotalFound(count);
      setSelectedUrls(new Set((pages as any[]).map(p => p.url)));
      if (!urlTitle.trim()) setUrlTitle(new URL(urlInput.trim()).hostname);
      setDiscoverStep("tree");
      toast.success(`Found ${count} pages`, { description: "Select which ones to index." });
    } catch (err: any) {
      toast.error("Discovery failed", {
        id: tid,
        description: err.response?.data?.message ?? err.message ?? "Could not reach the website.",
      });
    } finally { setDiscovering(false); }
  }

  async function handleScrapeSelected() {
    const urls = [...selectedUrls];
    if (!urls.length) return;
    setDiscoverStep("scraping");
    setScrapeQueue(urls);
    setScrapeIndex(0);

    // ETA hint
    const etaSec = urls.length * 21;
    const etaLabel = etaSec < 60 ? `~${etaSec}s` : `~${Math.ceil(etaSec / 60)}m`;
    toast.info(`Embedding ETA: ${etaLabel}`, {
      description: `${urls.length} pages queued — processing may be slow due to limited compute resources`,
      duration: 8000,
    });

    for (let i = 0; i < urls.length; i++) {
      setScrapeIndex(i);
      try {
        const res = await api.post("/knowledge/scrape", {
          url: urls[i],
          title: `${urlTitle} (${i + 1}/${urls.length})`,
          knowledgeBaseId: projectId,
        });
        const doc = res.data.data;
        setDocs(prev => [doc, ...prev]);
        subscribeToDocument(doc.id);
      } catch {}
    }
    setScrapeIndex(urls.length);
    toast.success(`${urls.length} pages queued`, { description: "Processing in background." });
    setTimeout(() => { setModalOpen(false); resetDiscover(); }, 1200);
  }

  function toggleUrl(url: string, checked: boolean) {
    setSelectedUrls(prev => { const n = new Set(prev); checked ? n.add(url) : n.delete(url); return n; });
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this document and all its chunks?")) return;
    await api.delete(`/knowledge/${id}`);
    setDocs(d => d.filter(doc => doc.id !== id));
    setProgress(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const filtered = docs
    .filter(d => statusFilter === "all" || d.status === statusFilter)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.fileName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "newest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const counts = {
    all: docs.length,
    ready: docs.filter(d => d.status === "ready").length,
    processing: docs.filter(d => d.status === "processing").length,
    failed: docs.filter(d => d.status === "failed").length,
  };

  const activeProgress = activeDocId ? progress[activeDocId] : null;

  // ETA banner for active processing
  const processingDocs = docs.filter(d => d.status === "processing");
  const etaSec = processingDocs.length * 21;
  const etaBanner = processingDocs.length > 1
    ? `${processingDocs.length} docs embedding · overall ETA ${etaSec < 60 ? `~${etaSec}s` : `~${Math.ceil(etaSec / 60)}m`}`
    : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => router.push("/dashboard/knowledge")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Knowledge Base
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{project?.name ?? "Project"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {docs.length} source{docs.length !== 1 ? "s" : ""} · {counts.ready} ready
            {counts.processing > 0 ? ` · ${counts.processing} processing` : ""}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Source
        </Button>
      </div>

      {/* ETA banner */}
      {etaBanner && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          {etaBanner}
          <span className="text-xs text-muted-foreground ml-1">(rate-limit delay: 21s/batch)</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search sources…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">All <span className="ml-1.5 bg-muted-foreground/15 px-1.5 py-0.5 rounded-full text-[11px]">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="ready" className="text-xs px-3">Ready <span className="ml-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-1.5 py-0.5 rounded-full text-[11px]">{counts.ready}</span></TabsTrigger>
            <TabsTrigger value="processing" className="text-xs px-3">Processing <span className="ml-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-1.5 py-0.5 rounded-full text-[11px]">{counts.processing}</span></TabsTrigger>
            {counts.failed > 0 && <TabsTrigger value="failed" className="text-xs px-3">Failed <span className="ml-1.5 bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 px-1.5 py-0.5 rounded-full text-[11px]">{counts.failed}</span></TabsTrigger>}
          </TabsList>
        </Tabs>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-36 h-9 text-xs gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed rounded-2xl">
          <BookOpen className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium text-sm">{search || statusFilter !== "all" ? "No sources match your filters" : "No sources yet"}</p>
          <p className="text-xs mt-1 opacity-60 mb-5">{search || statusFilter !== "all" ? "Try adjusting search or filters" : "Upload a PDF, DOCX, or add a website URL"}</p>
          {!search && statusFilter === "all" && (
            <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Add your first source</Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const prog = progress[doc.id];
            const { icon: Icon, bg, fg, label, accent } = fileIcon(doc.fileType, doc.fileName);
            const isUrl = doc.fileType === "text/html" || doc.fileName?.startsWith("http");
            const size = formatSize(doc.fileSize);
            return (
              <div
                key={doc.id}
                onClick={() => doc.status === "ready" && router.push(`/dashboard/knowledge/${doc.id}`)}
                className={cn(
                  "group relative bg-card border rounded-xl p-5 transition-all duration-150",
                  doc.status === "ready" ? "cursor-pointer hover:border-primary/40 hover:shadow-md hover:shadow-primary/5" : "cursor-default",
                  prog ? "border-amber-300 dark:border-amber-500/30" : "border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-xl border flex flex-col items-center justify-center flex-shrink-0", bg, accent)}>
                    <Icon className={cn("w-5 h-5", fg)} />
                    <span className={cn("text-[9px] font-bold mt-0.5 opacity-70", fg)}>{label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {isUrl ? <span className="flex items-center gap-1"><Globe className="w-3 h-3 flex-shrink-0" />{doc.fileName}</span> : doc.fileName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={doc.status} prog={prog} />
                        {doc.status === "failed" && (
                          <button onClick={e => { e.stopPropagation(); loadDocs(); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.status === "ready" && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>View chunks</span><ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                        <button onClick={e => handleDelete(e, doc.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {prog && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="truncate pr-4">{prog.message}</span>
                          <span className="font-medium flex-shrink-0">{prog.percent}%</span>
                        </div>
                        <Progress value={prog.percent} className="h-1.5" />
                      </div>
                    )}
                    {!prog && (
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        {doc.chunkCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Layers className="w-3 h-3" />{doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {size && <span className="text-xs text-muted-foreground before:content-['·'] before:mr-3">{size}</span>}
                        <span className="text-xs text-muted-foreground before:content-['·'] before:mr-3">
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Source Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={open => {
          if (discoverStep === "scraping" || submitting || activeDocId) return;
          setModalOpen(open);
          if (!open) resetDiscover();
        }}
      >
        <DialogContent className={cn("transition-all", discoverStep === "tree" ? "max-w-xl" : "max-w-lg")}>
          <DialogHeader>
            <DialogTitle>Add to Project</DialogTitle>
            <DialogDescription>Upload a document or crawl a website</DialogDescription>
          </DialogHeader>

          {activeDocId && activeProgress ? (
            <div className="py-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center",
                  activeProgress.stage === "ready" ? "bg-emerald-100 dark:bg-emerald-500/15" :
                  activeProgress.stage === "failed" ? "bg-red-100 dark:bg-red-500/15" : "bg-primary/10")}>
                  {activeProgress.stage === "ready" ? <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    : activeProgress.stage === "failed" ? <AlertCircle className="w-6 h-6 text-red-500" />
                    : <Loader2 className="w-6 h-6 text-primary animate-spin" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeProgress.stage === "ready" ? "Processing complete!" : activeProgress.message}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{activeProgress.stage}</p>
                </div>
              </div>
              <Progress value={activeProgress.percent} className="h-2" />
              {activeProgress.stage === "embedding" && (
                <p className="text-xs text-muted-foreground text-center">
                  Rate-limited to 3 req/min — embedding takes ~21s per batch
                </p>
              )}
              {activeProgress.stage === "ready" && <p className="text-sm text-muted-foreground text-center">Document indexed and searchable ✓</p>}
            </div>
          ) : (
            <Tabs value={tab} onValueChange={v => { setTab(v as any); resetDiscover(); }}>
              <TabsList className="w-full mb-5">
                <TabsTrigger value="file" className="flex-1 gap-2 text-sm"><FileUp className="w-4 h-4" />Upload File</TabsTrigger>
                <TabsTrigger value="url" className="flex-1 gap-2 text-sm"><Link2 className="w-4 h-4" />Website URL</TabsTrigger>
              </TabsList>

              {/* File tab */}
              <TabsContent value="file" className="space-y-4 mt-0">
                <div
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    selectedFile ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30")}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-7 h-7 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-semibold">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium">Drop file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, MD · up to 50 MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.docx" className="hidden"
                    onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Product FAQ" value={fileTitle} onChange={e => setFileTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Description (optional)</Label>
                  <Textarea placeholder="What does this document cover?" value={fileDesc} onChange={e => setFileDesc(e.target.value)} rows={2} className="resize-none" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSubmitFile} disabled={submitting || !selectedFile || !fileTitle.trim()}>
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4 mr-2" />Upload & Process</>}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* URL tab */}
              <TabsContent value="url" className="mt-0">
                {discoverStep === "input" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Website URL <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="https://yoursite.com" value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleDiscover()} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Label <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input placeholder="e.g. Company Docs" value={urlTitle} onChange={e => setUrlTitle(e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
                      We'll scan the sitemap to discover all pages. You can then pick exactly which ones to index.
                    </p>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button onClick={handleDiscover} disabled={discovering || !urlInput.trim()}>
                        {discovering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning…</> : <><Search className="w-4 h-4 mr-2" />Discover Pages</>}
                      </Button>
                    </DialogFooter>
                  </div>
                )}

                {discoverStep === "tree" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{totalFound} pages found</p>
                        <p className="text-xs text-muted-foreground">{selectedUrls.size} selected</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5"
                          onClick={() => setSelectedUrls(new Set(collectAllUrls(sitemapTree)))}>All</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5"
                          onClick={() => setSelectedUrls(new Set())}>None</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={resetDiscover}>↩ Back</Button>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-y-auto overflow-x-hidden bg-muted/30 border border-border" style={{ height: 300 }}>
                      <div className="p-2 min-w-0">
                        <SitemapTree nodes={sitemapTree} selected={selectedUrls} onToggle={toggleUrl} />
                      </div>
                    </div>
                    {selectedUrls.size > 0 && (
                      <p className="text-xs text-muted-foreground bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-700 dark:text-amber-400">
                        ETA: ~{selectedUrls.size * 21 < 60 ? `${selectedUrls.size * 21}s` : `${Math.ceil(selectedUrls.size * 21 / 60)}m`} — processing may be slow due to limited compute resources
                      </p>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={resetDiscover}>Back</Button>
                      <Button onClick={handleScrapeSelected} disabled={selectedUrls.size === 0}
                        className="text-white" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                        <Globe className="w-4 h-4 mr-2" />
                        Scrape {selectedUrls.size} page{selectedUrls.size !== 1 ? "s" : ""}
                      </Button>
                    </DialogFooter>
                  </div>
                )}

                {discoverStep === "scraping" && (
                  <div className="py-8 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        {scrapeIndex >= scrapeQueue.length
                          ? <CheckCircle className="w-6 h-6 text-emerald-500" />
                          : <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {scrapeIndex >= scrapeQueue.length ? "All pages queued!" : `Queuing page ${scrapeIndex + 1} of ${scrapeQueue.length}…`}
                        </p>
                        {scrapeIndex < scrapeQueue.length && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{scrapeQueue[scrapeIndex]}</p>
                        )}
                      </div>
                    </div>
                    <Progress value={scrapeQueue.length ? Math.round((scrapeIndex / scrapeQueue.length) * 100) : 0} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Pages will embed in the background · ETA ~{Math.ceil(scrapeQueue.length * 21 / 60)}m
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
