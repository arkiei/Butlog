export type ThemePref = "light" | "dark" | "system";
const KEY = "butlog-theme";
export const getPref = (): ThemePref => { try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; } };
export const isDarkPref = (p: ThemePref) => p === "dark" || (p === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
export function setPref(p: ThemePref) { try { localStorage.setItem(KEY, p); } catch {} document.documentElement.classList.toggle("dark", isDarkPref(p)); }
