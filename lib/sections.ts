import * as E from "./engine";
import * as U from "./units";
import { uid } from "./utils";
import type { Category, Component, Subject } from "./engine";

// Three separate levels (never mixed):
//   1. UNITS (credit info only, see units.ts)
//   2. CATEGORY weights: each section's categories add up to 100% of that section's grade (Lecture Grade / Laboratory Grade)
//   3. FINAL weighting: how much Lecture and Laboratory each count toward the subject grade (typed by the user, never derived from units)
// Assessments inside a category share the category weight equally unless the user customizes them.
// eff() flattens all of this into ordinary weighted components so the existing grade engine works unchanged.

export type Sec = "lec" | "lab";
export const SEC_NAME: Record<Sec, string> = { lec: "Lecture", lab: "Laboratory" };
const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => String(r2(n));

/** Which sections a subject uses, from its units. No units at all behaves like a lecture-only subject (old subjects). */
export const activeSecs = (s: Subject): Sec[] => { const a: Sec[] = []; if (U.lecOf(s) > 0) a.push("lec"); if (U.labOf(s) > 0) a.push("lab"); return a.length ? a : ["lec"]; };
export const catSec = (c: Category, act: Sec[]): Sec => (act.includes(c.sec) ? c.sec : act[0]);

/** Old subjects have no categories: each old component becomes its own one-assessment category (same weight). Idempotent. */
export function withCats(s: Subject): Subject {
  if (s.cats) return s;
  const sec = activeSecs(s)[0], cats: Category[] = [], comps: Component[] = [];
  for (const c of s.comps) { cats.push({ id: c.id, name: c.n, sec, w: c.w }); comps.push({ ...c, id: c.aid ?? c.id, cat: c.id }); }
  return { ...s, cats, comps };
}

/** Equal split of a category weight in whole hundredths; the last assessment gets the remainder (10 / 3 = 3.33, 3.33, 3.34). */
export function split(total: string, n: number): string[] {
  if (n <= 0) return [];
  const wc = Math.round(Math.max(0, E.num(total) ?? 0) * 100), per = Math.floor(wc / n), last = wc - per * (n - 1);
  return Array.from({ length: n }, (_, i) => String((i === n - 1 ? last : per) / 100));
}
export function redistribute(s: Subject, catId: string): Subject {
  const cat = s.cats?.find((c) => c.id === catId);
  if (!cat || cat.custom) return s;
  const ids = s.comps.filter((c) => c.cat === catId).map((c) => c.id), ws = split(cat.w, ids.length);
  return { ...s, comps: s.comps.map((c) => { const i = ids.indexOf(c.id); return i < 0 ? c : { ...c, w: ws[i] }; }) };
}
const nextName = (s: Subject, cat: Category) => {
  const used = new Set(s.comps.filter((c) => c.cat === cat.id).map((c) => c.n.toLowerCase()));
  let i = 1; while (used.has(`${cat.name} ${i}`.toLowerCase())) i++; return `${cat.name} ${i}`;
};
const newItem = (s: Subject, cat: Category, name?: string): Component => ({ id: uid(), cat: cat.id, n: name ?? nextName(s, cat), w: "0", s: "", t: "" });

export function addCategory(s0: Subject, sec: Sec, name: string, w = "0"): Subject {
  const s = withCats(s0), cat: Category = { id: uid(), name: name.trim() || "Category", sec, w };
  return redistribute({ ...s, cats: [...s.cats!, cat], comps: [...s.comps, newItem(s, cat)] }, cat.id);
}
export function setCat(s0: Subject, id: string, p: Partial<Category>): Subject {
  const s = withCats(s0);
  return redistribute({ ...s, cats: s.cats!.map((c) => (c.id === id ? { ...c, ...p } : c)) }, id);
}
export const removeCat = (s0: Subject, id: string): Subject => { const s = withCats(s0); return { ...s, cats: s.cats!.filter((c) => c.id !== id), comps: s.comps.filter((c) => c.cat !== id) }; };
export function addItem(s0: Subject, catId: string): Subject {
  const s = withCats(s0), cat = s.cats!.find((c) => c.id === catId);
  return cat ? redistribute({ ...s, comps: [...s.comps, newItem(s, cat)] }, catId) : s;
}
export function removeItem(s0: Subject, itemId: string): Subject {
  const s = withCats(s0), it = s.comps.find((c) => c.id === itemId);
  return it ? redistribute({ ...s, comps: s.comps.filter((c) => c.id !== itemId) }, it.cat as string) : s;
}
export const setItem = (s0: Subject, id: string, p: Partial<Component>): Subject => { const s = withCats(s0); return { ...s, comps: s.comps.map((c) => (c.id === id ? { ...c, ...p } : c)) }; };

/** Final Lecture / Laboratory weighting in percent. One-section subjects are 100% that section. Null when not valid. */
export function shares(s: Subject): Record<Sec, number> | null {
  const act = activeSecs(s);
  if (act.length === 1) return { lec: act[0] === "lec" ? 100 : 0, lab: act[0] === "lab" ? 100 : 0 };
  const l = E.num(s.lw), b = E.num(s.bw);
  if (l === null || b === null || l < 0 || b < 0 || l > 100 || b > 100 || Math.abs(l + b - 100) > 1e-9) return null;
  return { lec: l, lab: b };
}
export const WEIGHT_MSG = "Set how much of your final subject grade comes from Lecture and from Laboratory. They need to total 100%.";

export function sectionErrors(s0: Subject, k: Sec): string[] {
  const s = withCats(s0), act = activeSecs(s), errs: string[] = [], cats = s.cats!.filter((c) => catSec(c, act) === k), noun = `Your ${SEC_NAME[k]} categories`;
  if (!cats.length) return [`Add at least one ${SEC_NAME[k]} category (for example ${k === "lec" ? "Exams or Quizzes" : "Lab Exams or Lab Reports"}).`];
  if (cats.some((c) => { const w = E.num(c.w); return w === null || w < 0 || w > 100; })) errs.push(`Every ${SEC_NAME[k]} category needs a percentage between 0 and 100.`);
  const tot = cats.reduce((a, c) => a + (E.num(c.w) ?? 0), 0);
  if (Math.abs(tot - 100) > 1e-9) errs.push(tot < 100 ? `${noun} total ${fmt(tot)}%. Add another ${fmt(100 - tot)}% or adjust the existing categories.` : `${noun} total ${fmt(tot)}%. They need to total 100%.`);
  for (const c of cats) {
    const items = s.comps.filter((i) => i.cat === c.id);
    if (!items.length) errs.push(`Add at least one assessment to ${c.name || "your category"}.`);
    else if (c.custom) { const sum = items.reduce((a, i) => a + (E.num(i.w) ?? 0), 0), cw = E.num(c.w) ?? 0; if (Math.abs(sum - cw) > 0.005) errs.push(`The assessments in ${c.name} add up to ${fmt(sum)}% but the category is ${fmt(cw)}%.`); }
  }
  return errs;
}
export function validate(s: Subject): string[] {
  const act = activeSecs(s), errs = act.flatMap((k) => sectionErrors(s, k));
  if (act.length === 2 && !shares(s)) errs.push(WEIGHT_MSG);
  return errs;
}
export const ok = (s: Subject) => validate(s).length === 0;

/** Non-blocking hints: blank or repeated names. */
export function warnings(s0: Subject): string[] {
  const s = withCats(s0), act = activeSecs(s), out: string[] = [];
  for (const k of act) {
    const names = s.cats!.filter((c) => catSec(c, act) === k).map((c) => c.name.trim().toLowerCase());
    if (names.some((n) => !n)) out.push(`A ${SEC_NAME[k]} category has no name.`);
    if (new Set(names).size !== names.length) out.push(`Two ${SEC_NAME[k]} categories share the same name.`);
  }
  return out;
}

/** Flat weighted components for the grade engine. Each weight already includes the category share and the final Lecture/Laboratory weighting. */
export function eff(s0: Subject): Component[] {
  const s = withCats(s0), act = activeSecs(s), sh = shares(s) ?? { lec: 0, lab: 0 };
  if (act.length === 1) return s.comps;
  const sm = new Map(s.cats!.map((c) => [c.id, catSec(c, act)] as const));
  return s.comps.map((c) => { const k = sm.get(c.cat as string) ?? act[0]; return { ...c, n: `${c.n} (${SEC_NAME[k]})`, w: String(((E.num(c.w) ?? 0) * sh[k]) / 100) }; });
}
/** Grade of one section on its own (only its own assessments, weights out of 100). */
export function sectionStats(s0: Subject, k: Sec) {
  const s = withCats(s0), act = activeSecs(s), ids = new Set(s.cats!.filter((c) => catSec(c, act) === k).map((c) => c.id)), cs = s.comps.filter((c) => ids.has(c.cat as string));
  return { cur: E.calculateWeightedStanding(cs), max: E.calculateMaximumPossibleStanding(cs) };
}
