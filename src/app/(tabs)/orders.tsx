import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { SignInCard } from "@/components/SignInCard";
import { colors, money } from "@/lib/theme";

type Order = { id: string; order_number?: number | null; total?: number | null; status?: string | null; created_at?: string | null; [k: string]: unknown };

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setBusy(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return <SignInCard message="Sign in to see your orders." />;
  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={<Text style={s.empty}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <Text style={s.id}>{item.order_number ? `Order #SERA-${item.order_number}` : `Order ${String(item.id).slice(0, 8)}`}</Text>
          {item.created_at ? <Text style={s.meta}>{new Date(item.created_at).toLocaleDateString()}</Text> : null}
          {item.status ? <Text style={s.meta}>{item.status}</Text> : null}
          {item.total != null ? <Text style={s.total}>{money(Number(item.total))}</Text> : null}
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 3 },
  id: { fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  total: { color: colors.primary, fontWeight: "700", marginTop: 4 },
});
