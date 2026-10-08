"use client";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };
const slot = () => window as unknown as { __butlogInstall?: InstallEvent | null; navigator: Navigator & { standalone?: boolean } };
export type Platform = "ios" | "android" | "desktop";
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return /android/i.test(ua) ? "android" : "desktop";
}
export const openInstall = () => window.dispatchEvent(new Event("butlog-open-install"));

/** Install state: already installed, whether the browser can show its own install prompt, and which device this is. */
export function useInstall() {
  const [s, setS] = useState<{ installed: boolean; canPrompt: boolean; platform: Platform; ready: boolean }>({ installed: false, canPrompt: false, platform: "desktop", ready: false });
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const upd = () => setS({ installed: mq.matches || slot().navigator.standalone === true, canPrompt: !!slot().__butlogInstall, platform: detectPlatform(), ready: true });
    upd();
    window.addEventListener("butlog-installable", upd); window.addEventListener("appinstalled", upd); mq.addEventListener?.("change", upd);
    return () => { window.removeEventListener("butlog-installable", upd); window.removeEventListener("appinstalled", upd); mq.removeEventListener?.("change", upd); };
  }, []);
  const promptInstall = async (): Promise<string> => {
    const e = slot().__butlogInstall; if (!e) return "unavailable";
    e.prompt(); const c = await e.userChoice; slot().__butlogInstall = null; window.dispatchEvent(new Event("butlog-installable")); return c.outcome;
  };
  return { ...s, promptInstall };
}
