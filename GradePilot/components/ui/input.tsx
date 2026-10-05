import * as React from "react";
import { cn } from "@/lib/utils";
const base = "min-h-11 w-full rounded-xl border border-slategray/30 bg-white px-3 py-1.5 transition focus:border-brand focus:ring-2 focus:ring-brand/30 focus-visible:outline-none";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} className={cn(base, className)} {...p} />);
Input.displayName = "Input";
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(base, className)} {...p} />;
