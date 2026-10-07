"use client";
import { useEffect, useState } from "react";

export function EggIcon({ className = "", cracked = false }: { className?: string; cracked?: boolean }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M12 2.5 C8 2.5 5 9.5 5 14.2 C5 18.4 8 21.5 12 21.5 C16 21.5 19 18.4 19 14.2 C19 9.5 16 2.5 12 2.5 Z" fill="#FFF8EC" stroke="#A63A0A" strokeWidth="1.5" strokeLinejoin="round" />
    {cracked && <path d="M6.2 11.5 L9.5 13.5 L11.5 10.8 L14 13.8 L17.8 11.2" fill="none" stroke="#A63A0A" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />}
  </svg>;
}

function Crack() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 3300); return () => clearTimeout(t); }, []);
  if (!on) return null;
  const shell = { fill: "#FFF8EC", stroke: "#A63A0A", strokeWidth: 3, strokeLinejoin: "round" as const };
  return <div aria-hidden="true" className="egg-overlay pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
    <div className="egg-pop relative h-40 w-40">
      <svg viewBox="0 0 100 120" className="egg-shake h-full w-full overflow-visible">
        <circle className="egg-yolk" cx="50" cy="68" r="17" fill="#FFB703" />
        <path className="egg-top" d="M50 8 C28 8 12 44 12 66 L26 58 L36 70 L48 56 L60 70 L72 58 L88 66 C88 44 72 8 50 8 Z" {...shell} />
        <path className="egg-bottom" d="M12 66 L26 58 L36 70 L48 56 L60 70 L72 58 L88 66 C88 94 72 114 50 114 C28 114 12 94 12 66 Z" {...shell} />
      </svg>
      {Array.from({ length: 12 }).map((_, k) => { const a = (k / 12) * Math.PI * 2;
        return <span key={k} className="yolk-dot" style={{ "--dx": `${Math.cos(a) * 95}px`, "--dy": `${Math.sin(a) * 95 - 15}px` } as React.CSSProperties} />; })}
      <p className="egg-label absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-4 py-1 font-serif text-lg font-bold text-brand-dark shadow-lg">Target secured!</p>
    </div>
  </div>;
}
export function EggCrack({ burst }: { burst: number }) { return burst ? <Crack key={burst} /> : null; }
