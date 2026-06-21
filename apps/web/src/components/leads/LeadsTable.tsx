"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MessageSquare, Workflow, Users, Eye, EyeOff, Columns3, X, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { timeAgo, type Lead, type LeadStatus } from "./types";

// ── Frozen column geometry ────────────────────────────────────────────────────
const W = { select: 48, status: 130, contact: 200 };
const L = { select: 0, status: W.select, contact: W.select + W.status };

const FROZEN = new Set(["select", "status", "contact"]);

function frozenLeft(id: string) {
  if (id === "select")  return L.select;
  if (id === "status")  return L.status;
  if (id === "contact") return L.contact;
  return undefined;
}

// ── Column visibility picker ──────────────────────────────────────────────────

function ColumnPicker({ table }: { table: ReturnType<typeof useReactTable<Lead>> }) {
  const [open, setOpen] = useState(false);
  const cols = table.getAllLeafColumns().filter(c => !["select", "chat"].includes(c.id));
  const hiddenCount = cols.filter(c => !c.getIsVisible()).length;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(o => !o)} className="gap-2 h-9">
        <Columns3 className="w-3.5 h-3.5" />
        Columns
        {hiddenCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{hiddenCount}</Badge>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 bg-popover border border-border rounded-xl shadow-2xl p-2 w-52">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 py-1.5">
              Toggle columns
            </p>
            {cols.map(col => {
              const label = typeof col.columnDef.header === "string"
                ? col.columnDef.header
                : col.id.replace("field_", "");
              return (
                <label key={col.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent cursor-pointer">
                  <input type="checkbox" checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-foreground font-medium flex-1 capitalize">{label}</span>
                  {col.getIsVisible()
                    ? <Eye className="w-3.5 h-3.5 text-muted-foreground/30" />
                    : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  leads: Lead[];
  loading: boolean;
  onRowClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, flowId: string, status: LeadStatus) => void;
  filterSlot?: React.ReactNode;
}

export function LeadsTable({ leads, loading, onRowClick, onStatusChange, filterSlot }: Props) {
  const router = useRouter();
  const [sorting, setSorting]               = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection]     = useState<RowSelectionState>({});
  const [density, setDensity]               = useState<"compact" | "comfortable">("comfortable");

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    {
      id: "select",
      size: W.select,
      enableSorting: false,
      header: ({ table }) => (
        <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={e => e.stopPropagation()} />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: W.status,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status}
          onChange={s => onStatusChange(row.original.id, row.original.flowId, s)} />
      ),
    },
    {
      id: "contact",
      header: "Contact",
      size: W.contact,
      accessorFn: r =>
        r.data?.name ?? r.data?.full_name ?? r.data?.email ?? r.data?.phone
        ?? Object.values(r.data)[0] ?? "",
      cell: ({ row, getValue }) => {
        const primary = String(getValue());
        const email   = row.original.data?.email ?? "";
        return (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{primary || "—"}</p>
            {email && primary !== email && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "flowName",
      header: "Flow",
      size: 160,
      cell: ({ row }) => (
        <button
          onClick={e => { e.stopPropagation(); router.push(`/dashboard/flows/${row.original.flowId}/leads`); }}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium max-w-[148px] truncate"
        >
          <Workflow className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{row.original.flowName}</span>
        </button>
      ),
    },
    {
      accessorKey: "tags",
      header: "Tags",
      size: 148,
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.original.tags ?? [];
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {t.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{tag}</span>
            ))}
            {t.length > 2 && <span className="text-[10px] text-muted-foreground font-medium">+{t.length - 2}</span>}
            {t.length === 0 && <span className="text-muted-foreground/30 text-xs">—</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "isPartial",
      header: "Type",
      size: 96,
      cell: ({ row }) => row.original.isPartial
        ? <Badge variant="warning"  className="text-[10px] h-5 font-semibold">Partial</Badge>
        : <Badge variant="success"  className="text-[10px] h-5 font-semibold">Complete</Badge>,
    },
    {
      accessorKey: "utmSource",
      header: "UTM Source",
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.original.utmSource ?? <span className="opacity-30">—</span>}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      size: 130,
      cell: ({ row }) => (
        <div>
          <p className="text-xs text-foreground font-medium">{timeAgo(row.original.createdAt)}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {new Date(row.original.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      ),
    },
    {
      id: "chat",
      header: "",
      size: 40,
      enableSorting: false,
      cell: ({ row }) => row.original.conversation.length > 0
        ? <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/30" />
        : null,
    },
  ], [leads, router]);

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const rowPad = density === "compact" ? "py-2" : "py-3";

  function exportCSV() {
    const rows = selectedCount > 0
      ? leads.filter((_, i) => rowSelection[i])
      : leads;
    const dataKeys = Array.from(new Set(rows.flatMap(l => Object.keys(l.data).filter(k => !k.startsWith("_")))));
    const base = ["id", "flowName", "status", "isPartial", "createdAt", "utmSource", "utmMedium", "utmCampaign", "sourceUrl"];
    const allKeys = [...base, ...dataKeys];
    const csv = [
      allKeys.join(","),
      ...rows.map(l => allKeys.map(k => `"${String(k in l ? (l as any)[k] : (l.data[k] ?? "")).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-3">
      {/* Single unified toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter slot from parent */}
        {filterSlot}

        {/* Divider */}
        {filterSlot && <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />}

        {/* Table-level actions */}
        <div className="flex items-center gap-2 ml-auto">
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-9 text-xs">
              Export {selectedCount} selected
            </Button>
          )}
          <Button variant="outline" size="sm"
            onClick={() => setDensity(d => d === "compact" ? "comfortable" : "compact")}
            className="h-9 text-xs">
            {density === "compact" ? "Compact" : "Comfortable"}
          </Button>
          <ColumnPicker table={table} />
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-9 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 900 }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="bg-muted/50 border-b border-border">
                    {hg.headers.map(header => {
                      const frozen = FROZEN.has(header.id);
                      const left   = frozenLeft(header.id);
                      const isLastFrozen = header.id === "contact";
                      return (
                        <th key={header.id}
                          style={{ width: header.getSize(), ...(frozen ? { left, position: "sticky", zIndex: 30 } : {}) }}
                          className={[
                            "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap",
                            frozen && "bg-muted/50 backdrop-blur-sm",
                            isLastFrozen && "border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.12)]",
                          ].filter(Boolean).join(" ")}>
                          {!header.isPlaceholder && (
                            <div
                              onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                              className={header.column.getCanSort() ? "flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors select-none" : ""}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                header.column.getIsSorted() === "asc"  ? <ArrowUp className="w-3 h-3" />
                                : header.column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" />
                                : <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground/40">
                        <Users className="w-10 h-10" />
                        <div className="text-center">
                          <p className="text-sm font-semibold">No leads found</p>
                          <p className="text-xs mt-1">Adjust your filters or complete a flow to collect leads</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} onClick={() => onRowClick(row.original)}
                      className={`group border-b border-border/50 last:border-0 hover:bg-accent/30 cursor-pointer transition-colors ${row.getIsSelected() ? "bg-primary/5" : ""}`}>
                      {row.getVisibleCells().map(cell => {
                        const frozen = FROZEN.has(cell.column.id);
                        const left   = frozenLeft(cell.column.id);
                        const isLastFrozen = cell.column.id === "contact";
                        return (
                          <td key={cell.id}
                            style={{ width: cell.column.getSize(), ...(frozen ? { left, position: "sticky", zIndex: 10 } : {}) }}
                            className={[
                              `px-4 ${rowPad}`,
                              frozen && "bg-card group-hover:bg-accent/30 transition-colors",
                              row.getIsSelected() && frozen && "bg-primary/5",
                              isLastFrozen && "border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]",
                            ].filter(Boolean).join(" ")}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <span className="text-sm text-muted-foreground font-medium">
              {leads.length.toLocaleString()} lead{leads.length !== 1 ? "s" : ""}
              {selectedCount > 0 && (
                <span className="text-primary font-semibold"> · {selectedCount} selected</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground font-medium px-3 tabular-nums">
                {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
              </span>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
              <Select value={String(table.getState().pagination.pageSize)} onValueChange={v => table.setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[110px] text-xs ml-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(s => <SelectItem key={s} value={String(s)}>{s} per page</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
