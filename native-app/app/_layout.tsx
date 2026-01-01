import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAppGroup = segments[0] === "(app)";
    const inPublicGroup = segments[0] === "(public)";

    if (!isAuthenticated && inAppGroup) {
      // Redirect to login if not authenticated
      router.replace("/(public)/login");
    } else if (isAuthenticated && inPublicGroup) {
      // Redirect to dashboard if authenticated and in public routes
      router.replace("/(app)/(home)");
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
