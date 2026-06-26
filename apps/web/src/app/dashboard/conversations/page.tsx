"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  MessageSquare,
  Search,
  UserRoundCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Inbox,
  Globe,
  Mail,
  MessageCircle,
  Instagram,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bot,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface Conversation {
  id: string;
  status: "open" | "assigned" | "resolved" | "closed";
  channel: "widget" | "whatsapp" | "email" | "instagram";
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customerName: string | null;
  customerEmail: string | null;
  lastMessage: { preview: string; senderType: "customer" | "ai" | "agent" } | null;
}

type FilterTab = "all" | "open" | "assigned" | "resolved" | "closed";
type BadgeVariant = "success" | "default" | "secondary" | "destructive" | "outline" | "warning";

const STATUS_CONFIG: Record<Conversation["status"], { label: string; variant: BadgeVariant; icon: React.ElementType }> = {
  open:     { label: "Active",   variant: "success",   icon: MessageSquare },
  assigned: { label: "Handoff",  variant: "warning",   icon: UserRoundCheck },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
  closed:   { label: "Closed",   variant: "outline",   icon: XCircle },
};

const CHANNEL_CONFIG: Record<Conversation["channel"], { label: string; icon: React.ElementType }> = {
  widget:    { label: "Widget",    icon: MessageCircle },
  whatsapp:  { label: "WhatsApp",  icon: Globe },
  email:     { label: "Email",     icon: Mail },
  instagram: { label: "Instagram", icon: Instagram },
};

const SENDER_ICON: Record<string, React.ElementType> = {
  ai: Bot,
  agent: User,
  customer: User,
};

const TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: "all",      label: "All",      icon: Inbox },
  { key: "open",     label: "Active",   icon: MessageSquare },
  { key: "assigned", label: "Handoff",  icon: AlertTriangle },
  { key: "resolved", label: "Resolved", icon: CheckCircle2 },
  { key: "closed",   label: "Closed",   icon: XCircle },
];

function initials(name: string | null, email: string | null) {
  if (name) return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

const col = createColumnHelper<Conversation>();

export default function ConversationsPage() {
  const router = useRouter();
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    api.get("/chat")
      .then(res => setData(res.data?.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Tab filter applied before passing to table
  const tabFiltered = useMemo(
    () => tab === "all" ? data : data.filter(c => c.status === tab),
    [data, tab]
  );

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: data.length, open: 0, assigned: 0, resolved: 0, closed: 0 };
    data.forEach(cv => { c[cv.status] = (c[cv.status] ?? 0) + 1; });
    return c;
  }, [data]);

  const columns = useMemo(() => [
    col.accessor(row => ({ name: row.customerName, email: row.customerEmail, id: row.id }), {
      id: "customer",
      header: "Customer",
      enableSorting: false,
      cell: info => {
        const { name, email, id } = info.getValue();
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 text-xs border border-border shrink-0">
              <AvatarFallback className="bg-muted text-muted-foreground text-[11px]">
                {initials(name, email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {name ?? email ?? "Unknown"}
              </p>
              {email && name && (
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              )}
              <p className="text-[10px] text-muted-foreground/50 font-mono">#{id.slice(0, 8)}</p>
            </div>
          </div>
        );
      },
    }),

    col.accessor("lastMessage", {
      header: "Last message",
      enableSorting: false,
      cell: info => {
        const msg = info.getValue();
        if (!msg) return <p className="text-sm text-muted-foreground/40 italic">No messages yet</p>;
        const SIcon = SENDER_ICON[msg.senderType] ?? User;
        return (
          <div className="flex items-start gap-1.5 max-w-[400px]">
            {msg.senderType !== "customer" && (
              <span className={`text-[10px] font-semibold shrink-0 mt-0.5
                ${msg.senderType === "ai" ? "text-primary" : "text-blue-500"}`}>
                {msg.senderType === "ai" ? "AI" : "Agent"}
              </span>
            )}
            <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
          </div>
        );
      },
    }),

    col.accessor("status", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting()}
        >
          Status
          {column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: info => {
        const cfg = STATUS_CONFIG[info.getValue()];
        const Icon = cfg.icon;
        return (
          <Badge variant={cfg.variant} className="gap-1 text-xs whitespace-nowrap">
            <Icon className="w-3 h-3" />
            {cfg.label}
          </Badge>
        );
      },
    }),

    col.accessor("channel", {
      header: "Channel",
      enableSorting: false,
      cell: info => {
        const cfg = CHANNEL_CONFIG[info.getValue()];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </div>
        );
      },
    }),

    col.accessor("updatedAt", {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto"
          onClick={() => column.toggleSorting()}
        >
          Last activity
          {column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: info => (
        <p className="text-xs text-muted-foreground text-right">
          {formatDistanceToNow(new Date(info.getValue()), { addSuffix: true })}
        </p>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: tabFiltered,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const q = filterValue.toLowerCase();
      const r = row.original;
      return (
        r.id.includes(q) ||
        (r.customerName?.toLowerCase().includes(q) ?? false) ||
        (r.customerEmail?.toLowerCase().includes(q) ?? false) ||
        (r.lastMessage?.preview.toLowerCase().includes(q) ?? false) ||
        (r.subject?.toLowerCase().includes(q) ?? false)
      );
    },
  });

  usePageHeader(
    <PageHeaderBar
      icon={MessageSquare}
      tone="primary"
      title="Conversations"
      stats={[{ icon: Inbox, value: counts.all ?? 0, label: "total" }]}
    />,
    [counts.all],
  );

  return (
    <div className="p-8 pt-4">
      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as FilterTab)} className="mb-4">
        <TabsList className="h-9">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs px-3">
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {counts[t.key] > 0 && (
                  <span className="ml-1 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                    {counts[t.key]}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search customer, email, or message…"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id} className="hover:bg-transparent border-border">
                  {hg.headers.map(header => (
                    <TableHead key={header.id} className="text-xs font-medium text-muted-foreground h-10">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MessageSquare className="w-9 h-9 opacity-30" />
                      <p className="text-sm font-medium">No conversations found</p>
                      <p className="text-xs opacity-60">
                        {globalFilter ? "Try a different search term" : "Conversations will appear here once customers start chatting"}
                      </p>
                    </div>
                  </td>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors border-border"
                    onClick={() => router.push(`/dashboard/conversations/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Row count */}
      {!loading && table.getRowModel().rows.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-right">
          {table.getRowModel().rows.length} of {tabFiltered.length} conversations
        </p>
      )}
    </div>
  );
}
