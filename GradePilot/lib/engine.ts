// Pure grade engine: no React, no DOM.
export type Category = { id: string; name: string; sec: "lec" | "lab"; w: string; custom?: boolean };
export type Component = { id: string; cat?: string; aid?: string; n: string; w: string; s: string; t: string; d?: string };
export type Conv = Record<string, string>;
export type CustomRow = { id: string; label: string; min: string; points: string };
export type Subject = { id: string; name: string; code: string; units: number; lec?: number; lab?: number; instr: string; sem: string; target: string; sample?: boolean; conv: Conv; comps: Component[]; system?: string; custom?: CustomRow[]; cats?: Category[]; lw?: string; bw?: string };
export const num = (v: unknown): number | null => { if (v == null) return null; const x = typeof v === "string" ? v.trim() : v; return x === "" || isNaN(Number(x)) ? null : Number(x); };
/** A score was typed but cannot be used: negative, no/zero total, or above the total. */
export const isInvalid = (c: Component) => { const sc = num(c.s), t = num(c.t); return sc !== null && (sc < 0 || t === null || t <= 0 || sc > t); };
/** Completed = valid score with a positive total. Invalid scores are ignored. */
export const isDone = (c: Component) => num(c.s) !== null && !isInvalid(c);
const W = (c: Component) => num(c.w) ?? 0;
export const calculatePercentage = (s: number, t: number) => (t > 0 ? (s / t) * 100 : null);
export const totalWeight = (cs: Component[]) => cs.reduce((a, c) => a + W(c), 0);
export const calculateRemainingWeight = (cs: Component[]) => cs.filter((c) => !isDone(c)).reduce((a, c) => a + W(c), 0);
export const completedWeight = (cs: Component[]) => cs.filter(isDone).reduce((a, c) => a + W(c), 0);
/** Course-percentage points earned so far. */
export const earnedPoints = (cs: Component[]) => cs.filter(isDone).reduce((a, c) => a + (W(c) * (calculatePercentage(Number(c.s), Number(c.t)) as number)) / 100, 0);
/** Standing over completed work only. */
export const calculateWeightedStanding = (cs: Component[]) => { const w = completedWeight(cs); return w > 0 ? (earnedPoints(cs) / w) * 100 : null; };
export const calculateMaximumPossibleStanding = (cs: Component[]) => earnedPoints(cs) + calculateRemainingWeight(cs);
/** Average % needed across all remaining work to reach minStanding (course %). May be <0 or >100. */
export const calculateRequiredExamScore = (cs: Component[], minStanding: number) => { const r = calculateRemainingWeight(cs); return r > 0 ? ((minStanding - earnedPoints(cs)) / r) * 100 : null; };
export const calculateRequiredQuestions = (pct: number, total: number) => { const req = Math.min(total, Math.max(0, Math.ceil((pct / 100) * total - 1e-9))); return { req, miss: total - req }; };
export const calculateProjectedStanding = (cs: Component[], pcts: Record<string, number>) => earnedPoints(cs) + cs.filter((c) => !isDone(c)).reduce((a, c) => a + (W(c) * (pcts[c.id] ?? 0)) / 100, 0);
/** Converts a course standing to a grade label using only the supplied minimums (best grade first). Null if none entered. */
export const convertToGrade = (standing: number | null, conv: Conv, labels: string[], failLabel: string | null) => {
  if (standing == null) return null; let any = false;
  for (const g of labels) { const m = num(conv[g]); if (m !== null) { any = true; if (standing >= m - 1e-9) return g; } }
  return any ? failLabel : null;
};
export const calculateGPA = (l: { grade: number; units: number }[]) => { const u = l.reduce((a, x) => a + x.units, 0); return u > 0 ? l.reduce((a, x) => a + x.grade * x.units, 0) / u : null; };
export const statusFor = (req: number | null): [string, "ok"|"warn"|"bad"] => req == null || req <= 1e-9 ? ["Secured","ok"] : req <= 85 ? ["Achievable","ok"] : req <= 95 ? ["Difficult","warn"] : req <= 100 + 1e-9 ? ["Very difficult","warn"] : ["Impossible","bad"];
