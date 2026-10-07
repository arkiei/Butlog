"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EggIcon } from "@/components/egg";
import * as E from "@/lib/engine";
import * as S from "@/lib/sections";
import type { Subject } from "@/lib/engine";

const PRESETS: Record<S.Sec, string[]> = { lec: ["Exams", "Quizzes", "Assignments", "Attendance", "Projects"], lab: ["Lab Exams", "Lab Activities", "Lab Reports"] };
const f = (n: number) => String(Math.round(n * 100) / 100);
const hint = "rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200";

type Props = { s: Subject; onChange: (s: Subject) => void; mode?: "cats" | "items" | "all"; only?: S.Sec; withScores?: boolean };

/** Categories (Exams, Quizzes...) and the assessments inside them (Quiz 1, Quiz 2...). Assessment percentages are split automatically. */
export function GradingEditor({ s: s0, onChange, mode = "all", only, withScores = false }: Props) {
  const s = S.withCats(s0), act = S.activeSecs(s);
  const [newName, setNewName] = useState<Record<string, string>>({});
  const showCats = mode !== "items", showItems = mode !== "cats";
  const warns = S.warnings(s);
  return <div>
    {act.filter((k) => !only || k === only).map((k) => {
      const cats = s.cats!.filter((c) => S.catSec(c, act) === k), tot = cats.reduce((a, c) => a + (E.num(c.w) ?? 0), 0), good = Math.abs(tot - 100) < 1e-9, errs = S.sectionErrors(s, k);
      const rest = Math.max(0, Math.round((100 - tot) * 100) / 100);
      return <section key={k} className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-serif text-lg font-bold uppercase tracking-wide">{S.SEC_NAME[k]} grading</h4>
          <span className={`text-sm font-semibold ${good ? "text-brand-dark" : "text-danger"}`}>Categories total {f(tot)}%{good ? " ✓" : ""}</span></div>
        {showCats && <p className="mb-2 text-sm text-slategray">These categories make up 100% of your {S.SEC_NAME[k]} Grade. Category weight: how much of this section&apos;s grade is this category worth?</p>}
        {cats.map((c) => { const items = s.comps.filter((i) => i.cat === c.id);
          return <div key={c.id} className="mb-3 rounded-xl border border-slategray/20 p-3">
            {showCats ? <div className="grid grid-cols-[1fr_84px_auto] items-end gap-2">
              <label className="text-xs text-slategray">Category<Input value={c.name} onChange={(e) => onChange(S.setCat(s, c.id, { name: e.target.value }))} /></label>
              <label className="text-xs text-slategray">Weight %<Input type="number" min={0} max={100} step="0.01" value={c.w} onChange={(e) => onChange(S.setCat(s, c.id, { w: e.target.value }))} /></label>
              <Button size="sm" aria-label={`Remove ${c.name}`} onClick={() => onChange(S.removeCat(s, c.id))}>Remove</Button></div>
              : <p className="font-semibold">{c.name} <span className="font-normal text-slategray">· {f(E.num(c.w) ?? 0)}% of the {S.SEC_NAME[k]} Grade</span></p>}
            {showItems && <>
              <ul className="mt-2 space-y-2">{items.map((i) => { const bad = E.isInvalid(i), p = E.isDone(i) ? E.calculatePercentage(Number(i.s), Number(i.t)) : null;
                return <li key={i.id}>
                  <div className={`grid items-center gap-1 ${withScores ? "grid-cols-4 sm:grid-cols-[1fr_76px_72px_72px_auto]" : "grid-cols-[1fr_76px_auto]"}`}>
                    <Input className={withScores ? "col-span-4 sm:col-span-1" : ""} aria-label="Assessment name" value={i.n} onChange={(e) => onChange(S.setItem(s, i.id, { n: e.target.value }))} />
                    {c.custom ? <Input aria-label="Percent of this section" type="number" min={0} step="0.01" value={i.w} onChange={(e) => onChange(S.setItem(s, i.id, { w: e.target.value }))} />
                      : <span className="text-center text-sm font-semibold tabular-nums text-brand-dark">{f(E.num(i.w) ?? 0)}%</span>}
                    {withScores && <><Input aria-label="Score" type="number" min={0} placeholder="left" value={i.s} onChange={(e) => onChange(S.setItem(s, i.id, { s: e.target.value }))} />
                      <Input aria-label="Out of" type="number" min={0} value={i.t} onChange={(e) => onChange(S.setItem(s, i.id, { t: e.target.value }))} /></>}
                    <Button size="sm" aria-label={`Remove ${i.n}`} onClick={() => onChange(S.removeItem(s, i.id))}>✕</Button></div>
                  {withScores && <><p className="text-xs text-slategray">{bad ? <span className="text-danger">Score must be between 0 and {i.t || "the Out of value"}. It is ignored until fixed.</span>
                    : p != null ? (p === 0 ? <span className="inline-flex items-center gap-1"><EggIcon className="egg-wobble h-4 w-4" />{i.s}/{i.t} = 0% (an itlog)</span> : `${i.s}/${i.t} = ${f(p)}%`)
                    : "Not taken yet. \"Out of\" = number of items (used for question counts)."}</p>
                    <label className="mt-1 flex items-center gap-2 text-xs text-slategray">Exam or due date<Input type="date" className="max-w-[11rem]" value={i.d ?? ""} onChange={(e) => onChange(S.setItem(s, i.id, { d: e.target.value }))} /></label></>}
                </li>; })}</ul>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => onChange(S.addItem(s, c.id))}>Add assessment</Button>
                {items.length > 1 && <Button size="sm" onClick={() => onChange(S.setCat(s, c.id, { custom: !c.custom }))}>{c.custom ? "Use equal split" : "Customize percentages"}</Button>}
                {!c.custom && items.length > 1 && <span className="text-xs text-slategray">{f(E.num(c.w) ?? 0)}% is split equally between {items.length} assessments.</span>}</div>
              {c.custom && <p className="mt-1 text-xs text-slategray">These need to add up to {f(E.num(c.w) ?? 0)}%.</p>}
            </>}
          </div>; })}
        {showCats && <div className="mt-3"><p className="text-sm font-semibold">Add a category</p>
          <div className="mt-1 flex flex-wrap gap-1.5">{PRESETS[k].filter((n) => !cats.some((c) => c.name.toLowerCase() === n.toLowerCase())).map((n) =>
            <Button key={n} size="sm" onClick={() => onChange(S.addCategory(s, k, n, String(rest)))}>+ {n}</Button>)}</div>
          <div className="mt-2 flex gap-2"><Input placeholder="Other category (for example Projects)" aria-label="New category name" value={newName[k] ?? ""} onChange={(e) => setNewName({ ...newName, [k]: e.target.value })} />
            <Button size="sm" disabled={!(newName[k] ?? "").trim()} onClick={() => { onChange(S.addCategory(s, k, newName[k], String(rest))); setNewName({ ...newName, [k]: "" }); }}>Add</Button></div></div>}
        {showCats && errs.length > 0 && <div className={`mt-3 space-y-1 ${hint}`}>{errs.map((e) => <p key={e}>{e}</p>)}</div>}
      </section>; })}
    {warns.length > 0 && <p className="text-xs text-slategray">{warns.join(" ")}</p>}
  </div>;
}

/** Lecture and Laboratory share of the final subject grade. Typed by the user from the syllabus (never derived from units). */
export function FinalWeighting({ s, onChange }: { s: Subject; onChange: (s: Subject) => void }) {
  if (S.activeSecs(s).length !== 2) return null;
  const valid = S.shares(s) !== null;
  const setW = (which: "lw" | "bw", v: string) => { const n = E.num(v), other = which === "lw" ? "bw" : "lw"; onChange({ ...s, [which]: v, ...(n !== null && n >= 0 && n <= 100 ? { [other]: f(100 - n) } : {}) }); };
  return <div>
    <p className="text-sm text-slategray">What percentage of your final subject grade comes from Lecture, and from Laboratory? Use your syllabus. Units do not decide this: 3 lecture units + 1 laboratory unit does not mean 75% / 25%.</p>
    <div className="mt-2 grid max-w-sm grid-cols-2 gap-2 text-sm">
      <label>Lecture %<Input type="number" min={0} max={100} step="0.01" value={s.lw ?? ""} onChange={(e) => setW("lw", e.target.value)} /></label>
      <label>Laboratory %<Input type="number" min={0} max={100} step="0.01" value={s.bw ?? ""} onChange={(e) => setW("bw", e.target.value)} /></label></div>
    {!valid && <p className={`mt-2 ${hint}`}>{S.WEIGHT_MSG}</p>}
  </div>;
}
