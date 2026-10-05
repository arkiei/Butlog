"use client";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import * as G from "@/lib/grading-systems";
import type { CustomRow, Subject } from "@/lib/engine";

export function GradingSetup({ s, onChange }: { s: Subject; onChange: (s: Subject) => void }) {
  const id = G.sysId(s), scale = G.scaleOf(s), rows = s.custom ?? [], errs = id === "custom" ? G.validateCustom(rows) : [];
  const apply = (n: Subject) => onChange(G.ensureTarget(n));
  const changeSystem = (next: G.SystemId) => {
    if (next === id) return;
    const has = id === "custom" || Object.values(s.conv ?? {}).some(Boolean);
    if (has && !confirm("Changing the grading system resets this subject's grade scale and target. Continue?")) return;
    const d = G.defaultsFor(next);
    onChange({ ...s, system: next, conv: d.conv, target: d.target, custom: next === "custom" ? G.defaultCustom() : undefined, sample: false });
  };
  const setRow = (rid: string, p: Partial<CustomRow>) => apply({ ...s, custom: rows.map((r) => (r.id === rid ? { ...r, ...p } : r)) });
  const isTpl = id === "msu" && G.isMsuTemplate(s.conv);
  const pickTemplate = (v: string) => {
    if (v === "template") {
      const has = Object.values(s.conv ?? {}).some(Boolean);
      if (has && !isTpl && !confirm("This replaces the numbers you entered with the common template. Continue?")) return;
      onChange({ ...s, conv: { ...G.MSU_TEMPLATE }, sample: false });
    } else if (isTpl) onChange({ ...s, conv: {}, sample: false });
  };
  const templateUi = id === "msu" ? <div className="mt-3">
    <label className="text-sm text-slategray">Starting conversion
      <Select value={isTpl ? "template" : ""} onChange={(e) => pickTemplate(e.target.value)}><option value="">Enter my own</option><option value="template">Common template (75% = 3.00)</option></Select></label>
    {isTpl && <p className="mt-2 rounded-lg bg-yolk/10 px-3 py-2 text-sm">This is a common template, not an official MSU-IIT table. Many instructors use their own, so check your syllabus and edit any box below.</p>}
  </div> : null;
  return <>
    <h3 className="mb-2 font-serif text-xl">Grading system</h3>
    <label className="text-sm text-slategray">Choose the scale your course uses
      <Select value={id} onChange={(e) => changeSystem(e.target.value as G.SystemId)}>{G.SYSTEMS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></label>
    {id === "msu" && <p className="mt-2 text-xs text-slategray">Using the MSU 1.00–5.00 grading scale.</p>}
    {id === "percent" && <p className="mt-3 text-sm text-slategray">Your target is the final percentage itself, so there is nothing else to set up.</p>}
    {(id === "msu" || id === "gpa4") && <>
      {templateUi}<p className="mt-3 rounded-lg bg-yolk/10 px-3 py-2 text-sm">Your instructor&apos;s grading formula may differ. Enter the conversion used in your course. Each box is the minimum course standing (%) for that grade{scale.failLabel ? `; below the lowest minimum is ${scale.failLabel}` : ""}.{id === "gpa4" && " Prefilled with common values: edit them to match your school."}</p>
      {s.sample && <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900">These are SAMPLE numbers for the demo only. They are not an official conversion.</p>}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">{scale.targets.map((t) => <label key={t.label} className="text-xs text-slategray">{t.label}{t.desc ? ` ${t.desc}` : ""}
        <Input type="number" step="0.01" value={s.conv?.[t.label] ?? ""} onChange={(e) => onChange({ ...s, conv: { ...s.conv, [t.label]: e.target.value }, sample: false })} /></label>)}</div>
      {id === "msu" && <p className="mt-2 text-xs text-slategray">5.00 Failure · INC Incomplete · Drp Dropped are not computed here.</p>}
    </>}
    {id === "custom" && <>
      <p className="mt-3 text-sm text-slategray">Add each grade with the minimum percentage needed. Include a lowest grade with a minimum of 0. Grade points are optional and only needed for GPA.</p>
      <div className="mt-2 grid grid-cols-[1fr_72px_72px_auto] gap-1 text-xs text-slategray"><span>Grade</span><span>Min %</span><span>Points</span><span /></div>
      {rows.map((r) => <div key={r.id} className="mb-1 grid grid-cols-[1fr_72px_72px_auto] gap-1">
        <Input aria-label="Grade name" value={r.label} onChange={(e) => setRow(r.id, { label: e.target.value })} />
        <Input aria-label="Minimum percentage" type="number" min={0} max={100} value={r.min} onChange={(e) => setRow(r.id, { min: e.target.value })} />
        <Input aria-label="Grade points" type="number" min={0} step="0.01" value={r.points} onChange={(e) => setRow(r.id, { points: e.target.value })} />
        <Button size="sm" aria-label="Remove grade" onClick={() => apply({ ...s, custom: rows.filter((x) => x.id !== r.id) })}>Remove</Button></div>)}
      <Button size="sm" className="mt-1" onClick={() => onChange({ ...s, custom: [...rows, { id: `r${Date.now()}`, label: "", min: "", points: "" }] })}>Add grade</Button>
      {errs.length > 0 && <ul role="alert" className="mt-3 list-disc rounded-lg bg-red-100 py-2 pl-7 pr-3 text-sm text-red-900">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
    </>}
  </>;
}
