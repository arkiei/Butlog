"use client";
import { Button } from "@/components/ui/button";
import { googleUrl, icsFile, type CalItem } from "@/lib/ics";
import { countdown, daysUntil } from "@/lib/insights";

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export upcoming exam dates: one .ics file for every calendar app, or one-tap links for Google Calendar. */
export function CalendarExport({ items, compact = false }: { items: CalItem[]; compact?: boolean }) {
  if (!items.length) return null;
  return <div className={compact ? "mt-3" : ""}>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => downloadBlob("butlog-exams.ics", new Blob([icsFile(items)], { type: "text/calendar;charset=utf-8" }))}>Download .ics ({items.length})</Button>
      <span className="text-xs text-slategray">Opens in Google, Apple and Outlook calendars. Each date has a reminder the day before.</span></div>
    <details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold text-brand-dark">Add to Google Calendar one by one</summary>
      <ul className="mt-2 space-y-1">{items.slice(0, 12).map((it) => <li key={it.id} className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate">{it.title} <span className="text-slategray">· {countdown(daysUntil(it.date))}</span></span>
        <a className="shrink-0 font-semibold text-brand-dark underline" href={googleUrl(it)} target="_blank" rel="noopener noreferrer">Add</a></li>)}</ul></details>
  </div>;
}
