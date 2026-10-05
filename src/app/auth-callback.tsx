import { Redirect } from "expo-router";

// Google sends you back here after sign-in; the AuthProvider has already handled the session.
export default function AuthCallback() {
  return <Redirect href="/(tabs)" />;
}
