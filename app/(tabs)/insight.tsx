import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

function getScoreMeta(score?: number) {
  if (!score) return { label: "—", color: Colors.stone400, bg: Colors.stone100 };
  if (score >= 86) return { label: "VIRAL 🔥", color: "#DC2626", bg: "#FEF2F2" };
  if (score >= 71) return { label: "HOT 🌟", color: Colors.orange, bg: "#FFF7ED" };
  if (score >= 51) return { label: "AKTIF ✅", color: Colors.emerald, bg: "#F0FDF4" };
  if (score >= 31) return { label: "BERKEMBANG 📈", color: "#3B82F6", bg: "#EFF6FF" };
  return { label: "NICHE 🔍", color: Colors.stone500, bg: Colors.stone100 };
}

function LoadingSteps({ step }: { step: number }) {
  const steps = [
    { icon: "search-outline" as const, label: "Menganalisa data tren…" },
    { icon: "bulb-outline" as const, label: "Meracik strategi kuliner…" },
    { icon: "document-text-outline" as const, label: "Menyusun laporan AI…" },
  ];
  return (
    <View style={loadStyles.wrap}>
      {steps.map((s, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <View key={i} style={loadStyles.step}>
            <View style={[loadStyles.iconWrap, isDone && loadStyles.iconDone, isActive && loadStyles.iconActive]}>
              {isDone
                ? <Ionicons name="checkmark" size={14} color={Colors.white} />
                : isActive
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Ionicons name={s.icon} size={14} color={Colors.stone400} />
              }
            </View>
            <Text style={[loadStyles.label, isDone && loadStyles.labelDone, isActive && loadStyles.labelActive]}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const loadStyles = StyleSheet.create({
  wrap: { gap: 10 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.stone100,
    alignItems: "center", justifyContent: "center",
  },
  iconDone: { backgroundColor: Colors.emerald },
  iconActive: { backgroundColor: Colors.orange },
  label: { fontSize: 13, color: Colors.stone400 },
  labelDone: { color: Colors.stone500 },
  labelActive: { fontSize: 13, fontWeight: "700", color: Colors.stone800 },
});

export default function InsightScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ keyword?: string; score?: string; region?: string }>();

  const [keyword, setKeyword] = useState(params.keyword ?? "");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const score = params.score ? parseInt(params.score) : undefined;
  const scoreMeta = getScoreMeta(score);

  useEffect(() => {
    if (params.keyword) setKeyword(params.keyword);
  }, [params.keyword]);

  function startLoadAnimation() {
    setLoadStep(0);
    let s = 0;
    intervalRef.current = setInterval(() => {
      s = Math.min(s + 1, 2);
      setLoadStep(s);
    }, 1800);
  }

  function stopLoadAnimation() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function generate() {
    if (!keyword.trim() || !token) return;
    setLoading(true);
    setResult(null);
    startLoadAnimation();
    try {
      const res = await fetch(`${API_URL}/api/v1/insights/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trending_product: keyword,
          trend_score: score,
          region_code: params.region ?? "ID",
        }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal generate."); return; }
      setResult(json.insight?.summary ?? json.summary ?? null);
      setProvider(json.insight?.provider ?? json.provider ?? null);
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      stopLoadAnimation();
      setLoading(false);
    }
  }

  const providerLabel = provider === "groq" ? "Groq AI" : provider === "gemini" ? "Gemini AI" : provider === "stub" ? "Demo" : provider ?? "";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="sparkles" size={17} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Konsultan Kuliner</Text>
          <Text style={styles.headerSub}>Strategi & promosi berbasis AI</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <View style={styles.gateCard}>
            <View style={styles.gateLockIcon}>
              <Ionicons name="lock-closed" size={28} color={Colors.orange} />
            </View>
            <Text style={styles.gateTitle}>Login untuk konsultasi AI</Text>
            <Text style={styles.gateSub}>Dapatkan strategi kuliner, estimasi cuan, dan konten promosi siap pakai</Text>
            <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/login")}>
              <Ionicons name="log-in-outline" size={16} color={Colors.white} />
              <Text style={styles.gateBtnText}>Masuk Sekarang</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.gateRegisterLink}>Belum punya akun? <Text style={{ color: Colors.orange, fontWeight: "700" }}>Daftar gratis</Text></Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Keyword chip (from dashboard tap) */}
            {params.keyword && (
              <View style={styles.fromDashboardBanner}>
                <Ionicons name="arrow-down-circle-outline" size={16} color={Colors.orange} />
                <Text style={styles.fromDashboardText}>Dari Dashboard: <Text style={{ fontWeight: "700", color: Colors.stone800 }}>{params.keyword}</Text></Text>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Keyword Kuliner</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="Ketik keyword, cth: mie gacoan…"
                  placeholderTextColor={Colors.stone400}
                  returnKeyType="done"
                  onSubmitEditing={generate}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!keyword.trim() || loading) && styles.sendBtnDisabled]}
                  onPress={generate}
                  disabled={!keyword.trim() || loading}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Ionicons name="sparkles" size={17} color={Colors.white} />
                  }
                </TouchableOpacity>
              </View>

              {/* Score badge */}
              {score !== undefined && (
                <View style={styles.scoreBadgeRow}>
                  <View style={[styles.scoreBadge, { backgroundColor: scoreMeta.bg, borderColor: scoreMeta.color + "30" }]}>
                    <Text style={[styles.scoreBadgeLabel, { color: scoreMeta.color }]}>{scoreMeta.label}</Text>
                  </View>
                  <Text style={styles.scoreNumText}>Skor <Text style={{ color: Colors.orange, fontWeight: "800" }}>{score}</Text>/100</Text>
                </View>
              )}
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loadingCard}>
                <View style={styles.loadingCardHeader}>
                  <ActivityIndicator color={Colors.orange} />
                  <Text style={styles.loadingTitle}>AI sedang bekerja…</Text>
                </View>
                <LoadingSteps step={loadStep} />
              </View>
            )}

            {/* Result */}
            {result && !loading && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleRow}>
                    <Ionicons name="sparkles" size={15} color={Colors.orange} />
                    <Text style={styles.resultTitle}>Rekomendasi AI</Text>
                  </View>
                  {providerLabel !== "" && (
                    <View style={styles.providerBadge}>
                      <Text style={styles.providerText}>{providerLabel}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.resultDivider} />
                <Text style={styles.resultText}>{result}</Text>
              </View>
            )}

            {!result && !loading && (
              <View style={styles.hintCard}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.stone300} />
                <Text style={styles.hintText}>
                  Ketik keyword kuliner atau pilih dari tab Dashboard, lalu tekan tombol ✨.
                </Text>
              </View>
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

  // Gate (not logged in)
  gateCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 28,
    alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    marginTop: 16,
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
  gateRegisterLink: { fontSize: 13, color: Colors.stone400 },

  // From dashboard banner
  fromDashboardBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFF7ED", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  fromDashboardText: { fontSize: 12, color: Colors.stone600, flex: 1 },

  // Input card
  inputCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inputLabel: { fontSize: 11, fontWeight: "700", color: Colors.stone600, textTransform: "uppercase", letterSpacing: 0.4 },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1, backgroundColor: Colors.stone50, borderRadius: 13, borderWidth: 1.5,
    borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.stone800,
  },
  sendBtn: {
    width: 50, height: 50, borderRadius: 13, backgroundColor: Colors.orange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  scoreBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreBadge: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  scoreBadgeLabel: { fontSize: 11, fontWeight: "800" },
  scoreNumText: { fontSize: 12, color: Colors.stone500 },

  // Loading
  loadingCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, gap: 16,
    borderWidth: 1, borderColor: "#FED7AA",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  loadingCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingTitle: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },

  // Result
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  resultHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: Colors.orangeBg,
  },
  resultTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  resultTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone800 },
  providerBadge: {
    backgroundColor: Colors.white, borderRadius: 99, borderWidth: 1, borderColor: "#FED7AA",
    paddingHorizontal: 10, paddingVertical: 3,
  },
  providerText: { fontSize: 10, fontWeight: "700", color: Colors.orange },
  resultDivider: { height: 1, backgroundColor: Colors.stone100 },
  resultText: { fontSize: 13, color: Colors.stone700, lineHeight: 23, padding: 16 },

  // Hint
  hintCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
  },
  hintText: { flex: 1, fontSize: 13, color: Colors.stone400, lineHeight: 21 },
});
