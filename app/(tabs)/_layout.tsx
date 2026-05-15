import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

function CenterTabButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/insight")}
      style={{
        top: -16,
        alignSelf: "center",
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.orange,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: Colors.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons name="add" size={28} color="white" />
    </TouchableOpacity>
  );
}

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

      {/* Hidden: prediction (navigated from tren.tsx) */}
      <Tabs.Screen
        name="prediction"
        options={{ href: null }}
      />

      {/* Tab 3: Center (AI Insight) — custom floating button */}
      <Tabs.Screen
        name="insight"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: () => <CenterTabButton />,
        }}
      />

      {/* Tab 4: Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={22} color={color} />
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

      {/* Hidden: competitors (navigated from akun.tsx) */}
      <Tabs.Screen
        name="competitors"
        options={{ href: null }}
      />
    </Tabs>
  );
}
