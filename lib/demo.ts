import type { Subject } from "./engine";
import { uid } from "./utils";
const id = uid;
const iso = (off: number) => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const c = (name: string, s: number | "", t: number, w: number, off?: number) => ({ id: id(), aid: id(), n: name, w: String(w), s: String(s), t: String(t), ...(off != null ? { d: iso(off) } : {}) });
// SAMPLE thresholds for the demo only. NOT an official conversion.
const SAMPLE = { "1.00":"96","1.25":"92","1.50":"88","1.75":"84","2.00":"80","2.25":"76","2.50":"72","2.75":"68","3.00":"60" };
export const demoSubjects = (): Subject[] => [
  { id: id(), name: "Engineering Mathematics", code: "MATH 101", units: 3, instr: "", sem: "1st Semester", system: "msu", target: "3.00", sample: true, conv: { ...SAMPLE },
    comps: [c("Quizzes",42,50,10), c("Activities",18,20,10), c("Midterm Exam",73,100,25), c("Pre-Final Exam","",60,25,9), c("Final Exam","",60,30,24)] },
  { id: id(), name: "General Physics", code: "PHYS 101", units: 3, instr: "", sem: "1st Semester", system: "msu", target: "2.50", sample: true, conv: { ...SAMPLE },
    comps: [c("Quizzes",30,50,20), c("Laboratory",85,100,30), c("Midterm Exam",58,100,25), c("Final Exam","",100,25,16)] },
];
