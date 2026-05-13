import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

type FeatureItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  badge?: string;
  desc: string;
  onPress: () => void;
};

export default function TrenScreen() {
  const router = useRouter();

  const features: FeatureItem[] = [
    {
      icon: "bulb-outline",
      iconBg: "#FFF7ED",
      iconColor: Colors.orange,
      title: "AI Insight",
      badge: "Baru",
      desc: "Dapatkan analisis mendalam tentang tren kuliner dan rekomendasi strategi",
      onPress: () => router.push("/(tabs)/insight"),
    },
    {
      icon: "trending-up-outline",
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      title: "Prediksi Tren",
      desc: "Lihat prediksi tren kuliner 7 hari ke depan berdasarkan data real-time",
      onPress: () => router.push("/(tabs)/prediction"),
    },
    {
      icon: "map-outline",
      iconBg: "#F0FDF4",
      iconColor: Colors.emerald,
      title: "Heatmap Regional",
      desc: "Lihat peta panas tren kuliner di seluruh Indonesia",
      onPress: () => router.push("/heatmap"),
    },
    {
      icon: "megaphone-outline",
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      title: "Rekomendasi Promosi",
      desc: "Ide konten, caption, hashtag, dan script TikTok siap pakai",
      onPress: () => router.push("/(tabs)/insight"),
    },
    {
      icon: "chatbubbles-outline",
      iconBg: "#F5F3FF",
      iconColor: "#8B5CF6",
      title: "Trendly Chatbot",
      desc: "Tanya apapun tentang bisnis kuliner, strategi, harga, dan promosi",
      onPress: () => router.push("/(tabs)/chat"),
    },
    {
      icon: "time-outline",
      iconBg: Colors.stone100,
      iconColor: Colors.stone500,
      title: "Riwayat Analisis",
      desc: "Lihat riwayat pencarian, analisis, dan insight yang pernah dibuat",
      onPress: () => router.push("/(tabs)/competitors"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Orange header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fitur</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Semua fitur untuk mendukung bisnis kuliner kamu
      </Text>

      {/* Feature list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {features.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.featureRow,
              index === features.length - 1 && styles.featureRowLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={item.iconColor}
              />
            </View>

            {/* Text block */}
            <View style={styles.featureTextBlock}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.featureDesc} numberOfLines={2}>
                {item.desc}
              </Text>
            </View>

            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.stone400}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Header
  header: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.white,
  },

  // Subtitle
  subtitle: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.stone500,
  },

  // Feature list
  listContent: {
    paddingBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
  },
  featureRowLast: {
    borderBottomWidth: 0,
  },

  // Icon circle
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Text block
  featureTextBlock: {
    flex: 1,
    gap: 3,
  },
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.stone900,
  },

  // "Baru" badge
  badge: {
    backgroundColor: Colors.orange,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },

  featureDesc: {
    fontSize: 12,
    color: Colors.stone500,
    lineHeight: 18,
  },
});
