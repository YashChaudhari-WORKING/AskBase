"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown,
  Search, Download, Columns, Trash2, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, Eye,
  MessageSquare, Tag, StickyNote, X, Check, Loader2,
  Users, UserCheck, TrendingUp, AlertCircle,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

interface Lead {
  id: string;
  flowId: string;
  data: Record<string, any>;
  status: LeadStatus;
  isPartial: boolean;
  tags: string[];
  conversation: { role: string; text: string }[];
  notes: string | null;
  sourceUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

interface FlowInfo {
  id: string;
  name: string;
  nodes: any[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new:        { label: "New",        color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  contacted:  { label: "Contacted",  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  qualified:  { label: "Qualified",  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  won:        { label: "Won",        color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  lost:       { label: "Lost",       color: "text-red-600 dark:text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status, onChange }: { status: LeadStatus; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const m = STATUS_META[status];
  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.bg} ${m.color} whitespace-nowrap`}
      >
        {m.label}
      </button>
      {open && (
        <div className="absolute z-50 top-7 left-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[120px]">
          {ALL_STATUSES.map(s => {
            const sm = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center gap-2 hover:bg-accent transition-colors ${s === status ? sm.color : "text-foreground"}`}
              >
                {s === status && <Check className="w-3 h-3" />}
                {s !== status && <span className="w-3" />}
                {sm.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Lead Drawer ─────────────────────────────────────────────────────────────

function LeadDrawer({ lead, fieldKeys, onClose, onUpdate }: {
  lead: Lead;
  fieldKeys: string[];
  onClose: () => void;
  onUpdate: (patch: Partial<Lead>) => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(lead.tags ?? []);
  const [savingNotes, setSavingNotes] = useState(false);
  const [tab, setTab] = useState<"fields" | "chat" | "meta">("fields");

  async function saveNotes() {
    setSavingNotes(true);
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { notes }).catch(() => {});
    onUpdate({ notes });
    setSavingNotes(false);
  }

  async function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed];
    setTags(next);
    setTagInput("");
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { tags: next }).catch(() => {});
    onUpdate({ tags: next });
  }

  async function removeTag(tag: string) {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { tags: next }).catch(() => {});
    onUpdate({ tags: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[440px] bg-card border-l border-border flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {lead.data?.name ?? lead.data?.full_name ?? "Lead"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(lead.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {lead.isPartial && <span className="ml-2 text-amber-500 font-medium">· Partial</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 flex-shrink-0">
          {(["fields", "chat", "meta"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition-colors capitalize ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "fields" ? "Fields" : t === "chat" ? "Chat replay" : "Source"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === "fields" && (
            <>
              {/* Field values */}
              <div className="space-y-2">
                {fieldKeys.filter(k => !k.startsWith("_") && lead.data[k] !== undefined).map(key => (
                  <div key={key} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-[11px] font-mono text-muted-foreground/60 pt-0.5 w-28 flex-shrink-0 truncate">{key}</span>
                    <span className="text-sm text-foreground font-medium break-words">{String(lead.data[key] ?? "—")}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addTag(tagInput); }}
                    placeholder="Add tag…"
                    className="px-2 py-0.5 text-xs bg-transparent border border-dashed border-border rounded-full outline-none placeholder:text-muted-foreground/40 text-foreground w-20 focus:border-primary/40"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <StickyNote className="w-3 h-3" /> Notes
                </p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add internal notes…"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors resize-none"
                />
                <button
                  onClick={saveNotes}
                  disabled={savingNotes || notes === (lead.notes ?? "")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save notes
                </button>
              </div>
            </>
          )}

          {tab === "chat" && (
            <div className="space-y-3">
              {lead.conversation.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 text-center py-8">No conversation recorded</p>
              ) : lead.conversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : msg.role === "error"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "meta" && (
            <div className="space-y-2">
              {[
                ["Source URL", lead.sourceUrl],
                ["UTM Source", lead.utmSource],
                ["UTM Medium", lead.utmMedium],
                ["UTM Campaign", lead.utmCampaign],
                ["Submitted", new Date(lead.createdAt).toLocaleString()],
              ].map(([label, val]) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-[11px] font-mono text-muted-foreground/60 pt-0.5 w-28 flex-shrink-0">{label}</span>
                  <span className="text-xs text-foreground break-all">{val || <span className="text-muted-foreground/30">—</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [flow, setFlow] = useState<FlowInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [tab, setTab] = useState<"all" | "partial">("all");

  // TanStack state
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showColPicker, setShowColPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/flows/${id}`),
      api.get(`/flows/${id}/leads`),
    ]).then(([flowRes, leadsRes]) => {
      setFlow(flowRes.data.data);
      setLeads(leadsRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  // Derive field keys from all leads' data
  const fieldKeys = useMemo(() => {
    const keys = new Set<string>();
    leads.forEach(l => Object.keys(l.data).filter(k => !k.startsWith("_")).forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [leads]);

  const filteredLeads = useMemo(() =>
    tab === "partial" ? leads.filter(l => l.isPartial) : leads.filter(l => !l.isPartial),
    [leads, tab]
  );

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status } : l));
    if (activeLead?.id === leadId) setActiveLead(prev => prev ? { ...prev, status } : prev);
    await api.patch(`/flows/${id}/leads/${leadId}`, { status }).catch(() => {});
  }

  function handleLeadUpdate(leadId: string, patch: Partial<Lead>) {
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, ...patch } : l));
    if (activeLead?.id === leadId) setActiveLead(prev => prev ? { ...prev, ...patch } : prev);
  }

  function exportCSV() {
    const selectedRows = table.getSelectedRowModel().rows;
    const rows = selectedRows.length > 0 ? selectedRows.map(r => r.original) : filteredLeads;
    const allKeys = ["id", "status", "isPartial", "createdAt", "sourceUrl", "utmSource", "utmMedium", "utmCampaign", ...fieldKeys];
    const header = allKeys.join(",");
    const body = rows.map(l => allKeys.map(k => {
      const val = k in l ? (l as any)[k] : l.data[k];
      return `"${String(val ?? "").replace(/"/g, '""')}"`;
    }).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${flow?.name ?? "leads"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    {
      id: "select",
      size: 40,
      header: ({ table }) => (
        <input type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="accent-primary cursor-pointer" />
      ),
      cell: ({ row }) => (
        <input type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()}
          className="accent-primary cursor-pointer" />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ row }) => (
        <StatusPill
          status={row.original.status}
          onChange={s => handleStatusChange(row.original.id, s)}
        />
      ),
      filterFn: (row, _, value) => !value || row.original.status === value,
    },
    // Dynamic field columns
    ...fieldKeys.map(key => ({
      id: `field_${key}`,
      header: key,
      size: 160,
      accessorFn: (row: Lead) => row.data[key] ?? "",
      cell: ({ getValue }: any) => (
        <span className="truncate block max-w-[150px]">{String(getValue() ?? "")}</span>
      ),
    } as ColumnDef<Lead>)),
    {
      accessorKey: "tags",
      header: "Tags",
      size: 140,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.tags ?? []).slice(0, 2).map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{t}</span>
          ))}
          {(row.original.tags ?? []).length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{row.original.tags.length - 2}</span>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "isPartial",
      header: "Type",
      size: 80,
      cell: ({ row }) => row.original.isPartial
        ? <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Partial</span>
        : <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Complete</span>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Submitted
          {column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" />
            : column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" />
            : <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      size: 140,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      accessorKey: "utmSource",
      header: "UTM Source",
      size: 110,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.utmSource ?? "—"}</span>,
    },
    {
      id: "chat",
      header: "",
      size: 36,
      cell: ({ row }) => row.original.conversation.length > 0
        ? <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40" />
        : null,
      enableSorting: false,
    },
  ], [fieldKeys, leads]);

  const table = useReactTable({
    data: filteredLeads,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const completedCount = leads.filter(l => !l.isPartial).length;
  const partialCount = leads.filter(l => l.isPartial).length;
  const wonCount = leads.filter(l => l.status === "won").length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-[400px] bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border flex-shrink-0 bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/flows/${id}`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {flow?.name ?? "Flow"}
          </button>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-sm font-semibold text-foreground">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {selectedCount > 0 ? `Export ${selectedCount}` : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Users,       label: "Total leads",  value: leads.length,      color: "text-primary" },
            { icon: UserCheck,   label: "Completed",    value: completedCount,    color: "text-emerald-500" },
            { icon: AlertCircle, label: "Partial",      value: partialCount,      color: "text-amber-500" },
            { icon: TrendingUp,  label: "Won",          value: wonCount,          color: "text-violet-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className={`w-4 h-4 ${color}`} style={{ opacity: 1 }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex bg-muted rounded-lg p-0.5 border border-border">
            <button onClick={() => setTab("all")}
              className={`px-3 h-7 rounded-md text-xs font-medium transition-all ${tab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              All ({leads.filter(l => !l.isPartial).length})
            </button>
            <button onClick={() => setTab("partial")}
              className={`px-3 h-7 rounded-md text-xs font-medium transition-all ${tab === "partial" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Partial ({partialCount})
            </button>
          </div>

          {/* Status filter */}
          <select
            value={(columnFilters.find(f => f.id === "status")?.value as string) ?? ""}
            onChange={e => {
              setColumnFilters(prev => {
                const without = prev.filter(f => f.id !== "status");
                return e.target.value ? [...without, { id: "status", value: e.target.value }] : without;
              });
            }}
            className="h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>

          {/* Global search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search leads…"
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Column visibility */}
            <div className="relative">
              <button
                onClick={() => setShowColPicker(o => !o)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Columns className="w-3.5 h-3.5" /> Columns
              </button>
              {showColPicker && (
                <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-xl p-2 min-w-[160px] space-y-0.5">
                  {table.getAllLeafColumns().filter(c => c.id !== "select" && c.id !== "chat").map(col => (
                    <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent cursor-pointer text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                        className="accent-primary"
                      />
                      {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id.replace("field_", "")}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="border-b border-border bg-muted/30">
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={header.column.getCanSort() ? "cursor-pointer select-none flex items-center gap-1 hover:text-foreground transition-colors" : ""}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && header.column.id !== "createdAt" && (
                              header.column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" />
                              : header.column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" />
                              : <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-20 text-center text-muted-foreground/50 text-sm">
                      {globalFilter ? "No leads match your search" : "No leads yet — run your flow to collect leads"}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setActiveLead(row.original)}
                      className={`border-b border-border/50 last:border-0 hover:bg-accent/40 cursor-pointer transition-colors ${row.getIsSelected() ? "bg-primary/5" : ""}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {table.getFilteredRowModel().rows.length} lead{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
              {selectedCount > 0 && ` · ${selectedCount} selected`}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => table.setPageSize(Number(e.target.value))}
                className="ml-2 h-7 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none"
              >
                {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s} / page</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Drawer */}
      {activeLead && (
        <LeadDrawer
          lead={activeLead}
          fieldKeys={fieldKeys}
          onClose={() => setActiveLead(null)}
          onUpdate={patch => handleLeadUpdate(activeLead.id, patch)}
        />
      )}
    </div>
  );
}
