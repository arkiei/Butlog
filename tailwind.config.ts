import type { Config } from "tailwindcss";
const v = (n: string) => `rgb(var(--c-${n}) / <alpha-value>)`;
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: {
    colors: { brand: { DEFAULT: v("brand"), dark: v("brand-dark") }, yolk: v("yolk"), slategray: v("muted"), ink: v("ink"), card: v("card"), page: v("page"), onbrand: v("onbrand"), hero: "#2B1B12", tint: v("tint"), danger: v("danger") },
    fontFamily: {
      sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      serif: ["var(--font-display)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
    },
  } },
} satisfies Config;
