import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Animated,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

// Matches web exactly
const LOADING_STEPS = [
  "Memindai tren pasar kuliner real-time…",
  "Analisis kompetitor & posisi pasar…",
  "AI menyusun strategi untuk kamu…",
];

type ScoreMeta = {
  label: string; verdict: string; icon: string;
  badgeColor: string; badgeBg: string;
  potential: string; action: string;
};

function getScoreMeta(score?: number): ScoreMeta {
  if (!score) return { label: "—", verdict: "Masukkan keyword", icon: "📊", badgeColor: Colors.stone500, badgeBg: Colors.stone100, potential: "—", action: "—" };
  if (score >= 86) return { label: "VIRAL",      verdict: "Masuk sekarang!",      icon: "🔥", badgeColor: "#DC2626", badgeBg: "#FEF2F2", potential: "Sangat Tinggi",  action: "Mulai Hari Ini"     };
  if (score >= 71) return { label: "HOT",        verdict: "Momentum memuncak",     icon: "🌟", badgeColor: Colors.orange, badgeBg: "#FFF7ED", potential: "Tinggi",        action: "Push Sekarang"      };
  if (score >= 51) return { label: "AKTIF",      verdict: "Pasar siap digarap",    icon: "✅", badgeColor: Colors.emerald, badgeBg: "#F0FDF4", potential: "Sedang–Tinggi", action: "Mulai Minggu Ini"   };
  if (score >= 31) return { label: "BERKEMBANG", verdict: "Early mover advantage", icon: "📈", badgeColor: "#3B82F6", badgeBg: "#EFF6FF", potential: "Berkembang",     action: "Persiapkan Dulu"    };
  return              { label: "NICHE",      verdict: "Spesialisasi unik",     icon: "🔍", badgeColor: Colors.stone500, badgeBg: Colors.stone100, potential: "Niche", action: "Riset Lebih Lanjut" };
}

type Section = { heading: string; content: string };

function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^## /, "").trim(), content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  // If no ## sections found, treat entire text as one section
  if (sections.length === 0 && text.trim()) {
    sections.push({ heading: "Rekomendasi AI", content: text });
  }
  return sections;
}

const PROVIDER_LABEL: Record<string, string> = {
  gemini: "Gemini AI",
  groq: "Groq AI",
  stub: "Demo Mode",
};

function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function CopyableSectionCard({
  section, index, isOpen, onToggle, isPriority,
}: {
  section: { heading: string; content: string };
  index: number; isOpen: boolean;
  onToggle: () => void; isPriority: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }

  return (
    <AnimatedCard delay={index * 80} style={[styles.sectionCard, isPriority && styles.sectionCardPriority]}>
      <TouchableOpacity
        style={styles.sectionToggle}
        onPress={onToggle}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          <Text style={styles.sectionHeading} numberOfLines={2}>{section.heading}</Text>
        </Animated.View>
        <View style={styles.sectionToggleRight}>
          {isPriority && (
            <View style={styles.copyReadyBadge}>
              <Text style={styles.copyReadyText}>Siap Copy</Text>
            </View>
          )}
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.stone400} />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.sectionBody, { borderTopColor: Colors.stone100, borderTopWidth: 1 }]}>
          <Markdown style={insightMdStyles}>{section.content.trim()}</Markdown>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons
              name={copied ? "checkmark-circle" : "copy-outline"}
              size={14}
              color={copied ? Colors.emerald : Colors.stone400}
            />
            <Text style={[styles.copyBtnText, copied && { color: Colors.emerald }]}>
              {copied ? "Tersalin!" : "Copy teks"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </AnimatedCard>
  );
}

export default function InsightScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const { setSelected } = useSelectedKeyword();
  const params = useLocalSearchParams<{ keyword?: string; score?: string; region?: string }>();

  const [keyword, setKeyword] = useState(params.keyword ?? "");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
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
    setOpenSections(new Set([0]));
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
      if (res.status === 401) { Alert.alert("Sesi Habis", "Silakan logout lalu login ulang."); return; }
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal generate."); return; }
      setResult(json.insight?.summary ?? json.summary ?? null);
      setProvider(json.insight?.provider ?? json.provider ?? null);
      setOpenSections(new Set([0, 1]));
      // Share keyword ke tab Prediksi (mirip DashboardClient di web)
      setSelected({
        keyword,
        score: score ?? 50,
        region: params.region ?? "ID",
        snapshotId: params.snapshotId ? parseInt(params.snapshotId as string) : null,
      });
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      stopLoadAnimation();
      setLoading(false);
    }
  }

  function toggleSection(i: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const sections = result ? parseSections(result) : [];
  const providerLabel = provider ? (PROVIDER_LABEL[provider] ?? provider) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — gradient from-orange-50 to-amber-50 on web, orange on mobile */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="sparkles" size={17} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Konsultan Kuliner</Text>
          <Text style={styles.headerSub}>Strategi promosi & target pasar berbasis AI</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          /* Gate — matches web: two buttons side by side */
          <View style={styles.gateCard}>
            <View style={styles.gateLockIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.orange} />
            </View>
            <Text style={styles.gateTitle}>Konsultasi Gratis dengan AI</Text>
            <Text style={styles.gateSub}>
              Login untuk mendapatkan strategi kuliner & promosi AI secara real-time.
            </Text>
            <View style={styles.gateBtnRow}>
              <TouchableOpacity style={styles.gateBtnOutline} onPress={() => router.push("/login")}>
                <Ionicons name="log-in-outline" size={14} color={Colors.orange} />
                <Text style={styles.gateBtnOutlineText}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gateBtnFill} onPress={() => router.push("/register")}>
                <Ionicons name="person-add-outline" size={14} color={Colors.white} />
                <Text style={styles.gateBtnFillText}>Daftar Gratis</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Input — matches web */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={keyword}
                onChangeText={(v) => setKeyword(v)}
                placeholder="Ketik keyword atau pilih dari tabel…"
                placeholderTextColor={Colors.stone400}
                returnKeyType="done"
                onSubmitEditing={generate}
              />
              <TouchableOpacity
                style={[styles.generateBtn, (!keyword.trim() || loading) && styles.generateBtnDisabled]}
                onPress={generate}
                disabled={!keyword.trim() || loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Ionicons name="send" size={15} color={Colors.white} />
                }
                <Text style={styles.generateBtnText}>{loading ? "Analisis…" : "Generate"}</Text>
              </TouchableOpacity>
            </View>

            {/* Score summary — 3 cards matching web exactly */}
            {score !== undefined && !loading && (
              <View style={styles.scoreGrid}>
                <AnimatedCard delay={0} style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    <Ionicons name="trending-up-outline" size={10} color={Colors.stone400} />
                    <Text style={styles.scoreCardLabel}>Status Tren</Text>
                  </View>
                  <View style={[styles.scoreBadgePill, { backgroundColor: scoreMeta.badgeBg }]}>
                    <Text style={[styles.scoreBadgePillText, { color: scoreMeta.badgeColor }]}>
                      {scoreMeta.icon} {scoreMeta.label}
                    </Text>
                  </View>
                  <Text style={styles.scoreCardVerdict}>{scoreMeta.verdict}</Text>
                </AnimatedCard>

                <AnimatedCard delay={80} style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    <Ionicons name="cash-outline" size={10} color={Colors.stone400} />
                    <Text style={styles.scoreCardLabel}>Potensi Cuan</Text>
                  </View>
                  <Text style={styles.scoreCardValue}>{scoreMeta.potential}</Text>
                  <Text style={styles.scoreCardVerdict}>skor {score}/100</Text>
                </AnimatedCard>

                <AnimatedCard delay={160} style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    <Ionicons name="flash-outline" size={10} color={Colors.stone400} />
                    <Text style={styles.scoreCardLabel}>Rekomendasi</Text>
                  </View>
                  <Text style={[styles.scoreCardValue, { color: Colors.orange }]}>{scoreMeta.action}</Text>
                  <Text style={styles.scoreCardVerdict}>data Trendlify</Text>
                </AnimatedCard>
              </View>
            )}

            {!result && !loading && score === undefined && (
              <Text style={styles.hintText}>
                Masukkan nama produk kuliner atau klik baris di tabel Dashboard untuk analisis instan.
              </Text>
            )}

            {/* Loading steps — matches web exactly */}
            {loading && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingCardTitle}>AI sedang bekerja…</Text>
                {LOADING_STEPS.map((step, i) => {
                  const isDone = i < loadStep;
                  const isActive = i === loadStep;
                  return (
                    <View key={i} style={[styles.loadStep, (!isDone && !isActive) && styles.loadStepDim]}>
                      <View style={[styles.loadStepIcon, isDone && styles.loadStepDone, isActive && styles.loadStepActive]}>
                        {isDone
                          ? <Ionicons name="checkmark" size={11} color={Colors.white} />
                          : isActive
                            ? <ActivityIndicator size="small" color={Colors.white} />
                            : null
                        }
                      </View>
                      <Text style={[styles.loadStepText, (isDone || isActive) && styles.loadStepTextActive]}>
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Result — collapsible sections matching web */}
            {result && sections.length > 0 && !loading && (
              <View style={styles.resultWrap}>
                {/* Provider badge */}
                {providerLabel && (
                  <View style={styles.providerRow}>
                    <View style={styles.providerBadge}>
                      <Ionicons name="sparkles" size={11} color={Colors.orange} />
                      <Text style={styles.providerText}>{providerLabel}</Text>
                    </View>
                    <Text style={styles.providerFor}>
                      Analisis untuk: <Text style={{ fontWeight: "700", color: Colors.stone600 }}>{keyword}</Text>
                    </Text>
                  </View>
                )}

                {sections.map((section, i) => {
                  const isOpen = openSections.has(i);
                  const isPriority = /caption|tiktok|script|konten siap/i.test(section.heading);

                  return (
                    <CopyableSectionCard
                      key={i}
                      section={section}
                      index={i}
                      isOpen={isOpen}
                      onToggle={() => toggleSection(i)}
                      isPriority={isPriority}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const insightMdStyles = {
  body: { color: Colors.stone700, fontSize: 13, lineHeight: 22 },
  heading2: { fontSize: 13, fontWeight: "800" as const, color: Colors.orange, marginTop: 8, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: 0.3 },
  heading3: { fontSize: 13, fontWeight: "700" as const, color: Colors.stone800, marginTop: 6, marginBottom: 2 },
  strong: { fontWeight: "700" as const, color: Colors.stone900 },
  em: { fontStyle: "italic" as const, color: Colors.stone500 },
  bullet_list: { marginTop: 2, marginBottom: 2 },
  ordered_list: { marginTop: 2, marginBottom: 2 },
  list_item: { marginVertical: 1 },
  bullet_list_icon: { color: Colors.orange, marginTop: 5 },
  paragraph: { marginTop: 1, marginBottom: 1 },
  hr: { backgroundColor: Colors.stone200, marginVertical: 6, height: 1 },
  code_inline: { backgroundColor: Colors.stone100, color: Colors.orange, borderRadius: 4, paddingHorizontal: 4, fontSize: 12 },
};

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

  // Gate — two buttons side by side (matches web)
  gateCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 28, marginTop: 16,
    alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: Colors.stone200,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  gateLockIcon: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  gateTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone800, textAlign: "center" },
  gateSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  gateBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  gateBtnOutline: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 2, borderColor: "#FED7AA", borderRadius: 12,
    paddingVertical: 11, backgroundColor: Colors.white,
  },
  gateBtnOutlineText: { fontSize: 13, fontWeight: "700", color: Colors.orange },
  gateBtnFill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 11,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  gateBtnFillText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  // Input — matches web rounded-xl border-2 border-stone-200 bg-stone-50
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.stone50, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.stone800,
  },
  generateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.orange, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  generateBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  generateBtnText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  // Score summary — 3 cards matching web
  scoreGrid: { flexDirection: "row", gap: 8 },
  scoreCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.stone100,
    padding: 10, gap: 4,
  },
  scoreCardHeader: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  scoreCardLabel: { fontSize: 8, fontWeight: "600", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.3 },
  scoreBadgePill: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  scoreBadgePillText: { fontSize: 9, fontWeight: "800" },
  scoreCardValue: { fontSize: 12, fontWeight: "800", color: Colors.stone800 },
  scoreCardVerdict: { fontSize: 9, color: Colors.stone500, lineHeight: 13 },

  hintText: { fontSize: 12, color: Colors.stone400, lineHeight: 18 },

  // Loading — matches web orange-50 bg with steps
  loadingCard: {
    backgroundColor: "#FFF7ED", borderRadius: 16, padding: 18, gap: 12,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  loadingCardTitle: { fontSize: 10, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 1 },
  loadStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadStepDim: { opacity: 0.3 },
  loadStepIcon: {
    width: 20, height: 20, borderRadius: 99,
    borderWidth: 2, borderColor: Colors.stone200,
    alignItems: "center", justifyContent: "center",
  },
  loadStepDone: { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
  loadStepActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  loadStepText: { flex: 1, fontSize: 13, color: Colors.stone400 },
  loadStepTextActive: { color: Colors.stone700, fontWeight: "500" },

  // Result sections — collapsible like web
  resultWrap: { gap: 8 },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  providerBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0FDF4", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  providerText: { fontSize: 11, fontWeight: "600", color: Colors.emerald },
  providerFor: { fontSize: 11, color: Colors.stone400 },

  sectionCard: {
    backgroundColor: Colors.white, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.stone200,
  },
  sectionCardPriority: { borderColor: "#FDBA74", backgroundColor: "#FFFBF5" },
  sectionToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  sectionHeading: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.stone800, lineHeight: 18 },
  sectionToggleRight: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  copyReadyBadge: {
    backgroundColor: "#FFF7ED", borderRadius: 99,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  copyReadyText: { fontSize: 8, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 0.3 },
  sectionBody: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: Colors.stone50, borderRadius: 8, borderWidth: 1, borderColor: Colors.stone200,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  copyBtnText: { fontSize: 11, fontWeight: "600", color: Colors.stone400 },
});
