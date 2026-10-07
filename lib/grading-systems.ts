import * as E from "./engine";
import type { Conv, CustomRow, Subject } from "./engine";

export type SystemId = "msu" | "percent" | "gpa4" | "custom";
export type GradeDef = { label: string; desc?: string; points: number | null };
/** Rules for one grading system: target grades (best first) and what lies below the lowest. */
export type Scale = { id: SystemId; targets: GradeDef[]; failLabel: string | null; failPoints: number | null };

export const SYSTEMS: { id: SystemId; name: string }[] = [
  { id: "msu", name: "MSU 1.00–5.00" }, { id: "percent", name: "Percentage (0–100)" }, { id: "gpa4", name: "4.00 GPA" }, { id: "custom", name: "Custom" },
];
const MSU: [string, string][] = [["1.00","Excellent"],["1.25","Excellent"],["1.50","Very Good"],["1.75","Very Good"],["2.00","Good"],["2.25","Good"],["2.50","Satisfactory"],["2.75","Satisfactory"],["3.00","Passing"]];
const GPA4: [string, number, number][] = [["A",4,93],["A-",3.7,90],["B+",3.3,87],["B",3,83],["B-",2.7,80],["C+",2.3,77],["C",2,73],["C-",1.7,70],["D",1,60]];
const PCTS = [100,95,90,85,80,75,70,65,60,55,50];

/** A COMMON Philippine 1.00-3.00 template (75% = 3.00). Not an official MSU-IIT table: instructors differ. */
export const MSU_TEMPLATE: Conv = { "1.00": "97", "1.25": "94", "1.50": "91", "1.75": "88", "2.00": "85", "2.25": "82", "2.50": "79", "2.75": "76", "3.00": "75" };
export const isMsuTemplate = (c: Conv | undefined) => !!c && Object.entries(MSU_TEMPLATE).every(([k, v]) => E.num(c[k]) === Number(v));

export const sysId = (s: Subject): SystemId => ((s.system as SystemId) || "msu");
export const defaultCustom = (): CustomRow[] => ([["A",90],["B+",85],["B",80],["C+",75],["C",70],["D",60],["F",0]] as [string, number][])
  .map(([label, min], i) => ({ id: `r${i}${Date.now()}`, label, min: String(min), points: "" }));
const validRows = (rows: CustomRow[]) => rows.filter((r) => r.label.trim() && E.num(r.min) !== null).sort((a, b) => Number(b.min) - Number(a.min));

export function validateCustom(rows: CustomRow[]): string[] {
  const e: string[] = [];
  if (rows.length < 2) e.push("Add at least two grades.");
  const labels = new Set<string>(), mins = new Set<number>();
  rows.forEach((r, i) => {
    const n = i + 1, m = E.num(r.min), l = r.label.trim().toLowerCase();
    if (!l) e.push(`Row ${n}: enter a grade name.`); else if (labels.has(l)) e.push(`Row ${n}: "${r.label.trim()}" is used twice.`); else labels.add(l);
    if (m === null || m < 0 || m > 100) e.push(`Row ${n}: minimum percentage must be between 0 and 100.`);
    else if (mins.has(m)) e.push(`Row ${n}: another grade already starts at ${m}%, so the ranges overlap.`); else mins.add(m);
    const p = E.num(r.points); if (r.points.trim() !== "" && (p === null || p < 0)) e.push(`Row ${n}: grade points must be 0 or more.`);
  });
  if (rows.length && !rows.some((r) => E.num(r.min) === 0)) e.push("Include a lowest grade with a minimum of 0 so every score has a grade.");
  return e;
}
export function scaleOf(s: Subject): Scale {
  const id = sysId(s);
  if (id === "percent") return { id, targets: PCTS.map((p) => ({ label: `${p}%`, points: null })), failLabel: "Below 50%", failPoints: null };
  if (id === "gpa4") return { id, targets: GPA4.map(([label, points]) => ({ label, desc: `${points.toFixed(2)} pts`, points })), failLabel: "F", failPoints: 0 };
  if (id === "custom") {
    const rows = validRows(s.custom ?? []), low = rows.find((r) => Number(r.min) <= 0);
    return { id, targets: rows.filter((r) => Number(r.min) > 0).map((r) => ({ label: r.label.trim(), points: E.num(r.points) })), failLabel: low ? low.label.trim() : null, failPoints: low ? E.num(low.points) : null };
  }
  return { id, targets: MSU.map(([label, desc]) => ({ label, desc, points: parseFloat(label) })), failLabel: "5.00", failPoints: 5 };
}
/** Minimum course standing (%) for each target label. Invalid custom scales yield none. */
export function thresholdsOf(s: Subject): Conv {
  const id = sysId(s);
  if (id === "percent") return Object.fromEntries(PCTS.map((p) => [`${p}%`, String(p)]));
  if (id === "custom") { const rows = s.custom ?? []; return validateCustom(rows).length ? {} : Object.fromEntries(validRows(rows).filter((r) => Number(r.min) > 0).map((r) => [r.label.trim(), r.min])); }
  return s.conv ?? {};
}
export function gradeFor(s: Subject, standing: number | null): string | null {
  if (standing == null) return null;
  if (sysId(s) === "percent") return `${standing.toFixed(2)}%`;
  const sc = scaleOf(s);
  return E.convertToGrade(standing, thresholdsOf(s), sc.targets.map((t) => t.label), sc.failLabel);
}
export function pointsFor(s: Subject, label: string): number | null {
  const sc = scaleOf(s);
  if (label === sc.failLabel && sc.targets.every((t) => t.label !== label)) return sc.failPoints;
  return sc.targets.find((t) => t.label === label)?.points ?? null;
}
export function defaultsFor(id: SystemId): { conv: Conv; target: string } {
  if (id === "gpa4") return { conv: Object.fromEntries(GPA4.map(([l, , m]) => [l, String(m)])), target: "C" };
  if (id === "percent") return { conv: {}, target: "60%" };
  if (id === "custom") return { conv: {}, target: "C" };
  return { conv: {}, target: "3.00" };
}
export function ensureTarget(s: Subject): Subject {
  const t = scaleOf(s).targets.map((x) => x.label);
  return t.length && !t.includes(s.target) ? { ...s, target: t[t.length - 1] } : s;
}
