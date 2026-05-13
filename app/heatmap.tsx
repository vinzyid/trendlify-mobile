import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type RegionTrend = {
  region_code: string;
  region_name: string;
  trend_score: number;
  trending_product: string;
};

const REGION_MAP: Record<string, string> = {
  "ID-JK": "DKI Jakarta",
  "ID-JB": "Jawa Barat",
  "ID-JT": "Jawa Tengah",
  "ID-JI": "Jawa Timur",
  "ID-YO": "DI Yogyakarta",
  "ID-BT": "Banten",
  "ID-BL": "Bali",
  "ID-SN": "Sulawesi Selatan",
};

export default function HeatmapScreen() {
  const router = useRouter();
  const [data, setData] = useState<RegionTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  async function fetchHeatmapData() {
    try {
      // Mocking heatmap data based on region codes
      const res = await fetch(`${API_URL}/api/v1/trends?limit=50`);
      if (res.ok) {
        const json = await res.json();
        const trends = json.data ?? [];
        
        // Group by region and get top trend per region
        const regional: Record<string, RegionTrend> = {};
        trends.forEach((t: any) => {
          if (!regional[t.region_code] || regional[t.region_code].trend_score < t.trend_score) {
            regional[t.region_code] = {
              region_code: t.region_code,
              region_name: REGION_MAP[t.region_code] ?? t.region_code,
              trend_score: t.trend_score,
              trending_product: t.entity_label,
            };
          }
        });
        
        setData(Object.values(regional).sort((a, b) => b.trend_score - a.trend_score));
      }
    } catch (error) {
      console.error("Heatmap error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getHeatColor(score: number) {
    if (score >= 85) return "#EF4444"; // Hot (Red)
    if (score >= 70) return "#F97316"; // Warm (Orange)
    if (score >= 50) return "#F59E0B"; // Active (Amber)
    return "#10B981"; // Developing (Emerald)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.stone800} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Heatmap Regional</Text>
          <Text style={styles.headerSub}>Sebaran tren kuliner di Indonesia</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.orange} />
          <Text style={styles.infoText}>
            Warna menunjukkan intensitas tren di wilayah tersebut berdasarkan aktivitas pencarian dan media sosial.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.orange} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {data.map((item) => (
              <TouchableOpacity key={item.region_code} style={styles.regionCard}>
                <View style={[styles.heatIndicator, { backgroundColor: getHeatColor(item.trend_score) }]} />
                <View style={styles.regionContent}>
                  <Text style={styles.regionName}>{item.region_name}</Text>
                  <Text style={styles.trendingProduct}>🔥 {item.trending_product}</Text>
                  <View style={styles.scoreRow}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${item.trend_score}%`, backgroundColor: getHeatColor(item.trend_score) }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.scoreValue, { color: getHeatColor(item.trend_score) }]}>
                      {item.trend_score}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.stone300} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.stone900 },
  headerSub: { fontSize: 12, color: Colors.stone500 },
  scroll: { padding: 16 },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.orangeBg,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.orange, lineHeight: 18 },
  grid: { gap: 12 },
  regionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.stone100,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heatIndicator: {
    width: 6,
    height: 40,
    borderRadius: 3,
  },
  regionContent: { flex: 1, gap: 4 },
  regionName: { fontSize: 15, fontWeight: "700", color: Colors.stone800 },
  trendingProduct: { fontSize: 12, color: Colors.stone500, fontWeight: "500" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  progressBar: { flex: 1, height: 4, backgroundColor: Colors.stone100, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  scoreValue: { fontSize: 14, fontWeight: "800" },
});
