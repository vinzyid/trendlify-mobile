import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Ellipse } from "react-native-svg";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

const TILE_W = (Dimensions.get("window").width - 28 - 10) / 3;

const REGION_META: Record<string, { name: string; short: string; icon: string }> = {
  "ID-JK": { name: "DKI Jakarta",       short: "Jakarta",  icon: "business-outline" },
  "ID-JB": { name: "Jawa Barat",        short: "Jabar",    icon: "leaf-outline" },
  "ID-JT": { name: "Jawa Tengah",       short: "Jateng",   icon: "trail-sign-outline" },
  "ID-JI": { name: "Jawa Timur",        short: "Jatim",    icon: "flame-outline" },
  "ID-YO": { name: "Yogyakarta",        short: "Yogya",    icon: "school-outline" },
  "ID-BT": { name: "Banten",            short: "Banten",   icon: "home-outline" },
  "ID-BL": { name: "Bali",              short: "Bali",     icon: "sunny-outline" },
  "ID-SN": { name: "Sulawesi Selatan",  short: "Sulsel",   icon: "boat-outline" },
};

const REGION_ORDER = ["ID-JK","ID-JI","ID-JB","ID-JT","ID-BL","ID-YO","ID-SN","ID-BT"];
const LEGEND_COLORS = ["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C","#C2410C"];

type RegionData = {
  region_code: string;
  avg_score: number;
  samples: number;
  top_product: string;
};

function heatStyle(score: number, maxScore: number) {
  const r = maxScore > 0 ? score / maxScore : 0;
  if (r >= 0.96) return { bg: "#9A3412", nameColor: "#FDBA74", scoreColor: "#fff" };
  if (r >= 0.90) return { bg: "#C2410C", nameColor: "#FED7AA", scoreColor: "#fff" };
  if (r >= 0.83) return { bg: "#EA580C", nameColor: "#FFF7ED", scoreColor: "#fff" };
  if (r >= 0.76) return { bg: "#F97316", nameColor: "#fff",    scoreColor: "#fff" };
  if (r >= 0.68) return { bg: "#FB923C", nameColor: "#7C2D12", scoreColor: "#7C2D12" };
  if (r >= 0.60) return { bg: "#FDBA74", nameColor: "#9A3412", scoreColor: "#9A3412" };
  return               { bg: "#FED7AA", nameColor: "#C2410C", scoreColor: "#C2410C" };
}

function getScoreColor(score: number) {
  if (score >= 80) return "#C2410C";
  if (score >= 65) return Colors.orange;
  if (score >= 50) return "#FB923C";
  return "#FDBA74";
}

// Decorative Indonesia island ellipses
function IndonesiaShape() {
  const islands = [
    { cx: 18,  cy: 28, rx: 22, ry: 9  },
    { cx: 62,  cy: 40, rx: 20, ry: 6  },
    { cx: 72,  cy: 22, rx: 15, ry: 13 },
    { cx: 96,  cy: 24, rx: 8,  ry: 12 },
    { cx: 128, cy: 28, rx: 18, ry: 13 },
    { cx: 90,  cy: 42, rx: 10, ry: 5  },
  ];
  return (
    <Svg width={148} height={56}>
      {islands.map((d, i) => (
        <Ellipse key={i} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill="#fff" opacity={0.22} />
      ))}
    </Svg>
  );
}

export default function HeatmapScreen() {
  const router = useRouter();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RegionData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [heatRes, trendRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/regions/heatmap`),
          fetch(`${API_URL}/api/v1/trends?limit=100`),
        ]);
        const heatJson = await heatRes.json();
        const trendJson = await trendRes.json();

        const heatMap: Record<string, { avg_score: number; samples: number }> = {};
        (heatJson.regions ?? []).forEach((r: any) => {
          heatMap[r.region_code] = { avg_score: Math.round(r.avg_score), samples: r.samples };
        });

        const topProduct: Record<string, string> = {};
        (trendJson.data ?? []).forEach((t: any) => {
          if (!topProduct[t.region_code]) topProduct[t.region_code] = t.entity_label;
        });

        const combined: RegionData[] = Object.keys(heatMap)
          .filter(c => REGION_META[c])
          .map(c => ({
            region_code: c,
            avg_score: heatMap[c].avg_score,
            samples: heatMap[c].samples,
            top_product: topProduct[c] ?? "—",
          }))
          .sort((a, b) => b.avg_score - a.avg_score);

        setRegions(combined);
        setSelected(combined[0] ?? null);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const maxScore = regions[0]?.avg_score ?? 100;
  const orderedTiles = REGION_ORDER.map(c => regions.find(r => r.region_code === c) ?? null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={Colors.stone700} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Heatmap Regional</Text>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.orange} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.stone700} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>Heatmap Regional</Text>
          <Text style={styles.topSub}>Sebaran tren per provinsi</Text>
        </View>
        <IndonesiaShape />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Selected region card */}
        {selected && (
          <View style={styles.heroCard}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>Wilayah Terpilih</Text>
            </View>
            <View style={styles.heroBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{REGION_META[selected.region_code]?.name ?? selected.region_code}</Text>
                <View style={styles.heroDivider} />
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Ionicons name="trending-up-outline" size={12} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.heroStatLabel}>Skor</Text>
                    <Text style={styles.heroStatVal}>{selected.avg_score}</Text>
                  </View>
                  <View style={styles.heroStatLine} />
                  <View style={styles.heroStat}>
                    <Ionicons name="cube-outline" size={12} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.heroStatLabel}>Produk</Text>
                    <Text style={styles.heroStatVal}>{selected.samples}</Text>
                  </View>
                  <View style={styles.heroStatLine} />
                  <View style={[styles.heroStat, { flex: 1.5 }]}>
                    <Ionicons name="star-outline" size={12} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.heroStatLabel}>Top Produk</Text>
                    <Text style={[styles.heroStatVal, { fontSize: 13 }]} numberOfLines={1}>
                      {selected.top_product}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons
                  name={(REGION_META[selected.region_code]?.icon ?? "location-outline") as any}
                  size={52}
                  color="rgba(255,255,255,0.15)"
                />
              </View>
            </View>
          </View>
        )}

        {/* Peta Intensitas heading */}
        <View style={styles.secHead}>
          <Text style={styles.secLabel}>PETA INTENSITAS</Text>
          <Ionicons name="information-circle-outline" size={15} color={Colors.stone400} />
        </View>

        {/* Tile grid */}
        <View style={styles.grid}>
          {orderedTiles.map((r, i) => {
            if (!r) return <View key={i} style={[styles.tile, { backgroundColor: "transparent", elevation: 0, shadowOpacity: 0 }]} />;
            const hs = heatStyle(r.avg_score, maxScore);
            const isSelected = selected?.region_code === r.region_code;
            return (
              <TouchableOpacity
                key={r.region_code}
                style={[styles.tile, { backgroundColor: hs.bg }, isSelected && styles.tileActive]}
                onPress={() => setSelected(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tileName, { color: hs.nameColor }]} numberOfLines={2}>
                  {REGION_META[r.region_code]?.short ?? r.region_code}
                </Text>
                <Text style={[styles.tileScore, { color: hs.scoreColor }]}>{r.avg_score}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>LEGENDA</Text>
          <View style={styles.legendRow}>
            {LEGEND_COLORS.map((c, i) => (
              <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
            ))}
            <Text style={styles.legendText}>Rendah</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.stone400} style={{ marginHorizontal: 4 }} />
            <Text style={styles.legendText}>Tinggi</Text>
          </View>
        </View>

        {/* Ranking */}
        <View style={styles.secHead}>
          <Ionicons name="trending-up" size={15} color={Colors.orange} />
          <Text style={[styles.secLabel, { color: Colors.stone700 }]}>RANKING WILAYAH</Text>
        </View>

        <View style={styles.rankCard}>
          {regions.map((r, i) => {
            const isSelected = selected?.region_code === r.region_code;
            return (
              <TouchableOpacity
                key={r.region_code}
                style={[
                  styles.rankRow,
                  i === regions.length - 1 && { borderBottomWidth: 0 },
                  isSelected && { backgroundColor: Colors.orangeBg },
                ]}
                onPress={() => setSelected(r)}
                activeOpacity={0.7}
              >
                <View style={[styles.rankNum, isSelected && { backgroundColor: Colors.orange }]}>
                  <Text style={[styles.rankNumTxt, isSelected && { color: Colors.white }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankName}>{REGION_META[r.region_code]?.name ?? r.region_code}</Text>
                  <Text style={styles.rankTop}>Top: {r.top_product}</Text>
                </View>
                <Text style={[styles.rankScore, { color: getScoreColor(r.avg_score) }]}>{r.avg_score}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#FFF7ED",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.stone100,
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { fontSize: 17, fontWeight: "900", color: Colors.stone900 },
  topSub: { fontSize: 11, color: Colors.stone400, marginTop: 1 },

  scroll: { paddingHorizontal: 14, paddingBottom: 32 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.orange,
    borderRadius: 20, padding: 18, marginBottom: 20,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  heroTag: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  heroTagText: { fontSize: 11, fontWeight: "700", color: Colors.white },
  heroBody: { flexDirection: "row", alignItems: "flex-end" },
  heroName: { fontSize: 28, fontWeight: "900", color: Colors.white, marginBottom: 10 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.3)", marginBottom: 12 },
  heroStats: { flexDirection: "row", alignItems: "flex-start" },
  heroStat: { flex: 1, gap: 3 },
  heroStatLine: { width: 1, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 10, height: 40 },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  heroStatVal: { fontSize: 22, fontWeight: "900", color: Colors.white },
  heroIcon: { position: "absolute", right: 0, bottom: 0 },

  // Section heading
  secHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  secLabel: { fontSize: 11, fontWeight: "800", color: Colors.stone500, letterSpacing: 0.8 },

  // Tile grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 16 },
  tile: {
    width: TILE_W, height: TILE_W * 0.72,
    borderRadius: 14, padding: 10, justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tileActive: { borderWidth: 2.5, borderColor: Colors.white, elevation: 6 },
  tileName: { fontSize: 11, fontWeight: "700", lineHeight: 14 },
  tileScore: { fontSize: 22, fontWeight: "900" },

  // Legend
  legendBox: {
    backgroundColor: Colors.white, borderRadius: 14,
    padding: 14, marginBottom: 20, gap: 8,
    borderWidth: 1, borderColor: Colors.stone100,
  },
  legendTitle: { fontSize: 10, fontWeight: "800", color: Colors.stone400, letterSpacing: 0.8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  swatch: { width: 26, height: 12, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.stone400, fontWeight: "600", marginLeft: 4 },

  // Ranking
  rankCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    overflow: "hidden", borderWidth: 1, borderColor: Colors.stone100,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  rankRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  rankNum: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.stone100, alignItems: "center", justifyContent: "center",
  },
  rankNumTxt: { fontSize: 12, fontWeight: "800", color: Colors.stone600 },
  rankName: { fontSize: 13, fontWeight: "700", color: Colors.stone800 },
  rankTop: { fontSize: 11, color: Colors.stone400, marginTop: 1 },
  rankScore: { fontSize: 20, fontWeight: "900" },
});
