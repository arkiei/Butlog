"use client";
import { useEffect, useState } from "react";
export function useLocalStorage<T>(key: string, init: T, legacyKey?: string) {
  const [v, setV] = useState<T>(init); const [ready, setReady] = useState(false);
  useEffect(() => { try { const r = localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null); if (r) setV(JSON.parse(r)); } catch {} setReady(true); }, [key]);
  useEffect(() => { if (ready) try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v, ready]);
  return [v, setV, ready] as const;
}
