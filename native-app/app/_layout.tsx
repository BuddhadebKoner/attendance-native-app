import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inPublicGroup = segments[0] === "(public)";

    if (isAuthenticated && inPublicGroup) {
      // Redirect to dashboard if authenticated and in public routes
      router.replace("/(app)/(home)");
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(public)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryProvider>
  );
}
