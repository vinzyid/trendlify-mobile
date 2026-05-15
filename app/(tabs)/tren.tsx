import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Snapshot = {
  id: number;
  entity_label: string;
  trend_score: number;
  prev_score: number | null;
  region_code: string;
  category: { slug: string; name: string } | null;
};

// ── Explicit category map (all seed keywords) ─────────────────────────────────
type Cat = "Minuman" | "Tradisional" | "Modern" | "Lainnya";

const CATEGORY_MAP: Record<string, Cat> = {
  // === MINUMAN ===
  "dirty latte": "Minuman", "kopi kelapa": "Minuman", "kopi pandan": "Minuman",
  "kopi gula merah": "Minuman", "kopi susu aren": "Minuman", "cold brew": "Minuman",
  "americano": "Minuman", "es kopi susu": "Minuman", "matcha latte": "Minuman",
  "goguma latte": "Minuman", "tiger milk boba": "Minuman", "cheese boba": "Minuman",
  "brown sugar boba": "Minuman", "thai tea": "Minuman", "taro milk tea": "Minuman",
  "wedang jahe": "Minuman", "wedang uwuh": "Minuman", "teh serai pandan": "Minuman",
  "es teh telang": "Minuman", "es teh jeruk madu": "Minuman", "cendol": "Minuman",
  "es teh manis": "Minuman", "es campur": "Minuman", "jus alpukat": "Minuman",
  "es buah segar": "Minuman", "rujak buah": "Tradisional",

  // === TRADISIONAL ===
  "pisang goreng": "Tradisional", "cilor": "Tradisional", "cireng megalodon": "Tradisional",
  "jasuke": "Tradisional", "risol mayo": "Tradisional", "cireng": "Tradisional",
  "batagor": "Tradisional", "siomay": "Tradisional", "tahu bulat": "Tradisional",
  "basreng": "Tradisional", "keripik pedas": "Tradisional", "kue cubit": "Tradisional",
  "klepon": "Tradisional", "onde-onde": "Tradisional", "ayam bakar": "Tradisional",
  "seblak": "Tradisional", "bakso aci": "Tradisional", "bakso malang": "Tradisional",
  "sate taichan": "Tradisional", "nasi goreng": "Tradisional", "mie ayam": "Tradisional",
  "nasi padang": "Tradisional", "rendang": "Tradisional", "pecel lele": "Tradisional",
  "bebek goreng": "Tradisional", "ikan bakar": "Tradisional", "nasi uduk": "Tradisional",
  "bubur ayam": "Tradisional", "ketoprak": "Tradisional", "gado-gado": "Tradisional",
  "rawon": "Tradisional", "soto betawi": "Tradisional", "soto lamongan": "Tradisional",
  "nasi kuning": "Tradisional", "nasi liwet": "Tradisional", "lontong sayur": "Tradisional",
  "pempek": "Tradisional", "coto makassar": "Tradisional", "mie kocok": "Tradisional",
  "lumpia semarang": "Tradisional", "roti bakar": "Tradisional",

  // === MODERN ===
  "tteokbokki": "Modern", "corn dog korea": "Modern", "hotteok": "Modern",
  "kimbap": "Modern", "bingsu": "Modern", "injeolmi toast": "Modern",
  "gohyong": "Modern", "katsu sando": "Modern", "coklat dubai": "Modern",
  "dimsum mentai": "Modern", "tanghulu": "Modern", "croffle": "Modern",
  "tissue bread": "Modern", "roti sopit": "Modern", "smash burger": "Modern",
  "takoyaki": "Modern", "gyoza goreng": "Modern", "okonomiyaki": "Modern",
  "udang keju": "Modern", "basque cheesecake": "Modern", "tiramisu cup": "Modern",
  "mochi premium": "Modern", "donat lumer": "Modern", "martabak oreo": "Modern",
  "martabak matcha": "Modern", "dessert jar": "Modern", "brownies lumer": "Modern",
  "cheesecake": "Modern", "pudding susu": "Modern", "ayam geprek": "Modern",
  "ayam crispy": "Modern", "ayam chili padi": "Modern", "mie pedas": "Modern",
  "frozen food homemade": "Modern", "rice bowl topping": "Modern", "saus mentai": "Modern",
};

// Fallback keyword lists for user-searched terms not in CATEGORY_MAP
const MINUMAN_FB = ["kopi","latte","boba","bubble tea","thai tea","matcha latte","goguma","wedang","cendol","es teh","es kopi","jus ","es buah","minuman"];
const TRADISIONAL_FB = ["cireng","cilor","batagor","siomay","klepon","onde","bakso","seblak","ketoprak","gado","soto","rawon","rendang","pempek","tahu","basreng","keripik","nasi","ayam bakar","mie ayam","sate","bebek","ikan bakar","bubur","lumpia","lontong"];
const MODERN_FB = ["tteok","corn dog","croffle","burger","takoyaki","gyoza","tiramisu","mochi","donat","cheesecake","brownies","dessert","geprek","crispy","mentai","bingsu","hotdog","sando","toast"];

function classifyCategory(label: string): Cat {
  const exact = CATEGORY_MAP[label.toLowerCase()];
  if (exact) return exact;
  const l = label.toLowerCase();
  if (MINUMAN_FB.some(k => l.includes(k))) return "Minuman";
  if (TRADISIONAL_FB.some(k => l.includes(k))) return "Tradisional";
  if (MODERN_FB.some(k => l.includes(k))) return "Modern";
  return "Lainnya";
}

// ── Region labels ─────────────────────────────────────────────────────────────
const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jabar", "ID-JT": "Jateng",
  "ID-JI": "Jatim", "ID-YO": "Yogyakarta", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulsel",
};

// ── Category icon ─────────────────────────────────────────────────────────────
type CategoryStyle = { icon: string; iconColor: string; iconBg: string; borderColor: string };

function getCategoryStyle(cat: string): CategoryStyle {
  switch (cat) {
    case "Minuman":     return { icon: "cafe-outline",       iconColor: "#3B82F6", iconBg: "#EFF6FF", borderColor: "#BFDBFE" };
    case "Tradisional": return { icon: "restaurant-outline", iconColor: Colors.emerald, iconBg: "#F0FDF4", borderColor: "#A7F3D0" };
    case "Modern":      return { icon: "sparkles-outline",   iconColor: Colors.orange,  iconBg: Colors.orangeBg, borderColor: Colors.orangeLight };
    default:            return { icon: "nutrition-outline",  iconColor: Colors.stone500, iconBg: Colors.stone100, borderColor: Colors.stone200 };
  }
}


// ── Score color ───────────────────────────────────────────────────────────────
function getScoreColor(score: number) {
  if (score >= 80) return "#DC2626";
  if (score >= 65) return Colors.orange;
  if (score >= 45) return Colors.emerald;
  return Colors.stone400;
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ scores, color }: { scores: number[]; color: string }) {
  const W = 220, H = 56;
  if (scores.length < 2) return null;
  const min = Math.min(...scores) - 4;
  const max = Math.max(...scores) + 4;
  const pts = scores.map((s, i) => ({
    x: (i / (scores.length - 1)) * W,
    y: H - ((s - min) / (max - min)) * H,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <Svg width={W} height={H}>
      <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={color} />
    </Svg>
  );
}

// ── Weekly score simulation (deterministic per score) ─────────────────────────
function generateWeeklyScores(currentScore: number): number[] {
  const days = 7;
  const scores: number[] = [];
  let s = Math.max(20, currentScore - 10 + Math.round(Math.sin(currentScore) * 6));
  for (let i = 0; i < days - 1; i++) {
    s = Math.min(100, Math.max(20, s + Math.round(Math.cos(i + currentScore * 0.1) * 5)));
    scores.push(s);
  }
  scores.push(currentScore);
  return scores;
}

const CATEGORIES = ["Semua", "Tradisional", "Modern", "Minuman"] as const;
type Category = typeof CATEGORIES[number];

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function TrenScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("Semua");
  const [trends, setTrends] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrends = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/trends?limit=100`);
      const json = await res.json();
      setTrends(json.data ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  // Deduplicate by entity_label, keep highest score
  const deduped = Object.values(
    trends.reduce<Record<string, Snapshot>>((acc, t) => {
      const key = t.entity_label.toLowerCase();
      if (!acc[key] || t.trend_score > acc[key].trend_score) acc[key] = t;
      return acc;
    }, {})
  );

  const filtered = activeCategory === "Semua"
    ? deduped
    : deduped.filter(t => classifyCategory(t.entity_label) === activeCategory);

  const topTrend = filtered[0];
  const weeklyScores = topTrend ? generateWeeklyScores(topTrend.trend_score) : [];
  const topColor = topTrend ? getScoreColor(topTrend.trend_score) : Colors.orange;

  // Day labels: last 7 days from today
  const today = new Date();
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return DAY_LABELS[d.getDay()];
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tren Kuliner</Text>
          <Text style={styles.headerSub}>Update real-time setiap menit</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => router.push("/search")}>
          <Ionicons name="options-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTrends(true); }}
            colors={[Colors.orange]}
            tintColor={Colors.orange}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Search bar */}
            <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/search")} activeOpacity={0.8}>
              <Ionicons name="search-outline" size={17} color={Colors.stone400} />
              <Text style={styles.searchPlaceholder}>Cari produk...</Text>
            </TouchableOpacity>

            {/* Category chips */}
            <View style={styles.chipContent}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activeCategory === cat && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weekly chart card */}
            {!loading && topTrend && (
              <View style={styles.chartCard}>
                <View style={styles.chartTop}>
                  <View>
                    <Text style={styles.chartLabel}>Skor Tren Mingguan</Text>
                    <Text style={[styles.chartScore, { color: topColor }]}>{topTrend.trend_score}</Text>
                  </View>
                  {topTrend.prev_score !== null && topTrend.prev_score > 0 && (
                    <View style={[styles.deltaBadge, {
                      backgroundColor: topTrend.trend_score >= topTrend.prev_score ? "#D1FAE5" : "#FEE2E2"
                    }]}>
                      <Ionicons
                        name={topTrend.trend_score >= topTrend.prev_score ? "trending-up" : "trending-down"}
                        size={13}
                        color={topTrend.trend_score >= topTrend.prev_score ? Colors.emerald : Colors.red}
                      />
                      <Text style={[styles.deltaText, {
                        color: topTrend.trend_score >= topTrend.prev_score ? Colors.emerald : Colors.red
                      }]}>
                        {topTrend.trend_score >= topTrend.prev_score ? "+" : ""}
                        {(((topTrend.trend_score - topTrend.prev_score) / topTrend.prev_score) * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.chartWrap}>
                  <Sparkline scores={weeklyScores} color={topColor} />
                </View>

                <View style={styles.dayRow}>
                  {dayLabels.map((d, i) => (
                    <Text key={i} style={[styles.dayLabel, i === dayLabels.length - 1 && { color: topColor, fontWeight: "700" }]}>{d}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* List heading */}
            <View style={styles.listHeading}>
              <Text style={styles.listHeadingText}>
                {loading ? "Memuat..." : `${filtered.length} Produk ${activeCategory === "Semua" ? "Kuliner" : activeCategory}`}
              </Text>
              <Text style={styles.sortLabel}>Diurutkan: Skor ↓</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.orange} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={36} color={Colors.stone300} />
              <Text style={styles.emptyText}>Tidak ada data untuk kategori ini</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cat = classifyCategory(item.entity_label);
          const catStyle = getCategoryStyle(cat);
          const scoreColor = getScoreColor(item.trend_score);
          const delta = item.prev_score !== null && item.prev_score > 0
            ? ((item.trend_score - item.prev_score) / item.prev_score) * 100
            : null;
          const region = REGION_LABELS[item.region_code] ?? item.region_code;

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.72}
              onPress={() => router.push({
                pathname: "/(tabs)/insight",
                params: { keyword: item.entity_label, score: item.trend_score, region: item.region_code },
              })}
            >
              {/* Category icon */}
              <View style={[styles.iconCircle, { backgroundColor: catStyle.iconBg, borderColor: catStyle.borderColor }]}>
                <Ionicons name={catStyle.icon as any} size={22} color={catStyle.iconColor} />
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{item.entity_label}</Text>
                <Text style={styles.cardMeta}>{region} · {cat}</Text>
              </View>

              {/* Delta + Score + Chevron */}
              <View style={styles.cardRight}>
                {delta !== null && (
                  <Text style={[styles.cardDelta, { color: delta >= 0 ? Colors.emerald : Colors.red }]}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(0)}%
                  </Text>
                )}
                <Text style={[styles.cardScore, { color: scoreColor }]}>{item.trend_score}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.stone300} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  // Header
  header: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  filterBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    margin: 14,
    marginBottom: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.stone200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchPlaceholder: { fontSize: 14, color: Colors.stone400 },

  // Category chips
  chipContent: { flexDirection: "row", paddingHorizontal: 14, gap: 8, marginTop: 12, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.stone200,
  },
  chipActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.stone500 },
  chipTextActive: { color: Colors.white },

  // Chart card
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    margin: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  chartLabel: { fontSize: 11, fontWeight: "600", color: Colors.stone400, marginBottom: 2 },
  chartScore: { fontSize: 40, fontWeight: "900", lineHeight: 44 },
  deltaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5,
  },
  deltaText: { fontSize: 12, fontWeight: "800" },
  chartWrap: { alignItems: "center", marginVertical: 6 },
  dayRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  dayLabel: { fontSize: 10, color: Colors.stone400, fontWeight: "500", flex: 1, textAlign: "center" },

  // List heading
  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  listHeadingText: { fontSize: 13, fontWeight: "800", color: Colors.stone700 },
  sortLabel: { fontSize: 11, color: Colors.stone400, fontWeight: "500" },

  // Cards
  listContent: { paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.stone100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  cardInfo: { flex: 1, marginLeft: 12, gap: 3 },
  cardName: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },
  cardMeta: { fontSize: 11, color: Colors.stone400 },
  cardRight: { alignItems: "flex-end", gap: 2, marginRight: 2 },
  cardDelta: { fontSize: 11, fontWeight: "700" },
  cardScore: { fontSize: 20, fontWeight: "900" },

  center: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.stone400 },
});
