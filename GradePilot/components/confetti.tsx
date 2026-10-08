"use client";
import { useEffect, useState } from "react";
const COLORS = ["rgb(var(--c-brand))", "rgb(var(--c-yolk))", "#FFC24A", "#E63946", "#FFE8A3"];
function Burst() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 3600); return () => clearTimeout(t); }, []);
  if (!on) return null;
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
    {Array.from({ length: 40 }).map((_, i) => <span key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % 5], animationDelay: `${(i % 9) * 70}ms`, animationDuration: `${1800 + (i % 7) * 200}ms` }} />)}
  </div>;
}
export function Confetti({ burst }: { burst: number }) { return burst ? <Burst key={burst} /> : null; }
