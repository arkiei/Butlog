"use client";
import { useEffect, useState } from "react";

// ---- Midnight mode (light / dark) ----
export type ThemePref = "light" | "dark" | "system";
const KEY = "butlog-theme";
export const getPref = (): ThemePref => { try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; } };
export const isDarkPref = (p: ThemePref) => p === "dark" || (p === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
export function setPref(p: ThemePref) { try { localStorage.setItem(KEY, p); } catch {} document.documentElement.classList.toggle("dark", isDarkPref(p)); changed(); }

// ---- Theme packs (seasonal palettes). Colours live in globals.css as [data-theme="..."] variable sets; the default has no attribute. ----
export type PackId = "butlog" | "mango" | "rainy" | "pasko";
export type PackPref = PackId | "auto";
export const PACKS: { id: PackId; name: string; note: string; swatch: [string, string, string] }[] = [
  { id: "butlog", name: "Butlog", note: "Warm egg", swatch: ["#CC430D", "#FFF8EC", "#FFB703"] },
  { id: "mango", name: "Mango Summer", note: "Sunny and sweet", swatch: ["#B05400", "#FFF4CD", "#FFC414"] },
  { id: "rainy", name: "Rainy Day", note: "Cool and calm", swatch: ["#1D4ED8", "#EEF5FC", "#38BDF8"] },
  { id: "pasko", name: "Pasko", note: "Christmas cheer", swatch: ["#B91C1C", "#FFF9F5", "#FACC15"] },
];
const PK = "butlog-pack";
/** Automatic pick by month: Pasko (Dec-Jan), Mango Summer (Mar-May), Rainy Day (Jun-Nov), otherwise Butlog. */
export const seasonPack = (d = new Date()): PackId => { const m = d.getMonth(); return m === 11 || m === 0 ? "pasko" : m >= 2 && m <= 4 ? "mango" : m >= 5 && m <= 10 ? "rainy" : "butlog"; };
export const getPackPref = (): PackPref => { try { const v = localStorage.getItem(PK); return v === "auto" || PACKS.some((p) => p.id === v) ? (v as PackPref) : "butlog"; } catch { return "butlog"; } };
export const resolvePack = (p: PackPref): PackId => (p === "auto" ? seasonPack() : p);
export function setPackPref(p: PackPref) {
  try { localStorage.setItem(PK, p); } catch {}
  const id = resolvePack(p), el = document.documentElement;
  if (id === "butlog") el.removeAttribute("data-theme"); else el.setAttribute("data-theme", id);
  changed();
}

// ---- Reading the active colours (for charts and the share image, which cannot use CSS variables directly) ----
export const cssColor = (name: string, fallback = "rgb(204,67,13)") => {
  const n = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return n.length === 3 && n.every((x) => !isNaN(x)) ? `rgb(${n.join(",")})` : fallback;
};
function changed() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", cssColor("--c-brand"));
  window.dispatchEvent(new Event("butlog-theme-change"));
}
export function useThemeColor(name: string) {
  const [c, setC] = useState("rgb(204,67,13)");
  useEffect(() => { const read = () => setC(cssColor(name)); read(); window.addEventListener("butlog-theme-change", read); return () => window.removeEventListener("butlog-theme-change", read); }, [name]);
  return c;
}
