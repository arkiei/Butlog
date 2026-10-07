import * as React from "react";
import { cn } from "@/lib/utils";
type P = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "yolk"; size?: "sm" | "md" };
export const Button = React.forwardRef<HTMLButtonElement, P>(({ className, variant = "outline", size = "md", ...p }, ref) => (
  <button ref={ref} className={cn("inline-flex items-center justify-center rounded-full font-semibold transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "min-h-[44px] px-5" : "min-h-9 px-3 text-sm",
    variant === "primary" ? "bg-brand text-onbrand shadow-sm hover:bg-brand-dark" : variant === "yolk" ? "bg-yolk text-hero shadow-sm hover:brightness-105" : "border border-brand/40 text-brand-dark hover:bg-brand/10", className)} {...p} />
));
Button.displayName = "Button";
