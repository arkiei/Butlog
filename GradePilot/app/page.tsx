"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import * as G from "@/lib/grading-systems";
import { Logo } from "@/components/logo";
import { AccountMenu } from "@/components/account-menu";
import { SubjectDetail } from "@/components/subject-detail";
import { useCloudData, type SaveStatus } from "@/lib/use-cloud-data";
import { bubblesSay } from "@/components/bubbles";
import * as I from "@/lib/insights";
import { uid } from "@/lib/utils";
import { demoSubjects } from "@/lib/demo";
import * as E from "@/lib/engine";
import type { Subject } from "@/lib/engine";

type Data = { subjects: Subject[]; prior: { units: string; gpa: string } };
const f = (n: number | null, d = 2) => (n == null || !isFinite(n) ? "–" : n.toFixed(d));
const pill = { ok: "bg-green-100 text-green-900", warn: "bg-amber-100 text-amber-900", bad: "bg-red-100 text-red-900" };

function dashStatus(s: Subject): [string, keyof typeof pill] {
  const m = E.num(G.thresholdsOf(s)[s.target]);
  if (m === null || Math.abs(E.totalWeight(s.comps) - 100) > 1e-9) return ["Set up needed", "warn"];
  if (E.calculateRemainingWeight(s.comps) === 0) return E.earnedPoints(s.comps) >= m - 1e-9 ? ["Target met", "ok"] : ["Target not reached", "bad"];
  const r = E.calculateRequiredExamScore(s.comps, m) as number;
  return r <= 1e-9 ? ["On track: target secured", "ok"] : r <= 85 ? ["On track", "ok"] : r <= 100 + 1e-9 ? ["Needs strong finish", "warn"] : ["Unreachable", "bad"];
}
const subjGrade = (s: Subject) => Math.abs(E.totalWeight(s.comps) - 100) > 1e-9 ? null : G.gradeFor(s, E.calculateWeightedStanding(s.comps));

function SaveBadge({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const label = status === "saving" ? "Saving…" : status === "error" ? "Couldn't save" : status === "loading" ? "Loading…" : "Saved";
  const dot = status === "saving" ? "bg-yolk animate-pulse" : status === "error" ? "bg-red-600" : status === "loading" ? "bg-slategray" : "bg-green-600";
  const inner = <><span className={`h-2.5 w-2.5 rounded-full ${dot}`} /><span className="hidden sm:inline">{status === "error" ? "Retry save" : label}</span></>;
  return status === "error"
    ? <button onClick={onRetry} title="Couldn't save. Tap to retry." className="flex items-center gap-1.5 px-1 text-xs font-semibold text-red-700">{inner}</button>
    : <span role="status" title={label} className="flex items-center gap-1.5 px-1 text-xs text-slategray">{inner}</span>;
}

export default function Page() {
  const { data: d, setData: setD, status, ready, legacy, importLegacy, discardLegacy, retry, reload } = useCloudData();
  const [view, setView] = useState<string>("home");
  const [form, setForm] = useState({ name: "", code: "", units: "3", sem: "1st Semester", instr: "", system: "msu" });
  useEffect(() => {
    if (view !== "list" || !d.subjects.length) return;
    const n = d.subjects.filter((x) => dashStatus(x)[1] !== "ok").length;
    bubblesSay(n ? `${n} subject${n === 1 ? "" : "s"} could use attention. Open one and let's make a plan.` : "Everything looks on track. Keep it up!", n ? "normal" : "cheer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, d.subjects.length]);
  if (!ready) return <main className="mx-auto max-w-md px-4 pt-24 text-center">{status === "error"
    ? <><p className="mb-3">We couldn&apos;t load your plans. Check your connection, and that the database setup (supabase/setup.sql) has been run.</p><Button variant="primary" onClick={reload}>Try again</Button></>
    : <p className="text-slategray">Loading your plans…</p>}</main>;
  const cur = d.subjects.find((s) => s.id === view);
  const update = (s: Subject) => setD({ ...d, subjects: d.subjects.map((x) => (x.id === s.id ? s : x)) });

  const body = () => {
    if (cur) return <SubjectDetail s={cur} onChange={update} onBack={() => setView("list")} />;
    if (view === "home") return <section className="py-4 text-center"><div className="anim-in relative mb-6 overflow-hidden rounded-3xl bg-ink px-6 py-14 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-yolk/25 blur-3xl" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M-20 270 C 160 270, 240 70, 420 100 S 700 210, 830 40" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" /><circle cx="420" cy="100" r="5" fill="#FFB703" /></svg>
        <div className="relative">
      <h1 className="font-serif text-4xl font-extrabold tracking-tight sm:text-6xl text-white">Butlog</h1>
      <p className="mt-2 text-xl font-medium text-amber-200">Know what you need before your next exam.</p>
      <p className="mx-auto mt-3 max-w-xl text-white/80">Plan your grades, calculate required exam scores, and see whether your target grade is still achievable.</p>
        
      <div className="my-4 flex justify-center gap-2"><Button variant="yolk" onClick={() => setView("new")}>Start Planning</Button>
        <Button className="border-white/40 text-white hover:bg-white/10" onClick={() => { const s = demoSubjects(); setD({ ...d, subjects: [...d.subjects, ...s] }); setView(s[0].id); }}>Try Demo</Button></div>
      </div></div>
      <div className="stagger mx-auto mb-4 grid max-w-3xl gap-2 sm:grid-cols-3">{[["1", "Add a subject", "Name, units and grading components."], ["2", "Enter your scores", "Quizzes, labs and exams you already took."], ["3", "See what you need", "Required score and questions you can miss."]].map(([n, t, d]) =>
        <Card key={n} className="mb-0 text-left"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand font-serif font-bold text-white">{n}</div><div className="font-semibold">{t}</div><div className="text-sm text-slategray">{d}</div></Card>)}</div>
      <p className="mt-3 text-sm text-slategray">Works with MSU 1.00–5.00, percentage, 4.00 GPA, or your own custom scale. Your subjects are saved in this browser.</p>
      </section>;
    if (view === "new") return <Card className="mx-auto mt-4 max-w-xl"><h2 className="mb-3 text-center font-serif text-2xl">Create subject</h2><div className="grid grid-cols-2 gap-2 text-sm">
      <label>Subject name<Input value={form.name} placeholder="Mathematics in the Modern World" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Course code<Input value={form.code} placeholder="GEC 104" onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
      <label>Units<Input type="number" min={0} step={0.5} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} /></label>
      <label>Semester<Select value={form.sem} onChange={(e) => setForm({ ...form, sem: e.target.value })}><option>1st Semester</option><option>2nd Semester</option><option>Midyear</option></Select></label>
      <label className="col-span-2">Grading system<Select value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })}>{G.SYSTEMS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></label>
      <label className="col-span-2">Instructor (optional)<Input value={form.instr} onChange={(e) => setForm({ ...form, instr: e.target.value })} /></label></div>
      <Button className="mt-3" variant="primary" disabled={!form.name.trim()} onClick={() => { const dd = G.defaultsFor(form.system as G.SystemId); const s: Subject = { id: uid(), name: form.name.trim(), code: form.code, units: Number(form.units) || 0, instr: form.instr, sem: form.sem, system: form.system, target: dd.target, conv: dd.conv, custom: form.system === "custom" ? G.defaultCustom() : undefined, comps: [] };
        setD({ ...d, subjects: [...d.subjects, s] }); setView(s.id); }}>Create subject</Button></Card>;
    // semester dashboard
    if (!d.subjects.length) return <Card>No subjects yet. <Button variant="primary" onClick={() => setView("new")}>Create a subject</Button></Card>;
    const graded = d.subjects.map((s) => ({ s, g: subjGrade(s) }));
    const pts = graded.map(({ s, g }) => (g ? G.pointsFor(s, g) : null));
    const ok = new Set(d.subjects.map(G.sysId)).size === 1 && graded.every((x, i) => pts[i] !== null && x.s.units > 0);
    const gpa = ok ? E.calculateGPA(graded.map((x, i) => ({ grade: pts[i] as number, units: x.s.units }))) : null;
    const units = d.subjects.reduce((a, s) => a + s.units, 0), attn = d.subjects.filter((s) => dashStatus(s)[1] !== "ok").length;
    const upcoming = d.subjects.flatMap((s) => s.comps.filter((c) => !E.isDone(c) && c.d).map((c) => ({ s, c, days: I.daysUntil(c.d as string) }))).filter((x) => x.days >= -1).sort((a, b) => a.days - b.days).slice(0, 5);
    const pu = E.num(d.prior.units), pg = E.num(d.prior.gpa);
    const cum = gpa != null && pu && pu > 0 && pg !== null ? (gpa * units + pg * pu) / (units + pu) : null;
    return <>
      <h2 className="mb-4 text-center font-serif text-3xl">My semester</h2>
      <div className="stagger grid items-start gap-x-4 md:grid-cols-2 xl:grid-cols-3">{graded.map(({ s, g }) => { const [l, k] = dashStatus(s); return <Card key={s.id}>
        <div className="flex items-start justify-between gap-2"><button className="text-left font-serif text-lg font-bold" onClick={() => setView(s.id)}>{s.name}</button><span className={`rounded-full px-2 text-sm ${pill[k]}`}>{l}</span></div>
        <p className="text-sm text-slategray">{s.code} · {s.units} units</p><p>Current estimate: <b>{g ?? "set grading scale"}</b> · Target: <b>{s.target}</b></p>
        <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => setView(s.id)}>Open calculator</Button>
          <Button size="sm" onClick={() => confirm("Delete this subject from this device?") && setD({ ...d, subjects: d.subjects.filter((x) => x.id !== s.id) })}>Delete</Button></div></Card>; })}</div>
      {upcoming.length > 0 && <Card><h3 className="mb-2 font-serif text-xl">Coming up</h3><ul className="space-y-2">{upcoming.map(({ s, c, days }) => { const r = I.requiredAvg(s);
        return <li key={c.id} className="flex items-center justify-between gap-2 text-sm"><span><b>{c.n}</b> <span className="text-slategray">{s.name}</span></span>
          <span className="text-right"><span className="font-semibold">{I.countdown(days)}</span>{r !== null && <span className="block text-xs text-slategray">{r <= 1e-9 ? "target secured" : r > 100 + 1e-9 ? "target out of reach" : `need about ${f(r)}% avg`}</span>}</span></li>; })}</ul></Card>}
      <Card><h3 className="font-serif text-xl">Semester summary</h3>
        <p>Subjects: <b>{d.subjects.length}</b> · Total units: <b>{units}</b> · Needing attention: <b>{attn}</b></p>
        <p>Semester GPA (current estimates): <b>{gpa != null ? f(gpa) : "not available"}</b></p>
        <p className="text-xs text-slategray">GPA = Σ(grade × units) / Σ(units). Shown only when every subject has a valid estimate. These are in-progress estimates, not final grades. All subjects must use the same grading system.</p>
        <h3 className="mt-3 font-serif text-xl">Cumulative GPA</h3>
        <div className="grid grid-cols-2 gap-2 text-sm"><label>Prior units completed<Input type="number" value={d.prior.units} onChange={(e) => setD({ ...d, prior: { ...d.prior, units: e.target.value } })} /></label>
          <label>Prior cumulative GPA<Input type="number" step="0.01" value={d.prior.gpa} onChange={(e) => setD({ ...d, prior: { ...d.prior, gpa: e.target.value } })} /></label></div>
        <p>Cumulative GPA: <b>{cum != null ? f(cum) : "not available"}</b></p></Card>
      <Button variant="primary" onClick={() => setView("new")}>Add subject</Button></>;
  };
  const nav = (v: string, label: string, on: boolean) => <button onClick={() => setView(v)} aria-current={on ? "page" : undefined}
    className={`min-h-10 rounded-full px-3 text-sm font-semibold transition-colors sm:px-3 ${on ? "bg-brand text-white" : "text-slategray hover:bg-brand/10"}`}>{label}</button>;
  return <>
    <header className="sticky top-0 z-10 border-b border-slategray/20 bg-white/85 text-ink backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-1.5">
      <button className="flex items-center gap-2 font-serif text-base font-bold text-ink sm:text-lg" onClick={() => setView("home")}><Logo className="h-7 w-7" />Butlog</button>
      <div className="flex items-center gap-1 sm:gap-2"><nav className="flex gap-1">{nav("list", "Semester", view === "list" || !!cur)}{nav("new", "+ Subject", view === "new")}</nav><SaveBadge status={status} onRetry={retry} /><AccountMenu /></div></div></header>
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      {legacy && <Card className="border-brand/40"><p className="text-sm">We found {legacy.subjects.length} subject{legacy.subjects.length === 1 ? "" : "s"} saved in this browser from before accounts. Add them to your account?</p>
        <div className="mt-2 flex gap-2"><Button size="sm" variant="primary" onClick={importLegacy}>Import to my account</Button><Button size="sm" onClick={discardLegacy}>Discard</Button></div></Card>}
      {body()}</main></>;
}
