import { cn } from "@/lib/utils";

type P = { className?: string };

const s = { stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

/* Overview — 2×2 squares */
export function OverviewIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={cn("overflow-visible", className)} {...s}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"
        className="transition-transform duration-200 group-hover:-translate-x-[1.5px] group-hover:-translate-y-[1.5px]" />
      <rect x="14" y="3" width="7" height="7" rx="1.5"
        className="transition-transform duration-200 group-hover:translate-x-[1.5px] group-hover:-translate-y-[1.5px]" />
      <rect x="3" y="14" width="7" height="7" rx="1.5"
        className="transition-transform duration-200 group-hover:-translate-x-[1.5px] group-hover:translate-y-[1.5px]" />
      <rect x="14" y="14" width="7" height="7" rx="1.5"
        className="transition-transform duration-200 group-hover:translate-x-[1.5px] group-hover:translate-y-[1.5px]" />
    </svg>
  );
}

/* Assistants — CPU chip */
export function BotsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
      <rect x="7" y="7" width="10" height="10" rx="2"
        className="transition-transform duration-300 origin-[12px_12px] group-hover:scale-90" />
      {/* top pins */}
      <line x1="9" y1="4" x2="9" y2="7" /><line x1="12" y1="4" x2="12" y2="7" /><line x1="15" y1="4" x2="15" y2="7" />
      {/* bottom pins */}
      <line x1="9" y1="17" x2="9" y2="20" /><line x1="12" y1="17" x2="12" y2="20" /><line x1="15" y1="17" x2="15" y2="20" />
      {/* left pins */}
      <line x1="4" y1="9" x2="7" y2="9" /><line x1="4" y1="12" x2="7" y2="12" /><line x1="4" y1="15" x2="7" y2="15" />
      {/* right pins */}
      <line x1="17" y1="9" x2="20" y2="9" /><line x1="17" y1="12" x2="20" y2="12" /><line x1="17" y1="15" x2="20" y2="15" />
    </svg>
  );
}

/* Knowledge — 3 stacked layers */
export function KnowledgeIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      <ellipse cx="12" cy="5" rx="8" ry="2.5" />
      <path d="M4 5v4.5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
      <path d="M4 9.5V14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V9.5"
        className="transition-transform duration-200 group-hover:translate-y-[1px]" />
      <path d="M4 14v4.5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V14"
        className="transition-transform duration-200 group-hover:translate-y-[2px]" />
    </svg>
  );
}

/* Flows — left node branching to two right nodes */
export function FlowsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      <circle cx="5" cy="12" r="2.5" />
      <circle cx="19" cy="6.5" r="2.5" />
      <circle cx="19" cy="17.5" r="2.5" />
      <path d="M7.5 12h3l2.5-5.5h3.5"
        className="transition-transform duration-200 group-hover:translate-x-[1px]" />
      <path d="M7.5 12h3l2.5 5.5h3.5"
        className="transition-transform duration-200 group-hover:translate-x-[1px]" />
    </svg>
  );
}

/* Leads — clean person silhouette */
export function LeadsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"
        className="transition-transform duration-200 origin-[12px_8px] group-hover:scale-110" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

/* Conversations — speech bubble with 3 typing dots */
export function ConversationsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="8.5" cy="11" r="1" fill="currentColor" stroke="none"
        className="transition-transform duration-150 group-hover:-translate-y-[2px]"
        style={{ transitionDelay: "0ms" }} />
      <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"
        className="transition-transform duration-150 group-hover:-translate-y-[2px]"
        style={{ transitionDelay: "70ms" }} />
      <circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none"
        className="transition-transform duration-150 group-hover:-translate-y-[2px]"
        style={{ transitionDelay: "140ms" }} />
    </svg>
  );
}

/* Analytics — ascending bar chart */
export function AnalyticsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={cn("overflow-visible", className)} {...s}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="4" y="15" width="4" height="6" rx="1"
        className="transition-transform duration-200 group-hover:-translate-y-[2px]"
        style={{ transformOrigin: "6px 21px" }} />
      <rect x="10" y="10" width="4" height="11" rx="1"
        className="transition-transform duration-200 group-hover:-translate-y-[2px]"
        style={{ transformOrigin: "12px 21px", transitionDelay: "40ms" }} />
      <rect x="16" y="5" width="4" height="16" rx="1"
        className="transition-transform duration-200 group-hover:-translate-y-[2px]"
        style={{ transformOrigin: "18px 21px", transitionDelay: "80ms" }} />
    </svg>
  );
}

/* Widgets — embed/browser window */
export function WidgetsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      <rect x="2" y="3" width="20" height="18" rx="2.5" />
      <line x1="2" y1="8.5" x2="22" y2="8.5" />
      <circle cx="5.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 14l-2.5 2 2.5 2"
        className="transition-transform duration-200 group-hover:-translate-x-[1px]" />
      <path d="M14.5 14l2.5 2-2.5 2"
        className="transition-transform duration-200 group-hover:translate-x-[1px]" />
    </svg>
  );
}

/* Settings — proper cog, rotates on hover */
export function SettingsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <g className="transition-transform duration-500 group-hover:rotate-45"
        style={{ transformOrigin: "12px 12px" }}>
        <path
          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
          stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.65" />
      </g>
    </svg>
  );
}

/* Sign Out */
export function SignOutIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...s}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <g className="transition-transform duration-200 group-hover:translate-x-[3px]">
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </g>
    </svg>
  );
}

/* backward compat */
export function PlaygroundIcon({ className }: P) {
  return <WidgetsIcon className={className} />;
}
