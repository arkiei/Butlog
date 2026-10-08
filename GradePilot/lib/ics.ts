import * as E from "./engine";
import * as S from "./sections";
import * as I from "./insights";
import type { Subject } from "./engine";

export type CalItem = { id: string; title: string; date: string; details: string };

/** Upcoming dated assessments (not yet taken) across the given subjects. */
export function calendarItems(subjects: Subject[]): CalItem[] {
  const out: CalItem[] = [];
  for (const s of subjects) {
    const r = I.requiredAvg(s);
    const need = r === null ? "" : r <= 1e-9 ? `Your ${s.target} is already secured.` : r > 100 + 1e-9 ? `Your ${s.target} target is out of reach.` : `About ${Math.round(r)}% on the remaining work gets you a ${s.target}.`;
    for (const c of S.eff(s)) if (!E.isDone(c) && c.d && I.daysUntil(c.d) >= 0)
      out.push({ id: c.id, title: `${c.n}: ${s.name}`, date: c.d.slice(0, 10), details: [s.code ? `${s.name} (${s.code})` : s.name, need, "Planned with Butlog."].filter(Boolean).join("\n") });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const ymd = (iso: string) => iso.replace(/-/g, "");
const nextDay = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); const n = new Date(y, m - 1, d + 1); return `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`; };
export const googleUrl = (it: CalItem) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(it.title)}&dates=${ymd(it.date)}/${nextDay(it.date)}&details=${encodeURIComponent(it.details)}`;

const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const parts: string[] = []; let rest = line; while (rest.length > 70) { parts.push(rest.slice(0, 70)); rest = " " + rest.slice(70); } parts.push(rest); return parts.join("\r\n"); };

/** An iCalendar (.ics) file of all-day events, each with a reminder the day before at 9:00. Works with Google, Apple and Outlook calendars. */
export function icsFile(items: CalItem[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Butlog//Exam dates//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Butlog exams"];
  for (const it of items) lines.push("BEGIN:VEVENT", `UID:${it.id}@butlog`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(it.date)}`, `DTEND;VALUE=DATE:${nextDay(it.date)}`,
    `SUMMARY:${esc(it.title)}`, `DESCRIPTION:${esc(it.details)}`, "TRANSP:TRANSPARENT", "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(it.title)} is tomorrow`, "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT");
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
