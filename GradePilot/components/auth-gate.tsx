"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ k: "bad" | "ok"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="p-6 text-slategray">Loading…</p>;
  if (user) return <>{children}</>;

  const submit = async () => {
    setBusy(true); setMsg(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ k: "bad", t: error.message });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg({ k: "bad", t: error.message });
      else if (!data.session) setMsg({ k: "ok", t: "Account created. Check your email to confirm it, then log in." });
    }
    setBusy(false);
  };
  return <main className="mx-auto max-w-md px-4 pt-14">
    <div className="mb-2 flex items-center justify-center gap-3"><Logo className="h-11 w-11" /><h1 className="font-serif text-4xl font-extrabold tracking-tight text-ink">Butlog</h1></div>
    <p className="mb-4 text-center font-serif italic">Know what you need before your next exam.</p>
    <Card>
      <h2 className="mb-2 font-serif text-2xl">{mode === "login" ? "Log in" : "Sign up"}</h2>
      <label className="text-sm">Email<Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="mt-2 block text-sm">Password<Input type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {msg && <p role="status" className={`my-2 rounded-lg px-3 py-2 text-sm ${msg.k === "ok" ? "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-200" : "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200"}`}>{msg.t}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="primary" disabled={busy || !email || password.length < 6} onClick={submit}>{mode === "login" ? "Log in" : "Create account"}</Button>
        <Button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}>{mode === "login" ? "Need an account?" : "Have an account?"}</Button></div>
      <p className="mt-2 text-xs text-slategray">Passwords are handled by Supabase Auth. This app never stores them.</p>
    </Card></main>;
}
