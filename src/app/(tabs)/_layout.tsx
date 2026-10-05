import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { useCart } from "@/components/CartProvider";

export default function TabsLayout() {
  const { count } = useCart();
  const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: import("react-native").ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.ink },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Sera", tabBarLabel: "Home", tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search-outline") }} />
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart", tabBarIcon: icon("bag-outline"), tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: icon("receipt-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person-outline") }} />
    </Tabs>
  );
}
