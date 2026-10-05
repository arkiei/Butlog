import { supabase } from "@/lib/supabase/client";
import { num } from "@/lib/engine";
import type { Subject } from "@/lib/engine";
import { uid } from "@/lib/utils";

export type Data = { subjects: Subject[]; prior: { units: string; gpa: string } };
type Row = Record<string, any>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const normalizeIds = (d: Data): Data => ({ ...d, subjects: d.subjects.map((s) => ({ ...s, id: UUID.test(s.id) ? s.id : uid(),
  comps: s.comps.map((c) => ({ ...c, id: UUID.test(c.id) ? c.id : uid(), aid: c.aid && UUID.test(c.aid) ? c.aid : uid() })) })) });

export async function loadRemote(): Promise<{ data: Data; semIds: Record<string, string> }> {
  const [sem, subs, comps, asm, prof] = await Promise.all([
    supabase.from("semesters").select("id,name"),
    supabase.from("subjects").select("*").order("position", { ascending: true }),
    supabase.from("grading_components").select("*").order("position", { ascending: true }),
    supabase.from("assessments").select("*"),
    supabase.from("profiles").select("*").maybeSingle(),
  ]);
  for (const r of [sem, subs, comps, asm, prof]) if (r.error) throw new Error(r.error.message);
  const semIds: Record<string, string> = {}, semName = new Map<string, string>();
  (sem.data ?? []).forEach((x: Row) => { semIds[x.name] = x.id; semName.set(x.id, x.name); });
  const aByC = new Map<string, Row>(); (asm.data ?? []).forEach((a: Row) => { if (!aByC.has(a.component_id)) aByC.set(a.component_id, a); });
  const subjects: Subject[] = (subs.data ?? []).map((r: Row) => {
    const conv = { ...(r.conversion ?? {}) } as Record<string, string>, sample = !!conv._sample; delete conv._sample;
    return { id: r.id, name: r.name, code: r.course_code ?? "", units: Number(r.units) || 0, instr: r.instructor ?? "", sem: semName.get(r.semester_id) ?? "1st Semester",
      target: r.target ?? "3.00", system: r.grading_system ?? "msu", conv, sample: sample || undefined, custom: r.custom_scale ?? undefined,
      comps: (comps.data ?? []).filter((c: Row) => c.subject_id === r.id).map((c: Row) => { const a = aByC.get(c.id);
        return { id: c.id, aid: a?.id ?? uid(), n: c.name, w: String(c.weight ?? 0), s: a?.score == null ? "" : String(a.score), t: a?.max_score == null ? "" : String(a.max_score), d: a?.date ? String(a.date).slice(0, 10) : undefined }; }) };
  });
  const p = prof.data as Row | null;
  return { data: { subjects, prior: { units: p?.prior_units != null ? String(p.prior_units) : "", gpa: p?.prior_gpa != null ? String(p.prior_gpa) : "" } }, semIds };
}

const check = (r: { error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); };
async function prune(table: string, keep: string[]) {
  const { data, error } = await supabase.from(table).select("id"); if (error) throw new Error(error.message);
  const gone = (data ?? []).map((r: Row) => r.id as string).filter((id) => !keep.includes(id));
  if (gone.length) check(await supabase.from(table).delete().in("id", gone));
}

/** Writes the whole planner to the user's own rows (RLS enforces ownership), then removes rows deleted in the app. */
export async function saveRemote(userId: string, d: Data, semIds: Record<string, string>) {
  const label = (s: Subject) => s.sem || "Semester";
  const names = [...new Set(d.subjects.map(label))], fresh = new Set<string>();
  names.forEach((n) => { if (!semIds[n]) { semIds[n] = uid(); fresh.add(n); } });
  const semRows = names.map((n) => ({ id: semIds[n], user_id: userId, name: n, ...(fresh.has(n) ? { school_year: "" } : {}) }));
  const subRows = d.subjects.map((s, i) => ({ id: s.id, semester_id: semIds[label(s)], name: s.name, course_code: s.code, units: s.units, instructor: s.instr, target: s.target,
    grading_system: s.system ?? "msu", conversion: { ...(s.conv ?? {}), ...(s.sample ? { _sample: "1" } : {}) }, custom_scale: s.custom ?? null, position: i }));
  const compRows = d.subjects.flatMap((s) => s.comps.map((c, i) => ({ id: c.id, subject_id: s.id, name: c.n, weight: num(c.w) ?? 0, position: i })));
  const asmRows = d.subjects.flatMap((s) => s.comps.map((c) => ({ id: c.aid as string, component_id: c.id, name: c.n, score: num(c.s), max_score: num(c.t), date: c.d || null })));
  if (semRows.length) check(await supabase.from("semesters").upsert(semRows));
  if (subRows.length) check(await supabase.from("subjects").upsert(subRows));
  if (compRows.length) check(await supabase.from("grading_components").upsert(compRows));
  if (asmRows.length) check(await supabase.from("assessments").upsert(asmRows));
  await prune("assessments", asmRows.map((r) => r.id)); await prune("grading_components", compRows.map((r) => r.id));
  await prune("subjects", subRows.map((r) => r.id)); await prune("semesters", semRows.map((r) => r.id));
  check(await supabase.from("profiles").upsert({ user_id: userId, prior_units: num(d.prior.units), prior_gpa: num(d.prior.gpa), updated_at: new Date().toISOString() }));
}
