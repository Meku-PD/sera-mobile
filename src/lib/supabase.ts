import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage, // keeps you signed in after closing the app
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // there is no browser URL bar in an app
  },
});

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
