export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface Lead {
  id: string;
  flowId: string;
  flowName?: string;
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

export interface Flow {
  id: string;
  name: string;
}

export const STATUS_CFG: Record<LeadStatus, { label: string; dot: string; badge: string }> = {
  new:       { label: "New",       dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  contacted: { label: "Contacted", dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  qualified: { label: "Qualified", dot: "bg-violet-500",  badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  won:       { label: "Won",       dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  lost:      { label: "Lost",      dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

export const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
