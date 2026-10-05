import { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = Linking.createURL("auth-callback");
    console.log("[auth] redirectTo =", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return error?.message ?? "Could not start Google sign-in";
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log("[auth] result type =", res.type, "url =", "url" in res ? res.url : "");
    if (res.type !== "success") return null; // user closed the window
    const url = res.url;
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    if (typeof code === "string") {
      const { error: e } = await supabase.auth.exchangeCodeForSession(code);
      return e?.message ?? null;
    }
    const frag = url.split("#")[1];
    if (frag) {
      const p = new URLSearchParams(frag);
      const access_token = p.get("access_token");
      const refresh_token = p.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
        return e?.message ?? null;
      }
    }
    return "Google sign-in did not return a session. Check the Redirect URLs in Supabase.";
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (!data.session) return "Account created. Check your email to confirm, then sign in.";
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{ user: session?.user ?? null, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}