import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/components/AuthProvider";
import { SignInCard } from "@/components/SignInCard";
import { colors } from "@/lib/theme";

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  if (loading) return null;
  if (!user) return <SignInCard message="Sign in with the same account you use on the Sera website. Your cart follows you." />;
  return (
    <View style={s.wrap}>
      <Text style={s.label}>Signed in as</Text>
      <Text style={s.email}>{user.email}</Text>
      <Pressable style={s.btn} onPress={signOut}><Text style={s.btnText}>Sign out</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { margin: 20, padding: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, gap: 8 },
  label: { color: colors.muted },
  email: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 12 },
  btn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { color: colors.primary, fontWeight: "700" },
});
