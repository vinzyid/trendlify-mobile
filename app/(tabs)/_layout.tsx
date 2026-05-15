import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "ios" ? 20 : Math.max(insets.bottom, 8);

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
          paddingBottom: bottomPad,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 82 : 56 + bottomPad,
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
      {/* Tab 1: Beranda */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 2: Tren */}
      <Tabs.Screen
        name="tren"
        options={{
          title: "Tren",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Hidden: prediction */}
      <Tabs.Screen
        name="prediction"
        options={{ href: null }}
      />

      {/* Tab 3: Fitur (center) */}
      <Tabs.Screen
        name="fitur"
        options={{
          title: "Fitur",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "layers" : "layers-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 4: Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Tab 5: Akun */}
      <Tabs.Screen
        name="akun"
        options={{
          title: "Akun",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="insight"      options={{ href: null }} />
      <Tabs.Screen name="competitors"  options={{ href: null }} />
      <Tabs.Screen name="promosi"      options={{ href: null }} />
    </Tabs>
  );
}
