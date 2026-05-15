import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
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

type PromoItem = Snapshot & {
  delta: number;
  promoScore: number;
};

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jabar", "ID-JT": "Jateng",
  "ID-JI": "Jatim", "ID-YO": "Yogyakarta", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulsel",
};

function getScoreColor(score: number) {
  if (score >= 80) return "#DC2626";
  if (score >= 65) return Colors.orange;
  if (score >= 45) return Colors.emerald;
  return Colors.stone400;
}

export default function PromosiScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [items, setItems] = useState<PromoItem[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const fetchTrends = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoadingTrends(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/trends?limit=100`);
      const json = await res.json();
      const raw: Snapshot[] = json.data ?? [];

      // Hanya ambil yang naik (delta positif) dan skor >= 55
      const rising: PromoItem[] = raw
        .filter(t => t.prev_score !== null && t.trend_score > t.prev_score && t.trend_score >= 55)
        .map(t => ({
          ...t,
          delta: t.trend_score - (t.prev_score ?? t.trend_score),
          // promoScore: bobot skor + kenaikan delta
          promoScore: Math.round(t.trend_score * 0.7 + ((t.trend_score - (t.prev_score ?? t.trend_score)) * 3)),
        }))
        .sort((a, b) => b.promoScore - a.promoScore)
        .slice(0, 10);

      setItems(rising);
    } catch {}
    finally {
      setLoadingTrends(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  async function generateAI() {
    if (items.length === 0 || loadingAi) return;
    setLoadingAi(true);
    setAiResult(null);

    const top5 = items.slice(0, 5);
    const listText = top5
      .map((t, i) => `${i + 1}. **${t.entity_label}** — Skor: ${t.trend_score}, Naik: +${t.delta} poin, Region: ${REGION_LABELS[t.region_code] ?? t.region_code}`)
      .join("\n");

    const prompt =
      `Saya punya data tren kuliner real-time di Indonesia. Produk yang sedang naik tren:\n\n${listText}\n\n` +
      `Berikan rekomendasi peluang promosi yang konkret dan actionable. Untuk setiap produk, jelaskan:\n` +
      `- Strategi promosi terbaik (konten, platform, timing)\n` +
      `- Target konsumen yang tepat\n` +
      `- Tips cepat meningkatkan penjualan\n\n` +
      `Jawab dalam Bahasa Indonesia, singkat dan langsung ke poin.`;

    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: prompt, history: [] }),
      });
      const json = await res.json();
      const reply = json.reply ?? json.message ?? json.text ?? null;
      setAiResult(reply);
      setAiGenerated(true);
    } catch {
      setAiResult("Gagal menghubungi AI. Pastikan koneksi internet kamu aktif.");
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Peluang Promosi</Text>
          <Text style={styles.headerSub}>Produk trending yang siap dipromosikan</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => { setRefreshing(true); fetchTrends(true); setAiResult(null); setAiGenerated(false); }}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.orange} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrends(true); }} tintColor={Colors.orange} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* AI Generate card */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardTop}>
            <View style={styles.aiIconWrap}>
              <Ionicons name="sparkles" size={20} color={Colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCardTitle}>Rekomendasi AI</Text>
              <Text style={styles.aiCardSub}>
                {aiGenerated
                  ? "Rekomendasi berdasarkan tren terkini"
                  : "Analisis 5 produk terbaik dengan AI"}
              </Text>
            </View>
            {aiGenerated && (
              <TouchableOpacity onPress={() => { setAiResult(null); setAiGenerated(false); }}>
                <Ionicons name="refresh-outline" size={16} color={Colors.stone400} />
              </TouchableOpacity>
            )}
          </View>

          {loadingAi ? (
            <View style={styles.aiLoading}>
              <ActivityIndicator color={Colors.orange} size="small" />
              <Text style={styles.aiLoadingText}>AI sedang menganalisis tren…</Text>
            </View>
          ) : aiResult ? (
            <View style={styles.aiResult}>
              <Markdown style={mdStyles}>{aiResult}</Markdown>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, (loadingTrends || items.length === 0) && styles.generateBtnDisabled]}
              onPress={generateAI}
              disabled={loadingTrends || items.length === 0}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles-outline" size={16} color={Colors.white} />
              <Text style={styles.generateBtnText}>Generate Rekomendasi AI</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section heading */}
        <View style={styles.sectionHead}>
          <Ionicons name="trending-up" size={14} color={Colors.orange} />
          <Text style={styles.sectionTitle}>
            {loadingTrends ? "Memuat…" : `${items.length} Produk Naik Tren`}
          </Text>
        </View>

        {loadingTrends ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.orange} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="analytics-outline" size={40} color={Colors.stone300} />
            <Text style={styles.emptyText}>Belum ada produk yang naik tren saat ini</Text>
          </View>
        ) : (
          items.map((item, i) => {
            const scoreColor = getScoreColor(item.trend_score);
            const region = REGION_LABELS[item.region_code] ?? item.region_code;
            const isTop3 = i < 3;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isTop3 && styles.cardTop]}
                activeOpacity={0.72}
                onPress={() => router.push({
                  pathname: "/(tabs)/insight",
                  params: { keyword: item.entity_label, score: item.trend_score, region: item.region_code },
                })}
              >
                {/* Rank */}
                <View style={[styles.rank, isTop3 && { backgroundColor: Colors.orange }]}>
                  <Text style={[styles.rankText, isTop3 && { color: Colors.white }]}>#{i + 1}</Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.entity_label}</Text>
                  <Text style={styles.cardMeta}>{region}</Text>

                  {/* Promo score bar */}
                  <View style={styles.barWrap}>
                    <View style={[styles.barFill, { width: `${Math.min(item.promoScore, 100)}%`, backgroundColor: scoreColor }]} />
                  </View>
                  <Text style={styles.barLabel}>Potensi promosi {item.promoScore}%</Text>
                </View>

                {/* Score + delta */}
                <View style={styles.cardRight}>
                  <Text style={[styles.cardScore, { color: scoreColor }]}>{item.trend_score}</Text>
                  <View style={styles.deltaPill}>
                    <Ionicons name="trending-up" size={11} color={Colors.emerald} />
                    <Text style={styles.deltaText}>+{item.delta}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color={Colors.stone300} />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: { padding: 14, gap: 10 },

  // AI card
  aiCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center",
  },
  aiCardTitle: { fontSize: 14, fontWeight: "800", color: Colors.stone800 },
  aiCardSub: { fontSize: 11, color: Colors.stone400, marginTop: 1 },

  aiLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  aiLoadingText: { fontSize: 12, color: Colors.stone400 },

  aiResult: { borderTopWidth: 1, borderTopColor: Colors.stone100, paddingTop: 12 },

  generateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 13,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  generateBtnText: { color: Colors.white, fontWeight: "800", fontSize: 13 },

  // Section
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone700 },

  center: { paddingVertical: 48, alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 13, color: Colors.stone400, textAlign: "center" },

  // Product cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.stone100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    borderColor: "#FED7AA",
    backgroundColor: Colors.orangeBg,
  },

  rank: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.stone100,
    alignItems: "center", justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800", color: Colors.stone600 },

  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 13, fontWeight: "700", color: Colors.stone800 },
  cardMeta: { fontSize: 11, color: Colors.stone400 },
  barWrap: { height: 4, borderRadius: 99, backgroundColor: Colors.stone100, overflow: "hidden", marginTop: 4 },
  barFill: { height: "100%", borderRadius: 99 },
  barLabel: { fontSize: 9, color: Colors.stone400, fontWeight: "600", marginTop: 2 },

  cardRight: { alignItems: "flex-end", gap: 4 },
  cardScore: { fontSize: 20, fontWeight: "900" },
  deltaPill: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "#D1FAE5", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2,
  },
  deltaText: { fontSize: 10, fontWeight: "700", color: Colors.emerald },
});

const mdStyles: any = {
  body: { fontSize: 12, color: Colors.stone700, lineHeight: 20 },
  heading2: { fontSize: 13, fontWeight: "800", color: Colors.stone900, marginTop: 10, marginBottom: 4 },
  strong: { fontWeight: "700", color: Colors.stone800 },
  bullet_list: { marginLeft: 4 },
  list_item: { marginBottom: 4 },
};
