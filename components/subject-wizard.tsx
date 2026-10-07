"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { UnitsFields } from "@/components/units-fields";
import { GradingEditor, FinalWeighting } from "@/components/grading-editor";
import { bubblesClear, bubblesSay } from "@/components/bubbles";
import * as E from "@/lib/engine";
import * as G from "@/lib/grading-systems";
import * as S from "@/lib/sections";
import * as U from "@/lib/units";
import { uid } from "@/lib/utils";
import type { Subject } from "@/lib/engine";

const GUIDE: Record<string, string> = {
  info: "Hi! Let's set up your subject. First, enter your lecture and laboratory units.",
  lab: "Does your subject have a laboratory? Pick the option that matches your syllabus.",
  lec: "Now enter how your teacher divides your Lecture grade into categories. They should add up to 100%.",
  lbg: "Now the laboratory. These categories should add up to 100% of your Laboratory grade.",
  items: "Quizzes are 10% in this example. If you add two quizzes, I'll automatically split that 10% between them.",
  review: "Almost done! Make sure your category percentages add up to 100%.",
};
const TITLE: Record<string, string> = { info: "Subject information", lab: "Does this subject have a laboratory?", lec: "Lecture grading", lbg: "Laboratory grading", items: "Add your assessments", review: "Review and create" };

export function SubjectWizard({ onCreate }: { onCreate: (s: Subject) => void }) {
  const [d, setD] = useState<Subject>(() => ({ id: uid(), name: "", code: "", units: 3, lec: 3, lab: 0, instr: "", sem: "1st Semester", system: "msu", target: "3.00", conv: {}, comps: [], cats: [] }));
  const [step, setStep] = useState("info");
  const [guide, setGuide] = useState(true);
  const [ul, setUl] = useState("3"), [ub, setUb] = useState("");
  const act = S.activeSecs(d), both = act.length === 2;
  const steps = ["info", "lab", ...(act.includes("lec") ? ["lec"] : []), ...(act.includes("lab") ? ["lbg"] : []), "items", "review"];
  const cur = steps.includes(step) ? step : "info", idx = steps.indexOf(cur);
  useEffect(() => { if (guide) bubblesSay(GUIDE[cur], "normal", true); }, [cur, guide]);
  useEffect(() => {
    const off = () => setGuide(false); window.addEventListener("bubbles-guide-skip", off);
    return () => { window.removeEventListener("bubbles-guide-skip", off); bubblesClear(); };
  }, []);
  const setUnits = (l: string, b: string) => { setUl(l); setUb(b); setD((x) => U.withUnits(x, E.num(l) ?? 0, E.num(b) ?? 0)); };
  const mode = both ? "both" : act[0] === "lab" ? "lab" : "lec";
  const pick = (m: "lec" | "both" | "lab") => { const l = E.num(ul) ?? 0, b = E.num(ub) ?? 0; setUnits(m === "lab" ? "0" : String(l > 0 ? l : 3), m === "lec" ? "" : String(b > 0 ? b : 1)); };
  const stepErrors = (k: string): string[] => k === "info" ? (d.name.trim() ? [] : ["Give your subject a name to continue."])
    : k === "lec" || k === "lbg" ? [...S.sectionErrors(d, k === "lec" ? "lec" : "lab"), ...(both && !S.shares(d) ? [S.WEIGHT_MSG] : [])]
    : k === "review" ? [...(d.name.trim() ? [] : ["Give your subject a name."]), ...S.validate(d)] : [];
  const errs = stepErrors(cur), last = idx === steps.length - 1;
  const go = (n: number) => setStep(steps[Math.max(0, Math.min(steps.length - 1, n))]);
  const skip = () => { setGuide(false); bubblesClear(); };
  const create = () => { const dd = G.defaultsFor((d.system ?? "msu") as G.SystemId); onCreate(S.withCats({ ...d, name: d.name.trim(), target: dd.target, conv: dd.conv })); };
  return <Card className="mx-auto mt-4 max-w-2xl">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slategray">Step {idx + 1} of {steps.length}</p>
      {guide && <Button size="sm" onClick={skip}>Skip guide</Button>}</div>
    <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slategray/15" aria-hidden="true"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>
    <h2 className="mb-3 font-serif text-2xl">{TITLE[cur]}</h2>

    {cur === "info" && <div className="space-y-3">
      <label className="block text-sm">Subject name<Input value={d.name} placeholder="Engineering Mathematics 1" onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
      <label className="block text-sm">Course code <span className="text-slategray">(optional)</span><Input value={d.code} placeholder="MATH 101" onChange={(e) => setD({ ...d, code: e.target.value })} /></label>
      <UnitsFields lec={ul} lab={ub} onChange={setUnits} />
      <details className="text-sm"><summary className="cursor-pointer font-semibold">More options</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label>Semester<Select value={d.sem} onChange={(e) => setD({ ...d, sem: e.target.value })}><option>1st Semester</option><option>2nd Semester</option><option>Midyear</option></Select></label>
          <label>Grading system<Select value={d.system} onChange={(e) => setD({ ...d, system: e.target.value })}>{G.SYSTEMS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></label></div></details></div>}

    {cur === "lab" && <div>
      <p className="mb-3 text-sm text-slategray">This decides which grading sections you will set up. It matches the units you entered.</p>
      <div role="radiogroup" className="grid gap-2">{([["lec", "No, Lecture only"], ["both", "Yes, Lecture + Laboratory"], ["lab", "Laboratory only"]] as const).map(([m, label]) =>
        <button key={m} role="radio" aria-checked={mode === m} onClick={() => pick(m)} className={`min-h-12 rounded-xl border-2 px-4 text-left font-semibold transition-colors ${mode === m ? "border-brand bg-brand/10 text-brand-dark" : "border-slategray/25"}`}>{label}</button>)}</div>
      <p className="mt-3 text-sm text-slategray">Current units: {U.unitsText(d)}.</p></div>}

    {(cur === "lec" || cur === "lbg") && <div>
      {both && <div className="mb-4 rounded-xl bg-brand/5 p-3"><p className="mb-1 text-sm font-semibold">What percentage of your final subject grade comes from {cur === "lec" ? "Lecture" : "Laboratory"}?</p><FinalWeighting s={d} onChange={setD} /></div>}
      <p className="mb-3 text-sm text-slategray">Add your grading categories, such as {cur === "lec" ? "Exams, Quizzes, Assignments, Attendance or Projects" : "Lab Exams, Lab Activities or Lab Reports"}. Each category has one total percentage. These percentages should add up to 100% of your {cur === "lec" ? "Lecture" : "Laboratory"} Grade.</p>
      <GradingEditor s={d} onChange={setD} mode="cats" only={cur === "lec" ? "lec" : "lab"} /></div>}

    {cur === "items" && <div>
      <p className="mb-3 text-sm text-slategray">Add the individual quizzes, exams and activities inside each category (Quiz 1, Quiz 2, Exam 1...). I split the category percentage between them automatically. You can enter scores later.</p>
      <GradingEditor s={d} onChange={setD} mode="items" /></div>}

    {cur === "review" && <div className="space-y-2 text-sm">
      <p><b>{d.name.trim() || "Untitled subject"}</b> {d.code && <span className="text-slategray">({d.code})</span>}</p>
      <p>{U.unitsText(d)}</p>
      {act.map((k) => { const cs = S.withCats(d).cats!.filter((c) => S.catSec(c, act) === k); return <p key={k}><b>{S.SEC_NAME[k]}</b>{both && S.shares(d) ? ` (${S.shares(d)![k]}% of the final grade)` : ""}: {cs.map((c) => `${c.name} ${c.w}%`).join(", ") || "no categories yet"}</p>; })}</div>}

    {errs.length > 0 && cur !== "info" && <div className="mt-4 space-y-1 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{errs.map((e) => <p key={e}>{e}</p>)}</div>}
    <div className="mt-5 flex items-center justify-between gap-2">
      <Button onClick={() => go(idx - 1)} disabled={idx === 0}>Back</Button>
      {last ? <Button variant="primary" disabled={errs.length > 0} onClick={create}>Create subject</Button>
        : <Button variant="primary" disabled={errs.length > 0} onClick={() => go(idx + 1)}>Next</Button>}</div>
  </Card>;
}
