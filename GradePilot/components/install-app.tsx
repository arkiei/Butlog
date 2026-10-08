"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { openInstall, useInstall } from "@/lib/install";

const DISMISS = "butlog-install-dismissed";
const DownIcon = () => <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 15v1.5h12V15" /></svg>;
const ShareIcon = () => <svg viewBox="0 0 20 20" className="inline h-5 w-5 align-text-bottom" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 12V3m0 0L7 6m3-3 3 3M5.5 9H5a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-.5" /></svg>;

/** Header button: installs straight away when the browser allows it, otherwise opens the how-to dialog. */
export function InstallButton() {
  const i = useInstall();
  if (!i.ready || i.installed || !(i.canPrompt || i.platform === "ios")) return null;
  return <button onClick={() => (i.canPrompt ? i.promptInstall() : openInstall())} className="hidden min-h-10 items-center gap-1.5 rounded-full border border-brand/40 px-3 text-sm font-semibold text-brand-dark transition hover:bg-brand/10 sm:inline-flex"><DownIcon />Install</button>;
}

/** Friendly card at the top of the app until the user installs or dismisses it (hidden for two weeks after "Not now"). */
export function InstallBanner() {
  const i = useInstall(), [hidden, setHidden] = useState(true);
  useEffect(() => { try { const t = Number(localStorage.getItem(DISMISS) ?? 0); setHidden(Date.now() - t < 14 * 864e5); } catch { setHidden(false); } }, []);
  if (!i.ready || i.installed || hidden || !(i.canPrompt || i.platform === "ios")) return null;
  const dismiss = () => { try { localStorage.setItem(DISMISS, String(Date.now())); } catch {} setHidden(true); };
  return <Card className="flex items-center gap-3 border-brand/30">
    <Logo className="h-11 w-11 shrink-0" />
    <div className="min-w-0 flex-1"><p className="font-semibold">Install Butlog on your phone</p><p className="text-sm text-slategray">Open it from your home screen like an app, and keep working offline.</p></div>
    <div className="flex shrink-0 flex-col gap-1 sm:flex-row"><Button size="sm" variant="primary" onClick={() => (i.canPrompt ? i.promptInstall() : openInstall())}>{i.canPrompt ? "Install" : "How?"}</Button><Button size="sm" onClick={dismiss}>Not now</Button></div>
  </Card>;
}

/** The install dialog: native prompt when available, otherwise clear steps for this device. Mount once. */
export function InstallApp() {
  const i = useInstall(), [open, setOpen] = useState(false), [done, setDone] = useState(false);
  useEffect(() => { const o = () => { setDone(false); setOpen(true); }; window.addEventListener("butlog-open-install", o); return () => window.removeEventListener("butlog-open-install", o); }, []);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [open]);
  if (!open) return null;
  const steps = i.platform === "ios"
    ? [<>Open Butlog in <b>Safari</b> (other iPhone browsers can&apos;t install apps).</>, <>Tap the Share button <ShareIcon /> at the bottom of the screen.</>, <>Scroll down and tap <b>Add to Home Screen</b>.</>, <>Tap <b>Add</b>. Butlog now appears on your home screen.</>]
    : i.platform === "android" ? [<>Tap the <b>⋮ menu</b> in the top corner of your browser.</>, <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</>, <>Confirm. Butlog now appears with your other apps.</>]
    : [<>Look for the <b>install icon</b> at the right of the address bar, or open the browser menu.</>, <>Choose <b>Install Butlog</b> (or Create shortcut and tick Open as window).</>, <>Butlog opens in its own window like a normal app.</>];
  return <div role="dialog" aria-modal="true" aria-label="Install Butlog" className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-3 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
    <div className="anim-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
      <div className="flex items-center gap-3"><Logo className="h-12 w-12" /><div><h3 className="font-serif text-xl">Install Butlog</h3><p className="text-sm text-slategray">Free, no app store needed.</p></div></div>
      <ul className="mt-3 space-y-1 text-sm"><li>✓ Opens from your home screen like an app</li><li>✓ Keeps working offline after the first load</li><li>✓ Full screen, with no browser bars</li></ul>
      {i.installed ? <p className="mt-4 rounded-lg bg-tint px-3 py-2 text-sm">Butlog is already installed on this device.</p>
        : done ? <p role="status" className="mt-4 rounded-lg bg-tint px-3 py-2 text-sm">Installed! Look for Butlog on your home screen.</p>
        : i.canPrompt ? <div className="mt-4"><Button variant="primary" onClick={async () => { if ((await i.promptInstall()) === "accepted") setDone(true); }}>Install now</Button></div>
        : <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">{steps.map((st, k) => <li key={k}>{st}</li>)}</ol>}
      <div className="mt-4 text-right"><Button size="sm" onClick={() => setOpen(false)}>Close</Button></div>
    </div></div>;
}
