"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const TIPS = [
  "Check your scores after every quiz while it is still fresh.",
  "Study the heaviest-weighted exam first. Points add up there.",
  "Teach a topic out loud. If you can explain it, you know it.",
  "Short sessions with breaks beat one long cram.",
  "Write down the questions you missed and why.",
  "Review the night before, then sleep. Memory sets while you rest.",
  "Start with the hardest topic while your mind is fresh.",
  "Keep your scores updated here so the numbers stay honest.",
];
export type BubblesMood = "normal" | "cheer" | "calm" | "sleepy" | "dance";
/** Lets any screen make Bubbles say something (and look happy). */
export function bubblesSay(message: string, mood: BubblesMood = "normal", sticky = false) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("bubbles-say", { detail: { message, mood, sticky } }));
}
/** Removes a guide message (used when a guided flow ends). */
export function bubblesClear() { if (typeof window !== "undefined") window.dispatchEvent(new Event("bubbles-clear")); }
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
  "Hard semester? Take it one assessment at a time.",
  "Asking for help early is a strength, not a weakness.",
  "You've got this. Let's check the math together.",
  "Take a stretch and a sip of water. Then back to it!",
  "Consistency is quieter than cramming, and it wins.",
];
const KEY = "gradepilot-bubbles-hidden";

export function CatBody({ mood = "normal" }: { mood?: BubblesMood }) {
  const ink = "#2B1B12", cream = "#ECEEF2", pink = "#FFB4A2", spot = "#232834";
  return <>
    {[[10, 28, 4.5, "0s"], [90, 20, 3.5, "1.2s"], [7, 58, 3, "2.2s"], [93, 48, 2.5, "0.6s"]].map(([x, y, r, d], k) =>
      <g key={k} className="cat-bubble" style={{ animationDelay: d as string }}><circle cx={x as number} cy={y as number} r={r as number} fill="rgba(244,162,97,.18)" stroke="#F4A261" strokeWidth="1.5" /><circle cx={(x as number) - (r as number) / 3} cy={(y as number) - (r as number) / 3} r={(r as number) / 4} fill="#fff" /></g>)}
    <ellipse cx="50" cy="96" rx="24" ry="3" fill="rgba(43,27,18,.12)" />
    <g className="cat-tail"><path d="M76 82 Q98 82 90 56" stroke={ink} strokeWidth="11" fill="none" strokeLinecap="round" /><path d="M76 82 Q98 82 90 56" stroke={cream} strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M92 65.4 Q91.6 60 90 56" stroke={spot} strokeWidth="6" fill="none" strokeLinecap="round" /></g>
    <defs><clipPath id="cat-head"><ellipse cx="50" cy="45" rx="33" ry="28" /></clipPath><clipPath id="cat-body"><ellipse cx="50" cy="74" rx="26" ry="19" /></clipPath></defs>
    <ellipse cx="50" cy="74" rx="26" ry="19" fill={cream} stroke={ink} strokeWidth="3" />
    <g clipPath="url(#cat-body)" fill={spot}><ellipse cx="33" cy="82" rx="8" ry="6" /><ellipse cx="69" cy="70" rx="7" ry="9" /><ellipse cx="54" cy="88" rx="5" ry="3.5" /></g>
    <ellipse cx="38" cy="91" rx="8" ry="4.5" fill={cream} stroke={ink} strokeWidth="2.5" /><ellipse cx="62" cy="91" rx="8" ry="4.5" fill={cream} stroke={ink} strokeWidth="2.5" />
    <path d="M20 38 L22 8 L45 22 Z" fill={cream} stroke={ink} strokeWidth="3" strokeLinejoin="round" /><path d="M26 31 L27 16 L38 23 Z" fill={pink} />
    <path d="M80 38 L78 8 L55 22 Z" fill={spot} stroke={ink} strokeWidth="3" strokeLinejoin="round" /><path d="M74 31 L73 16 L62 23 Z" fill={pink} />
    <ellipse cx="50" cy="45" rx="33" ry="28" fill={cream} stroke={ink} strokeWidth="3" />
    <g clipPath="url(#cat-head)" fill={spot}><ellipse cx="73" cy="28" rx="13" ry="10" /><ellipse cx="29" cy="21" rx="7" ry="5" /><ellipse cx="51" cy="17" rx="3.4" ry="4" /></g>
    {mood === "cheer" || mood === "dance" ? <path d="M31 49 Q37 41 43 49 M57 49 Q63 41 69 49" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" /> : mood === "sleepy" ? <path d="M31 48 Q37 54 43 48 M57 48 Q63 54 69 48" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" /> : <g className="cat-eye"><ellipse cx="37" cy="47" rx="5.2" ry="6.4" fill={ink} /><ellipse cx="63" cy="47" rx="5.2" ry="6.4" fill={ink} />
      <circle cx="38.8" cy="44.6" r="1.9" fill="#fff" /><circle cx="64.8" cy="44.6" r="1.9" fill="#fff" /></g>}
    <circle cx="27" cy="57" r="4.2" fill={pink} opacity=".7" /><circle cx="73" cy="57" r="4.2" fill={pink} opacity=".7" />
    <path d="M47 54 L53 54 L50 58 Z" fill="#FF8FA3" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M50 58 L50 60 M50 60 Q45 65 41 61 M50 60 Q55 65 59 61" stroke={ink} strokeWidth="2.3" fill="none" strokeLinecap="round" />
    {(mood === "cheer" || mood === "dance") && <path d="M44 62 Q50 71 56 62 Z" fill="#FF8FA3" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />}
    {mood === "calm" && <><path d="M31 38 L43 41 M69 38 L57 41" stroke={ink} strokeWidth="2.4" strokeLinecap="round" /><path d="M80 30 Q84 38 80 40 Q76 38 80 30 Z" fill="#9DD6F5" stroke={ink} strokeWidth="1.2" /></>}
    {mood === "sleepy" && <g className="cat-zzz" fill={ink} fontFamily="sans-serif" fontWeight="700"><text x="74" y="22" fontSize="11">z</text><text x="83" y="12" fontSize="8">z</text></g>}
    {mood === "dance" && <g fill="#FFB703"><path d="M12 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" /><path d="M86 8 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z" /></g>}
    <path d="M29 55 L13 52 M29 59 L13 62 M71 55 L87 52 M71 59 L87 62" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M32 68 Q50 77 68 68" stroke="#D9480F" strokeWidth="5" fill="none" strokeLinecap="round" />
    <circle cx="50" cy="75" r="3.6" fill="#FFC24A" stroke={ink} strokeWidth="2" />
  </>;
}

function CatArt({ mood = "normal" }: { mood?: BubblesMood }) {
  return <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Bubbles, the Butlog cat"><CatBody mood={mood} /></svg>;
}

type Mode = "focus" | "short" | "long";
const DUR: Record<Mode, number> = { focus: 25, short: 5, long: 15 };
const LABEL: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
type Timer = { mode: Mode; remaining: number; running: boolean };
const pill = "rounded-full border border-brand/40 px-2.5 py-0.5 text-xs font-semibold text-brand-dark hover:bg-brand/10";

/** Bubbles: an original Butlog cat. Shows encouragement, reacts to your grades, and runs a pomodoro timer (naps while you focus). */
export function Bubbles() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(-1);
  const [hop, setHop] = useState(0);
  const [say, setSay] = useState<{ message: string; mood: BubblesMood; sticky?: boolean } | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [idle, setIdle] = useState(false);
  const endAt = useRef(0), lastActive = useRef(Date.now()), baseTitle = useRef("");
  const sayTimer = useRef<ReturnType<typeof setTimeout>>(), timerRef = useRef<Timer | null>(null);
  timerRef.current = timer;
  const hasTimer = !!timer, running = !!timer?.running, mode = timer?.mode;
  const next = () => setI((x) => (x + 1 + Math.floor(Math.random() * 3)) % MSGS.length);
  const announce = useCallback((message: string, mood: BubblesMood, sticky = false) => { setSay({ message, mood, sticky }); setHop((x) => x + 1); clearTimeout(sayTimer.current); if (!sticky) sayTimer.current = setTimeout(() => setSay(null), 12000); }, []);
  const finish = useCallback(() => {
    const t = timerRef.current; setTimer(null); if (!t) return;
    announce(t.mode === "focus" ? "Meow! Focus session done. You earned a break." : "Break's over. Ready for another round?", "cheer");
  }, [announce]);
  useEffect(() => { try { if (localStorage.getItem(KEY) === "1") setOpen(false); } catch {} setReady(true); }, []);
  useEffect(() => { if (!open || hasTimer) return; const t = setInterval(next, 14000); return () => clearInterval(t); }, [open, hasTimer]);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; announce(d.message, d.mood, !!d.sticky); };
    const clear = () => { clearTimeout(sayTimer.current); setSay(null); };
    window.addEventListener("bubbles-say", h); window.addEventListener("bubbles-clear", clear);
    return () => { window.removeEventListener("bubbles-say", h); window.removeEventListener("bubbles-clear", clear); clearTimeout(sayTimer.current); };
  }, [announce]);
  useEffect(() => {
    const bump = () => { lastActive.current = Date.now(); setIdle(false); };
    const evs = ["pointerdown", "keydown", "scroll"]; evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => { if (Date.now() - lastActive.current > 120000) setIdle(true); }, 15000);
    return () => { evs.forEach((e) => window.removeEventListener(e, bump)); clearInterval(id); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => { const rem = endAt.current - Date.now(); if (rem <= 0) finish(); else setTimer((t) => (t && t.running ? { ...t, remaining: rem } : t)); }, 500);
    return () => clearInterval(id);
  }, [running, mode, finish]);
  useEffect(() => {
    if (timer) { if (!baseTitle.current) baseTitle.current = document.title; document.title = `${mmss(timer.remaining)} · ${LABEL[timer.mode]} · Butlog`; }
    else if (baseTitle.current) { document.title = baseTitle.current; baseTitle.current = ""; }
  }, [timer]);
  const start = (m: Mode) => {
    endAt.current = Date.now() + DUR[m] * 60000; setTimer({ mode: m, remaining: DUR[m] * 60000, running: true });
    announce(m === "focus" ? "Focus time! I'll nap while you work. Shh..." : "Break time. Stretch and sip some water. I'll keep watch.", m === "focus" ? "sleepy" : "normal");
  };
  const resume = () => { if (!timer) return; endAt.current = Date.now() + timer.remaining; setTimer({ ...timer, running: true }); };
  const setHidden = (h: boolean) => { setOpen(!h); try { localStorage.setItem(KEY, h ? "1" : "0"); } catch {} };
  if (!ready) return null;
  const hour = new Date().getHours(), night = hour >= 22 || hour < 5;
  const intro = night ? "Yawn... it's late. A rested brain remembers more." : `Meow! I'm Bubbles. Tip of the day: ${TIPS[Math.floor(Date.now() / 864e5) % TIPS.length]}`;
  const timerMsg = timer ? (timer.mode === "focus" ? "Shh... Bubbles is napping while you focus." : "Break time. Stretch and sip some water.") : "";
  const msg = say?.message ?? (timer ? timerMsg : i < 0 ? intro : MSGS[i]);
  const mood: BubblesMood = say?.mood ?? (timer?.mode === "focus" || idle || night ? "sleepy" : "normal");
  return <div className="pointer-events-none fixed bottom-2 right-2 z-20 flex max-w-[calc(100vw-1rem)] flex-col items-end sm:bottom-4 sm:right-4 print:hidden">
    {open && <div key={msg} className="pointer-events-auto anim-in mb-1 mr-2 max-w-[16rem] rounded-2xl rounded-br-md border border-slategray/20 bg-card px-4 py-3 text-sm shadow-lg">
      <p className="font-medium text-ink">{msg}</p>
      {say?.sticky && <div className="mt-1.5 flex gap-4 text-xs font-semibold text-brand-dark"><button onClick={() => setSay(null)}>Got it</button><button onClick={() => { window.dispatchEvent(new Event("bubbles-guide-skip")); setSay(null); }}>Skip guide</button></div>}
      <div className="mt-2 border-t border-slategray/20 pt-2">
        {!timer ? <div className="flex flex-wrap items-center gap-1.5"><span className="text-xs text-slategray">Study timer</span>
          <button className={pill} onClick={() => start("focus")}>Focus 25</button><button className={pill} onClick={() => start("short")}>Break 5</button><button className={pill} onClick={() => start("long")}>Long 15</button></div>
        : <div className="flex items-center justify-between gap-2"><div><span className="font-serif text-2xl font-bold tabular-nums text-ink">{mmss(timer.remaining)}</span><span className="ml-2 text-xs text-slategray">{LABEL[timer.mode]}</span></div>
          <div className="flex gap-1.5">{timer.running ? <button className={pill} onClick={() => setTimer({ ...timer, running: false })}>Pause</button> : <button className={pill} onClick={resume}>Resume</button>}<button className={pill} onClick={() => setTimer(null)}>Stop</button></div></div>}
      </div>
      <div className="mt-2 flex gap-4 text-xs font-semibold text-brand-dark"><button onClick={next}>Another one</button><button onClick={() => setHidden(true)}>Hide</button></div></div>}
    {!open && timer && <span className="pointer-events-auto mb-1 mr-2 rounded-full border border-slategray/20 bg-card px-3 py-1 text-xs font-semibold tabular-nums text-ink shadow">{mmss(timer.remaining)} {LABEL[timer.mode]}</span>}
    <button onClick={() => { if (!open) setHidden(false); else next(); setHop((h) => h + 1); }} aria-label={open ? "Show another message from Bubbles" : "Show Bubbles the cat"}
      className="pointer-events-auto cat-bob h-20 w-20 sm:h-24 sm:w-24"><span key={hop} className={`block h-full w-full ${mood === "dance" ? "cat-dance" : hop ? "cat-hop" : ""}`}><CatArt mood={mood} /></span></button>
  </div>;
}
