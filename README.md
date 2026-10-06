# Sera Mobile (Expo / React Native)

The Android app for **Sera**, an Ethiopian artisan marketplace. It uses the **same Supabase backend and the same account** as the web app: sign in on both, and your cart is shared. Add an item on the web and it appears in the app; add one in the app and it appears on the web.

**Web app:** https://sera-shop-tan.vercel.app
**APK download:** (https://expo.dev/accounts/meku-pd/projects/sera-mobile/builds/6b612f16-ab4d-4a7a-ad32-7292f8676516)

<!-- Add 2–3 phone screenshots here: home, product, cart -->

## Features
- Sign up and sign in with email and password
- Browse and search products, view product details and maker stories
- Cart synced in real time with the web app (Supabase Realtime, with a short polling fallback and instant local updates)
- Checkout and order history
- Profile

## Tech stack
- **Expo** (SDK 57), **React Native**, **expo-router**, TypeScript
- **Supabase** (Auth, Postgres, Realtime) with AsyncStorage for the session
- **EAS Build** for the Android APK

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_API_URL` (the web app URL, used for product images)
3. `npx expo start` (add `--tunnel` if your phone can't connect)
4. Open it in **Expo Go** on your Android phone and scan the QR code

## Build the APK
```
npx eas-cli build --platform android --profile preview
```

## How the sync works
Both apps read and write one `cart_items` table in Supabase, secured with row-level security so users only access their own rows. Each app subscribes to realtime changes and also refreshes every few seconds as a backup.

## Notes
- Google sign-in works on the web; the mobile app uses email and password.
- The Supabase publishable key is safe to expose in a client app. Never commit service-role or other secret keys.

Built by **Meklit Seife** (Bony), Product Designer in Addis Ababa.