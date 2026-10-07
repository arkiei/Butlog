"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { setPref } from "@/lib/theme";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setDark(document.documentElement.classList.contains("dark"));
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
    {open && <div role="menu" className="absolute right-0 top-12 w-60 rounded-xl border border-slategray/30 bg-card p-3 text-ink shadow-lg">
      <p className="text-xs text-slategray">Signed in as</p>
      <p className="mb-3 break-all text-sm font-semibold">{user.email}</p>
      <button role="switch" aria-checked={dark} onClick={() => { setPref(dark ? "light" : "dark"); setDark(!dark); }} className="mb-2 flex min-h-10 w-full items-center justify-between rounded-lg px-1 text-sm">
        <span>Midnight mode</span><span className={`relative h-5 w-9 rounded-full transition-colors ${dark ? "bg-brand" : "bg-slategray/30"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all ${dark ? "left-[18px]" : "left-0.5"}`} /></span></button>
      <button role="menuitem" onClick={signOut} className="min-h-10 w-full rounded-lg border border-brand text-sm font-semibold text-brand-dark hover:bg-brand/10">Log out</button>
    </div>}
  </div>;
}
