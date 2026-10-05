import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { colors } from "@/lib/theme";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      let query = supabase.from("products").select("*");
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      const { data } = await query;
      setResults((data ?? []) as Product[]);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <FlatList
      data={results}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <TextInput style={s.input} placeholder="Search coffee, leather, textiles..." value={q} onChangeText={setQ} />
        </View>
      }
      ListEmptyComponent={<Text style={s.empty}>No products found.</Text>}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}

const s = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, backgroundColor: colors.card },
  empty: { textAlign: "center", color: colors.muted, marginTop: 30 },
});
