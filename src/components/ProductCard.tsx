import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/CartProvider";
import { colors, money } from "@/lib/theme";
import { API_URL } from "@/lib/supabase";

export function imageUrl(u: string | null | undefined) {
  if (!u) return null;
  return u.startsWith("http") ? u : `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const img = imageUrl(product.image_url);
  return (
    <Pressable style={s.card} onPress={() => router.push(`/product/${product.id}`)}>
      {img ? <Image source={{ uri: img }} style={s.img} /> : <View style={[s.img, s.noimg]} />}
      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        {product.region ? <Text style={s.meta}>{product.region}</Text> : null}
        <Text style={s.price}>{money(product.price)}</Text>
        <Pressable style={s.btn} onPress={() => add(product)}>
          <Text style={s.btnText}>Add to cart</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.line },
  noimg: { alignItems: "center", justifyContent: "center" },
  body: { padding: 10, gap: 3 },
  name: { fontSize: 14, fontWeight: "600", color: colors.ink },
  meta: { fontSize: 12, color: colors.muted },
  price: { fontSize: 15, fontWeight: "700", color: colors.primary, marginTop: 2 },
  btn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
