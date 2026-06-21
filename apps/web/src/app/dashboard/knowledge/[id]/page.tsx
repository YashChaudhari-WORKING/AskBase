"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft, Layers, Globe, FileText, FileType, File,
  Search, Copy, CheckCheck, ChevronDown, ChevronUp,
  Hash, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Chunk {
  id: string;
  content: string;
  chunkIndex: number;
  tokenCount: number | null;
  metadata: Record<string, any>;
  createdAt: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  status: string;
}

function fileIcon(title: string) {
  if (title?.startsWith("http") || title?.includes(".vercel.") || title?.includes("://"))
    return { icon: Globe, bg: "bg-blue-50 dark:bg-blue-500/10", fg: "text-blue-600 dark:text-blue-400" };
  if (title?.endsWith(".pdf"))
    return { icon: FileText, bg: "bg-red-50 dark:bg-red-500/10", fg: "text-red-600 dark:text-red-400" };
  if (title?.endsWith(".docx"))
    return { icon: FileType, bg: "bg-indigo-50 dark:bg-indigo-500/10", fg: "text-indigo-600 dark:text-indigo-400" };
  return { icon: File, bg: "bg-muted", fg: "text-muted-foreground" };
}

function ChunkCard({ chunk, index }: { chunk: Chunk; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = chunk.content.length > 300;
  const display = expanded ? chunk.content : chunk.content.slice(0, 300);

  function copy() {
    navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {/* Chunk header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">#{chunk.chunkIndex + 1}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Chunk {chunk.chunkIndex + 1}</span>
          {chunk.tokenCount && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {chunk.tokenCount} tokens
            </span>
          )}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {chunk.content.length} chars
          </span>
        </div>
        <button
          onClick={copy}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Copy chunk"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Chunk body */}
      <div className="px-4 py-3">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono text-[13px]">
          {display}{!expanded && isLong && <span className="text-muted-foreground">…</span>}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Show more ({chunk.content.length - 300} more chars)</>}
          </button>
        )}
      </div>

      {/* Metadata (if any) */}
      {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {Object.entries(chunk.metadata).slice(0, 4).map(([k, v]) => (
            <span key={k} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {k}: {String(v).slice(0, 30)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChunksPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/knowledge/${id}/chunks`)
      .then(res => {
        setDocument(res.data.data.document);
        setChunks(res.data.data.chunks);
      })
      .catch(() => setError("Failed to load chunks"))
      .finally(() => setLoading(false));
  }, [id]);

  const filtered = chunks.filter(c =>
    !search || c.content.toLowerCase().includes(search.toLowerCase())
  );

  const avgTokens = chunks.length
    ? Math.round(chunks.reduce((s, c) => s + (c.tokenCount ?? 0), 0) / chunks.length)
    : 0;
  const totalChars = chunks.reduce((s, c) => s + c.content.length, 0);

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 text-muted-foreground">
        <p className="font-medium mb-3">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </button>

        {loading ? (
          <Skeleton className="h-7 w-64 mb-2" />
        ) : (
          <h1 className="text-xl font-bold tracking-tight">{document?.title}</h1>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">Indexed chunks · read-only view</p>
      </div>

      {/* Stats row */}
      {!loading && chunks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{chunks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total chunks</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{avgTokens}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg tokens/chunk</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{totalChars > 1000 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars}</p>
              <p className="text-xs text-muted-foreground mt-1">Total characters</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search within chunks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filtered.length} match{filtered.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Chunks list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{search ? "No chunks match your search" : "No chunks found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((chunk, i) => (
            <ChunkCard key={chunk.id} chunk={chunk} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
