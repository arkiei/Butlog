import { supabase } from "@/lib/supabase/client";
import { num } from "@/lib/engine";
import type { Category, Component, Subject } from "@/lib/engine";
import { uid } from "@/lib/utils";
import * as U from "@/lib/units";
import * as S from "@/lib/sections";

export type Data = { subjects: Subject[]; prior: { units: string; gpa: string } };
type Row = Record<string, any>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const normalizeIds = (d: Data): Data => ({ ...d, subjects: d.subjects.map((s) => ({ ...s, id: UUID.test(s.id) ? s.id : uid(),
  comps: s.comps.map((c) => ({ ...c, id: UUID.test(c.id) ? c.id : uid(), aid: c.aid && UUID.test(c.aid) ? c.aid : uid() })) })) });

// Database mapping: grading_components = CATEGORIES (weight within its Lecture/Laboratory section, `type`),
// assessments = the individual items (Quiz 1, Exam 1...). Old rows (one assessment per component) load as one-item categories.
export async function loadRemote(): Promise<{ data: Data; semIds: Record<string, string> }> {
  const [sem, subs, cats, asm, prof] = await Promise.all([
    supabase.from("semesters").select("id,name"),
    supabase.from("subjects").select("*").order("position", { ascending: true }),
    supabase.from("grading_components").select("*").order("position", { ascending: true }),
    supabase.from("assessments").select("*").order("position", { ascending: true }),
    supabase.from("profiles").select("*").maybeSingle(),
  ]);
  for (const r of [sem, subs, cats, asm, prof]) if (r.error) throw new Error(r.error.message);
  const semIds: Record<string, string> = {}, semName = new Map<string, string>();
  (sem.data ?? []).forEach((x: Row) => { semIds[x.name] = x.id; semName.set(x.id, x.name); });
  const byCat = new Map<string, Row[]>(); (asm.data ?? []).forEach((a: Row) => { byCat.set(a.component_id, [...(byCat.get(a.component_id) ?? []), a]); });
  const subjects: Subject[] = (subs.data ?? []).map((r: Row) => {
    const conv = { ...(r.conversion ?? {}) } as Record<string, string>, sample = !!conv._sample; delete conv._sample;
    // Rows saved before lecture/lab units existed have neither column set: their `units` becomes lecture units.
    const hasSplit = r.lecture_units != null || r.laboratory_units != null;
    const lec = hasSplit ? Number(r.lecture_units) || 0 : Number(r.units) || 0, lab = hasSplit ? Number(r.laboratory_units) || 0 : 0;
    const mine = (cats.data ?? []).filter((c: Row) => c.subject_id === r.id);
    const categories: Category[] = mine.map((c: Row) => ({ id: c.id, name: c.name, sec: c.type === "laboratory" ? "lab" : "lec", w: String(c.weight ?? 0), custom: c.custom_split ? true : undefined }));
    const comps: Component[] = mine.flatMap((c: Row) => { const items = byCat.get(c.id) ?? [];
      return (items.length ? items : [null]).map((a: Row | null) => ({ id: a?.id ?? uid(), cat: c.id, n: a?.name ?? c.name, w: c.custom_split && a?.weight != null ? String(a.weight) : "0",
        s: a?.score == null ? "" : String(a.score), t: a?.max_score == null ? "" : String(a.max_score), d: a?.date ? String(a.date).slice(0, 10) : undefined })); });
    let subj: Subject = { id: r.id, name: r.name, code: r.course_code ?? "", units: lec + lab, lec, lab, instr: r.instructor ?? "", sem: semName.get(r.semester_id) ?? "1st Semester",
      target: r.target ?? "3.00", system: r.grading_system ?? "msu", conv, sample: sample || undefined, custom: r.custom_scale ?? undefined,
      lw: r.lecture_weight != null ? String(r.lecture_weight) : undefined, bw: r.laboratory_weight != null ? String(r.laboratory_weight) : undefined, cats: categories, comps };
    for (const c of categories) subj = S.redistribute(subj, c.id); // equal-split weights are computed, not stored
    return subj;
  });
  const p = prof.data as Row | null;
  return { data: { subjects, prior: { units: p?.prior_units != null ? String(p.prior_units) : "", gpa: p?.prior_gpa != null ? String(p.prior_gpa) : "" } }, semIds };
}

const check = (r: { error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); };
/** Upserts; if a newer optional column has not been migrated yet, retries without just that column so saving keeps working. */
async function upsertSafe(table: string, rows: Row[], optional: string[]) {
  let now = rows;
  for (let i = 0; i < 5; i++) {
    const r = await supabase.from(table).upsert(now);
    if (!r.error) return;
    const bad = optional.filter((k) => r.error!.message.includes(k) && k in now[0]);
    if (!bad.length) throw new Error(r.error.message);
    now = now.map((row) => { const c = { ...row }; bad.forEach((k) => delete c[k]); return c; });
  }
}
async function prune(table: string, keep: string[]) {
  const { data, error } = await supabase.from(table).select("id"); if (error) throw new Error(error.message);
  const gone = (data ?? []).map((r: Row) => r.id as string).filter((id) => !keep.includes(id));
  if (gone.length) check(await supabase.from(table).delete().in("id", gone));
}

/** Writes the whole planner to the user's own rows (RLS enforces ownership), then removes rows deleted in the app. */
export async function saveRemote(userId: string, d: Data, semIds: Record<string, string>) {
  const subjects = d.subjects.map(S.withCats);
  const label = (s: Subject) => s.sem || "Semester";
  const names = [...new Set(subjects.map(label))], fresh = new Set<string>();
  names.forEach((n) => { if (!semIds[n]) { semIds[n] = uid(); fresh.add(n); } });
  const semRows = names.map((n) => ({ id: semIds[n], user_id: userId, name: n, ...(fresh.has(n) ? { school_year: "" } : {}) }));
  const subRows = subjects.map((s, i) => ({ id: s.id, semester_id: semIds[label(s)], name: s.name, course_code: s.code, units: s.units, lecture_units: U.lecOf(s), laboratory_units: U.labOf(s), instructor: s.instr, target: s.target,
    lecture_weight: S.activeSecs(s).length === 2 ? num(s.lw) : null, laboratory_weight: S.activeSecs(s).length === 2 ? num(s.bw) : null,
    grading_system: s.system ?? "msu", conversion: { ...(s.conv ?? {}), ...(s.sample ? { _sample: "1" } : {}) }, custom_scale: s.custom ?? null, position: i }));
  const catRows = subjects.flatMap((s) => { const act = S.activeSecs(s);
    return s.cats!.map((c, i) => ({ id: c.id, subject_id: s.id, name: c.name, weight: num(c.w) ?? 0, type: S.catSec(c, act) === "lab" ? "laboratory" : "lecture", custom_split: !!c.custom, position: i })); });
  const customCat = new Set(subjects.flatMap((s) => s.cats!.filter((c) => c.custom).map((c) => c.id)));
  const asmRows = subjects.flatMap((s) => s.comps.map((c, i) => ({ id: c.id, component_id: c.cat as string, name: c.n, score: num(c.s), max_score: num(c.t), date: c.d || null,
    weight: customCat.has(c.cat as string) ? num(c.w) : null, position: i })));
  if (semRows.length) check(await supabase.from("semesters").upsert(semRows));
  if (subRows.length) await upsertSafe("subjects", subRows, ["lecture_units", "laboratory_units", "lecture_weight", "laboratory_weight"]);
  if (catRows.length) await upsertSafe("grading_components", catRows, ["type", "custom_split"]);
  if (asmRows.length) await upsertSafe("assessments", asmRows, ["weight", "position"]);
  await prune("assessments", asmRows.map((r) => r.id)); await prune("grading_components", catRows.map((r) => r.id));
  await prune("subjects", subRows.map((r) => r.id)); await prune("semesters", semRows.map((r) => r.id));
  check(await supabase.from("profiles").upsert({ user_id: userId, prior_units: num(d.prior.units), prior_gpa: num(d.prior.gpa), updated_at: new Date().toISOString() }));
}
