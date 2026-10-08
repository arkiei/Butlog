"use client";
import { useEffect } from "react";

/** Registers the offline service worker (production only) and remembers the browser's install prompt. */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    const w = window as unknown as { __butlogInstall?: Event | null };
    const onPrompt = (e: Event) => { e.preventDefault(); w.__butlogInstall = e; window.dispatchEvent(new Event("butlog-installable")); };
    const onInstalled = () => { w.__butlogInstall = null; window.dispatchEvent(new Event("butlog-installable")); };
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  return null;
}
