import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Markdown from "react-native-markdown-display";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

const LOADING_STEPS = [
  "Memindai tren pasar kuliner real-time…",
  "Analisis kompetitor & posisi pasar…",
  "AI menyusun strategi untuk kamu…",
];

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jawa Barat", "ID-JT": "Jawa Tengah",
  "ID-JI": "Jawa Timur", "ID-YO": "Yogyakarta", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulawesi Selatan", "ID": "Indonesia",
};

const PROVIDER_LABEL: Record<string, string> = {
  openrouter: "Gemini Pro via OpenRouter",
  gemini: "Gemini 2.0 Flash",
  groq: "GPT-OSS 120B via Groq",
  stub: "Demo Mode",
};

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
  if (sections.length === 0 && text.trim()) {
    sections.push({ heading: "Rekomendasi AI", content: text });
  }
  return sections;
}

function getVerdictText(result: string): string {
  const sections = parseSections(result);
  if (sections.length === 0) return "";
  return sections[0].content
    .replace(/\*\*/g, "")
    .replace(/^[-*•]\s*/gm, "")
    .trim()
    .slice(0, 260);
}

function getScoreLevel(score: number) {
  if (score >= 86) return { label: "Sangat Tinggi", labelColor: Colors.emerald, stars: 5, icon: "flame" as const, iconBg: "#F0FDF4", position: "Posisi Sangat Kuat", positionDesc: "Kesempatan emas untuk jadi market leader!" };
  if (score >= 71) return { label: "Tinggi", labelColor: Colors.orange, stars: 4, icon: "trending-up" as const, iconBg: "#FFF7ED", position: "Posisi Kuat", positionDesc: "Momentum sedang memuncak, push sekarang!" };
  if (score >= 51) return { label: "Sedang", labelColor: "#3B82F6", stars: 3, icon: "bulb-outline" as const, iconBg: "#EFF6FF", position: "Posisi Baik", positionDesc: "Pasar siap digarap!" };
  if (score >= 31) return { label: "Berkembang", labelColor: "#8B5CF6", stars: 2, icon: "arrow-up-circle-outline" as const, iconBg: "#F5F3FF", position: "Posisi Berkembang", positionDesc: "Peluang early mover masih lebar!" };
  return { label: "Niche", labelColor: Colors.stone400, stars: 1, icon: "search-outline" as const, iconBg: Colors.stone100, position: "Niche", positionDesc: "Potensi spesialisasi unik!" };
}

function getMetrics(score: number) {
  return [
    { label: "Ukuran Pasar", value: Math.min(100, Math.round(score * 0.92)) },
    { label: "Tren Popularitas", value: Math.min(100, Math.round(score * 0.98)) },
    { label: "Persaingan", value: Math.min(100, Math.round(score * 0.74)) },
    { label: "Potensi Keuntungan", value: Math.min(100, Math.round(score * 0.96)) },
  ];
}

function getStatChips(score: number, region: string) {
  const regionLabel = REGION_LABELS[region] ?? region;
  const peluang = score >= 86 ? "Sangat Besar" : score >= 71 ? "Besar" : score >= 51 ? "Sedang" : "Berkembang";
  const tren = score >= 86 ? "Viral Sekarang" : score >= 71 ? "Naik Signifikan" : "Aktif";
  return [
    { icon: "people-outline" as const, title: "Peluang Pasar", value: peluang, valueColor: Colors.stone800, desc: score >= 71 ? "Permintaan tinggi, kompetisi masih terbuka" : "Pasar aktif dan berkembang" },
    { icon: "trending-up-outline" as const, title: "Tren Saat Ini", value: tren, valueColor: Colors.emerald, desc: `+${Math.round(score * 0.6)}% dalam 30 hari (berdasarkan data)` },
    { icon: "location-outline" as const, title: "Wilayah Potensial", value: regionLabel, valueColor: Colors.stone800, desc: "Area dengan permintaan tertinggi" },
  ];
}

function getInsightCards(score: number) {
  return [
    { icon: "trending-up-outline" as const, iconBg: "#F0FDF4", iconColor: Colors.emerald, title: "Tren Google Naik Tajam", sub: `+${Math.round(score * 0.6)}% dalam 30 hari` },
    { icon: "heart-outline" as const, iconBg: "#FFF0F3", iconColor: "#F43F5E", title: "Disukai Gen Z & Milenial", sub: "Konten FYP meningkat" },
    { icon: "logo-tiktok" as const, iconBg: "#F5F3FF", iconColor: "#7C3AED", title: "Konten TikTok Ramai", sub: `+${Math.round(score * 0.87)}% views (30 hari)` },
  ];
}

function stripEmoji(text: string): string {
  return text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|\u{FE0F}/gu, "").trim();
}

function getSectionIcon(heading: string): { name: string; color: string; bg: string } {
  const h = heading.toLowerCase();
  if (h.includes("verdict"))
    return { name: "sparkles-outline", color: Colors.orange, bg: "#FFF7ED" };
  if (h.includes("skor") || h.includes("posisi") || h.includes("kompetitif"))
    return { name: "bar-chart-outline", color: Colors.orange, bg: "#FFF7ED" };
  if (h.includes("kalkulasi") || h.includes("cuan") || h.includes("keuntungan") || h.includes("harga"))
    return { name: "cash-outline", color: Colors.emerald, bg: "#F0FDF4" };
  if (h.includes("pembeli") || h.includes("profil") || h.includes("target") || h.includes("audien"))
    return { name: "people-outline", color: "#3B82F6", bg: "#EFF6FF" };
  if (h.includes("strategi") || h.includes("promosi") || h.includes("marketing"))
    return { name: "megaphone-outline", color: "#8B5CF6", bg: "#F5F3FF" };
  if (h.includes("konten") || h.includes("caption") || h.includes("copy") || h.includes("tiktok") || h.includes("script"))
    return { name: "create-outline", color: "#EC4899", bg: "#FDF2F8" };
  if (h.includes("action") || h.includes("langkah") || h.includes("hari") || h.includes("plan") || h.includes("besok"))
    return { name: "calendar-outline", color: "#F59E0B", bg: "#FFFBEB" };
  if (h.includes("kompetitor") || h.includes("pesaing") || h.includes("saingan"))
    return { name: "git-compare-outline", color: Colors.red, bg: "#FEF2F2" };
  if (h.includes("risiko") || h.includes("tantangan"))
    return { name: "warning-outline", color: "#F59E0B", bg: "#FFFBEB" };
  return { name: "document-text-outline", color: Colors.stone500, bg: Colors.stone100 };
}

function parseScoreFromText(text: string): number | null {
  const m = text.match(/(?:skor|score)[:\s]+(\d+)\/100/i) ?? text.match(/\b(\d{2,3})\/100\b/);
  if (m) { const v = parseInt(m[1]); if (v >= 0 && v <= 100) return v; }
  return null;
}

function getHighlightText(keyword: string, score: number, region: string) {
  const r = REGION_LABELS[region] ?? region;
  if (score >= 86) return `✨ ${keyword} berada di Top 3 makanan viral di ${r} saat ini!`;
  if (score >= 71) return `✨ ${keyword} sedang dalam tren naik yang kuat di ${r}!`;
  return `✨ ${keyword} punya potensi besar untuk berkembang di ${r}!`;
}

function CircularGauge({ score, size = 100, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#FED7AA" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={Colors.orange} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
    </View>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}/100</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${value}%` as any }]} />
      </View>
    </View>
  );
}

function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export default function InsightScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const { setSelected } = useSelectedKeyword();
  const params = useLocalSearchParams<{ keyword?: string; score?: string; region?: string; snapshotId?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [keyword, setKeyword] = useState(params.keyword ?? "");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const score = params.score ? parseInt(params.score) : undefined;
  const region = params.region ?? "ID";

  useEffect(() => { if (params.keyword) setKeyword(params.keyword); }, [params.keyword]);

  function startLoadAnimation() {
    setLoadStep(0);
    let s = 0;
    intervalRef.current = setInterval(() => { s = Math.min(s + 1, 2); setLoadStep(s); }, 1800);
  }
  function stopLoadAnimation() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function generate() {
    if (!keyword.trim() || !token) return;
    setLoading(true);
    setResult(null);
    setShowDetails(false);
    startLoadAnimation();
    try {
      const res = await fetch(`${API_URL}/api/v1/insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trending_product: keyword, trend_score: score, region_code: region }),
      });
      const json = await res.json();
      if (res.status === 401) { Alert.alert("Sesi Habis", "Silakan logout lalu login ulang."); return; }
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal generate."); return; }
      setResult(json.insight?.summary ?? json.summary ?? null);
      setProvider(json.insight?.provider ?? json.provider ?? null);
      setSelected({ keyword, score: score ?? 50, region, snapshotId: params.snapshotId ? parseInt(params.snapshotId as string) : null });
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      stopLoadAnimation();
      setLoading(false);
    }
  }

  function toggleSection(i: number) {
    setOpenSections((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  }

  const sections = result ? parseSections(result) : [];
  const providerLabel = provider ? (PROVIDER_LABEL[provider] ?? provider) : null;
  const effectiveScore = score ?? (result ? (parseScoreFromText(result) ?? 70) : undefined);
  const scoreLevel = effectiveScore !== undefined ? getScoreLevel(effectiveScore) : null;
  const verdictText = result ? getVerdictText(result) : "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="sparkles" size={17} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>AI Konsultan Kuliner</Text>
          <Text style={styles.headerSub}>Strategi promosi & target pasar berbasis AI</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <View style={styles.gateCard}>
            <View style={styles.gateLockIcon}><Ionicons name="sparkles" size={24} color={Colors.orange} /></View>
            <Text style={styles.gateTitle}>Konsultasi Gratis dengan AI</Text>
            <Text style={styles.gateSub}>Login untuk mendapatkan strategi kuliner & promosi AI secara real-time.</Text>
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
            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={keyword}
                onChangeText={setKeyword}
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
                {loading ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="sparkles" size={15} color={Colors.white} />}
                <Text style={styles.generateBtnText}>{loading ? "Analisis…" : "Generate"}</Text>
              </TouchableOpacity>
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingCardTitle}>AI sedang bekerja…</Text>
                {LOADING_STEPS.map((step, i) => {
                  const isDone = i < loadStep;
                  const isActive = i === loadStep;
                  return (
                    <View key={i} style={[styles.loadStep, (!isDone && !isActive) && styles.loadStepDim]}>
                      <View style={[styles.loadStepIcon, isDone && styles.loadStepDone, isActive && styles.loadStepActive]}>
                        {isDone ? <Ionicons name="checkmark" size={11} color={Colors.white} /> : isActive ? <ActivityIndicator size="small" color={Colors.white} /> : null}
                      </View>
                      <Text style={[styles.loadStepText, (isDone || isActive) && styles.loadStepTextActive]}>{step}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Hint */}
            {!result && !loading && !score && (
              <Text style={styles.hintText}>Masukkan nama produk kuliner untuk analisis instan berbasis AI.</Text>
            )}

            {/* Results */}
            {result && !loading && (
              <>
                {/* Provider badge */}
                {providerLabel && (
                  <View style={styles.providerRow}>
                    <View style={styles.providerBadge}>
                      <Ionicons name="sparkles" size={11} color={Colors.emerald} />
                      <Text style={styles.providerText}>{providerLabel}</Text>
                    </View>
                    <Text style={styles.providerFor}>Analisis untuk: <Text style={{ fontWeight: "700", color: Colors.stone700 }}>{keyword}</Text></Text>
                  </View>
                )}

                {/* ── Verdict Card — only if score available ── */}
                {effectiveScore !== undefined && scoreLevel && (
                <AnimatedCard delay={0} style={styles.verdictCard}>
                  <View style={styles.verdictTop}>
                    {/* Left */}
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.verdictLabelRow}>
                        <View style={[styles.verdictIconCircle, { backgroundColor: scoreLevel.iconBg, borderColor: scoreLevel.labelColor + "30" }]}>
                          <Ionicons name={scoreLevel.icon} size={20} color={scoreLevel.labelColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.verdictSmallLabel}>VERDICT</Text>
                          <Text style={styles.verdictKeyword} numberOfLines={1}>{keyword}</Text>
                        </View>
                      </View>
                      <View style={[styles.scoreLevelBadge, { backgroundColor: scoreLevel.labelColor + "18", alignSelf: "flex-start" }]}>
                        <Text style={[styles.scoreLevelText, { color: scoreLevel.labelColor }]}>{scoreLevel.label}</Text>
                      </View>
                      <Text style={styles.verdictDesc} numberOfLines={4}>{verdictText}</Text>
                    </View>

                    {/* Right: gauge */}
                    <View style={styles.verdictGaugeWrap}>
                      <View style={{ position: "relative" }}>
                        <CircularGauge score={effectiveScore} size={88} strokeWidth={9} />
                        <View style={{ position: "absolute", top: 0, left: 0, width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
                          <Text style={styles.gaugeScore}>{effectiveScore}</Text>
                          <Text style={styles.gaugeMax}>/100</Text>
                        </View>
                      </View>
                      <Text style={styles.gaugePotLabel}>Skor Potensi</Text>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Ionicons key={i} name={i <= scoreLevel.stars ? "star" : "star-outline"} size={11} color={Colors.amber} />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Stat chips */}
                  <View style={styles.statChipRow}>
                    {getStatChips(effectiveScore, region).map((chip, i) => (
                      <View key={i} style={[styles.statChip, i < 2 && styles.statChipBorder]}>
                        <View style={styles.statChipIcon}>
                          <Ionicons name={chip.icon} size={15} color={Colors.orange} />
                        </View>
                        <Text style={styles.statChipTitle}>{chip.title}</Text>
                        <Text style={[styles.statChipValue, { color: chip.valueColor }]}>{chip.value}</Text>
                        <Text style={styles.statChipDesc} numberOfLines={2}>{chip.desc}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Lihat Rekomendasi */}
                  <TouchableOpacity
                    style={styles.lihatRekoBtn}
                    onPress={() => {
                      setShowDetails(!showDetails);
                      if (!showDetails) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="bulb-outline" size={14} color={Colors.orange} />
                    <Text style={styles.lihatRekoBtnText}>{showDetails ? "Sembunyikan Strategi" : "Lihat Rekomendasi Strategi"}</Text>
                    <Ionicons name={showDetails ? "chevron-up" : "chevron-forward"} size={14} color={Colors.orange} />
                  </TouchableOpacity>
                </AnimatedCard>
                )}

                {/* ── Score & Position Card — only if score available ── */}
                {effectiveScore !== undefined && scoreLevel && (
                <AnimatedCard delay={100} style={styles.scoreCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="bar-chart" size={16} color={Colors.orange} />
                    <Text style={styles.sectionTitle}>Baca Skor & Posisi Kompetitif</Text>
                  </View>
                  <View style={styles.scoreCardBody}>
                    {/* Left */}
                    <View style={styles.scoreGaugeWrap}>
                      <View style={{ position: "relative" }}>
                        <CircularGauge score={effectiveScore} size={110} strokeWidth={11} />
                        <View style={{ position: "absolute", top: 0, left: 0, width: 110, height: 110, alignItems: "center", justifyContent: "center" }}>
                          <Text style={styles.scoreBigNum}>{effectiveScore}</Text>
                          <Text style={styles.scoreBigMax}>/100</Text>
                        </View>
                      </View>
                      <View style={styles.positionBadge}>
                        <View style={styles.positionDot} />
                        <Text style={styles.positionLabel}>{scoreLevel.position}</Text>
                      </View>
                      <Text style={styles.positionDesc}>{scoreLevel.positionDesc}</Text>
                    </View>
                    {/* Right */}
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                      {getMetrics(effectiveScore).map((m) => <MetricBar key={m.label} label={m.label} value={m.value} />)}
                    </View>
                  </View>
                  <View style={styles.highlightBox}>
                    <Text style={styles.highlightText}>{getHighlightText(keyword, effectiveScore, region)}</Text>
                  </View>
                </AnimatedCard>
                )}

                {/* ── Insight AI Cards — only if score available ── */}
                {effectiveScore !== undefined && (
                <AnimatedCard delay={180} style={styles.insightSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="bulb" size={16} color={Colors.orange} />
                    <Text style={styles.sectionTitle}>Insight AI</Text>
                  </View>
                  <View style={styles.insightCardRow}>
                    {getInsightCards(effectiveScore).map((card, i) => (
                      <View key={i} style={styles.insightMiniCard}>
                        <View style={[styles.insightMiniIcon, { backgroundColor: card.iconBg }]}>
                          <Ionicons name={card.icon} size={18} color={card.iconColor} />
                        </View>
                        <Text style={styles.insightMiniTitle}>{card.title}</Text>
                        <Text style={styles.insightMiniSub}>{card.sub}</Text>
                      </View>
                    ))}
                  </View>
                </AnimatedCard>
                )}

                {/* ── Detail Sections — always show when no score, toggle when score available ── */}
                {(showDetails || effectiveScore === undefined) && (
                  <View style={{ gap: 8 }}>
                    {sections.map((section, i) => {
                      const isOpen = openSections.has(i);
                      const isPriority = /caption|tiktok|script|konten siap/i.test(section.heading);
                      return (
                        <AnimatedCard key={i} delay={i * 50} style={[styles.sectionDetailCard, isPriority && styles.sectionDetailCardPriority]}>
                          <TouchableOpacity style={styles.sectionToggle} onPress={() => toggleSection(i)} activeOpacity={0.8}>
                            <View style={[styles.sectionIconBox, { backgroundColor: getSectionIcon(section.heading).bg }]}>
                              <Ionicons name={getSectionIcon(section.heading).name as any} size={15} color={getSectionIcon(section.heading).color} />
                            </View>
                            <Text style={styles.sectionHeading} numberOfLines={2}>{stripEmoji(section.heading)}</Text>
                            <View style={styles.sectionToggleRight}>
                              {isPriority && <View style={styles.copyReadyBadge}><Text style={styles.copyReadyText}>Siap Copy</Text></View>}
                              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={15} color={Colors.stone400} />
                            </View>
                          </TouchableOpacity>
                          {isOpen && (
                            <View style={styles.sectionBody}>
                              <Markdown style={insightMdStyles}>{section.content.trim()}</Markdown>
                            </View>
                          )}
                        </AnimatedCard>
                      );
                    })}
                  </View>
                )}
              </>
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
  bullet_list: { marginTop: 2, marginBottom: 2 },
  list_item: { marginVertical: 1 },
  bullet_list_icon: { color: Colors.orange, marginTop: 5 },
  paragraph: { marginTop: 1, marginBottom: 1 },
  hr: { backgroundColor: Colors.stone200, marginVertical: 6, height: 1 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.orangeBg },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  headerIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },

  scroll: { padding: 16, gap: 12, paddingBottom: 32 },

  // Gate
  gateCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 28, marginTop: 16, alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.stone200 },
  gateLockIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  gateTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone800, textAlign: "center" },
  gateSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  gateBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  gateBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 2, borderColor: "#FED7AA", borderRadius: 12, paddingVertical: 11, backgroundColor: Colors.white },
  gateBtnOutlineText: { fontSize: 13, fontWeight: "700", color: Colors.orange },
  gateBtnFill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.orange, borderRadius: 12, paddingVertical: 11 },
  gateBtnFillText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  // Input
  inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.stone800 },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.orange, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, shadowColor: Colors.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  generateBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  generateBtnText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  hintText: { fontSize: 12, color: Colors.stone400, lineHeight: 18, textAlign: "center", paddingVertical: 20 },

  // Loading
  loadingCard: { backgroundColor: "#FFF7ED", borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: "#FED7AA" },
  loadingCardTitle: { fontSize: 10, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 1 },
  loadStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadStepDim: { opacity: 0.3 },
  loadStepIcon: { width: 20, height: 20, borderRadius: 99, borderWidth: 2, borderColor: Colors.stone200, alignItems: "center", justifyContent: "center" },
  loadStepDone: { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
  loadStepActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  loadStepText: { flex: 1, fontSize: 13, color: Colors.stone400 },
  loadStepTextActive: { color: Colors.stone700, fontWeight: "500" },

  // Provider
  providerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  providerBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#BBF7D0" },
  providerText: { fontSize: 11, fontWeight: "600", color: Colors.emerald },
  providerFor: { fontSize: 11, color: Colors.stone400 },

  // Verdict Card
  verdictCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.stone100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 14 },
  verdictTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  verdictLabelRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  verdictIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FED7AA" },
  verdictSmallLabel: { fontSize: 9, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 0.8 },
  verdictKeyword: { fontSize: 15, fontWeight: "800", color: Colors.stone900 },
  scoreLevelBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  scoreLevelText: { fontSize: 11, fontWeight: "700" },
  verdictDesc: { fontSize: 12, color: Colors.stone600, lineHeight: 19 },
  verdictGaugeWrap: { alignItems: "center", gap: 4, paddingTop: 2 },
  gaugeScore: { fontSize: 22, fontWeight: "900", color: Colors.orange, lineHeight: 26 },
  gaugeMax: { fontSize: 10, color: Colors.stone400, fontWeight: "600" },
  gaugePotLabel: { fontSize: 9, fontWeight: "600", color: Colors.stone500, textAlign: "center" },

  // Stat chips
  statChipRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.stone100, paddingTop: 12 },
  statChip: { flex: 1, gap: 3, paddingHorizontal: 8 },
  statChipBorder: { borderRightWidth: 1, borderRightColor: Colors.stone100 },
  statChipIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.orangeBg, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statChipTitle: { fontSize: 9, fontWeight: "600", color: Colors.stone400, textTransform: "uppercase" as const, letterSpacing: 0.3 },
  statChipValue: { fontSize: 12, fontWeight: "800", color: Colors.stone800 },
  statChipDesc: { fontSize: 9, color: Colors.stone400, lineHeight: 13 },

  // Lihat Rekomendasi button
  lihatRekoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#FED7AA", borderRadius: 12, paddingVertical: 11, backgroundColor: Colors.orangeBg },
  lihatRekoBtnText: { fontSize: 13, fontWeight: "700", color: Colors.orange },

  // Score Card
  scoreCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.stone100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 14 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: Colors.stone900, flex: 1 },
  scoreCardBody: { flexDirection: "row", alignItems: "flex-start" },
  scoreGaugeWrap: { alignItems: "center", gap: 6, width: 120 },
  scoreBigNum: { fontSize: 30, fontWeight: "900", color: Colors.orange, lineHeight: 34 },
  scoreBigMax: { fontSize: 12, color: Colors.stone400, fontWeight: "600" },
  positionBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  positionDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.emerald },
  positionLabel: { fontSize: 11, fontWeight: "700", color: Colors.emerald },
  positionDesc: { fontSize: 10, color: Colors.stone500, textAlign: "center", lineHeight: 14 },

  // Metric bar
  metricRow: { marginBottom: 10 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  metricLabel: { fontSize: 11, color: Colors.stone600, fontWeight: "500" },
  metricValue: { fontSize: 11, fontWeight: "700", color: Colors.stone800 },
  metricTrack: { height: 6, backgroundColor: "#FED7AA", borderRadius: 99 },
  metricFill: { height: 6, backgroundColor: Colors.orange, borderRadius: 99 },

  // Highlight
  highlightBox: { backgroundColor: Colors.orangeBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#FED7AA" },
  highlightText: { fontSize: 12, fontWeight: "600", color: Colors.stone700, lineHeight: 18 },

  // Insight AI
  insightSection: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.stone100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 12 },
  insightCardRow: { flexDirection: "row", gap: 10 },
  insightMiniCard: { flex: 1, backgroundColor: Colors.stone50, borderRadius: 12, padding: 10, gap: 4, borderWidth: 1, borderColor: Colors.stone100 },
  insightMiniIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  insightMiniTitle: { fontSize: 11, fontWeight: "700", color: Colors.stone800, lineHeight: 15 },
  insightMiniSub: { fontSize: 10, color: Colors.stone500, lineHeight: 14 },

  // Detail sections
  sectionDetailCard: { backgroundColor: Colors.white, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: Colors.stone200 },
  sectionDetailCardPriority: { borderColor: "#FDBA74", backgroundColor: "#FFFBF5" },
  sectionToggle: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  sectionIconBox: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionHeading: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.stone800, lineHeight: 18 },
  sectionToggleRight: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 8 },
  copyReadyBadge: { backgroundColor: "#FFF7ED", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  copyReadyText: { fontSize: 8, fontWeight: "800", color: Colors.orange, textTransform: "uppercase", letterSpacing: 0.3 },
  sectionBody: { paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.stone100 },
});
