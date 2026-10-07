import { cn } from "@/lib/utils";
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("anim-in mb-4 rounded-2xl border border-slategray/15 bg-card p-5 shadow-[0_1px_2px_rgba(43,27,18,.05),0_10px_28px_-14px_rgba(43,27,18,.18)] transition-shadow hover:shadow-[0_1px_2px_rgba(43,27,18,.06),0_14px_32px_-14px_rgba(43,27,18,.28)]", className)} {...p} />
);
