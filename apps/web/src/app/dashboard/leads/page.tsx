"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, X, ChevronUp, Inbox, Workflow } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LeadStatCards } from "@/components/leads/LeadStatCards";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { ALL_STATUSES, STATUS_CFG, type Lead, type Flow, type LeadStatus } from "@/components/leads/types";
import api from "@/lib/api";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

export default function AllLeadsPage() {
  const [flows, setFlows]       = useState<Flow[]>([]);
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Filters
  const [tab, setTab]               = useState<"completed" | "partial">("completed");
  const [flowFilter, setFlowFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    api.get("/flows").then(async r => {
      const flowList: Flow[] = r.data.data ?? [];
      setFlows(flowList);
      const all = (await Promise.all(
        flowList.map(f =>
          api.get(`/flows/${f.id}/leads`)
            .then(lr => (lr.data.data ?? []).map((l: Lead) => ({ ...l, flowName: f.name })))
            .catch(() => [])
        )
      )).flat() as Lead[];
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(all);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = tab === "partial" ? leads.filter(l => l.isPartial) : leads.filter(l => !l.isPartial);
    if (flowFilter !== "all")   r = r.filter(l => l.flowId === flowFilter);
    if (statusFilter !== "all") r = r.filter(l => l.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l =>
        Object.values(l.data).some(v => String(v ?? "").toLowerCase().includes(q)) ||
        (l.flowName ?? "").toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        (l.utmSource ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [leads, tab, flowFilter, statusFilter, search]);

  function handleStatusChange(leadId: string, flowId: string, status: LeadStatus) {
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status } : l));
    if (activeLead?.id === leadId) setActiveLead(p => p ? { ...p, status } : p);
    api.patch(`/flows/${flowId}/leads/${leadId}`, { status }).catch(() => {});
  }

  function handleLeadUpdate(leadId: string, patch: Partial<Lead>) {
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, ...patch } : l));
    if (activeLead?.id === leadId) setActiveLead(p => p ? { ...p, ...patch } : p);
  }

  const [showStats, setShowStats] = useState(true);

  const totalComplete = leads.filter(l => !l.isPartial).length;
  const totalPartial  = leads.filter(l => l.isPartial).length;
  const hasFilters    = flowFilter !== "all" || statusFilter !== "all" || search !== "";

  usePageHeader(
    <PageHeaderBar
      icon={Inbox}
      tone="primary"
      title="Leads"
      stats={[
        { icon: Inbox, value: leads.length, label: leads.length === 1 ? "lead" : "leads" },
        { icon: Workflow, value: flows.length, label: flows.length === 1 ? "flow" : "flows" },
      ]}
      actions={
        <button
          onClick={() => setShowStats(s => !s)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors"
        >
          <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${showStats ? "" : "rotate-180"}`} />
          {showStats ? "Hide stats" : "Show stats"}
        </button>
      }
    />,
    [showStats, leads.length, flows.length],
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-auto px-7 py-6 space-y-5 min-h-0">
        {/* Stats */}
        {showStats && <LeadStatCards leads={leads} flowCount={flows.length} />}

        {/* Table — filterSlot merges filters + actions into one line */}
        <LeadsTable
          leads={filtered}
          loading={loading}
          onRowClick={setActiveLead}
          onStatusChange={handleStatusChange}
          filterSlot={
            <>
              {/* Tabs */}
              <div className="flex bg-muted border border-border rounded-xl p-1 flex-shrink-0">
                <button onClick={() => setTab("completed")}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === "completed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  Completed ({totalComplete})
                </button>
                <button onClick={() => setTab("partial")}
                  className={`px-3 h-8 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === "partial" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  Partial ({totalPartial})
                </button>
              </div>

              {/* Flow filter */}
              <Select value={flowFilter} onValueChange={setFlowFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs flex-shrink-0">
                  <SelectValue placeholder="All flows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All flows</SelectItem>
                  {flows.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs flex-shrink-0">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} />
                        {STATUS_CFG[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative min-w-[180px] max-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-8 h-9 text-xs"
                />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {hasFilters && (
                <button
                  onClick={() => { setFlowFilter("all"); setStatusFilter("all"); setSearch(""); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1.5 hover:bg-accent transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </>
          }
        />
      </div>

      {activeLead && (
        <LeadDrawer
          lead={activeLead}
          onClose={() => setActiveLead(null)}
          onUpdate={patch => handleLeadUpdate(activeLead.id, patch)}
        />
      )}
    </div>
  );
}
