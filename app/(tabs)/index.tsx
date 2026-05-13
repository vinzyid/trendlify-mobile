import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Snapshot = {
  id: number;
  entity_label: string;
  trend_score: number;
  prev_score: number | null;
  region_code: string;
};

type Overview = {
  hero: { id?: number; trending_product?: string; trend_score?: number; region_code?: string };
  stats: { avg_score?: number; samples?: number };
};

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jabar", "ID-JT": "Jateng",
  "ID-JI": "Jatim", "ID-YO": "Yogya", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulsel",
};

function getBarColor(score: number) {
  if (score >= 80) return Colors.orangeDark;
  if (score >= 60) return Colors.orange;
  if (score >= 40) return "#FB923C";
  return Colors.orangeLight;
}

function getRankMeta(rank: number) {
  if (rank === 1) return { bg: "#FEF9C3", color: "#B45309", label: "🥇" };
  if (rank === 2) return { bg: "#F1F5F9", color: "#475569", label: "🥈" };
  if (rank === 3) return { bg: "#FFF0E6", color: "#9A3412", label: "🥉" };
  return { bg: Colors.stone100, color: Colors.stone500, label: null };
}

function ScoreBar({ score }: { score: number }) {
  return (
    <View style={styles.scoreBarTrack}>
      <View style={[styles.scoreBarFill, { width: `${score}%` as any, backgroundColor: getBarColor(score) }]} />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [trends, setTrends] = useState<Snapshot[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ovRes, trRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/dashboard/overview`),
        fetch(`${API_URL}/api/v1/trends?limit=24`),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (trRes.ok) {
        const j = await trRes.json();
        setTrends(j.data ?? []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = [...trends].sort((a, b) => b.trend_score - a.trend_score);

  function goToInsight(t: Snapshot) {
    router.push({
      pathname: "/(tabs)/insight",
      params: { keyword: t.entity_label, score: t.trend_score, region: t.region_code, snapshotId: t.id },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingLogoWrap}>
          <Ionicons name="restaurant" size={30} color={Colors.white} />
        </View>
        <Text style={styles.loadingTitle}>Trendlify</Text>
        <Text style={styles.loadingSubtitle}>Kuliner AI untuk UMKM Indonesia</Text>
        <ActivityIndicator size="large" color={Colors.orange} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.headerLogoBox}>
            <Ionicons name="restaurant" size={16} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Trendlify</Text>
            <Text style={styles.headerSub}>Kuliner AI</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
          {isLoggedIn && (
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.orange} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Page title — matches web "Dashboard Kuliner" */}
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleText}>Dashboard Kuliner</Text>
          <Text style={styles.pageTitleSub}>Pantau tren makanan & minuman UMKM Indonesia</Text>
        </View>

        {/* KPI Cards — matches web: 4 cards, first is accent */}
        {overview && (
          <View style={styles.kpiGrid}>
            {/* Accent card — Kuliner #1 Trending */}
            <View style={[styles.kpiCard, styles.kpiCardAccent]}>
              <View style={[styles.kpiIconWrap, styles.kpiIconAccent]}>
                <Ionicons name="star" size={16} color={Colors.orange} />
              </View>
              <Text style={styles.kpiLabel}>Kuliner #1 Trending</Text>
              <Text style={[styles.kpiValue, styles.kpiValueAccent]} numberOfLines={1}>
                {overview.hero.trending_product ?? "—"}
              </Text>
              {overview.hero.region_code && (
                <Text style={styles.kpiSub}>{REGION_LABELS[overview.hero.region_code] ?? overview.hero.region_code}</Text>
              )}
            </View>

            {/* Skor Tertinggi */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconWrap}>
                <Ionicons name="trending-up" size={16} color={Colors.stone400} />
              </View>
              <Text style={styles.kpiLabel}>Skor Tertinggi</Text>
              <Text style={styles.kpiValue}>{overview.hero.trend_score != null ? `${overview.hero.trend_score} / 100` : "—"}</Text>
            </View>

            {/* Rata-rata */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconWrap}>
                <Ionicons name="bar-chart" size={16} color={Colors.stone400} />
              </View>
              <Text style={styles.kpiLabel}>Rata-rata Tren</Text>
              <Text style={styles.kpiValue}>{overview.stats.avg_score != null ? `${overview.stats.avg_score} / 100` : "—"}</Text>
            </View>

            {/* Data Kuliner */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconWrap}>
                <Ionicons name="server-outline" size={16} color={Colors.stone400} />
              </View>
              <Text style={styles.kpiLabel}>Data Kuliner</Text>
              <Text style={styles.kpiValue}>{overview.stats.samples?.toLocaleString("id-ID") ?? "—"}</Text>
            </View>
          </View>
        )}

        {/* Trends table — matches web layout */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="trending-up" size={15} color={Colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Top 10 Keyword Kuliner</Text>
              <Text style={styles.cardSub}>Tren score tertinggi saat ini</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => { setRefreshing(true); fetchData(); }}
            >
              <Ionicons name="refresh-outline" size={13} color={Colors.stone500} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Table header — matches web bg-stone-50 */}
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, { width: 36 }]}>#</Text>
            <Text style={[styles.tableHeadCell, { flex: 1 }]}>Keyword Kuliner</Text>
            <Text style={[styles.tableHeadCell, { width: 108 }]}>Skor & Perubahan</Text>
            <Text style={[styles.tableHeadCell, { width: 46, textAlign: "right" }]}>Wilayah</Text>
          </View>

          {sorted.map((t, i) => {
            const rank = i + 1;
            const rankMeta = getRankMeta(rank);
            const delta = t.prev_score !== null ? t.trend_score - t.prev_score : null;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.trendRow, i === sorted.length - 1 && styles.trendRowLast]}
                onPress={() => goToInsight(t)}
                activeOpacity={0.65}
              >
                <View style={[styles.rankBadge, { backgroundColor: rankMeta.bg }]}>
                  {rankMeta.label
                    ? <Text style={styles.rankEmoji}>{rankMeta.label}</Text>
                    : <Text style={[styles.rankNum, { color: rankMeta.color }]}>{rank}</Text>
                  }
                </View>

                <Text style={styles.trendLabel} numberOfLines={1}>{t.entity_label}</Text>

                <View style={styles.scoreCol}>
                  <View style={styles.scoreInner}>
                    <ScoreBar score={t.trend_score} />
                    <Text style={styles.scoreNum}>{t.trend_score}</Text>
                    {delta !== null && delta !== 0 && (
                      <Text style={[styles.deltaText, { color: delta > 0 ? Colors.emerald : Colors.red }]}>
                        {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                      </Text>
                    )}
                  </View>
                </View>

                <Text style={styles.regionText} numberOfLines={1}>
                  {REGION_LABELS[t.region_code] ?? t.region_code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.orangeBg },

  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.orangeBg },
  loadingLogoWrap: {
    width: 68, height: 68, borderRadius: 22, backgroundColor: Colors.orange,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  loadingTitle: { fontSize: 26, fontWeight: "900", color: Colors.stone900 },
  loadingSubtitle: { fontSize: 12, color: Colors.stone500 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 13,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoBox: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: Colors.white, letterSpacing: -0.3 },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#4ADE80" },
  liveLabel: { fontSize: 9, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
  userAvatar: {
    width: 30, height: 30, borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  scroll: { padding: 16, gap: 14, paddingBottom: 28 },

  // Page title — matches web
  pageTitle: { gap: 2 },
  pageTitleText: { fontSize: 20, fontWeight: "800", color: Colors.stone900 },
  pageTitleSub: { fontSize: 12, color: Colors.stone500 },

  // KPI Cards — matches web rounded-2xl border bg-white shadow-sm
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "47.5%", backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    gap: 2,
  },
  kpiCardAccent: {
    borderColor: "#FDBA74",
    shadowColor: Colors.orange, shadowOpacity: 0.08,
  },
  kpiIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.stone100,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  kpiIconAccent: { backgroundColor: "#FFF7ED" },
  kpiLabel: { fontSize: 9, fontWeight: "600", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.4 },
  kpiValue: { fontSize: 16, fontWeight: "800", color: Colors.stone800, marginTop: 2 },
  kpiValueAccent: { color: Colors.orange },
  kpiSub: { fontSize: 10, color: Colors.stone400, marginTop: 1 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone800 },
  cardSub: { fontSize: 10, color: Colors.stone400, marginTop: 1 },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: Colors.stone200, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  refreshText: { fontSize: 10, fontWeight: "600", color: Colors.stone500 },

  // Table head — matches web bg-stone-50
  tableHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: Colors.stone50, borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  tableHeadCell: { fontSize: 9, fontWeight: "700", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.4 },

  // Trend rows — matches web hover:bg-orange-50
  trendRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  trendRowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankEmoji: { fontSize: 14 },
  rankNum: { fontSize: 11, fontWeight: "800" },
  trendLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: Colors.stone800 },
  scoreCol: { width: 108 },
  scoreInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreBarTrack: { flex: 1, height: 6, borderRadius: 99, backgroundColor: "#FED7AA", overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 99 },
  scoreNum: { fontSize: 11, fontWeight: "800", color: Colors.stone600, width: 22, textAlign: "right" },
  deltaText: { fontSize: 9, fontWeight: "800", width: 22 },
  regionText: { width: 46, fontSize: 9, fontWeight: "700", color: Colors.stone500, textAlign: "right" },
});
