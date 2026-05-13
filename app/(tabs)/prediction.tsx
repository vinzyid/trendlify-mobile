import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Dimensions, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

const { width: SW } = Dimensions.get("window");

type Prediction = {
  predicted_growth_pct: string;
  confidence_score: number;
  horizon_days: number;
  narration: string | null;
};

const HORIZONS = [7, 14, 30];

function getFoodEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("kopi") || n.includes("coffee") || n.includes("americano") || n.includes("espresso") || n.includes("latte") || n.includes("cappuccino")) return "☕";
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

function getGrowthLabel(g: number) {
  if (g >= 50) return "Sangat Potensial";
  if (g >= 25) return "Potensial";
  if (g >= 10) return "Cukup Potensial";
  if (g >= 0) return "Stabil";
  return "Menurun";
}

function getConfLabel(v: number) {
  if (v >= 80) return "Sangat Tinggi";
  if (v >= 65) return "Tinggi";
  if (v >= 50) return "Sedang";
  if (v >= 35) return "Rendah";
  return "Sangat Rendah";
}

function getUMKMRecs(keyword: string) {
  const n = keyword.toLowerCase();
  const isKopi = n.includes("kopi") || n.includes("coffee") || n.includes("americano") || n.includes("espresso");
  const isBoba = n.includes("boba") || n.includes("bubble") || n.includes("milk tea");

  if (isKopi) return [
    { icon: "videocam-outline" as const, bg: "#FEE2E2", color: "#EF4444", title: `Buat konten video aesthetic ${keyword}`, sub: "Tingkatkan engagement" },
    { icon: "time-outline" as const, bg: Colors.orangeBg, color: Colors.orange, title: "Posting di jam 19.00–21.00", sub: "Waktu terbaik" },
    { icon: "pricetag-outline" as const, bg: "#FEF3C7", color: Colors.amber, title: "Gunakan hashtag #KopiMinimalis", sub: "Jangkau lebih luas" },
  ];
  if (isBoba) return [
    { icon: "videocam-outline" as const, bg: "#FEE2E2", color: "#EF4444", title: `Review ${keyword} di TikTok`, sub: "Tingkatkan engagement" },
    { icon: "time-outline" as const, bg: Colors.orangeBg, color: Colors.orange, title: "Posting di jam 15.00–18.00", sub: "Waktu terbaik" },
    { icon: "pricetag-outline" as const, bg: "#FEF3C7", color: Colors.amber, title: `Hashtag #${keyword.replace(/\s/g, "")}`, sub: "Jangkau lebih luas" },
  ];
  return [
    { icon: "videocam-outline" as const, bg: "#FEE2E2", color: "#EF4444", title: `Buat konten video ${keyword}`, sub: "Tingkatkan engagement" },
    { icon: "time-outline" as const, bg: Colors.orangeBg, color: Colors.orange, title: "Posting di jam 18.00–21.00", sub: "Waktu terbaik" },
    { icon: "pricetag-outline" as const, bg: "#FEF3C7", color: Colors.amber, title: "Promosi akhir pekan", sub: "Maksimalkan penjualan" },
  ];
}

// Semicircle confidence gauge
function ConfidenceGauge({ value }: { value: number }) {
  const W = 126;
  const H = 70;
  const cx = W / 2;
  const cy = H;
  const r = 50;
  const sw = 10;

  // sweep=1 (CW on screen) from left → goes UP through top → right = upper semicircle
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Fill arc: same CW direction so it stays on the upper half
  const angleRad = (1 - value / 100) * Math.PI;
  const ex = cx + r * Math.cos(angleRad);
  const ey = cy - r * Math.sin(angleRad);
  const fillPath = value <= 0 ? "" : `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;

  return (
    <Svg width={W} height={H + sw / 2}>
      <Path d={trackPath} stroke="#F3F4F6" strokeWidth={sw} fill="none" strokeLinecap="round" />
      {value > 0 && (
        <Path d={fillPath} stroke={Colors.orange} strokeWidth={sw} fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}

// Trend area chart
function TrendChart({ score, growth, horizon }: { score: number; growth: number; horizon: number }) {
  const CW = SW - 64;
  const CH = 120;
  const PL = 28;
  const PB = 18;
  const PT = 8;
  const plotW = CW - PL - 4;
  const plotH = CH - PB - PT;

  const numPts = 5;
  const pts = Array.from({ length: numPts }, (_, i) => {
    const t = i / (numPts - 1);
    const val = Math.min(100, Math.max(0, score + score * (growth / 100) * Math.pow(t, 1.4)));
    const x = PL + t * plotW;
    const y = PT + plotH - (val / 100) * plotH;
    return { x, y, val };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(CH - PB).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(CH - PB).toFixed(1)} Z`;

  const xLabels = horizon === 7
    ? ["Hari ini", "+2 hari", "+4 hari", "+6 hari", `+7 hari`]
    : horizon === 14
    ? ["Hari ini", "+4 hari", "+7 hari", "+11 hari", `+14 hari`]
    : ["Hari ini", "+7 hari", "+14 hari", "+21 hari", `+30 hari`];

  const yLabels = [100, 75, 50, 25, 0];

  return (
    <View style={{ height: CH + 24 }}>
      {/* Y-axis labels */}
      <View style={{ position: "absolute", left: 0, top: PT, height: plotH }}>
        {yLabels.map((v) => (
          <Text
            key={v}
            style={{
              position: "absolute",
              top: (1 - v / 100) * plotH - 6,
              fontSize: 9, color: Colors.stone400,
              width: 24, textAlign: "right",
            }}
          >
            {v}
          </Text>
        ))}
      </View>

      <Svg width={CW} height={CH}>
        {/* Grid */}
        {yLabels.map((v) => {
          const gy = PT + plotH - (v / 100) * plotH;
          return (
            <Path key={v} d={`M ${PL} ${gy} L ${CW - 4} ${gy}`} stroke="#F3F4F6" strokeWidth={1} />
          );
        })}
        {/* Area fill */}
        <Path d={areaPath} fill="rgba(249,115,22,0.10)" />
        {/* Line */}
        <Path d={linePath} stroke={Colors.orange} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={Colors.orange} />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        {pts.map((p, i) => (
          <Text
            key={i}
            style={{
              position: "absolute",
              left: p.x - 22,
              fontSize: 8.5, color: Colors.stone400,
              width: 44, textAlign: "center",
            }}
          >
            {xLabels[i]}
          </Text>
        ))}
      </View>

      {/* Last point annotation */}
      <View style={styles.chartAnnotation}>
        <Text style={styles.chartAnnotationPct}>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</Text>
        <Text style={styles.chartAnnotationSub}>{horizon} hari</Text>
      </View>
    </View>
  );
}

export default function PredictionScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const { selected } = useSelectedKeyword();
  const params = useLocalSearchParams<{ keyword?: string; score?: string; snapshotId?: string }>();

  const keyword = params.keyword ?? selected?.keyword ?? "";
  const score = params.score ? parseInt(params.score) : (selected?.score ?? 50);
  const snapshotId = params.snapshotId ? parseInt(params.snapshotId) : (selected?.snapshotId ?? null);

  const [horizon, setHorizon] = useState(14);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const hasMounted = useRef(false);

  async function fetchPrediction(h: number) {
    if (!token) return;
    setLoading(true);
    setPrediction(null);
    try {
      const body = snapshotId
        ? { trend_snapshot_id: snapshotId, horizon_days: h }
        : { keyword, score, horizon_days: h };

      const res = await fetch(`${API_URL}/api/v1/predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.status === 401) { Alert.alert("Sesi Habis", "Silakan logout lalu login ulang."); return; }
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal memuat prediksi."); return; }
      // Handle multiple API response shapes
      const pred = json.prediction ?? json.data ?? (json.predicted_growth_pct !== undefined ? json : null);
      setPrediction(pred);
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  function selectHorizon(h: number) {
    setHorizon(h);
    if (prediction || hasMounted.current) fetchPrediction(h);
    hasMounted.current = true;
  }

  const growth = prediction ? parseFloat(prediction.predicted_growth_pct) : null;
  const isPositive = growth !== null && growth >= 0;
  const emoji = getFoodEmoji(keyword);
  const recs = keyword ? getUMKMRecs(keyword) : [];

  const tags = prediction?.narration
    ? [
        isPositive ? "↑ Tren meningkat" : "↓ Tren menurun",
        "👥 Target pasar luas",
        "📱 Konten sosial meningkat",
      ]
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header — white */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.stone700} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.headerTitle}>AI Prediction</Text>
            <Text style={{ fontSize: 15 }}>✨</Text>
          </View>
          <Text style={styles.headerSub}>Proyeksi pertumbuhan tren kuliner</Text>
        </View>
        <Image source={require("@/assets/chatbot.png")} style={{ width: 52, height: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <View style={styles.gateCard}>
            <View style={styles.gateLockIcon}>
              <Ionicons name="lock-closed" size={28} color={Colors.orange} />
            </View>
            <Text style={styles.gateTitle}>Login untuk akses prediksi</Text>
            <Text style={styles.gateSub}>Lihat proyeksi pertumbuhan keyword kuliner dalam 7, 14, atau 30 hari</Text>
            <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/login")}>
              <Ionicons name="log-in-outline" size={16} color={Colors.white} />
              <Text style={styles.gateBtnText}>Masuk Sekarang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Keyword hero — orange */}
            <View style={styles.heroCard}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.heroEmojiWrap}>
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.heroLabel}>Keyword yang dianalisis</Text>
                  <Text style={styles.heroKeyword} numberOfLines={1}>{keyword || "Belum dipilih"}</Text>
                  {keyword ? (
                    <View style={styles.heroBadge}>
                      <Ionicons name="trending-up" size={11} color="#059669" />
                      <Text style={styles.heroBadgeText}>Tren naik</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.heroScoreCard}>
                <Text style={styles.heroScoreNum}>
                  {score}
                  <Text style={styles.heroScoreDenom}>/100</Text>
                </Text>
                <Text style={styles.heroScoreLabel}>Skor Potensi</Text>
              </View>
            </View>

            {!keyword && (
              <View style={styles.noKeywordBanner}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.stone400} />
                <Text style={styles.noKeywordText}>
                  Pilih keyword dari tab Dashboard atau generate di AI Konsultan terlebih dahulu.
                </Text>
              </View>
            )}

            {/* Horizon selector */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>HORIZON PREDIKSI</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.stone400} />
                  <Text style={styles.cardSub}>Periode prediksi</Text>
                </View>
              </View>
              <View style={styles.horizonRow}>
                {HORIZONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.horizonBtn, horizon === h && styles.horizonBtnActive]}
                    onPress={() => selectHorizon(h)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    {horizon === h && (
                      <View style={styles.horizonCheck}>
                        <Ionicons name="checkmark" size={10} color={Colors.white} />
                      </View>
                    )}
                    <Text style={[styles.horizonNum, horizon === h && styles.horizonNumActive]}>{h}</Text>
                    <Text style={[styles.horizonUnit, horizon === h && styles.horizonUnitActive]}>hari</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hitung button */}
            {!prediction && !loading && (
              <TouchableOpacity
                style={[styles.calcBtn, !keyword && styles.calcBtnDisabled]}
                onPress={() => { hasMounted.current = true; fetchPrediction(horizon); }}
                disabled={!keyword || loading}
                activeOpacity={0.8}
              >
                <Ionicons name="calculator-outline" size={18} color={Colors.white} />
                <Text style={styles.calcBtnText}>Hitung Prediksi</Text>
              </TouchableOpacity>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={Colors.orange} size="large" />
                <Text style={styles.loadingText}>Menghitung proyeksi…</Text>
                <Text style={styles.loadingSubText}>AI menganalisa pola tren {horizon} hari ke depan</Text>
              </View>
            )}

            {/* Results */}
            {!loading && prediction && (
              <>
                {/* Proyeksi card */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>PROYEKSI {prediction.horizon_days} HARI KE DEPAN</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {/* Growth */}
                    <View style={[styles.growthBox, isPositive ? styles.growthBoxGreen : styles.growthBoxRed]}>
                      <Text style={styles.growthBoxLabel}>Pertumbuhan Prediksi</Text>
                      <Text style={[styles.growthValue, { color: isPositive ? "#059669" : "#DC2626" }]}>
                        {isPositive ? "+" : ""}{growth?.toFixed(1)}%
                      </Text>
                      <View style={[styles.growthBadge, isPositive ? styles.growthBadgeGreen : styles.growthBadgeRed]}>
                        <Ionicons name={isPositive ? "trending-up" : "trending-down"} size={12} color={isPositive ? "#059669" : "#DC2626"} />
                        <Text style={[styles.growthBadgeText, { color: isPositive ? "#059669" : "#DC2626" }]}>
                          {getGrowthLabel(growth ?? 0)}
                        </Text>
                      </View>
                      <Text style={styles.growthCompare}>Dibandingkan {prediction.horizon_days} hari terakhir</Text>
                    </View>

                    {/* Confidence gauge */}
                    <View style={styles.gaugeBox}>
                      <Text style={styles.growthBoxLabel}>Confidence Level</Text>
                      <View style={{ alignItems: "center" }}>
                        <ConfidenceGauge value={prediction.confidence_score} />
                        <Text style={[styles.gaugeValue, { marginTop: -16 }]}>{prediction.confidence_score}%</Text>
                        <Text style={styles.gaugeSubLabel}>Tingkat Keyakinan</Text>
                      </View>
                      <View style={styles.confBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#059669" />
                        <Text style={styles.confBadgeText}>{getConfLabel(prediction.confidence_score)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Trend chart */}
                {growth !== null && (
                  <View style={styles.card}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardTitle}>TREND PROYEKSI ({prediction.horizon_days} HARI)</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <View style={styles.legendDot} />
                        <Text style={styles.cardSub}>Prediksi</Text>
                      </View>
                    </View>
                    <TrendChart score={score} growth={growth} horizon={prediction.horizon_days} />
                  </View>
                )}

                {/* AI Analysis */}
                {prediction.narration && (
                  <View style={styles.card}>
                    <View style={styles.analysisHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                        <View style={styles.analysisIconBox}>
                          <Ionicons name="bulb" size={13} color={Colors.orange} />
                        </View>
                        <Text style={styles.cardTitle}>ANALISIS AI</Text>
                        <Text style={{ fontSize: 13 }}>✨</Text>
                      </View>
                      <TouchableOpacity>
                        <Text style={styles.lihatDetail}>Lihat detail &gt;</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.narrationText}>{prediction.narration}</Text>
                    <View style={styles.tagsRow}>
                      {tags.map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* UMKM Recommendations */}
                {keyword ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.cardTitle}>REKOMENDASI AI UNTUK UMKM</Text>
                      <Text style={{ fontSize: 14 }}>✨</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {recs.map((rec, i) => (
                        <View key={i} style={styles.recCard}>
                          <View style={[styles.recIconBox, { backgroundColor: rec.bg }]}>
                            <Ionicons name={rec.icon} size={16} color={rec.color} />
                          </View>
                          <Text style={styles.recCardTitle} numberOfLines={3}>{rec.title}</Text>
                          <Text style={styles.recCardSub}>{rec.sub}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Recalculate */}
                <TouchableOpacity
                  style={styles.recalcBtn}
                  onPress={() => { hasMounted.current = true; fetchPrediction(horizon); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={15} color={Colors.orange} />
                  <Text style={styles.recalcText}>Hitung Ulang</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F6" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.white, paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.stone50, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.stone200,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.stone900 },
  headerSub: { fontSize: 11, color: Colors.stone500, marginTop: 1 },

  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  // Gate
  gateCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 28, marginTop: 16,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.stone200,
  },
  gateLockIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 17, fontWeight: "800", color: Colors.stone800, textAlign: "center" },
  gateSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20 },
  gateBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.orange, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  gateBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },

  // Hero card
  heroCard: {
    backgroundColor: Colors.orange, borderRadius: 20, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  heroEmojiWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  heroLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  heroKeyword: { fontSize: 18, fontWeight: "900", color: Colors.white },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.white, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  heroBadgeText: { fontSize: 10, fontWeight: "700", color: "#059669" },
  heroScoreCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 12, alignItems: "center", minWidth: 78 },
  heroScoreNum: { fontSize: 22, fontWeight: "900", color: Colors.orange },
  heroScoreDenom: { fontSize: 11, fontWeight: "600", color: Colors.stone400 },
  heroScoreLabel: { fontSize: 9, color: Colors.stone500, fontWeight: "600", marginTop: 2 },

  // No keyword
  noKeywordBanner: {
    backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.stone200,
    padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10,
  },
  noKeywordText: { flex: 1, fontSize: 12, color: Colors.stone500, lineHeight: 18 },

  // Card
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 11, fontWeight: "800", color: Colors.stone700, textTransform: "uppercase", letterSpacing: 0.5 },
  cardSub: { fontSize: 11, color: Colors.stone400 },

  // Horizon
  horizonRow: { flexDirection: "row", gap: 10 },
  horizonBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.stone200,
    paddingVertical: 14, alignItems: "center", backgroundColor: Colors.stone50, position: "relative",
  },
  horizonBtnActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeBg },
  horizonCheck: { position: "absolute", top: -1, right: -1, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.orange, alignItems: "center", justifyContent: "center" },
  horizonNum: { fontSize: 20, fontWeight: "900", color: Colors.stone400 },
  horizonNumActive: { color: Colors.orange },
  horizonUnit: { fontSize: 11, fontWeight: "600", color: Colors.stone400 },
  horizonUnitActive: { color: Colors.orangeDark },

  // Calc
  calcBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.orange, borderRadius: 16, paddingVertical: 15, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  calcBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  calcBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },

  // Loading
  loadingCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 28, alignItems: "center", gap: 10, borderWidth: 1, borderColor: Colors.orangeLight },
  loadingText: { fontSize: 15, fontWeight: "700", color: Colors.stone800 },
  loadingSubText: { fontSize: 12, color: Colors.stone400, textAlign: "center" },

  // Growth box (left of proyeksi)
  growthBox: { flex: 1, borderRadius: 14, padding: 14, gap: 8 },
  growthBoxGreen: { backgroundColor: "#F0FDF4" },
  growthBoxRed: { backgroundColor: "#FEF2F2" },
  growthBoxLabel: { fontSize: 10, color: Colors.stone500, fontWeight: "600" },
  growthValue: { fontSize: 30, fontWeight: "900" },
  growthBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  growthBadgeGreen: { backgroundColor: "#DCFCE7" },
  growthBadgeRed: { backgroundColor: "#FEE2E2" },
  growthBadgeText: { fontSize: 10, fontWeight: "700" },
  growthCompare: { fontSize: 9, color: Colors.stone400 },

  // Gauge box (right of proyeksi)
  gaugeBox: { flex: 1, alignItems: "center", gap: 6 },
  gaugeValue: { fontSize: 26, fontWeight: "900", color: Colors.orange },
  gaugeSubLabel: { fontSize: 10, color: Colors.stone500, fontWeight: "600" },
  confBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  confBadgeText: { fontSize: 11, fontWeight: "700", color: "#059669" },

  // Chart
  chartAnnotation: { position: "absolute", right: 0, top: 0, backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: Colors.stone200, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  chartAnnotationPct: { fontSize: 11, fontWeight: "800", color: Colors.orange },
  chartAnnotationSub: { fontSize: 8, color: Colors.stone400 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.orange },

  // Analysis
  analysisHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  analysisIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center" },
  lihatDetail: { fontSize: 12, fontWeight: "700", color: Colors.orange },
  narrationText: { fontSize: 13, color: Colors.stone700, lineHeight: 21 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: { backgroundColor: Colors.stone50, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.stone200 },
  tagText: { fontSize: 11, fontWeight: "600", color: Colors.stone600 },

  // UMKM Recs
  recCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 7, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  recIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  recCardTitle: { fontSize: 11, fontWeight: "700", color: Colors.stone800, lineHeight: 15 },
  recCardSub: { fontSize: 10, color: Colors.stone400 },

  // Recalc
  recalcBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: Colors.orange },
  recalcText: { fontSize: 13, fontWeight: "700", color: Colors.orange },
});
