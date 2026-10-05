import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase, API_URL } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { SignInCard } from "@/components/SignInCard";
import { colors, money } from "@/lib/theme";

const CITIES = ["Addis Ababa", "Adama", "Bahir Dar", "Hawassa", "Dire Dawa", "Gondar", "Mekelle", "Jimma", "Other"];
const PAYMENTS = [
  { id: "Telebirr", note: "Instant Ethio Telecom Mobile Money" },
  { id: "CBE Birr", note: "Direct Bank Transfer Wallet" },
  { id: "Chapa", note: "Pay via Card or Other Wallets" },
  { id: "E-Birr", note: "Ethiopian mobile money service" },
];

export default function Checkout() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [landmark, setLandmark] = useState("");
  const [payment, setPayment] = useState("Telebirr");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  if (!user || !session) return <SignInCard message="Sign in to complete your order." />;
  if (items.length === 0 && !done) return <Text style={s.empty}>Your cart is empty.</Text>;

  async function placeOrder() {
    if (!user || !session) return;
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (!name.trim() || !landmark.trim()) return setError("Please fill in your name and landmark.");
    if (digits.length < 9) return setError("Please enter a valid phone number.");

    setBusy(true);
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_name: name || (user.user_metadata?.full_name as string) || "Customer",
        email: user.email,
        phone: `+251${digits.slice(-9)}`,
        address: `${city} - ${landmark}`,
        total: subtotal,
        status: "confirmed",
        payment_method: payment,
      })
      .select()
      .single();
    if (orderErr || !order) {
      setError(orderErr?.message ?? "Could not place your order.");
      setBusy(false);
      return;
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
      }))
    );
    if (itemsErr) {
      setError(itemsErr.message);
      setBusy(false);
      return;
    }

    // Same email route the website uses
    let emailStatus = "failed";
    try {
      const res = await fetch(`${API_URL}/api/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        const result = await res.json();
        emailStatus = result.customerEmailSent ? "sent" : "failed";
      }
    } catch {
      // the order is saved even if the email fails
    }

    setDone(true);
    clear();
    router.replace({ pathname: "/order-confirmed/[id]", params: { id: order.id, email: emailStatus } });
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={s.box}>
        <Text style={s.h}>Order summary</Text>
        {items.map((i) => (
          <View key={i.id} style={s.line}>
            <Text style={{ flex: 1 }}>{i.name} × {i.quantity}</Text>
            <Text>{money(i.price * i.quantity)}</Text>
          </View>
        ))}
        <View style={[s.line, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
          <Text style={s.total}>Total</Text>
          <Text style={s.total}>{money(subtotal)}</Text>
        </View>
      </View>

      <Text style={s.h}>Delivery address</Text>
      <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Phone, e.g. 911 234 567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {CITIES.map((c) => (
          <Pressable key={c} onPress={() => setCity(c)} style={[s.chip, city === c && s.chipOn]}>
            <Text style={{ color: city === c ? "#fff" : colors.ink }}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput style={[s.input, { minHeight: 70 }]} multiline placeholder="Landmark / area description" value={landmark} onChangeText={setLandmark} />

      <Text style={s.h}>Payment method</Text>
      {PAYMENTS.map((p) => (
        <Pressable key={p.id} onPress={() => setPayment(p.id)} style={[s.pay, payment === p.id && { borderColor: colors.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>{p.id}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{p.note}</Text>
          </View>
          <View style={[s.radio, payment === p.id && { backgroundColor: colors.primary }]} />
        </Pressable>
      ))}
      <Text style={{ color: colors.muted, fontSize: 12 }}>Demo checkout: no real payment is taken.</Text>

      {error ? <Text style={s.err}>{error}</Text> : null}
      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={placeOrder}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Pay now · {money(subtotal)}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty: { textAlign: "center", color: colors.muted, margin: 40 },
  box: { backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: colors.line },
  h: { fontSize: 18, fontWeight: "700", color: colors.ink },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  total: { fontWeight: "700", color: colors.primary, fontSize: 16 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, backgroundColor: colors.card },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pay: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary },
  err: { backgroundColor: "#F7E3DA", color: colors.primaryDark, padding: 12, borderRadius: 12 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});
