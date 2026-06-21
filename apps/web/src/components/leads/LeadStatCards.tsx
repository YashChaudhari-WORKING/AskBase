import { Users, UserCheck, AlertCircle, TrendingUp } from "lucide-react";
import type { Lead } from "./types";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color} bg-current/10`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{value.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  leads: Lead[];
  flowCount: number;
}

export function LeadStatCards({ leads, flowCount }: Props) {
  const totalComplete = leads.filter(l => !l.isPartial).length;
  const totalPartial  = leads.filter(l => l.isPartial).length;
  const totalWon      = leads.filter(l => l.status === "won").length;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total leads"
        value={leads.length}
        color="text-primary"
        sub={`${flowCount} flow${flowCount !== 1 ? "s" : ""}`}
      />
      <StatCard
        icon={UserCheck}
        label="Completed"
        value={totalComplete}
        color="text-emerald-500"
        sub={leads.length ? `${Math.round((totalComplete / leads.length) * 100)}% completion rate` : undefined}
      />
      <StatCard
        icon={AlertCircle}
        label="Partial"
        value={totalPartial}
        color="text-amber-500"
        sub="Dropped off"
      />
      <StatCard
        icon={TrendingUp}
        label="Won"
        value={totalWon}
        color="text-violet-500"
        sub={totalComplete ? `${Math.round((totalWon / totalComplete) * 100)}% win rate` : undefined}
      />
    </div>
  );
}
