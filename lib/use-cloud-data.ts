"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { loadRemote, normalizeIds, saveRemote, type Data } from "@/lib/sync";

export type SaveStatus = "loading" | "saved" | "saving" | "error";
const EMPTY: Data = { subjects: [], prior: { units: "", gpa: "" } };
const LEGACY = ["gradepilot", "iitgp"];
function readLegacy(): Data | null {
  try { for (const k of LEGACY) { const r = localStorage.getItem(k); if (r) { const d = JSON.parse(r); if (d?.subjects?.length) return normalizeIds({ subjects: d.subjects, prior: d.prior ?? EMPTY.prior }); } } } catch {}
  return null;
}
const clearLegacy = () => { try { LEGACY.forEach((k) => localStorage.removeItem(k)); } catch {} };

/** Loads the signed-in user's plans from Supabase and autosaves changes (debounced). */
export function useCloudData() {
  const { user } = useAuth();
  const [data, setDataState] = useState<Data>(EMPTY);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [ready, setReady] = useState(false);
  const [legacy, setLegacy] = useState<Data | null>(null);
  const [tick, setTick] = useState(0);
  const dirty = useRef(false), loaded = useRef(false), latest = useRef(data), semIds = useRef<Record<string, string>>({});
  const chain = useRef<Promise<void>>(Promise.resolve()), timer = useRef<ReturnType<typeof setTimeout>>();
  latest.current = data;

  useEffect(() => {
    loaded.current = false; dirty.current = false; setReady(false); setDataState(EMPTY); setLegacy(null);
    if (!user) return; let dead = false; setStatus("loading");
    loadRemote().then(({ data: d, semIds: m }) => { if (dead) return; semIds.current = m; setDataState(d); setLegacy(readLegacy()); loaded.current = true; setReady(true); setStatus("saved"); })
      .catch(() => { if (!dead) setStatus("error"); });
    return () => { dead = true; };
  }, [user?.id, tick]);

  const setData = useCallback((n: Data) => { if (!loaded.current) return; dirty.current = true; setDataState(n); }, []);
  useEffect(() => {
    if (!dirty.current || !user) return;
    setStatus("saving"); clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const snap = data;
      chain.current = chain.current.then(async () => {
        try { await saveRemote(user.id, snap, semIds.current); if (snap === latest.current) { dirty.current = false; setStatus("saved"); } } catch { setStatus("error"); }
      });
    }, 1200);
    return () => clearTimeout(timer.current);
  }, [data, user]);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h);
  }, []);

  const retry = useCallback(() => { dirty.current = true; setDataState((d) => ({ ...d })); }, []);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const importLegacy = () => { if (!legacy) return; setData({ subjects: [...data.subjects, ...legacy.subjects], prior: data.prior.units ? data.prior : legacy.prior }); clearLegacy(); setLegacy(null); };
  const discardLegacy = () => { clearLegacy(); setLegacy(null); };
  return { data, setData, status, ready, legacy, importLegacy, discardLegacy, retry, reload };
}
