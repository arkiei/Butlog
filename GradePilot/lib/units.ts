import type { Subject } from "./engine";

// Lecture/lab units are CREDIT information only. They never feed grading weights or required-score maths:
// grading percentages come solely from the user's grading components. Only the TOTAL is used for GPA and unit totals.
// `Subject.units` is always the TOTAL (lecture + laboratory), so GPA and unit totals keep working unchanged.
// Older subjects have no lec/lab values: their single `units` number is treated as lecture units.
const split = (s: Subject) => s.lec != null || s.lab != null;
export const lecOf = (s: Subject) => (split(s) ? s.lec ?? 0 : s.units);
export const labOf = (s: Subject) => (split(s) ? s.lab ?? 0 : 0);
export const totalUnits = (lec: number, lab: number) => Math.round((Math.max(0, lec) + Math.max(0, lab)) * 100) / 100;
export const withUnits = (s: Subject, lec: number, lab: number): Subject => ({ ...s, lec: Math.max(0, lec), lab: Math.max(0, lab), units: totalUnits(lec, lab) });
export const unitsText = (s: Subject) => {
  const l = lecOf(s), b = labOf(s), u = (n: number) => `${n} unit${n === 1 ? "" : "s"}`;
  return l > 0 && b > 0 ? `${u(s.units)} (${l} lec + ${b} lab)` : b > 0 ? `${u(s.units)} (lab)` : u(s.units);
};
