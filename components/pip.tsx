"use client";
import { useEffect, useState } from "react";

const GREETING = "Hi, I'm Pip, your GradePilot co-pilot. Let's plan this semester together!";
const MSGS = [
  "You don't need perfect. You need prepared.",
  "A plan turns worry into a to-do list.",
  "Small steps still count. One quiz at a time.",
  "Know your numbers, then trust your work.",
  "Every question you review is one you won't miss.",
  "Progress beats panic. You're already doing the right thing.",
  "Rest is part of studying. Sleep before the exam!",
  "Even a few points better on one quiz moves the needle.",
  "Celebrate what you've already finished.",
  "Hard semester? Break it into one assessment at a time.",
  "Asking for help early is a strength, not a weakness.",
  "You've got this. Let's check the math together.",
  "Future you will be glad you looked at this today.",
  "Consistency is quieter than cramming, and it wins.",
];
const KEY = "gradepilot-pip-hidden";

function PipArt() {
  const ink = "#0B1B3A";
  return <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Pip, the GradePilot co-pilot">
    <ellipse cx="50" cy="94" rx="22" ry="3.5" fill="rgba(11,27,58,.12)" />
    <ellipse cx="38" cy="89" rx="8" ry="4.5" fill="#FF7A45" stroke={ink} strokeWidth="2.5" /><ellipse cx="62" cy="89" rx="8" ry="4.5" fill="#FF7A45" stroke={ink} strokeWidth="2.5" />
    <path d="M20 62 Q8 66 10 76" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="10" cy="76" r="4" fill="#6C8BFF" stroke={ink} strokeWidth="2.5" />
    <ellipse cx="50" cy="60" rx="33" ry="30" fill="#6C8BFF" stroke={ink} strokeWidth="3" />
    <ellipse cx="50" cy="70" rx="19" ry="14" fill="#E6ECFF" />
    <path d="M19 47 Q20 12 50 12 Q80 12 81 47 Q50 39 19 47 Z" fill="#FF7A45" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    <path d="M17 47 Q50 37 83 47 L83 52 Q50 43 17 52 Z" fill="#E85D2C" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M45 27 L55 27" stroke={ink} strokeWidth="2.5" /><circle cx="37" cy="27" r="7.5" fill="#fff" stroke={ink} strokeWidth="2.5" /><circle cx="63" cy="27" r="7.5" fill="#fff" stroke={ink} strokeWidth="2.5" />
    <circle cx="37" cy="27" r="3.4" fill="#9DB4FF" /><circle cx="63" cy="27" r="3.4" fill="#9DB4FF" />
    <g className="pip-eye"><ellipse cx="39" cy="61" rx="4.8" ry="6" fill={ink} /><ellipse cx="61" cy="61" rx="4.8" ry="6" fill={ink} />
      <circle cx="40.6" cy="58.6" r="1.7" fill="#fff" /><circle cx="62.6" cy="58.6" r="1.7" fill="#fff" /></g>
    <circle cx="29" cy="69" r="4" fill="#FF9E80" opacity=".75" /><circle cx="71" cy="69" r="4" fill="#FF9E80" opacity=".75" />
    <path d="M44 69 Q50 75 56 69" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    <g className="pip-wave"><path d="M80 60 Q95 54 92 40" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="92" cy="38" r="4.6" fill="#6C8BFF" stroke={ink} strokeWidth="2.5" /></g>
  </svg>;
}

/** Pip: an original GradePilot mascot that shows rotating encouragement in a screen corner. */
export function Pip() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(-1);
  const [hop, setHop] = useState(0);
  const next = () => setI((x) => (x + 1 + Math.floor(Math.random() * 3)) % MSGS.length);
  useEffect(() => { try { if (localStorage.getItem(KEY) === "1") setOpen(false); } catch {} setReady(true); }, []);
  useEffect(() => { if (!open) return; const t = setInterval(next, 14000); return () => clearInterval(t); }, [open]);
  const setHidden = (h: boolean) => { setOpen(!h); try { localStorage.setItem(KEY, h ? "1" : "0"); } catch {} };
  if (!ready) return null;
  const msg = i < 0 ? GREETING : MSGS[i];
  return <div className="pointer-events-none fixed bottom-2 right-2 z-20 flex max-w-[calc(100vw-1rem)] flex-col items-end sm:bottom-4 sm:right-4 print:hidden">
    {open && <div key={msg} className="pointer-events-auto anim-in mb-1 mr-2 max-w-[16rem] rounded-2xl rounded-br-md border border-slategray/20 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-medium text-ink">{msg}</p>
      <div className="mt-1.5 flex gap-4 text-xs font-semibold text-brand-dark"><button onClick={next}>Another one</button><button onClick={() => setHidden(true)}>Hide</button></div></div>}
    <button onClick={() => { if (!open) setHidden(false); else next(); setHop((h) => h + 1); }} aria-label={open ? "Show another message from Pip" : "Show Pip"}
      className="pointer-events-auto pip-bob h-16 w-16 sm:h-20 sm:w-20"><span key={hop} className={`block h-full w-full ${hop ? "pip-hop" : ""}`}><PipArt /></span></button>
  </div>;
}
