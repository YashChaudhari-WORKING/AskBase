interface IconProps { size?: number; className?: string }

/* ── Start ── emerald #10b981 ──────────────────────────────────────── */
export function StartIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes si-spin { to { stroke-dashoffset: -126; } }
        .si-arc { animation: si-spin 3s linear infinite; }
      `}</style>
      {/* bg */}
      <circle cx="20" cy="20" r="18" fill="#10b981" fillOpacity="0.12"/>
      {/* spinning dashed ring */}
      <circle className="si-arc" cx="20" cy="20" r="15" stroke="#10b981" strokeWidth="1.5"
              strokeDasharray="8 4" strokeLinecap="round" strokeOpacity="0.4"/>
      {/* solid inner */}
      <circle cx="20" cy="20" r="11" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5"/>
      {/* play triangle */}
      <path d="M17 15.5 L17 24.5 L26 20 Z" fill="#10b981"/>
    </svg>
  );
}

/* ── Message ── blue #3b82f6 ─────────────────────────────────────── */
export function MessageIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes mi-dot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-3px)} }
        .mi-d1{animation:mi-dot 1.4s ease-in-out 0s   infinite}
        .mi-d2{animation:mi-dot 1.4s ease-in-out .2s  infinite}
        .mi-d3{animation:mi-dot 1.4s ease-in-out .4s  infinite}
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#3b82f6" fillOpacity="0.12"/>
      {/* bubble body */}
      <path d="M7 12 C7 9.2 9.2 7 12 7 L28 7 C30.8 7 33 9.2 33 12 L33 22
               C33 24.8 30.8 27 28 27 L22.5 27 L18 33 L16 27 L12 27
               C9.2 27 7 24.8 7 22 Z"
            fill="#3b82f6" fillOpacity="0.14" stroke="#3b82f6" strokeWidth="1.6" strokeLinejoin="round"/>
      {/* typing dots */}
      <circle className="mi-d1" cx="14" cy="17" r="2.2" fill="#3b82f6"/>
      <circle className="mi-d2" cx="20" cy="17" r="2.2" fill="#3b82f6"/>
      <circle className="mi-d3" cx="26" cy="17" r="2.2" fill="#3b82f6"/>
    </svg>
  );
}

/* ── Collect ── violet #8b5cf6 ───────────────────────────────────── */
export function CollectIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes ci-blink { 0%,100%{opacity:1} 49%{opacity:1} 50%,99%{opacity:0} }
        @keyframes ci-fill  { 0%{width:0} 60%{width:14px} 100%{width:14px} }
        .ci-cur { animation: ci-blink 1.1s step-start infinite }
        .ci-bar { animation: ci-fill 2s ease-out infinite }
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#8b5cf6" fillOpacity="0.12"/>
      {/* field 1 — active */}
      <rect x="8" y="9" width="24" height="7" rx="3.5" stroke="#8b5cf6" strokeWidth="1.6"/>
      <rect className="ci-bar" x="11" y="11.5" height="2" rx="1" fill="#8b5cf6" width="14"/>
      <rect className="ci-cur" x="26" y="11" width="1.5" height="3" rx="0.75" fill="#8b5cf6"/>
      {/* field 2 */}
      <rect x="8" y="20" width="24" height="7" rx="3.5" stroke="#8b5cf6" strokeWidth="1.6" strokeOpacity="0.5"/>
      <rect x="11" y="22.5" width="10" height="2" rx="1" fill="#8b5cf6" fillOpacity="0.35"/>
      {/* field 3 */}
      <rect x="8" y="31" width="24" height="7" rx="3.5" stroke="#8b5cf6" strokeWidth="1.6" strokeOpacity="0.25"/>
    </svg>
  );
}

/* ── Choice ── amber #f59e0b ─────────────────────────────────────── */
export function ChoiceIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes cho-sel {
          0%,100%{fill:#f59e0b;r:4}
          33%    {fill:#f59e0b;r:4}
          34%,66%{fill:none;r:3.5}
          67%    {fill:none;r:3.5}
        }
        .cho-a{animation:cho-sel 2.4s ease-in-out 0s infinite}
        .cho-b{animation:cho-sel 2.4s ease-in-out .8s infinite}
        .cho-c{animation:cho-sel 2.4s ease-in-out 1.6s infinite}
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#f59e0b" fillOpacity="0.12"/>
      {/* row 1 */}
      <circle className="cho-a" cx="11" cy="13" r="4" stroke="#f59e0b" strokeWidth="1.6"/>
      <rect x="18" y="11" width="16" height="4" rx="2" fill="#f59e0b" fillOpacity="0.3"/>
      {/* row 2 */}
      <circle className="cho-b" cx="11" cy="22" r="3.5" stroke="#f59e0b" strokeWidth="1.6"/>
      <rect x="18" y="20" width="12" height="4" rx="2" fill="#f59e0b" fillOpacity="0.3"/>
      {/* row 3 */}
      <circle className="cho-c" cx="11" cy="31" r="3.5" stroke="#f59e0b" strokeWidth="1.6"/>
      <rect x="18" y="29" width="14" height="4" rx="2" fill="#f59e0b" fillOpacity="0.3"/>
    </svg>
  );
}

/* ── Lead Save ── green #22c55e ──────────────────────────────────── */
export function LeadSaveIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes ls-drop { 0%{transform:translateY(-6px);opacity:0} 40%{opacity:1} 80%{transform:translateY(4px);opacity:0} 100%{opacity:0} }
        .ls-p1{animation:ls-drop 1.8s ease-in 0s   infinite}
        .ls-p2{animation:ls-drop 1.8s ease-in .55s infinite}
        .ls-p3{animation:ls-drop 1.8s ease-in 1.1s infinite}
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#22c55e" fillOpacity="0.12"/>
      {/* person head */}
      <circle cx="20" cy="11" r="4.5" stroke="#22c55e" strokeWidth="1.6"/>
      {/* person shoulders */}
      <path d="M10 24 C10 19 14 17 20 17 C26 17 30 19 30 24" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round"/>
      {/* save bar */}
      <rect x="10" y="28" width="20" height="5" rx="2.5" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.4"/>
      {/* falling data dots */}
      <circle className="ls-p1" cx="17" cy="26" r="1.5" fill="#22c55e"/>
      <circle className="ls-p2" cx="20" cy="26" r="1.5" fill="#22c55e"/>
      <circle className="ls-p3" cx="23" cy="26" r="1.5" fill="#22c55e"/>
    </svg>
  );
}

/* ── Webhook ── rose #f43f5e ─────────────────────────────────────── */
export function WebhookIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes wh-send {
          0%{transform:translate(0,0);opacity:1}
          70%{transform:translate(6px,-6px);opacity:0}
          71%{transform:translate(0,0);opacity:0}
          100%{opacity:1}
        }
        @keyframes wh-pulse { 0%,100%{strokeOpacity:.5;r:5} 50%{strokeOpacity:0;r:9} }
        .wh-arrow { animation: wh-send 1.8s ease-in-out infinite }
        .wh-ring  { animation: wh-pulse 1.8s ease-out infinite }
        .wh-r2    { animation-delay:.5s }
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#f43f5e" fillOpacity="0.12"/>
      {/* network node left */}
      <circle cx="10" cy="28" r="3.5" stroke="#f43f5e" strokeWidth="1.6"/>
      {/* network node right */}
      <circle cx="30" cy="28" r="3.5" stroke="#f43f5e" strokeWidth="1.6"/>
      {/* connection lines */}
      <line x1="13" y1="26" x2="20" y2="21" stroke="#f43f5e" strokeWidth="1.4" strokeOpacity="0.5"/>
      <line x1="27" y1="26" x2="20" y2="21" stroke="#f43f5e" strokeWidth="1.4" strokeOpacity="0.5"/>
      {/* hub */}
      <circle cx="20" cy="19" r="3" fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="1.6"/>
      {/* send arrow */}
      <g className="wh-arrow">
        <line x1="20" y1="15" x2="20" y2="7" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="16,11 20,7 24,11" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

/* ── Google Sheet ── green #16a34a ───────────────────────────────── */
export function GoogleSheetIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes gs-row { 0%,100%{opacity:0.3} 33%{opacity:1} }
        .gs-r1{animation:gs-row 1.8s ease-in-out 0s   infinite}
        .gs-r2{animation:gs-row 1.8s ease-in-out .6s  infinite}
        .gs-r3{animation:gs-row 1.8s ease-in-out 1.2s infinite}
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#16a34a" fillOpacity="0.12"/>
      {/* sheet outline */}
      <rect x="8" y="7" width="24" height="26" rx="3" stroke="#16a34a" strokeWidth="1.6"/>
      {/* header row */}
      <rect x="8" y="7" width="24" height="7" rx="3" fill="#16a34a" fillOpacity="0.25"/>
      {/* vertical divider */}
      <line x1="18" y1="14" x2="18" y2="33" stroke="#16a34a" strokeWidth="1.2" strokeOpacity="0.4"/>
      {/* animated data rows */}
      <rect className="gs-r1" x="10" y="17" width="6" height="2.5" rx="1" fill="#16a34a"/>
      <rect className="gs-r1" x="20" y="17" width="10" height="2.5" rx="1" fill="#16a34a"/>
      <rect className="gs-r2" x="10" y="22" width="6" height="2.5" rx="1" fill="#16a34a"/>
      <rect className="gs-r2" x="20" y="22" width="8"  height="2.5" rx="1" fill="#16a34a"/>
      <rect className="gs-r3" x="10" y="27" width="6" height="2.5" rx="1" fill="#16a34a"/>
      <rect className="gs-r3" x="20" y="27" width="11" height="2.5" rx="1" fill="#16a34a"/>
    </svg>
  );
}

/* ── End ── slate #64748b ────────────────────────────────────────── */
export function EndIcon({ size = 32, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes ei-ring { 0%{stroke-dashoffset:113;opacity:0} 10%{opacity:.9} 80%{stroke-dashoffset:0;opacity:.9} 100%{stroke-dashoffset:0;opacity:0} }
        @keyframes ei-chk  { 0%,45%{stroke-dashoffset:26} 85%,100%{stroke-dashoffset:0} }
        .ei-ring { animation: ei-ring 2.6s ease-in-out infinite }
        .ei-chk  { animation: ei-chk  2.6s ease-in-out infinite }
      `}</style>
      <circle cx="20" cy="20" r="18" fill="#64748b" fillOpacity="0.12"/>
      {/* static bg ring */}
      <circle cx="20" cy="20" r="12" stroke="#64748b" strokeWidth="1.4" strokeOpacity="0.2"/>
      {/* animated fill ring */}
      <circle className="ei-ring" cx="20" cy="20" r="12"
              stroke="#64748b" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="75.4" strokeDashoffset="75.4"/>
      {/* checkmark */}
      <polyline className="ei-chk" points="13,20 18,25.5 27,14"
                stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="26" strokeDashoffset="26"/>
    </svg>
  );
}
