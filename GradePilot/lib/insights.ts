import * as E from "./engine";
import * as G from "./grading-systems";
import * as S from "./sections";
import type { Subject } from "./engine";

export const daysUntil = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number); const n = new Date();
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 86400000);
};
export const countdown = (days: number) => days < 0 ? `${-days} day${days === -1 ? "" : "s"} ago` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`;
/** Average % needed on all remaining work for the subject's target, or null if it cannot be computed. */
export function requiredAvg(s: Subject): number | null {
  const m = E.num(G.thresholdsOf(s)[s.target]);
  if (m === null || !S.ok(s)) return null;
  const cs = S.eff(s);
  if (!E.calculateRemainingWeight(cs)) return null;
  return E.calculateRequiredExamScore(cs, m);
}
export function insights(s: Subject) {
  const cs = S.eff(s), rem = cs.filter((c) => !E.isDone(c)), rw = E.calculateRemainingWeight(cs), earned = E.earnedPoints(cs), cur = E.calculateWeightedStanding(cs);
  const m = E.num(G.thresholdsOf(s)[s.target]);
  const sens = rem.map((c) => { const w = Number(c.w) || 0; return { name: c.n, w, per10: w * 0.1, share: rw > 0 ? (w / rw) * 100 : 0 }; }).sort((a, b) => b.w - a.w);
  const atAvg = cur != null && rw > 0 ? earned + (rw * cur) / 100 : null;
  return { sens, worst: earned, atAvg, cushion: atAvg != null && m != null ? atAvg - m : null };
}
