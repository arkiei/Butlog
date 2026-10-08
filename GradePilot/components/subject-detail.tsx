"use client";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { GradingSetup } from "@/components/grading-setup";
import * as G from "@/lib/grading-systems";
import * as S from "@/lib/sections";
import { useThemeColor } from "@/lib/theme";
import { GradingEditor, FinalWeighting } from "@/components/grading-editor";
import * as I from "@/lib/insights";
import { Confetti } from "@/components/confetti";
import { CalendarExport } from "@/components/calendar-export";
import { calendarItems } from "@/lib/ics";
import { EggCrack, EggIcon } from "@/components/egg";
import { CountUp } from "@/components/count-up";
import { bubblesSay } from "@/components/bubbles";
import { uid } from "@/lib/utils";
import * as U from "@/lib/units";
import { UnitsFields } from "@/components/units-fields";
import * as E from "@/lib/engine";
import type { Subject, Component } from "@/lib/engine";

const f = (n: number | null, d = 2) => (n == null || !isFinite(n) ? "–" : n.toFixed(d));
const tone = { ok: "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-200", warn: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200", bad: "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200" };
const Note = ({ k, children }: { k: keyof typeof tone; children: React.ReactNode }) => <p className={`my-2 rounded-lg px-3 py-2 ${tone[k]}`}>{children}</p>;

function Misses({ c, pct }: { c: Component; pct: number }) {
  const t = E.num(c.t);
  if (!t || t <= 0) return <p className="text-sm text-slategray">Enter the number of items for {c.n} to see question counts.</p>;
  if (pct > 100 + 1e-9) return null;
  const q = E.calculateRequiredQuestions(pct, t);
  return <div className="my-2 rounded-lg border border-green-700 p-3"><div>{c.n}: need at least <b>{q.req}/{t}</b> correct</div>
    <div className="font-serif text-2xl text-brand-dark">You can miss up to {q.miss} question{q.miss === 1 ? "" : "s"}</div></div>;
}

export function SubjectDetail({ s, onChange, onBack }: { s: Subject; onChange: (s: Subject) => void; onBack: () => void }) {
  const cs = S.eff(s), errs = S.validate(s), tw = E.totalWeight(cs), wOK = errs.length === 0;
  const bothSecs = S.activeSecs(s).length === 2;
  const brandCss = useThemeColor("--c-brand");
  const rem = cs.filter((c) => !E.isDone(c)), earned = E.earnedPoints(cs), rw = E.calculateRemainingWeight(cs);
  const scale = G.scaleOf(s), conv = G.thresholdsOf(s);
  const m = E.num(conv[s.target]);
  const badC = cs.filter(E.isInvalid);
  const reqAll = wOK && m !== null && rem.length ? (E.calculateRequiredExamScore(cs, m) as number) : null;
  const secured = reqAll !== null && reqAll <= 1e-9;
  const dated = rem.filter((c) => c.d).map((c) => ({ c, days: I.daysUntil(c.d as string) })).sort((a, b) => a.days - b.days);
  const soon = dated.find((x) => x.days >= 0);
  const zeros = cs.filter((c) => E.isDone(c) && Number(c.s) === 0).length;
  const prevZeros = useRef(zeros);
  useEffect(() => { if (zeros > prevZeros.current) bubblesSay("That one's an itlog. The next one will be better.", "calm"); prevZeros.current = zeros; }, [zeros]);
  const [burst, setBurst] = useState(0);
  const wasSecured = useRef(secured);
  useEffect(() => { if (secured && !wasSecured.current) setBurst((b) => b + 1); wasSecured.current = secured; }, [secured]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!wOK || m === null) return;
      if (soon && soon.days <= 3) { bubblesSay(`${soon.c.n} is ${I.countdown(soon.days).toLowerCase()}. Time for a quick review!`); return; }
      if (reqAll === null) return;
      if (secured) bubblesSay(`A ${s.target} is secured. Nice work!`, "dance");
      else if (reqAll > 100 + 1e-9) bubblesSay(`A ${s.target} is out of reach now, but a lower target may still work. Check the Compare tab.`, "calm");
      else if (reqAll > 85) bubblesSay(`It's a stretch: about ${f(reqAll)}% on what's left. Let's make a plan.`, "calm");
      else bubblesSay(`About ${f(reqAll)}% on what's left gets you a ${s.target}. You can do this.`);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id, s.target, wOK, m, Math.round((reqAll ?? -1) * 10), soon?.days]);
  const [wi, setWi] = useState<Record<string, number>>({});
  const [cip, setCip] = useState<string | null>(null);
  const [ul, setUl] = useState(String(U.lecOf(s)));
  const [ub, setUb] = useState(U.labOf(s) ? String(U.labOf(s)) : "");
  const [tab, setTab] = useState<"plan" | "explore" | "compare" | "setup">("plan");
  const sec = (k: string) => (tab === k ? "" : "hidden");
  const tabs = [["plan", "Plan"], ["explore", "What-if"], ["compare", "Compare"], ["setup", "Setup"]] as const;
  const [cv, setCv] = useState({ id: "", t: "60", k: "48" });
  const set = (p: Partial<Subject>) => onChange({ ...s, ...p });
  const pct = (c: Component) => wi[c.id] ?? 75;
  const proj = E.calculateProjectedStanding(cs, Object.fromEntries(rem.map((c) => [c.id, pct(c)])));
  const cvC = rem.find((c) => c.id === cv.id) ?? rem[0];
  const cvT = Number(cv.t), cvK = Number(cv.k);

  const need = () => {
    if (!wOK) return <Note k="warn">Fix the component weights to see required scores.</Note>;
    if (m === null) return <Note k="warn">Enter the minimum course standing for {s.target} in Setup, under Grading system. Your instructor&apos;s grading formula may differ. Enter the conversion used in your course.</Note>;
    if (!rem.length) { const ok = earned >= m - 1e-9; return <Note k={ok ? "ok" : "bad"}>No remaining assessments. Final standing {f(earned)}% {ok ? "meets" : "does not meet"} the {f(m)}% needed for {s.target}.</Note>; }
    const req = E.calculateRequiredExamScore(cs, m) as number;
    return <>
      <p className="text-sm text-slategray">Needed final course standing for {s.target}: {f(m)}%. Earned so far: {f(earned)} of {f(E.completedWeight(cs), 0)} points from completed work.</p>
      {req <= 1e-9 && <Note k="ok">You have already secured the required course standing for this target, assuming your completed grades are accurate.</Note>}
      {req > 100 + 1e-9 && <Note k="warn"><EggIcon cracked className="mr-1.5 inline h-5 w-5 align-text-bottom" />Your selected target cannot be reached with the remaining assessment weight. You would need an average of {f(req)}% on the remaining work.</Note>}
      {req <= 100 + 1e-9 && rem.length === 1 && <><p>Required {rem[0].n} score:</p><div className="font-serif text-4xl font-bold tabular-nums"><CountUp value={Math.max(0, req)} suffix="%" /></div>
        {Math.abs(req - 100) < 1e-9 && <Note k="warn">This requires a perfect score.</Note>}<Misses c={rem[0]} pct={Math.max(0, req)} /></>}
      {req > 1e-9 && req <= 100 + 1e-9 && rem.length > 1 && <>
        <p>Average needed across remaining assessments: <b>{f(req)}%</b>. Scenarios:</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Scenario</th>{rem.map((c) => <th key={c.id} className="text-right">{c.n}</th>)}</tr></thead><tbody>
          {([["Balanced", null], ["Strong early (85%)", 85], ["Weaker early (70%)", 70]] as [string, number | null][]).map(([n, x]) => {
            const last = rem[rem.length - 1], early = rem.slice(0, -1);
            const lastV = x === null ? req : (m - earned - early.reduce((a, c) => a + (Number(c.w) * x) / 100, 0)) / Number(last.w) * 100;
            const vals = x === null ? rem.map(() => req) : [...early.map(() => x), lastV];
            return <tr key={n} className="border-t"><td>{n}</td>{vals.map((v, i) => <td key={i} className="text-right">{v < 0 ? "0% or less" : `${f(v)}%`}{v > 100 + 1e-9 ? " (over 100)" : ""}</td>)}</tr>;
          })}</tbody></table></div>
        {rem.map((c) => <Misses key={c.id} c={c} pct={req} />)}</>}
    </>;
  };

  const hist = cs.filter(E.isDone).map((c) => ({ n: c.n, p: Math.round((E.calculatePercentage(Number(c.s), Number(c.t)) as number) * 100) / 100 }));
  return <>
    <button onClick={onBack} className="mb-1 text-sm font-medium text-brand-dark">← All subjects</button>
    <h2 className="text-center font-serif text-3xl">{s.name}</h2>
    <p className="mb-3 text-center text-sm text-slategray">{s.code} · {U.unitsText(s)} · {s.sem} · Target <b>{s.target}</b> · {G.SYSTEMS.find((x) => x.id === G.sysId(s))?.name}</p>
    <div role="tablist" className="sticky top-14 z-[5] mx-auto mb-4 grid max-w-xl grid-cols-4 gap-1 rounded-xl border border-slategray/20 bg-card p-1 shadow-sm">
      {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
        className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${tab === k ? "bg-brand text-onbrand shadow" : "text-slategray"}`}>{l}</button>)}</div>
    {(!wOK || m === null) && tab !== "setup" && <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border-2 border-yolk bg-tint p-3 text-sm text-ink">
      <span>{!wOK ? "Your grading setup is not complete." : `Enter the conversion for ${s.target}.`} Finish setup to see your results.</span>
      <Button size="sm" onClick={() => setTab("setup")}>Go to Setup</Button></div>}
    {badC.length > 0 && <Note k="bad">Invalid score in {badC.map((c) => c.n).join(", ")}: it must be between 0 and the &quot;Out of&quot; value. It is ignored in the results until fixed (see Setup).</Note>}
    <div className="stagger grid items-start gap-x-4 lg:grid-cols-2">
    <Card className={sec("plan") + " lg:col-span-2"}><div className="grid grid-cols-3 gap-3">
      {([["Current standing", E.calculateWeightedStanding(cs), 2, "of completed work"], ["Remaining weight", rw, 0, ""], ["Maximum possible", E.calculateMaximumPossibleStanding(cs), 2, ""]] as [string, number | null, number, string][]).map(([a, b, dec, c]) =>
        <div key={a} className="rounded-xl bg-brand/5 p-3"><div className="text-xs text-slategray">{a}</div><div className="font-serif text-xl font-bold tabular-nums text-brand-dark sm:text-2xl"><CountUp value={b} decimals={dec} suffix="%" /></div><div className="text-xs text-slategray">{c}</div></div>)}
    </div>
      <div className="mt-3" aria-hidden="true"><div className="relative h-3 overflow-hidden rounded-full bg-slategray/15">
        <div className="grow absolute inset-y-0 left-0 bg-yolk/40" style={{ width: `${Math.min(100, earned + rw)}%` }} />
        <div className="grow absolute inset-y-0 left-0 bg-brand" style={{ width: `${Math.min(100, earned)}%` }} />
        {m !== null && <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${Math.min(100, m)}%` }} />}</div>
        <div className="mt-1 flex justify-between text-[11px] text-slategray"><span>Earned {f(earned)}</span><span>Max {f(E.calculateMaximumPossibleStanding(cs))}</span>{m !== null && <span>Target {f(m)}</span>}</div></div>
      <p className="mt-2 text-sm text-slategray">Total weight: {f(tw, 0)}% {wOK && "✓"}</p>
      {!wOK && <Note k="bad">{errs.map((e) => <span key={e} className="block">{e}</span>)}</Note>}</Card>

    {bothSecs && wOK && (() => {
      const L = S.sectionStats(s, "lec"), B = S.sectionStats(s, "lab"), sh = S.shares(s)!, fin = E.calculateWeightedStanding(cs), fg = fin == null ? null : G.gradeFor(s, fin);
      const tile = (label: string, v: number | null, hint: string) => <div className="rounded-xl bg-brand/5 p-3"><div className="text-xs text-slategray">{label}</div>
        <div className="font-serif text-xl font-bold tabular-nums text-brand-dark sm:text-2xl"><CountUp value={v} suffix="%" /></div><div className="text-xs text-slategray">{hint}</div></div>;
      return <Card className={sec("plan") + " lg:col-span-2"}><div className="grid grid-cols-3 gap-3">
        {tile("Lecture grade", L.cur, `max ${f(L.max)}%`)}{tile("Laboratory grade", B.cur, `max ${f(B.max)}%`)}{tile("Final subject grade", fin, fg ? `so far · ${fg}` : "so far")}</div>
        <p className="mt-2 text-xs text-slategray">Final grade = Lecture {f(sh.lec, 0)}% + Laboratory {f(sh.lab, 0)}%, using the weighting from your syllabus. It counts completed work only.</p></Card>;
    })()}

    <Card className={sec("plan")}><h3 className="mb-2 font-serif text-xl">Target grade</h3>
      <Select value={s.target} onChange={(e) => set({ target: e.target.value })}>{scale.targets.map((g) => <option key={g.label} value={g.label}>{g.label}{g.desc ? ` - ${g.desc}` : ""}</option>)}</Select>{need()}</Card>

    <Card className={sec("plan")}><Button variant="primary" onClick={() => {
      const mx = E.calculateMaximumPossibleStanding(cs);
      setCip(!wOK ? "Fix the component weights first." : m === null ? `Maximum possible course standing: ${f(mx)}%. Enter the minimum standing for ${s.target} to compare.`
        : `Maximum possible course standing: ${f(mx)}%. ` + (mx >= m - 1e-9 ? `Yes. A ${s.target} is still mathematically achievable.` : `Based on your current scores and grading weights, a ${s.target} is no longer mathematically achievable.`));
    }}>Can I Still Pass?</Button>{cip && <Note k={cip.includes("Yes") ? "ok" : "warn"}>{cip}</Note>}</Card>

    <Card className={sec("plan")}><h3 className="mb-2 font-serif text-xl">Insights</h3>
      {!rem.length ? <p className="text-sm text-slategray">Nothing left to take.</p> : (() => {
        const ins = I.insights(s), g = (x: number | null) => (x == null ? null : G.gradeFor(s, x));
        return <>
          <p className="text-sm text-slategray">Points your final standing gains for every 10% you score on each remaining item:</p>
          <ul className="mt-2 space-y-2">{ins.sens.map((x) => <li key={x.name}><div className="flex justify-between text-sm"><span>{x.name}</span><span className="tabular-nums">+{f(x.per10)} pts</span></div>
            <div className="h-2 rounded-full bg-slategray/15"><div className="grow h-2 rounded-full bg-brand" style={{ width: `${x.share}%` }} /></div></li>)}</ul>
          <div className="mt-4 space-y-1 text-sm">
            {ins.atAvg != null && <p>At your current average on the rest, you would finish near <b>{f(ins.atAvg)}%</b>{g(ins.atAvg) ? <> (<b>{g(ins.atAvg)}</b>)</> : null}.{ins.cushion != null && ` That is ${f(Math.abs(ins.cushion))} points ${ins.cushion >= 0 ? "above" : "below"} your ${s.target} target.`}</p>}
            <p>Worst case (0% on everything left): <b>{f(ins.worst)}%</b>{g(ins.worst) ? <> (<b>{g(ins.worst)}</b>)</> : null}.</p></div>
          {dated.length > 0 && <div className="mt-4"><p className="text-sm font-semibold">Coming up</p>
            <ul className="text-sm">{dated.map(({ c, days }) => <li key={c.id} className="flex justify-between"><span>{c.n}</span><span className="text-slategray">{I.countdown(days)}</span></li>)}</ul><CalendarExport items={calendarItems([s])} compact /></div>}
        </>;
      })()}</Card>

    <Card className={sec("compare")}><h3 className="mb-2 font-serif text-xl">Grade target table</h3>
      {!wOK || !rem.length ? <p className="text-sm text-slategray">Available when weights total 100% and work remains.</p> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Target</th><th className="text-right">Needs standing</th><th className="text-right">Required avg</th><th className="pl-3 text-left">Status</th></tr></thead><tbody>
          {[...scale.targets].reverse().map(({ label: g }) => { const mm = E.num(conv[g]); if (mm === null) return <tr key={g} className="border-t"><td>{g}</td><td colSpan={3} className="text-slategray">Enter conversion</td></tr>;
            const r = E.calculateRequiredExamScore(cs, mm) as number, [l, k] = E.statusFor(r);
            return <tr key={g} className="border-t"><td>{g}</td><td className="text-right">{f(mm)}%</td><td className="text-right">{r <= 0 ? "0% or less" : `${f(r)}%`}</td><td className="pl-3"><span className={`rounded-full px-2 ${tone[k]}`}>{l}</span></td></tr>; })}
        </tbody></table><p className="mt-2 text-xs text-slategray">Labels: up to 85% Achievable, to 95% Difficult, to 100% Very difficult, above 100% Impossible. These cut-offs are this app&apos;s own guide.</p></div>}</Card>

    <Card className={sec("explore")}><h3 className="mb-2 font-serif text-xl">What if I get…</h3>
      {!rem.length ? <p className="text-sm text-slategray">No remaining assessments.</p> : <>
        {rem.map((c) => <label key={c.id} className="mb-2 block text-sm">{c.n} ({c.w}%): <b>{pct(c)}%</b>
          <input type="range" min={0} max={100} value={pct(c)} className="w-full" onChange={(e) => setWi({ ...wi, [c.id]: +e.target.value })} /></label>)}
        <p aria-live="polite">Projected course standing: <b>{f(proj)}%</b><br />Projected grade: <b>{!wOK ? "fix weights first" : G.gradeFor(s, proj) ?? "enter conversion table"}</b></p></>}</Card>

    <Card className={sec("explore")}><h3 className="mb-2 font-serif text-xl">Exam score converter</h3>
      {!cvC ? <p className="text-sm text-slategray">No remaining assessments.</p> : <>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <label className="col-span-2 sm:col-span-1">Assessment<Select value={cvC.id} onChange={(e) => setCv({ ...cv, id: e.target.value })}>{rem.map((c) => <option key={c.id} value={c.id}>{c.n}</option>)}</Select></label>
          <label>Exam total<Input type="number" min={1} value={cv.t} onChange={(e) => setCv({ ...cv, t: e.target.value })} /></label>
          <label>Expected correct<Input type="number" min={0} value={cv.k} onChange={(e) => setCv({ ...cv, k: e.target.value })} /></label></div>
        {!(cvT > 0) || cvK < 0 || cvK > cvT ? <Note k="bad">Correct answers must be between 0 and the exam total.</Note> :
          <p aria-live="polite"><b>{cvK}/{cvT} = {f((cvK / cvT) * 100)}%</b>{cvK === 0 && <EggIcon className="egg-wobble ml-1 inline h-4 w-4" />}<br />Contribution to course: {f((cvK / cvT) * Number(cvC.w))} of {cvC.w} points</p>}</>}</Card>

    <Card className={sec("compare")}><h3 className="mb-2 font-serif text-xl">Grade history</h3>
      {!hist.length ? <p className="text-sm text-slategray">Record scores to see your performance.</p> :
        <div role="img" aria-label="Score percentage by component" className="h-56"><ResponsiveContainer><BarChart data={hist}><XAxis dataKey="n" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} width={30} tick={{ fontSize: 11 }} />
          <Bar dataKey="p" fill={brandCss}><LabelList dataKey="p" content={(q: any) => q.value === 0 ? <g transform={`translate(${q.x + q.width / 2 - 8},${q.y - 20})`}><path d="M8 1 C5 1 3 6 3 9.5 C3 12.5 5.2 15 8 15 C10.8 15 13 12.5 13 9.5 C13 6 11 1 8 1 Z" fill="#FFF8EC" stroke="#A63A0A" strokeWidth="1.2" /></g> : <text x={q.x + q.width / 2} y={q.y - 6} textAnchor="middle" fontSize={11} fill="currentColor">{`${Number(q.value).toFixed(0)}%`}</text>} /></Bar></BarChart></ResponsiveContainer></div>}</Card>

    <Card className={sec("setup") + " lg:col-span-2"}><h3 className="mb-2 font-serif text-xl">Units</h3>
      <UnitsFields lec={ul} lab={ub} onChange={(l, b) => { setUl(l); setUb(b); onChange(U.withUnits(s, E.num(l) ?? 0, E.num(b) ?? 0)); }} /></Card>

    {bothSecs && <Card className={sec("setup") + " lg:col-span-2"}><h3 className="mb-1 font-serif text-xl">Final grade weighting</h3>
      <FinalWeighting s={s} onChange={onChange} /></Card>}

    <Card className={sec("setup") + " lg:col-span-2"}><h3 className="mb-1 font-serif text-xl">Grading categories and assessments</h3>
      <p className="mb-3 text-sm text-slategray">Add the categories your teacher uses (Exams, Quizzes...). A category&apos;s percentage is split equally between its assessments unless you customize it.</p>
      <GradingEditor s={s} onChange={onChange} mode="all" withScores /></Card>

    <Card className={sec("setup") + " order-first lg:col-span-2"}><GradingSetup s={s} onChange={onChange} /></Card>
    </div>
    <Confetti burst={burst} />
    <EggCrack burst={burst} />
  </>;
}
