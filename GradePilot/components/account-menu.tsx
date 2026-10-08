"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PACKS, getPackPref, resolvePack, setPackPref, setPref, type PackPref } from "@/lib/theme";
import { openInstall, useInstall } from "@/lib/install";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [pack, setPack] = useState<PackPref>("butlog");
  const install = useInstall();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setDark(document.documentElement.classList.contains("dark")); setPack(getPackPref());
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", key); };
  }, [open]);
  if (!user) return null;
  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  return <div ref={ref} className="relative">
    <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand bg-brand/10 font-serif text-base font-bold text-brand-dark hover:bg-brand/20">{initial}</button>
    {open && <div role="menu" className="absolute right-0 top-12 max-h-[80vh] w-64 overflow-y-auto rounded-xl border border-slategray/30 bg-card p-3 text-ink shadow-lg">
      <p className="text-xs text-slategray">Signed in as</p>
      <p className="mb-3 break-all text-sm font-semibold">{user.email}</p>
      <button role="switch" aria-checked={dark} onClick={() => { setPref(dark ? "light" : "dark"); setDark(!dark); }} className="mb-2 flex min-h-10 w-full items-center justify-between rounded-lg px-1 text-sm">
        <span>Midnight mode</span><span className={`relative h-5 w-9 rounded-full transition-colors ${dark ? "bg-brand" : "bg-slategray/30"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all ${dark ? "left-[18px]" : "left-0.5"}`} /></span></button>
      <div className="mb-2 px-1"><p className="mb-1.5 text-xs text-slategray">Theme</p>
        <div role="radiogroup" aria-label="Theme" className="flex flex-wrap items-center gap-2">
          {PACKS.map((p) => <button key={p.id} role="radio" aria-checked={pack === p.id} aria-label={`${p.name}: ${p.note}`} title={p.name} onClick={() => { setPackPref(p.id); setPack(p.id); }}
            className={`h-8 w-8 rounded-full border-2 transition ${pack === p.id ? "border-brand ring-2 ring-brand/30" : "border-slategray/30"}`} style={{ background: `linear-gradient(135deg, ${p.swatch[0]} 50%, ${p.swatch[1]} 50%)` }} />)}
          <button role="radio" aria-checked={pack === "auto"} title="Changes with the season" onClick={() => { setPackPref("auto"); setPack("auto"); }}
            className={`h-8 rounded-full border-2 px-2.5 text-xs font-semibold ${pack === "auto" ? "border-brand bg-brand/10 text-brand-dark" : "border-slategray/30 text-slategray"}`}>Season</button></div>
        <p className="mt-1 text-xs text-slategray">{pack === "auto" ? `Seasonal: ${PACKS.find((p) => p.id === resolvePack("auto"))?.name}` : PACKS.find((p) => p.id === pack)?.name}</p></div>
      {!install.installed && <button role="menuitem" onClick={() => { setOpen(false); openInstall(); }} className="mb-1 flex min-h-10 w-full items-center rounded-lg px-1 text-left text-sm font-semibold text-brand-dark">Install app</button>}
      <button role="menuitem" onClick={signOut} className="min-h-10 w-full rounded-lg border border-brand text-sm font-semibold text-brand-dark hover:bg-brand/10">Log out</button>
    </div>}
  </div>;
}
