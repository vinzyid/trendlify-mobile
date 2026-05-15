import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

type Feature = {
  icon: string;
  badge: string;
  badgeColor: string;
  title: string;
  desc: string;
  available: boolean;
  route?: string;
};

const FEATURES: Feature[] = [
  {
    icon: "bulb-outline",
    badge: "AI",
    badgeColor: "#8B5CF6",
    title: "AI Konsultan Kuliner",
    desc: "Analisis mendalam tren kuliner dengan AI",
    available: true,
    route: "/(tabs)/insight",
  },
  {
    icon: "trending-up-outline",
    badge: "AI",
    badgeColor: "#8B5CF6",
    title: "Prediksi Tren",
    desc: "Prediksi tren 7 hari ke depan",
    available: true,
    route: "/(tabs)/prediction",
  },
  {
    icon: "chatbubble-outline",
    badge: "AI",
    badgeColor: "#8B5CF6",
    title: "Chatbot",
    desc: "Tanya apa saja seputar bisnis",
    available: true,
    route: "/(tabs)/chat",
  },
  {
    icon: "time-outline",
    badge: "Data",
    badgeColor: "#3B82F6",
    title: "Riwayat Analisis",
    desc: "Lihat semua analisis sebelumnya",
    available: true,
    route: "/(tabs)/competitors",
  },
  {
    icon: "map-outline",
    badge: "Map",
    badgeColor: Colors.emerald,
    title: "Heatmap Regional",
    desc: "Peta sebaran tren per provinsi",
    available: true,
    route: "/heatmap",
  },
  {
    icon: "bar-chart-outline",
    badge: "Stats",
    badgeColor: Colors.orange,
    title: "Statistik Tren",
    desc: "Grafik dan skor harian",
    available: true,
    route: "/(tabs)/tren",
  },
  {
    icon: "ribbon-outline",
    badge: "AI",
    badgeColor: "#8B5CF6",
    title: "Peluang Promosi",
    desc: "Rekomendasi AI produk siap dipromosikan",
    available: true,
    route: "/(tabs)/promosi",
  },
  {
    icon: "notifications-outline",
    badge: "App",
    badgeColor: Colors.stone500,
    title: "Notifikasi",
    desc: "Atur peringatan tren penting",
    available: true,
    route: "/notifications",
  },
];

export default function FiturScreen() {
  const router = useRouter();
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Semua Fitur</Text>
        <Text style={styles.headerSub}>Eksplorasi alat analisis tren kuliner</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.card, !f.available && styles.cardDim]}
              activeOpacity={f.available ? 0.72 : 0.85}
              onPress={() => {
                if (f.available && f.route) router.push(f.route as any);
                else if (!f.available) setComingSoon(f.title);
              }}
            >
              {/* Badge top-right */}
              <View style={[styles.badge, { backgroundColor: f.badgeColor + "18" }]}>
                <Text style={[styles.badgeText, { color: f.badgeColor }]}>{f.badge}</Text>
              </View>

              {/* Orange icon circle */}
              <View style={[styles.iconCircle, !f.available && styles.iconCircleDim]}>
                <Ionicons name={f.icon as any} size={26} color={Colors.white} />
              </View>

              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{f.desc}</Text>

              {!f.available && (
                <View style={styles.soonTag}>
                  <Text style={styles.soonTagText}>Segera</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Coming soon modal */}
      <Modal visible={!!comingSoon} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setComingSoon(null)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="construct-outline" size={30} color={Colors.orange} />
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>SEGERA HADIR</Text>
            </View>
            <Text style={styles.modalTitle}>{comingSoon}</Text>
            <Text style={styles.modalDesc}>
              Fitur ini sedang dalam pengembangan dan akan segera tersedia.
            </Text>
            <View style={styles.progressBg}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressLabel}>Progress 65%</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setComingSoon(null)}>
              <Text style={styles.modalBtnText}>Oke, Ditunggu!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: Colors.stone900 },
  headerSub: { fontSize: 12, color: Colors.stone400, marginTop: 2 },

  scroll: { padding: 14 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    width: "47.5%",
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  cardDim: { opacity: 0.75 },

  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "800" },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircleDim: { backgroundColor: Colors.stone300, shadowOpacity: 0 },

  cardTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone900, marginTop: 2 },
  cardDesc: { fontSize: 11, color: Colors.stone400, lineHeight: 16 },

  soonTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.stone100,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soonTagText: { fontSize: 9, fontWeight: "700", color: Colors.stone500 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  soonBadge: {
    backgroundColor: Colors.orange,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  soonBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.white, letterSpacing: 1 },
  modalTitle: { fontSize: 17, fontWeight: "800", color: Colors.stone900, textAlign: "center" },
  modalDesc: { fontSize: 12, color: Colors.stone500, textAlign: "center", lineHeight: 18 },
  progressBg: {
    width: "100%", height: 6, borderRadius: 99,
    backgroundColor: Colors.stone100, overflow: "hidden",
  },
  progressFill: { width: "65%", height: "100%", backgroundColor: Colors.orange, borderRadius: 99 },
  progressLabel: { fontSize: 11, color: Colors.stone400, fontWeight: "600" },
  modalBtn: {
    width: "100%", backgroundColor: Colors.orange,
    borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },
});
