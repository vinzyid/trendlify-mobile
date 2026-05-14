import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type HistoryItem = {
  id: number;
  keyword: string;
  score: number | null;
  region: string;
  provider: string;
  createdAt: string;
};

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jawa Barat", "ID-JT": "Jawa Tengah",
  "ID-JI": "Jawa Timur", "ID-YO": "Yogyakarta", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulawesi Selatan", "ID": "Indonesia",
};

function getFoodEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("kopi") || n.includes("coffee") || n.includes("americano") || n.includes("espresso")) return "☕";
  if (n.includes("matcha") || n.includes("teh")) return "🍵";
  if (n.includes("boba") || n.includes("bubble")) return "🧋";
  if (n.includes("ayam")) return "🍗";
  if (n.includes("bakso")) return "🍡";
  if (n.includes("mie") || n.includes("mi ")) return "🍜";
  if (n.includes("nasi")) return "🍚";
  if (n.includes("sate")) return "🍢";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("burger")) return "🍔";
  if (n.includes("seblak") || n.includes("pedas")) return "🌶️";
  if (n.includes("es ") || n.includes("ice")) return "🧊";
  if (n.includes("kue") || n.includes("cake")) return "🎂";
  if (n.includes("pisang")) return "🍌";
  if (n.includes("susu") || n.includes("milk")) return "🥛";
  if (n.includes("rendang") || n.includes("gulai")) return "🥘";
  return "🍽️";
}

function getScoreColor(score: number) {
  if (score >= 80) return "#DC2626";
  if (score >= 65) return Colors.orange;
  if (score >= 45) return Colors.emerald;
  return Colors.stone400;
}

function getScoreLabel(score: number) {
  if (score >= 80) return "VIRAL";
  if (score >= 65) return "HOT";
  if (score >= 45) return "AKTIF";
  if (score >= 30) return "BERKEMBANG";
  return "NICHE";
}

const PROVIDER_LABEL: Record<string, string> = {
  openrouter: "Gemini Pro",
  gemini: "Gemini Flash",
  groq: "GPT-OSS",
  stub: "Demo",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function RiwayatScreen() {
  const { token, isLoggedIn } = useAuth();
  const { setSelected } = useSelectedKeyword();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/insights/history`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function onRefresh() {
    setRefreshing(true);
    fetchHistory();
  }

  function goToInsight(item: HistoryItem) {
    setSelected({ keyword: item.keyword, score: item.score ?? 50, region: item.region, snapshotId: null });
    router.push({
      pathname: "/(tabs)/insight",
      params: { keyword: item.keyword, score: item.score ?? undefined, region: item.region },
    });
  }

  function goToPrediction(item: HistoryItem) {
    setSelected({ keyword: item.keyword, score: item.score ?? 50, region: item.region, snapshotId: null });
    router.push({
      pathname: "/(tabs)/prediction",
      params: { keyword: item.keyword, score: item.score ?? undefined },
    });
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Riwayat Analisis</Text>
            <Text style={styles.headerSub}>Tren kuliner yang pernah dianalisis</Text>
          </View>
        </View>
        <View style={styles.gateWrap}>
          <View style={styles.gateIconWrap}>
            <Ionicons name="lock-closed" size={28} color={Colors.orange} />
          </View>
          <Text style={styles.gateTitle}>Login diperlukan</Text>
          <Text style={styles.gateSub}>Masuk untuk melihat riwayat analisis tren kuliner kamu</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/login")}>
            <Ionicons name="log-in-outline" size={16} color={Colors.white} />
            <Text style={styles.gateBtnText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Riwayat Analisis</Text>
          <Text style={styles.headerSub}>Tren kuliner yang pernah dianalisis</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Count bar */}
      {!loading && items.length > 0 && (
        <View style={styles.countBar}>
          <Ionicons name="time-outline" size={13} color={Colors.stone400} />
          <Text style={styles.countText}>{items.length} analisis tersimpan</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.orange} size="large" />
          <Text style={styles.loadingText}>Memuat riwayat analisis…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="analytics-outline" size={36} color={Colors.stone300} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
          <Text style={styles.emptySub}>Analisis AI yang kamu generate akan muncul di sini</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/(tabs)/insight")}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.white} />
            <Text style={styles.gateBtnText}>Mulai Analisis</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />
          }
          renderItem={({ item }) => {
            const score = item.score ?? 0;
            const scoreColor = getScoreColor(score);
            const region = REGION_LABELS[item.region] ?? item.region;
            const providerLabel = PROVIDER_LABEL[item.provider] ?? item.provider;

            return (
              <View style={styles.card}>
                {/* Left: emoji + info */}
                <View style={styles.cardLeft}>
                  <View style={styles.emojiWrap}>
                    <Text style={{ fontSize: 22 }}>{getFoodEmoji(item.keyword)}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.keyword}</Text>
                    <View style={styles.cardMeta}>
                      {item.score !== null && (
                        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "18" }]}>
                          <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
                            {getScoreLabel(score)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.regionText}>{region}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)} · {providerLabel}</Text>
                  </View>
                </View>

                {/* Right: score */}
                <View style={styles.cardRight}>
                  {item.score !== null ? (
                    <>
                      <Text style={[styles.scoreNum, { color: scoreColor }]}>{item.score}</Text>
                      <Text style={styles.scoreMax}>/100</Text>
                    </>
                  ) : (
                    <Text style={styles.scoreMax}>—</Text>
                  )}
                </View>

                {/* Action buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => goToInsight(item)}>
                    <Ionicons name="sparkles-outline" size={14} color={Colors.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => goToPrediction(item)}>
                    <Ionicons name="trending-up-outline" size={14} color={Colors.orange} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.orangeBg },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },

  countBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  countText: { fontSize: 12, fontWeight: "600", color: Colors.stone500 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: Colors.stone400 },

  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  gateIconWrap: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  gateTitle: { fontSize: 17, fontWeight: "800", color: Colors.stone800, textAlign: "center" },
  gateSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20 },
  gateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13, marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  gateBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.stone50,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: Colors.stone700 },
  emptySub: { fontSize: 13, color: Colors.stone400, textAlign: "center", lineHeight: 20 },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: Colors.stone100,
  },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emojiWrap: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FED7AA",
  },
  cardName: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  scoreBadgeText: { fontSize: 9, fontWeight: "800" },
  regionText: { fontSize: 10, color: Colors.stone400, fontWeight: "500" },
  dateText: { fontSize: 10, color: Colors.stone400 },

  cardRight: { alignItems: "center", gap: 2, minWidth: 48 },
  scoreNum: { fontSize: 20, fontWeight: "900" },
  scoreMax: { fontSize: 9, color: Colors.stone400, fontWeight: "600", marginTop: -4 },
  deltaRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  deltaText: { fontSize: 10, fontWeight: "700" },

  cardActions: { flexDirection: "column", gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#FED7AA",
  },
});
