import "./globals.css";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGate } from "@/components/auth-gate";
import { Bubbles } from "@/components/bubbles";
import { PwaSetup } from "@/components/pwa-setup";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

// Set NEXT_PUBLIC_SITE_URL to your public domain; Vercel's production URL is used automatically otherwise.
const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
export const metadata: Metadata = {
  ...(site ? { metadataBase: new URL(site) } : {}),
  title: { default: "Butlog", template: "%s | Butlog" },
  description: "Plan your grades, calculate required exam scores, and see whether your target grade is still achievable.",
  appleWebApp: { capable: true, title: "Butlog", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: { title: "Butlog", description: "Know what you need before your next exam.", type: "website", siteName: "Butlog" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#D9480F" };
const themeScript = `try{var d=document.documentElement,p=localStorage.getItem("butlog-theme");if(p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");var k=localStorage.getItem("butlog-pack");if(k==="auto"){var m=new Date().getMonth();k=m===11||m===0?"pasko":m>=2&&m<=4?"mango":m>=5&&m<=10?"rainy":"butlog"}if(k&&k!=="butlog")d.setAttribute("data-theme",k)}catch(e){}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning className={`${display.variable} ${bodyFont.variable}`}><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <AuthProvider><PwaSetup /><AuthGate>{children}<Bubbles /></AuthGate></AuthProvider>
    <footer className="mx-auto max-w-5xl px-4 pb-24 pt-2 text-center text-xs text-slategray">Butlog is an independent student-made grade planning tool. It is not affiliated with, endorsed by, or officially associated with any university.</footer>
  </body></html>;
}
