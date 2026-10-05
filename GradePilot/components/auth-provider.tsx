"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type Ctx = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, loading: true, signOut: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => { await supabase.auth.signOut(); };
  return <AuthCtx.Provider value={{ user, loading, signOut }}>{children}</AuthCtx.Provider>;
}
