import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: {
    colors: { brand: { DEFAULT: "#D9480F", dark: "#A63A0A" }, yolk: "#FFB703", slategray: "#6B5B52", ink: "#2B1B12" },
    fontFamily: {
      sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      serif: ["var(--font-display)", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
    },
  } },
} satisfies Config;
