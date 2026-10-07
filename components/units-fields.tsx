"use client";
import { Input } from "@/components/ui/input";
import { num } from "@/lib/engine";
import { totalUnits } from "@/lib/units";

/** Lecture + laboratory units with an automatic total. Laboratory is optional (leave it at 0). */
export function UnitsFields({ lec, lab, onChange }: { lec: string; lab: string; onChange: (lec: string, lab: string) => void }) {
  const total = totalUnits(num(lec) ?? 0, num(lab) ?? 0);
  return <div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label>Lecture units<Input type="number" min={0} step={0.5} value={lec} onChange={(e) => onChange(e.target.value, lab)} /><span className="mt-0.5 block text-xs text-slategray">Units for classroom or theory work.</span></label>
      <label>Laboratory units<Input type="number" min={0} step={0.5} placeholder="0" value={lab} onChange={(e) => onChange(lec, e.target.value)} /><span className="mt-0.5 block text-xs text-slategray">Units for practical or lab work.</span></label>
    </div>
    <p className="mt-1.5 text-sm text-slategray">Total: <b className="text-ink">{total} unit{total === 1 ? "" : "s"}</b>. Leave laboratory at 0 if the subject has none.</p>
    <p className="mt-1 text-xs text-slategray">Units are academic credit information only. They do not set grading percentages: those come from your grading components and weights.</p>
  </div>;
}
