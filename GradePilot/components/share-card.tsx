"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cssColor } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { CatBody } from "@/components/bubbles";
import { downloadBlob } from "@/components/calendar-export";

export type ShareRow = { name: string; grade: string | null; target: string; status: string; ok: boolean };
export type ShareSummary = { subjects: number; units: number; attention: number; gpa: number | null };
type Pal = { brand: string; bd: string; yolk: string; ink: string; muted: string; card: string; page: string };
const FONT = "Trebuchet MS, Segoe UI, Arial, sans-serif";
const cut = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

/** The picture itself: plain SVG with fixed colours so it can be turned into a PNG. No email or other personal details. */
function CardSvg({ rows, sum, showNames, showGrades, host, pal }: { rows: ShareRow[]; sum: ShareSummary; showNames: boolean; showGrades: boolean; host: string | null; pal: Pal }) {
  const shown = rows.slice(0, 5), onTrack = sum.subjects - sum.attention;
  const stat = (x: number, label: string, value: string) => <g transform={`translate(${x} 470)`}><rect width="290" height="150" rx="28" fill={pal.card} stroke={pal.muted} strokeOpacity=".3" strokeWidth="2" />
    <text x="145" y="78" textAnchor="middle" fontSize="60" fontWeight="700" fill={pal.ink} fontFamily={FONT}>{value}</text>
    <text x="145" y="122" textAnchor="middle" fontSize="26" fill={pal.muted} fontFamily={FONT}>{label}</text></g>;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350" fontFamily={FONT}>
    <rect width="1080" height="1350" fill={pal.page} />
    <circle cx="960" cy="120" r="260" fill={pal.brand} opacity=".10" /><circle cx="60" cy="1280" r="280" fill={pal.yolk} opacity=".18" />
    <g transform="translate(72 72)"><rect width="84" height="84" rx="22" fill={pal.brand} /><g transform="scale(3.5)"><path d="M12 3.5 C8 3.5 5.2 10 5.2 14.2 C5.2 18.2 8.2 21 12 21 C15.8 21 18.8 18.2 18.8 14.2 C18.8 10 16 3.5 12 3.5 Z" fill={pal.page} /><ellipse cx="12" cy="14.6" rx="3.4" ry="3.9" fill={pal.yolk} /></g></g>
    <text x="180" y="132" fontSize="58" fontWeight="800" fill={pal.ink}>Butlog</text>
    <text x="72" y="300" fontSize="92" fontWeight="800" fill={pal.ink}>My semester</text>
    <text x="72" y="362" fontSize="36" fill={pal.muted}>{sum.subjects} subject{sum.subjects === 1 ? "" : "s"} · {sum.units} unit{sum.units === 1 ? "" : "s"}</text>
    <circle cx="870" cy="300" r="176" fill="#FFF8EC" opacity=".92" />
    <g transform="translate(700 130) scale(3.4)"><CatBody mood={sum.attention === 0 && sum.subjects > 0 ? "cheer" : "normal"} /></g>
    {stat(72, "on track", `${onTrack}/${sum.subjects}`)}{stat(395, "GPA estimate", sum.gpa == null ? "–" : sum.gpa.toFixed(2))}{stat(718, "need attention", String(sum.attention))}
    {shown.map((r, i) => <g key={i} transform={`translate(72 ${660 + i * 112})`}><rect width="936" height="96" rx="24" fill={pal.card} stroke={pal.muted} strokeOpacity=".3" strokeWidth="2" />
      <circle cx="40" cy="48" r="11" fill={r.ok ? "#2E9E5B" : "#E0A100"} />
      <text x="72" y="44" fontSize="34" fontWeight="700" fill={pal.ink}>{showNames ? cut(r.name, 24) : `Subject ${i + 1}`}</text>
      <text x="72" y="78" fontSize="25" fill={pal.muted}>{showGrades ? `Target ${r.target} · ` : ""}{r.status}</text>
      {showGrades && <text x="900" y="62" textAnchor="end" fontSize="44" fontWeight="800" fill={pal.bd}>{r.grade ?? "–"}</text>}</g>)}
    {rows.length > 5 && <text x="72" y={660 + 5 * 112 + 30} fontSize="28" fill={pal.muted}>+ {rows.length - 5} more</text>}
    <text x="72" y="1250" fontSize="36" fontWeight="700" fill={pal.ink}>Know what you need before your next exam.</text>
    {host && <text x="72" y="1298" fontSize="28" fill={pal.bd}>{host}</text>}
  </svg>;
}

async function toPng(svg: SVGSVGElement): Promise<Blob> {
  const img = new Image();
  await new Promise((ok, bad) => { img.onload = () => ok(null); img.onerror = bad; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg)); });
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
  c.getContext("2d")!.drawImage(img, 0, 0, 1080, 1350);
  return new Promise((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error("Could not make the image"))), "image/png"));
}

/** "Share my semester": preview, privacy toggles, then download or share the image. */
export function ShareSemester({ rows, summary }: { rows: ShareRow[]; summary: ShareSummary }) {
  const [open, setOpen] = useState(false), [names, setNames] = useState(true), [grades, setGrades] = useState(true), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const pal = useMemo<Pal>(() => (open ? { brand: cssColor("--c-brand"), bd: cssColor("--c-brand-dark"), yolk: cssColor("--c-yolk"), ink: cssColor("--c-ink"), muted: cssColor("--c-muted"), card: cssColor("--c-card"), page: cssColor("--c-page") } : { brand: "", bd: "", yolk: "", ink: "", muted: "", card: "", page: "" }), [open]);
  const h = typeof window === "undefined" ? "" : window.location.hostname;
  const host = h && h !== "localhost" && !/^[\d.]+$/.test(h) && !h.endsWith(".local") ? h : null;
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [open]);
  const make = async () => { const svg = ref.current?.querySelector("svg"); if (!svg) throw new Error("no card"); return toPng(svg as SVGSVGElement); };
  const save = async () => { setBusy(true); setMsg(""); try { downloadBlob("butlog-semester.png", await make()); setMsg("Image saved."); } catch { setMsg("Sorry, the image could not be made."); } setBusy(false); };
  const share = async () => {
    setBusy(true); setMsg("");
    try { const file = new File([await make()], "butlog-semester.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "My Butlog semester", text: "Know what you need before your next exam." }); else { downloadBlob(file.name, file); setMsg("Sharing isn't available here, so the image was saved."); }
    } catch (e) { if ((e as Error).name !== "AbortError") setMsg("Sorry, the image could not be shared."); }
    setBusy(false);
  };
  return <>
    <Button onClick={() => setOpen(true)}>Share my semester</Button>
    {open && <div role="dialog" aria-modal="true" aria-label="Share my semester" className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-3 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="anim-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between"><h3 className="font-serif text-xl">Share my semester</h3><Button size="sm" onClick={() => setOpen(false)}>Close</Button></div>
        <div ref={ref} className="overflow-hidden rounded-xl border border-slategray/20 [&>svg]:h-auto [&>svg]:w-full"><CardSvg rows={rows} sum={summary} showNames={names} showGrades={grades} host={host} pal={pal} /></div>
        <div className="mt-3 space-y-1 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} />Show subject names</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={grades} onChange={(e) => setGrades(e.target.checked)} />Show grades and targets</label>
          <p className="text-xs text-slategray">The picture never includes your email or account details.</p></div>
        <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" disabled={busy} onClick={share}>Share</Button><Button disabled={busy} onClick={save}>Save image</Button></div>
        {msg && <p role="status" className="mt-2 text-sm text-slategray">{msg}</p>}
      </div></div>}
  </>;
}
