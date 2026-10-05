import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/CartProvider";
import { imageUrl } from "@/components/ProductCard";
import { colors, money } from "@/lib/theme";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<Product | null>(null);
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").eq("id", id).single().then(({ data }) => setP(data as Product));
  }, [id]);

  if (!p) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  const img = imageUrl(p.image_url);
  const maker = imageUrl(p.maker_image_url ?? null);
  return (
    <ScrollView>
      {img ? <Image source={{ uri: img }} style={s.img} /> : null}
      <View style={s.body}>
        <Text style={s.name}>{p.name}</Text>
        <Text style={s.price}>{money(p.price)}</Text>
        {p.region ? <Text style={s.meta}>{p.category ? `${p.category} · ` : ""}{p.region}</Text> : null}
        {p.description ? <Text style={s.desc}>{p.description}</Text> : null}
        {maker ? (
          <View style={s.maker}>
            <Image source={{ uri: maker }} style={s.makerImg} />
            <Text style={s.meta}>Meet the maker{p.maker_name ? `: ${p.maker_name}` : ""}</Text>
          </View>
        ) : p.maker_name ? <Text style={s.meta}>Made by {p.maker_name}</Text> : null}
        {p.maker_story ? <Text style={s.desc}>{p.maker_story}</Text> : null}
        <Pressable
          style={s.btn}
          onPress={() => {
            add(p);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          <Text style={s.btnText}>{added ? "Added ✓" : "Add to cart"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.line },
  body: { padding: 16, gap: 8 },
  name: { fontSize: 24, fontWeight: "800", color: colors.ink },
  price: { fontSize: 20, fontWeight: "700", color: colors.primary },
  meta: { color: colors.muted },
  desc: { color: colors.ink, lineHeight: 21 },
  maker: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  makerImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.line },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontWeight: "700" },
});
