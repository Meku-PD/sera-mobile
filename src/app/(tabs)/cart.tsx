import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { imageUrl } from "@/components/ProductCard";
import { colors, money } from "@/lib/theme";

export default function Cart() {
  const { items, subtotal, setQty, remove, ready } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (!ready) return <Text style={s.empty}>Loading your cart...</Text>;
  if (items.length === 0) return <Text style={s.empty}>Your cart is empty. Add something on the web or here and it appears instantly.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.map((i) => {
          const img = imageUrl(i.image_url);
          return (
            <View key={i.id} style={s.row}>
              {img ? <Image source={{ uri: img }} style={s.img} /> : <View style={s.img} />}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.name} numberOfLines={2}>{i.name}</Text>
                <Text style={s.price}>{money(i.price)}</Text>
                <View style={s.qtyRow}>
                  <Pressable style={s.qbtn} onPress={() => setQty(i.id, i.quantity - 1)}><Text style={s.qtext}>−</Text></Pressable>
                  <Text style={{ minWidth: 22, textAlign: "center", fontWeight: "600" }}>{i.quantity}</Text>
                  <Pressable style={s.qbtn} onPress={() => setQty(i.id, i.quantity + 1)}><Text style={s.qtext}>+</Text></Pressable>
                  <Pressable onPress={() => remove(i.id)} style={{ marginLeft: "auto" }}><Text style={{ color: colors.primary }}>Remove</Text></Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={s.footer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.muted }}>Subtotal</Text>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{money(subtotal)}</Text>
        </View>
        <Pressable style={s.checkout} onPress={() => router.push(user ? "/checkout" : "/(tabs)/profile")}>
          <Text style={s.checkoutText}>{user ? "Checkout" : "Sign in to checkout"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { textAlign: "center", color: colors.muted, margin: 40 },
  row: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.line },
  img: { width: 80, height: 80, borderRadius: 10, backgroundColor: colors.line },
  name: { fontWeight: "600", color: colors.ink },
  price: { color: colors.primary, fontWeight: "700" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qbtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  qtext: { fontSize: 16, color: colors.ink },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  checkout: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  checkoutText: { color: "#fff", fontWeight: "700" },
});
