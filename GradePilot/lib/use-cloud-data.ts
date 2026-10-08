"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { loadRemote, normalizeIds, saveRemote, type Data } from "@/lib/sync";
import { readCache, writeCache } from "@/lib/offline-cache";

export type SaveStatus = "loading" | "saved" | "saving" | "error" | "offline";
const EMPTY: Data = { subjects: [], prior: { units: "", gpa: "" } };
const LEGACY = ["gradepilot", "iitgp"];
function readLegacy(): Data | null {
  try { for (const k of LEGACY) { const r = localStorage.getItem(k); if (r) { const d = JSON.parse(r); if (d?.subjects?.length) return normalizeIds({ subjects: d.subjects, prior: d.prior ?? EMPTY.prior }); } } } catch {}
  return null;
}
const clearLegacy = () => { try { LEGACY.forEach((k) => localStorage.removeItem(k)); } catch {} };

/** Loads the signed-in user's plans from Supabase and autosaves changes (debounced).
 *  Works offline: the last copy is kept on this device, edits are saved there, and they sync when the connection returns. */
export function useCloudData() {
  const { user } = useAuth();
  const [data, setDataState] = useState<Data>(EMPTY);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [ready, setReady] = useState(false);
  const [legacy, setLegacy] = useState<Data | null>(null);
  const [tick, setTick] = useState(0);
  const dirty = useRef(false), loaded = useRef(false), latest = useRef(data), semIds = useRef<Record<string, string>>({}), uidRef = useRef<string | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve()), timer = useRef<ReturnType<typeof setTimeout>>();
  latest.current = data; uidRef.current = user?.id ?? null;

  useEffect(() => {
    loaded.current = false; dirty.current = false; setReady(false); setDataState(EMPTY); setLegacy(null);
    if (!user) return; let dead = false; setStatus("loading");
    loadRemote().then(({ data: d, semIds: m }) => {
      if (dead) return; semIds.current = m;
      const c = readCache(user.id);
      if (c?.dirty) { dirty.current = true; setDataState(c.data); } // edits made offline win and are pushed now
      else { setDataState(d); writeCache(user.id, d, false, m); }
      setLegacy(readLegacy()); loaded.current = true; setReady(true); setStatus(c?.dirty ? "saving" : "saved");
    }).catch(() => {
      if (dead) return;
      const c = !navigator.onLine ? readCache(user.id) : null;
      if (c) { semIds.current = c.semIds; dirty.current = c.dirty; setDataState(c.data); loaded.current = true; setReady(true); setStatus("offline"); }
      else setStatus("error");
    });
    return () => { dead = true; };
  }, [user?.id, tick]);

  const setData = useCallback((n: Data) => {
    if (!loaded.current) return; dirty.current = true; setDataState(n);
    if (uidRef.current) writeCache(uidRef.current, n, true, semIds.current);
  }, []);
  useEffect(() => {
    if (!dirty.current || !user) return;
    if (!navigator.onLine) { setStatus("offline"); return; }
    setStatus("saving"); clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const snap = data;
      chain.current = chain.current.then(async () => {
        try { await saveRemote(user.id, snap, semIds.current); if (snap === latest.current) { dirty.current = false; setStatus("saved"); writeCache(user.id, snap, false, semIds.current); } }
        catch { setStatus(navigator.onLine ? "error" : "offline"); }
      });
    }, 1200);
    return () => clearTimeout(timer.current);
  }, [data, user]);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty.current && navigator.onLine) { e.preventDefault(); e.returnValue = ""; } };
    const online = () => { if (dirty.current) setDataState((d) => ({ ...d })); else if (loaded.current) setStatus("saved"); };
    const offline = () => { if (loaded.current) setStatus("offline"); };
    window.addEventListener("beforeunload", beforeUnload); window.addEventListener("online", online); window.addEventListener("offline", offline);
    return () => { window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const retry = useCallback(() => { dirty.current = true; setDataState((d) => ({ ...d })); }, []);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const importLegacy = () => { if (!legacy) return; setData({ subjects: [...data.subjects, ...legacy.subjects], prior: data.prior.units ? data.prior : legacy.prior }); clearLegacy(); setLegacy(null); };
  const discardLegacy = () => { clearLegacy(); setLegacy(null); };
  return { data, setData, status, ready, legacy, importLegacy, discardLegacy, retry, reload };
}
