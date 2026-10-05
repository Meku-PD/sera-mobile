import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { colors } from "@/lib/theme";

export function SignInCard({ message }: { message?: string }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    setNote(null);
    const err = await fn();
    setNote(err);
    setBusy(false);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{mode === "in" ? "Welcome back" : "Create your account"}</Text>
      {message ? <Text style={s.sub}>{message}</Text> : null}
      <Pressable style={s.google} disabled={busy} onPress={() => run(signInWithGoogle)}>
        <Text style={s.googleText}>Continue with Google</Text>
      </Pressable>
      <Text style={s.or}>or use email</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password (6+ characters)" secureTextEntry value={password} onChangeText={setPassword} />
      <Pressable
        style={s.primary}
        disabled={busy || !email || password.length < 6}
        onPress={() => run(() => (mode === "in" ? signInWithEmail(email.trim(), password) : signUpWithEmail(email.trim(), password)))}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{mode === "in" ? "Sign in" : "Sign up"}</Text>}
      </Pressable>
      {note ? <Text style={s.note}>{note}</Text> : null}
      <Pressable onPress={() => setMode(mode === "in" ? "up" : "in")}>
        <Text style={s.switch}>{mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { margin: 20, padding: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink },
  sub: { color: colors.muted },
  google: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  googleText: { fontWeight: "600", color: colors.ink },
  or: { textAlign: "center", color: colors.muted, fontSize: 12 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, backgroundColor: colors.bg },
  primary: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
  note: { color: colors.primaryDark, fontSize: 13 },
  switch: { textAlign: "center", color: colors.primary, fontWeight: "600" },
});
