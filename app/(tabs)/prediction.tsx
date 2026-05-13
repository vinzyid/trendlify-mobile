import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Prediction = {
  predicted_growth_pct: string;
  confidence_score: number;
  horizon_days: number;
  narration: string | null;
};

const HORIZONS = [7, 14, 30];

export default function PredictionScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ keyword?: string; score?: string; snapshotId?: string }>();

  const keyword = params.keyword ?? "";
  const score = params.score ? parseInt(params.score) : 50;
  const snapshotId = params.snapshotId ? parseInt(params.snapshotId) : null;

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
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal."); return; }
      setPrediction(json.prediction ?? null);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="trending-up" size={17} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Prediction</Text>
          <Text style={styles.headerSub}>Proyeksi pertumbuhan tren kuliner</Text>
        </View>
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
            {/* Keyword info card */}
            {keyword ? (
              <View style={styles.keywordCard}>
                <View style={styles.keywordIconWrap}>
                  <Ionicons name="restaurant-outline" size={18} color={Colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.keywordCardLabel}>Keyword yang dianalisa</Text>
                  <Text style={styles.keywordCardValue} numberOfLines={1}>{keyword}</Text>
                </View>
                <View style={styles.keywordScorePill}>
                  <Text style={styles.keywordScoreText}>{score}<Text style={{ fontSize: 9, fontWeight: "500" }}>/100</Text></Text>
                </View>
              </View>
            ) : (
              <View style={styles.noKeywordCard}>
                <Ionicons name="arrow-back-circle-outline" size={22} color={Colors.stone300} />
                <Text style={styles.noKeywordText}>Pilih keyword dari tab Dashboard untuk prediksi otomatis.</Text>
              </View>
            )}

            {/* Horizon selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Horizon Prediksi</Text>
              <View style={styles.horizonRow}>
                {HORIZONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.horizonBtn, horizon === h && styles.horizonBtnActive]}
                    onPress={() => selectHorizon(h)}
                    disabled={loading}
                  >
                    <Text style={[styles.horizonBtnNum, horizon === h && styles.horizonBtnNumActive]}>{h}</Text>
                    <Text style={[styles.horizonBtnUnit, horizon === h && styles.horizonBtnUnitActive]}>hari</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calculate button */}
            {!prediction && !loading && (
              <TouchableOpacity
                style={[styles.calcBtn, !keyword && styles.calcBtnDisabled]}
                onPress={() => { hasMounted.current = true; fetchPrediction(horizon); }}
                disabled={!keyword || loading}
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

            {/* Result */}
            {!loading && prediction && (
              <>
                {/* Main result cards */}
                <View style={styles.resultRow}>
                  <View style={[styles.resultBigCard, isPositive ? styles.cardGreen : styles.cardRed]}>
                    <Text style={styles.resultBigLabel}>Pertumbuhan</Text>
                    <Text style={[styles.resultBigValue, { color: isPositive ? Colors.emerald : Colors.red }]}>
                      {isPositive ? "+" : ""}{growth?.toFixed(1)}%
                    </Text>
                    <View style={[styles.horizonTagSmall, isPositive ? styles.horizonTagGreen : styles.horizonTagRed]}>
                      <Text style={[styles.horizonTagText, { color: isPositive ? Colors.emerald : Colors.red }]}>
                        {prediction.horizon_days} hari ke depan
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.resultBigCard, styles.cardOrange]}>
                    <Text style={styles.resultBigLabel}>Confidence</Text>
                    <Text style={[styles.resultBigValue, { color: Colors.orange }]}>{prediction.confidence_score}%</Text>
                    <View style={styles.horizonTagSmall}>
                      <Text style={[styles.horizonTagText, { color: Colors.orange }]}>tingkat keyakinan</Text>
                    </View>
                  </View>
                </View>

                {/* Confidence bar */}
                <View style={styles.confBarSection}>
                  <View style={styles.confBarLabelRow}>
                    <Text style={styles.confBarLabel}>Confidence Level</Text>
                    <Text style={styles.confBarValue}>{prediction.confidence_score}%</Text>
                  </View>
                  <View style={styles.confBarTrack}>
                    <View style={[styles.confBarFill, { width: `${prediction.confidence_score}%` as any }]} />
                  </View>
                </View>

                {/* Narration */}
                {prediction.narration && (
                  <View style={styles.narrationCard}>
                    <View style={styles.narrationHeader}>
                      <Ionicons name="bulb-outline" size={15} color={Colors.orange} />
                      <Text style={styles.narrationTitle}>Analisis AI</Text>
                    </View>
                    <Text style={styles.narrationText}>{prediction.narration}</Text>
                  </View>
                )}

                {/* Recalculate */}
                <TouchableOpacity
                  style={styles.recalcBtn}
                  onPress={() => { hasMounted.current = true; fetchPrediction(horizon); }}
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
  container: { flex: 1, backgroundColor: Colors.orangeBg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  scroll: { padding: 16, gap: 14, paddingBottom: 28 },

  // Gate
  gateCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 28, marginTop: 16,
    alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  gateLockIcon: {
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

  // Keyword card
  keywordCard: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.stone200,
    paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  keywordIconWrap: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center",
  },
  keywordCardLabel: { fontSize: 10, color: Colors.stone400, fontWeight: "600", marginBottom: 2 },
  keywordCardValue: { fontSize: 14, fontWeight: "800", color: Colors.stone800 },
  keywordScorePill: {
    backgroundColor: Colors.orangeBg, borderRadius: 10, borderWidth: 1, borderColor: "#FED7AA",
    paddingHorizontal: 10, paddingVertical: 6, alignItems: "center",
  },
  keywordScoreText: { fontSize: 16, fontWeight: "900", color: Colors.orange },

  noKeywordCard: {
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.stone200,
    padding: 16, flexDirection: "row", alignItems: "center", gap: 12,
  },
  noKeywordText: { flex: 1, fontSize: 13, color: Colors.stone400, lineHeight: 20 },

  // Section card
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: Colors.stone700, textTransform: "uppercase", letterSpacing: 0.4 },
  horizonRow: { flexDirection: "row", gap: 10 },
  horizonBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.stone200,
    paddingVertical: 12, alignItems: "center", backgroundColor: Colors.stone50,
  },
  horizonBtnActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeBg },
  horizonBtnNum: { fontSize: 18, fontWeight: "900", color: Colors.stone400 },
  horizonBtnNumActive: { color: Colors.orange },
  horizonBtnUnit: { fontSize: 10, fontWeight: "600", color: Colors.stone400 },
  horizonBtnUnitActive: { color: Colors.orangeDark },

  // Calc button
  calcBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 16, paddingVertical: 15,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  calcBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  calcBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },

  // Loading
  loadingCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 28,
    alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  loadingText: { fontSize: 15, fontWeight: "700", color: Colors.stone800 },
  loadingSubText: { fontSize: 12, color: Colors.stone400, textAlign: "center" },

  // Results
  resultRow: { flexDirection: "row", gap: 12 },
  resultBigCard: {
    flex: 1, borderRadius: 18, borderWidth: 1, padding: 16,
    alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardGreen: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  cardRed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  cardOrange: { backgroundColor: Colors.orangeBg, borderColor: "#FED7AA" },
  resultBigLabel: { fontSize: 10, fontWeight: "700", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.3 },
  resultBigValue: { fontSize: 30, fontWeight: "900", lineHeight: 36 },
  horizonTagSmall: {
    backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
  },
  horizonTagGreen: { backgroundColor: "#DCFCE7" },
  horizonTagRed: { backgroundColor: "#FEE2E2" },
  horizonTagText: { fontSize: 9, fontWeight: "700" },

  // Confidence bar
  confBarSection: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14, gap: 8,
    borderWidth: 1, borderColor: Colors.stone200,
  },
  confBarLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confBarLabel: { fontSize: 11, fontWeight: "700", color: Colors.stone600 },
  confBarValue: { fontSize: 13, fontWeight: "800", color: Colors.orange },
  confBarTrack: { height: 8, borderRadius: 99, backgroundColor: "#FED7AA", overflow: "hidden" },
  confBarFill: { height: "100%", borderRadius: 99, backgroundColor: Colors.orange },

  // Narration
  narrationCard: {
    backgroundColor: Colors.orangeBg, borderRadius: 16, borderWidth: 1, borderColor: "#FED7AA",
    padding: 16, gap: 10,
  },
  narrationHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  narrationTitle: { fontSize: 12, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 0.4 },
  narrationText: { fontSize: 13, color: Colors.stone700, lineHeight: 22 },

  // Recalc
  recalcBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.orange,
  },
  recalcText: { fontSize: 13, fontWeight: "700", color: Colors.orange },
});
