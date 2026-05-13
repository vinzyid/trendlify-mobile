import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Colors } from "@/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.stone400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.stone200,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 82 : 64,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insight"
        options={{
          title: "AI Konsultan",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          title: "Prediksi",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="competitors"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "eye" : "eye-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
