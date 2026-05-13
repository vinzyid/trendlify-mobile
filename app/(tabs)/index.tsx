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
        <Text style={styles.loadingHint}>Memuat tren kuliner…</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={Colors.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        {overview?.hero?.trending_product && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.heroCard}
            onPress={() => goToInsight({
              id: overview.hero.id ?? 0,
              entity_label: overview.hero.trending_product!,
              trend_score: overview.hero.trend_score ?? 0,
              prev_score: null,
              region_code: overview.hero.region_code ?? "ID",
            })}
          >
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroTop}>
              <View style={styles.heroFireBadge}>
                <Text style={styles.heroFireText}>🔥 TRENDING #1</Text>
              </View>
              <View style={styles.heroScorePill}>
                <Text style={styles.heroScoreText}>{overview.hero.trend_score}<Text style={styles.heroScoreUnit}>/100</Text></Text>
              </View>
            </View>
            <Text style={styles.heroProduct} numberOfLines={2}>{overview.hero.trending_product}</Text>
            <View style={styles.heroFooter}>
              <View style={styles.heroLocation}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroLocationText}>
                  {REGION_LABELS[overview.hero.region_code ?? ""] ?? overview.hero.region_code ?? "Indonesia"}
                </Text>
              </View>
              <View style={styles.heroAnalyzeBtn}>
                <Text style={styles.heroAnalyzeBtnText}>Analisa AI</Text>
                <Ionicons name="arrow-forward" size={11} color={Colors.orange} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats row */}
        {overview && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardFirst]}>
              <Ionicons name="trophy-outline" size={16} color={Colors.orange} style={styles.statIcon} />
              <Text style={styles.statLabel}>Skor Tertinggi</Text>
              <Text style={styles.statValue}>
                {overview.hero.trend_score ?? "—"}
                <Text style={styles.statUnit}>/100</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="analytics-outline" size={16} color="#3B82F6" style={styles.statIcon} />
              <Text style={styles.statLabel}>Rata-rata</Text>
              <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                {overview.stats.avg_score ?? "—"}
                <Text style={styles.statUnit}>/100</Text>
              </Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="grid-outline" size={16} color={Colors.emerald} style={styles.statIcon} />
              <Text style={styles.statLabel}>Data Kuliner</Text>
              <Text style={[styles.statValue, { color: Colors.emerald }]}>
                {overview.stats.samples?.toLocaleString("id-ID") ?? "—"}
              </Text>
            </View>
          </View>
        )}

        {/* Trends table */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="bar-chart" size={15} color={Colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Top Keyword Kuliner</Text>
              <Text style={styles.cardSub}>Tap keyword untuk konsultasi AI</Text>
            </View>
            <Text style={styles.cardCount}>{sorted.length} tren</Text>
          </View>

          {/* Table header */}
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, { width: 36 }]}>#</Text>
            <Text style={[styles.tableHeadCell, { flex: 1 }]}>Keyword</Text>
            <Text style={[styles.tableHeadCell, { width: 108 }]}>Skor & Delta</Text>
            <Text style={[styles.tableHeadCell, { width: 46, textAlign: "right" }]}>Area</Text>
          </View>

          {sorted.map((t, i) => {
            const rank = i + 1;
            const rankMeta = getRankMeta(rank);
            const delta = t.prev_score !== null ? t.trend_score - t.prev_score : null;
            const isViral = t.trend_score >= 80;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.trendRow, i === sorted.length - 1 && styles.trendRowLast]}
                onPress={() => goToInsight(t)}
                activeOpacity={0.65}
              >
                {/* Rank badge */}
                <View style={[styles.rankBadge, { backgroundColor: rankMeta.bg }]}>
                  {rankMeta.label
                    ? <Text style={styles.rankEmoji}>{rankMeta.label}</Text>
                    : <Text style={[styles.rankNum, { color: rankMeta.color }]}>{rank}</Text>
                  }
                </View>

                {/* Label */}
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel} numberOfLines={1}>{t.entity_label}</Text>
                  {isViral && (
                    <View style={styles.viralPill}>
                      <Text style={styles.viralText}>🔥 Viral</Text>
                    </View>
                  )}
                </View>

                {/* Score */}
                <View style={styles.scoreCol}>
                  <ScoreBar score={t.trend_score} />
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreNum}>{t.trend_score}</Text>
                    {delta !== null && delta !== 0 && (
                      <Text style={[styles.deltaText, { color: delta > 0 ? Colors.emerald : Colors.red }]}>
                        {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Region */}
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

  // Loading
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.orangeBg },
  loadingLogoWrap: {
    width: 68, height: 68, borderRadius: 22, backgroundColor: Colors.orange,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  loadingTitle: { fontSize: 26, fontWeight: "900", color: Colors.stone900 },
  loadingSubtitle: { fontSize: 12, color: Colors.stone500 },
  loadingHint: { fontSize: 12, color: Colors.stone400, marginTop: 8 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.orange,
    paddingHorizontal: 20, paddingVertical: 13,
    shadowColor: Colors.orangeDark,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogoBox: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: Colors.white, letterSpacing: -0.3 },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: "600", letterSpacing: 0.2 },
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

  // Scroll
  scroll: { padding: 16, gap: 14, paddingBottom: 28 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.orange, borderRadius: 22, padding: 20, gap: 10,
    overflow: "hidden",
    shadowColor: Colors.orangeDark,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  heroCircle1: {
    position: "absolute", right: -30, top: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroCircle2: {
    position: "absolute", right: 40, bottom: -40,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroFireBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroFireText: { fontSize: 10, fontWeight: "800", color: Colors.white, letterSpacing: 0.3 },
  heroScorePill: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroScoreText: { fontSize: 13, fontWeight: "900", color: Colors.white },
  heroScoreUnit: { fontSize: 10, fontWeight: "500", color: "rgba(255,255,255,0.75)" },
  heroProduct: { fontSize: 24, fontWeight: "900", color: Colors.white, lineHeight: 30 },
  heroFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  heroLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroLocationText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  heroAnalyzeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.white, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  heroAnalyzeBtnText: { fontSize: 11, fontWeight: "800", color: Colors.orange },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: Colors.stone200, gap: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statCardFirst: {},
  statIcon: { marginBottom: 4 },
  statLabel: { fontSize: 9, color: Colors.stone400, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 18, fontWeight: "900", color: Colors.orange },
  statUnit: { fontSize: 9, fontWeight: "500", color: Colors.stone400 },

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
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone800 },
  cardSub: { fontSize: 10, color: Colors.stone400, marginTop: 1 },
  cardCount: { fontSize: 10, fontWeight: "700", color: Colors.stone400, backgroundColor: Colors.stone100, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },

  // Table head
  tableHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: Colors.stone50, borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  tableHeadCell: { fontSize: 9, fontWeight: "700", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.4 },

  // Trend row
  trendRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  trendRowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rankEmoji: { fontSize: 15 },
  rankNum: { fontSize: 11, fontWeight: "800" },
  trendInfo: { flex: 1, gap: 3 },
  trendLabel: { fontSize: 12, fontWeight: "700", color: Colors.stone800 },
  viralPill: {
    alignSelf: "flex-start", backgroundColor: "#FFF7ED",
    borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  viralText: { fontSize: 9, fontWeight: "700", color: Colors.orangeDark },
  scoreCol: { width: 108, gap: 3 },
  scoreBarTrack: { height: 6, borderRadius: 99, backgroundColor: "#FED7AA", overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 99 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 11, fontWeight: "800", color: Colors.stone700 },
  deltaText: { fontSize: 9, fontWeight: "800" },
  regionText: { width: 46, fontSize: 9, fontWeight: "700", color: Colors.stone500, textAlign: "right" },
});
