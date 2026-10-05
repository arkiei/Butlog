"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
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
    {open && <div role="menu" className="absolute right-0 top-12 w-60 rounded-xl border border-slategray/30 bg-white p-3 text-stone-900 shadow-lg">
      <p className="text-xs text-slategray">Signed in as</p>
      <p className="mb-3 break-all text-sm font-semibold">{user.email}</p>
      <button role="menuitem" onClick={signOut} className="min-h-10 w-full rounded-lg border border-brand text-sm font-semibold text-brand-dark hover:bg-brand/10">Log out</button>
    </div>}
  </div>;
}
