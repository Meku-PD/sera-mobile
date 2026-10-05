import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, money } from "@/lib/theme";

type Order = {
  id: string;
  order_number: number | null;
  customer_name: string;
  email: string;
  address: string;
  payment_method: string;
  total: number;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
};

export default function OrderConfirmed() {
  const { id, email } = useLocalSearchParams<{ id: string; email?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    supabase.from("orders").select("*, order_items(*)").eq("id", id).single().then(({ data }) => setOrder(data as Order));
  }, [id]);

  if (!order) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Text style={s.title}>Order confirmed!</Text>
      <Text style={s.sub}>Thank you, {order.customer_name}. Your order {order.order_number ? `#SERA-${order.order_number}` : ""} is confirmed.</Text>
      <Text style={[s.note, email === "sent" ? s.ok : s.warn]}>
        {email === "sent" ? `A confirmation email was sent to ${order.email}.` : "Your order is saved, but we could not send the confirmation email."}
      </Text>
      <View style={s.box}>
        {order.order_items.map((i) => (
          <View key={i.id} style={s.line}>
            <Text style={{ flex: 1 }}>{i.product_name} × {i.quantity}</Text>
            <Text>{money(i.unit_price * i.quantity)}</Text>
          </View>
        ))}
        <View style={[s.line, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
          <Text style={s.total}>Total</Text>
          <Text style={s.total}>{money(order.total)}</Text>
        </View>
      </View>
      <Text style={{ color: colors.muted }}>Delivery to: {order.address}</Text>
      <Text style={{ color: colors.muted }}>Payment: {order.payment_method} · Estimated arrival: 2-4 days</Text>
      <Pressable style={s.btn} onPress={() => router.replace("/(tabs)")}>
        <Text style={s.btnText}>Keep shopping</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", color: colors.primary },
  sub: { color: colors.ink, fontSize: 16 },
  note: { padding: 12, borderRadius: 12, overflow: "hidden" },
  ok: { backgroundColor: "#E4F1E2", color: "#245B22" },
  warn: { backgroundColor: "#F7E3DA", color: colors.primaryDark },
  box: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: colors.line },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  total: { fontWeight: "700", color: colors.primary, fontSize: 16 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});
