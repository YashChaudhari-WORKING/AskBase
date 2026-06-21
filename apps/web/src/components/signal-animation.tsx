/* Signal Animation — draw once, hold */

const R1 = 190, R2 = 110;
const C1 = +(2 * Math.PI * R1).toFixed(2);
const C2 = +(2 * Math.PI * R2).toFixed(2);

const CSS = `
@keyframes sa-outer {
  from { stroke-dashoffset: ${C1}; opacity: 0 }
  4%   { opacity: 1 }
  to   { stroke-dashoffset: 0; opacity: 1 }
}
@keyframes sa-inner {
  from { stroke-dashoffset: ${C2}; opacity: 0 }
  4%   { opacity: 1 }
  to   { stroke-dashoffset: 0; opacity: 1 }
}
@keyframes sa-dot-in {
  0%   { r: 0;    opacity: 0 }
  55%  { r: 22px; opacity: 1 }
  78%  { r: 15px }
  100% { r: 15px; opacity: 1 }
}
@keyframes sa-dot-breathe {
  0%, 100% { opacity: .75 }
  50%       { opacity: 1   }
}
.sa-outer {
  stroke-dasharray: ${C1};
  animation: sa-outer 2.2s cubic-bezier(.4,0,.2,1) forwards;
}
.sa-inner {
  stroke-dasharray: ${C2};
  animation: sa-inner 1.8s cubic-bezier(.4,0,.2,1) 2.4s both;
}
.sa-dot-in  { animation: sa-dot-in 0.65s cubic-bezier(.34,1.56,.64,1) 4.4s both; }
.sa-dot-idle {
  animation: sa-dot-in 0.65s cubic-bezier(.34,1.56,.64,1) 4.4s both,
             sa-dot-breathe 3s ease-in-out 5.1s infinite;
}
`;

export function SignalAnimation({ className = "" }: { className?: string }) {
  return (
    <>
      <style>{CSS}</style>
      <svg viewBox="0 0 500 500" fill="none" className={className} aria-hidden="true">
        <circle className="sa-outer" cx="250" cy="250" r={R1} stroke="#6366f1" strokeWidth="14" strokeLinecap="round" opacity="0" />
        <circle className="sa-inner" cx="250" cy="250" r={R2} stroke="#6366f1" strokeWidth="11" strokeLinecap="round" opacity="0" />
        <circle className="sa-dot-idle" cx="250" cy="250" r="0" fill="#818cf8" />
      </svg>
    </>
  );
}

/* AskBase brand mark — three concentric rings + filled core */
export function SignalLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* outer ring */}
      <circle cx="20" cy="20" r="18" stroke="#6366f1" strokeOpacity="0.18" strokeWidth="1.5" />
      {/* mid ring */}
      <circle cx="20" cy="20" r="12" stroke="#6366f1" strokeOpacity="0.45" strokeWidth="1.5" />
      {/* inner ring */}
      <circle cx="20" cy="20" r="6.5" stroke="#6366f1" strokeOpacity="0.8" strokeWidth="1.5" />
      {/* core dot */}
      <circle cx="20" cy="20" r="3" fill="#6366f1" />
    </svg>
  );
}
