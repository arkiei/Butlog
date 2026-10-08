import type { Data } from "./sync";

// A copy of the signed-in user's plans on THIS device, so the app can open and be edited offline.
// It is removed when the user logs out.
const P = "butlog-cache:";
export type Cached = { data: Data; dirty: boolean; semIds: Record<string, string> };
export function readCache(uid: string): Cached | null { try { const r = localStorage.getItem(P + uid); return r ? (JSON.parse(r) as Cached) : null; } catch { return null; } }
export function writeCache(uid: string, data: Data, dirty: boolean, semIds: Record<string, string>) { try { localStorage.setItem(P + uid, JSON.stringify({ data, dirty, semIds })); } catch {} }
export function clearOfflineCache() { try { Object.keys(localStorage).filter((k) => k.startsWith(P)).forEach((k) => localStorage.removeItem(k)); } catch {} }
