import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { colors } from "@/lib/theme";

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cat, setCat] = useState("All");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data, error }) => {
      if (error) setErr(error.message);
      setProducts((data ?? []) as Product[]);
    });
  }, []);

  const cats = useMemo(() => ["All", ...Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean) as string[]))], [products]);
  const shown = (products ?? []).filter((p) => cat === "All" || p.category === cat);

  if (!products) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <FlatList
      data={shown}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <Text style={s.hero}>Handmade in Ethiopia</Text>
          <Text style={s.sub}>Crafts straight from the artisans who make them.</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={cats}
            keyExtractor={(c) => c}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => setCat(item)} style={[s.chip, cat === item && s.chipOn]}>
                <Text style={[s.chipText, cat === item && { color: "#fff" }]}>{item}</Text>
              </Pressable>
            )}
          />
          {err ? <Text style={{ color: "crimson" }}>{err}</Text> : null}
        </View>
      }
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}

const s = StyleSheet.create({
  hero: { fontSize: 26, fontWeight: "800", color: colors.ink },
  sub: { color: colors.muted },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
});
