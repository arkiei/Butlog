"use client";
import { useEffect, useRef, useState } from "react";

/** Animates a number to its new value. Skips the animation when the device prefers reduced motion. */
export function CountUp({ value, decimals = 2, suffix = "", ms = 600 }: { value: number | null; decimals?: number; suffix?: string; ms?: number }) {
  const [shown, setShown] = useState<number | null>(value == null ? null : 0);
  const from = useRef(0);
  useEffect(() => {
    if (value == null || !isFinite(value)) { setShown(null); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { from.current = value; setShown(value); return; }
    const start = performance.now(), a = from.current; let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - p, 3), v = a + (value - a) * e; from.current = v; setShown(v); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{shown == null ? "–" : `${shown.toFixed(decimals)}${suffix}`}</>;
}
