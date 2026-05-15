import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedKeywordProvider } from "@/contexts/SelectedKeywordContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SelectedKeywordProvider>
        <StatusBar style="light" backgroundColor="#F97316" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: "modal" }} />
          <Stack.Screen name="register" options={{ presentation: "modal" }} />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="search" />
          <Stack.Screen name="heatmap" />
        </Stack>
      </SelectedKeywordProvider>
    </AuthProvider>
  );
}
