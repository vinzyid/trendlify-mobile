import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

const SCREEN_WIDTH = Dimensions.get("window").width;

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function getFoodEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("kopi") || n.includes("coffee")) return "☕";
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
  if (n.includes("udang") || n.includes("ikan")) return "🦐";
  if (n.includes("rendang") || n.includes("gulai")) return "🥘";
  return "🍽️";
}

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta",
  "ID-JB": "Jawa Barat",
  "ID-JT": "Jawa Tengah",
  "ID-JI": "Jawa Timur",
  "ID-YO": "Yogyakarta",
  "ID-BT": "Banten",
  "ID-BL": "Bali",
  "ID-SN": "Sulawesi Selatan",
};

const SPARKLINE_UP = [30, 35, 32, 45, 42, 58, 65, 72, 68, 85];
const SPARKLINE_FLAT = [50, 48, 52, 49, 55, 51, 53, 50, 56, 54];
const SPARKLINE_DOWN = [85, 78, 72, 68, 62, 58, 55, 50, 47, 42];

function MiniSparkline({
  data,
  color = Colors.orange,
  width = 80,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 4;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));

  return (
    <View style={{ width, height, position: "relative" }}>
      {pts.slice(0, -1).map((p, i) => {
        const nx = pts[i + 1].x;
        const ny = pts[i + 1].y;
        const dx = nx - p.x;
        const dy = ny - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: (p.x + nx) / 2 - len / 2,
              top: (p.y + ny) / 2 - 1.5,
              width: len,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              opacity: 0.8,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
      {pts.map((p, i) => (
        <View
          key={`d${i}`}
          style={{
            position: "absolute",
            left: p.x - 2.5,
            top: p.y - 2.5,
            width: 5,
            height: 5,
            borderRadius: 99,
            backgroundColor: i === pts.length - 1 ? color : "transparent",
          }}
        />
      ))}
    </View>
  );
}

function KPICard({
  label,
  value,
  sub,
  subColor = Colors.emerald,
  sparkData,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  sparkData: number[];
  icon: string;
  iconBg: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiCardTop}>
        <Text style={styles.kpiCardLabel}>{label}</Text>
        <View style={[styles.kpiCardIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={14} color={Colors.orange} />
        </View>
      </View>
      <Text style={styles.kpiCardValue}>{value}</Text>
      <Text style={[styles.kpiCardSub, { color: subColor }]}>{sub}</Text>
      <MiniSparkline data={sparkData} color={Colors.orange} width={80} height={28} />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { setSelected } = useSelectedKeyword();
  const [trends, setTrends] = useState<Snapshot[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [searchText, setSearchText] = useState("");

  const fetchData = useCallback(async () => {
    setFetchError(false);
    try {
      const [ovRes, trRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/dashboard/overview`),
        fetch(`${API_URL}/api/v1/trends?limit=10`),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (trRes.ok) {
        const j = await trRes.json();
        setTrends(j.data ?? []);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sorted = [...trends].sort((a, b) => b.trend_score - a.trend_score);

  function goToInsight(t: Snapshot) {
    setSelected({ keyword: t.entity_label, score: t.trend_score, region: t.region_code, snapshotId: t.id });
    router.push({
      pathname: "/(tabs)/insight",
      params: { keyword: t.entity_label, score: t.trend_score, region: t.region_code, snapshotId: t.id },
    });
  }

  function toggleBookmark(id: number) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Build carousel slides from top-4 trends or placeholders
  const carouselSlides =
    sorted.slice(0, 4).length > 0
      ? sorted.slice(0, 4).map((t) => ({
          id: t.id,
          name: t.entity_label,
          region: REGION_LABELS[t.region_code] ?? t.region_code,
          score: t.trend_score,
          delta: t.prev_score !== null ? t.trend_score - t.prev_score : Math.floor(Math.random() * 15 + 5),
          emoji: getFoodEmoji(t.entity_label),
          snapshot: t,
        }))
      : [
          { id: -1, name: "Kopi Susu", region: "Jakarta", score: 92, delta: 18, emoji: "☕", snapshot: null },
          { id: -2, name: "Boba Taro", region: "Jawa Barat", score: 87, delta: 12, emoji: "🧋", snapshot: null },
          { id: -3, name: "Bakso Mercon", region: "Jawa Tengah", score: 79, delta: 8, emoji: "🍡", snapshot: null },
        ];

  // Build KPI data
  const avgScore = overview?.stats?.avg_score ?? (sorted.length > 0 ? Math.round(sorted.reduce((s, t) => s + t.trend_score, 0) / sorted.length) : 0);
  const topScore = overview?.hero?.trend_score ?? (sorted[0]?.trend_score ?? 0);
  const totalData = overview?.stats?.samples ?? sorted.length;
  const topProduct = overview?.hero?.trending_product ?? sorted[0]?.entity_label ?? "—";

  // Build sparkline data from trends scores (up to 10 values)
  const sparkFromTrends = sorted.slice(0, 10).map((t) => t.trend_score);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingLogoWrap}>
          <Text style={{ fontSize: 32 }}>🤖</Text>
        </View>
        <Text style={styles.loadingTitle}>Trendlify</Text>
        <Text style={styles.loadingSubtitle}>Kuliner AI untuk UMKM Indonesia</Text>
        <ActivityIndicator size="large" color={Colors.orange} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor={Colors.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Text style={styles.headerLogo}>Trendlify</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.stone700} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetSection}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.greetText}>
              {getGreeting()},{" "}
              <Text style={styles.greetName}>{user?.name?.split(" ")[0] ?? "Pengguna"}</Text>{" "}
              👋
            </Text>
            <Text style={styles.greetSub}>Pantau tren kuliner terkini untuk bisnis kamu</Text>
          </View>
          <View style={styles.robotCircle}>
            <Text style={{ fontSize: 28 }}>🤖</Text>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.7}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search-outline" size={18} color={Colors.stone400} />
          <Text style={styles.searchPlaceholder}>Cari tren kuliner...</Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.orange} />
          </View>
        </TouchableOpacity>

        {/* ── KPI: 1 big card ── */}
        <View style={styles.kpiBigCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiBigLabel}>Skor Tren Hari Ini</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 4 }}>
              <Text style={styles.kpiBigValue}>{topScore || "—"}</Text>
              <Text style={styles.kpiBigUnit}>/100</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Ionicons name="arrow-up" size={12} color="#4ADE80" />
              <Text style={styles.kpiBigDelta}>
                {sorted.length > 0 && sorted[0].prev_score
                  ? `${sorted[0].trend_score - sorted[0].prev_score}% dari kemarin`
                  : "Data tren aktif"}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={styles.kpiBigArrow}>
              <Ionicons name="arrow-forward" size={16} color={Colors.orange} />
            </View>
            <MiniSparkline
              data={sparkFromTrends.length >= 2 ? sparkFromTrends : SPARKLINE_UP}
              color="rgba(255,255,255,0.8)"
              width={100}
              height={40}
            />
          </View>
        </View>

        {/* ── KPI: 2×2 grid ── */}
        <View style={styles.kpiGrid}>
          {[
            { label: "Produk Trending", value: `${totalData || sorted.length}`, sub: `+${Math.max(1, Math.floor((totalData || 10) * 0.08))} baru hari ini`, subColor: Colors.emerald, icon: "bag-outline", iconBg: "#FFF7ED" },
            { label: "Prediksi Akurat", value: "85%", sub: "+12% peningkatan", subColor: Colors.emerald, icon: "radio-button-on-outline", iconBg: "#FFF7ED" },
            { label: "Peluang Promosi", value: "7", sub: "Siap digunakan", subColor: Colors.stone500, icon: "megaphone-outline", iconBg: "#FFF7ED" },
            { label: "AI Insight Baru", value: `${Math.min(sorted.length, 5)}`, sub: "update hari ini", subColor: Colors.stone500, icon: "sparkles-outline", iconBg: "#FFF7ED" },
          ].map((item, i) => (
            <View key={i} style={styles.kpiSmallCard}>
              <View style={styles.kpiSmallTop}>
                <Text style={styles.kpiSmallLabel}>{item.label}</Text>
                <View style={[styles.kpiSmallIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={13} color={Colors.orange} />
                </View>
              </View>
              <Text style={styles.kpiSmallValue}>{item.value}</Text>
              <Text style={[styles.kpiSmallSub, { color: item.subColor }]}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── AI Insight Carousel ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="sparkles" size={14} color={Colors.orange} />
          </View>
          <Text style={styles.sectionTitle}>AI Insight</Text>
        </View>

        <FlatList
          data={carouselSlides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40));
            setCarouselIndex(idx);
          }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }) => {
            const deltaAbs = Math.abs(item.delta);
            return (
              <View style={styles.carouselCard}>
                {/* Badge */}
                <View style={styles.carouselBadge}>
                  <Text style={styles.carouselBadgeText}>🔥 AI Insight Untuk Kamu</Text>
                </View>

                {/* Content row */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 10 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.carouselTitle} numberOfLines={2}>
                      {item.name} sedang meningkat di {item.region}
                    </Text>
                    <Text style={styles.carouselSub}>
                      Skor tren naik {deltaAbs}% dalam 2 hari terakhir
                    </Text>
                    {/* Delta badge */}
                    <View style={styles.deltaBadge}>
                      <Text style={styles.deltaBadgeText}>+{deltaAbs}%</Text>
                    </View>
                    {/* CTA */}
                    <TouchableOpacity
                      style={styles.carouselCTA}
                      onPress={() => item.snapshot && goToInsight(item.snapshot)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.carouselCTAText}>Lihat Rekomendasi →</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Food emoji */}
                  <Text style={styles.carouselEmoji}>{item.emoji}</Text>
                </View>
              </View>
            );
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH - 28}
        />

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {carouselSlides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === carouselIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* ── Top Trending ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="flame" size={14} color={Colors.orange} />
          </View>
          <Text style={styles.sectionTitle}>Top Trending</Text>
          <TouchableOpacity onPress={() => { setRefreshing(true); fetchData(); }} style={styles.refreshPill}>
            <Ionicons name="refresh-outline" size={12} color={Colors.stone500} />
            <Text style={styles.refreshPillText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trendingCard}>
          {sorted.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name={fetchError ? "cloud-offline-outline" : "search-outline"}
                size={32}
                color={Colors.stone400}
              />
              <Text style={styles.emptyTitle}>
                {fetchError ? "Tidak dapat terhubung ke server" : "Belum ada data tren"}
              </Text>
              <Text style={styles.emptySub}>
                {fetchError
                  ? "Pastikan backend sudah berjalan lalu tarik ke bawah untuk refresh"
                  : "Tarik ke bawah untuk memuat data"}
              </Text>
              <TouchableOpacity
                style={styles.emptyRetryBtn}
                onPress={() => {
                  setRefreshing(true);
                  fetchData();
                }}
              >
                <Ionicons name="refresh-outline" size={13} color={Colors.orange} />
                <Text style={styles.emptyRetryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {sorted.slice(0, 5).map((t, i) => {
            const delta = t.prev_score !== null ? t.trend_score - t.prev_score : null;
            const isBookmarked = bookmarked.has(t.id);

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.trendItem, i === Math.min(sorted.length, 5) - 1 && styles.trendItemLast]}
                onPress={() => goToInsight(t)}
                activeOpacity={0.7}
              >
                {/* Rank */}
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>

                {/* Food emoji circle */}
                <View style={styles.foodEmojiCircle}>
                  <Text style={{ fontSize: 20 }}>{getFoodEmoji(t.entity_label)}</Text>
                </View>

                {/* Name + Category */}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.trendName} numberOfLines={1}>{t.entity_label}</Text>
                  <Text style={styles.trendCategory} numberOfLines={1}>
                    {REGION_LABELS[t.region_code] ?? t.region_code}
                  </Text>
                </View>

                {/* Score + delta */}
                <View style={styles.scoreWrap}>
                  <Text style={styles.scoreValue}>{t.trend_score}</Text>
                  {delta !== null && delta !== 0 && (
                    <Text style={[styles.scoreDelta, { color: delta > 0 ? Colors.emerald : Colors.red }]}>
                      {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                    </Text>
                  )}
                </View>

                {/* Bookmark */}
                <TouchableOpacity
                  onPress={() => toggleBookmark(t.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={isBookmarked ? Colors.orange : Colors.stone400}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Chat Banner ── */}
        <View style={styles.chatBanner}>
          <View style={styles.chatBannerLeft}>
            <Text style={{ fontSize: 28 }}>🤖</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.chatBannerTitle}>Tanya Trendlify AI</Text>
            <Text style={styles.chatBannerSub}>Dapatkan rekomendasi bisnis personal</Text>
          </View>
          <TouchableOpacity
            style={styles.chatBannerBtn}
            onPress={() => router.push("/(tabs)/chat")}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.white,
  },
  loadingLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: Colors.orange,
  },
  loadingTitle: { fontSize: 26, fontWeight: "900", color: Colors.stone900 },
  loadingSubtitle: { fontSize: 12, color: Colors.stone500 },

  scroll: { paddingBottom: 32 },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { fontSize: 22, fontWeight: "900", color: Colors.stone900, letterSpacing: -0.5 },
  aiBadge: {
    backgroundColor: Colors.orange,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  aiBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.white, letterSpacing: 0.3 },
  bellButton: { position: "relative", padding: 4 },
  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: { fontSize: 8, fontWeight: "800", color: Colors.white },

  // ── Greeting ──
  greetSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  greetText: { fontSize: 18, fontWeight: "700", color: Colors.stone900 },
  greetName: { color: Colors.orange },
  greetSub: { fontSize: 12, color: Colors.stone500, marginTop: 2 },
  robotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Search ──
  searchBar: {
    marginHorizontal: 20,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.stone100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  searchPlaceholder: { flex: 1, fontSize: 13, color: Colors.stone400 },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── KPI Big Card ──
  kpiBigCard: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: Colors.orange, borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "flex-start",
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  kpiBigLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 2 },
  kpiBigValue: { fontSize: 48, fontWeight: "900", color: Colors.white, lineHeight: 52 },
  kpiBigUnit: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  kpiBigDelta: { fontSize: 12, fontWeight: "700", color: "#4ADE80" },
  kpiBigArrow: {
    width: 32, height: 32, borderRadius: 99, backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
  },

  // ── KPI 2×2 Grid ──
  kpiGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
  },
  kpiSmallCard: {
    width: "47%", backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.stone100,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 2,
  },
  kpiSmallTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  kpiSmallLabel: { fontSize: 10, fontWeight: "600", color: Colors.stone400, flex: 1 },
  kpiSmallIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  kpiSmallValue: { fontSize: 22, fontWeight: "900", color: Colors.stone900 },
  kpiSmallSub: { fontSize: 10, fontWeight: "600", marginTop: 1 },

  // ── Old KPI (kept for KPICard component compatibility) ──
  kpiScroll: { paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  kpiCard: { width: 140, backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.stone200 },
  kpiCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  kpiCardLabel: { fontSize: 9, fontWeight: "700", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.4, flex: 1, marginRight: 4 },
  kpiCardIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  kpiCardValue: { fontSize: 20, fontWeight: "900", color: Colors.stone900, marginBottom: 2 },
  kpiCardSub: { fontSize: 10, fontWeight: "600", marginBottom: 6 },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.stone900, flex: 1 },
  refreshPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.stone200,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshPillText: { fontSize: 10, fontWeight: "600", color: Colors.stone500 },

  // ── Carousel ──
  carouselCard: {
    width: SCREEN_WIDTH - 52,
    backgroundColor: Colors.orangeBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.orangeLight,
  },
  carouselBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  carouselBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.white },
  carouselTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.stone900,
    lineHeight: 22,
  },
  carouselSub: { fontSize: 12, color: Colors.stone500, lineHeight: 17 },
  deltaBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.emerald,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  deltaBadgeText: { fontSize: 11, fontWeight: "800", color: Colors.white },
  carouselCTA: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  carouselCTAText: { fontSize: 12, fontWeight: "700", color: Colors.white },
  carouselEmoji: { fontSize: 60, marginLeft: 8, lineHeight: 70 },

  // Pagination dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.stone200,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.orange,
  },

  // ── Top Trending ──
  trendingCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.stone200,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
  },
  trendItemLast: { borderBottomWidth: 0 },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.stone100,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800", color: Colors.stone600 },
  foodEmojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  trendName: { fontSize: 13, fontWeight: "700", color: Colors.stone800 },
  trendCategory: { fontSize: 11, color: Colors.stone400 },
  scoreWrap: { alignItems: "flex-end", gap: 2 },
  scoreValue: { fontSize: 16, fontWeight: "900", color: Colors.stone900 },
  scoreDelta: { fontSize: 10, fontWeight: "700" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20, gap: 8 },
  emptyTitle: { fontSize: 13, fontWeight: "700", color: Colors.stone500, textAlign: "center" },
  emptySub: { fontSize: 11, color: Colors.stone400, textAlign: "center", lineHeight: 17 },
  emptyRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyRetryText: { fontSize: 12, fontWeight: "700", color: Colors.orange },

  // ── Chat Banner ──
  chatBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.orangeBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.orangeLight,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  chatBannerLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBannerTitle: { fontSize: 14, fontWeight: "800", color: Colors.stone900 },
  chatBannerSub: { fontSize: 11, color: Colors.stone500 },
  chatBannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
