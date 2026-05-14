import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Snapshot = {
  id: number;
  entity_label: string;
  trend_score: number;
  prev_score: number | null;
  region_code: string;
};

const REGION_LABELS: Record<string, string> = {
  "ID-JK": "Jakarta", "ID-JB": "Jawa Barat", "ID-JT": "Jawa Tengah",
  "ID-JI": "Jawa Timur", "ID-YO": "Yogyakarta", "ID-BT": "Banten",
  "ID-BL": "Bali", "ID-SN": "Sulawesi Selatan",
};

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
  if (n.includes("seblak") || n.includes("pedas")) return "🌶️";
  if (n.includes("es ") || n.includes("ice")) return "🧊";
  if (n.includes("rendang") || n.includes("gulai")) return "🥘";
  return "🍽️";
}

function getScoreColor(score: number) {
  if (score >= 80) return "#DC2626";
  if (score >= 65) return Colors.orange;
  if (score >= 45) return Colors.emerald;
  return Colors.stone400;
}

function getScoreLabel(score: number) {
  if (score >= 80) return "VIRAL";
  if (score >= 65) return "HOT";
  if (score >= 45) return "AKTIF";
  return "NICHE";
}

export default function SearchScreen() {
  const router = useRouter();
  const { setSelected } = useSelectedKeyword();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [allTrends, setAllTrends] = useState<Snapshot[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/trends?limit=100`)
      .then(r => r.json())
      .then(j => setAllTrends(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingTrends(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const filtered = query.trim().length === 0
    ? allTrends.slice(0, 20)
    : allTrends.filter(t =>
        t.entity_label.toLowerCase().includes(query.toLowerCase())
      );

  const isCustomKeyword = query.trim().length > 0 &&
    !allTrends.some(t => t.entity_label.toLowerCase() === query.toLowerCase().trim());

  function goToInsight(keyword: string, snapshot?: Snapshot) {
    if (snapshot) {
      setSelected({ keyword: snapshot.entity_label, score: snapshot.trend_score, region: snapshot.region_code, snapshotId: snapshot.id });
      router.push({
        pathname: "/(tabs)/insight",
        params: { keyword: snapshot.entity_label, score: snapshot.trend_score, region: snapshot.region_code },
      });
    } else {
      setSelected({ keyword, score: 50, region: "ID", snapshotId: null });
      router.push({ pathname: "/(tabs)/insight", params: { keyword } });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.stone700} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={Colors.stone400} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Cari atau ketik nama kuliner..."
            placeholderTextColor={Colors.stone300}
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && goToInsight(query.trim())}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.stone300} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* AI CTA — muncul kalau keyword tidak ada di database */}
      {isCustomKeyword && (
        <TouchableOpacity
          style={styles.aiCTA}
          onPress={() => goToInsight(query.trim())}
          activeOpacity={0.85}
        >
          <View style={styles.aiCTALeft}>
            <Ionicons name="sparkles" size={18} color={Colors.orange} />
            <View style={{ gap: 2 }}>
              <Text style={styles.aiCTATitle}>Analisis "{query.trim()}" dengan AI</Text>
              <Text style={styles.aiCTASub}>Dapatkan insight mendalam dari Trendlify AI</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={Colors.orange} />
        </TouchableOpacity>
      )}

      {loadingTrends ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.orange} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {query.trim()
                ? `${filtered.length} hasil untuk "${query}"`
                : "Tren Populer"}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={36} color={Colors.stone300} />
              <Text style={styles.emptyTitle}>Tidak ditemukan di database</Text>
              <Text style={styles.emptySub}>Coba analisis langsung dengan AI</Text>
              <TouchableOpacity
                style={styles.emptyAIBtn}
                onPress={() => goToInsight(query.trim())}
              >
                <Ionicons name="sparkles-outline" size={15} color={Colors.white} />
                <Text style={styles.emptyAIBtnText}>Analisis dengan AI</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const scoreColor = getScoreColor(item.trend_score);
            const delta = item.prev_score !== null ? item.trend_score - item.prev_score : null;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => goToInsight(item.entity_label, item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardEmoji}>
                  <Text style={{ fontSize: 20 }}>{getFoodEmoji(item.entity_label)}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.cardName}>{item.entity_label}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "18" }]}>
                      <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
                        {getScoreLabel(item.trend_score)}
                      </Text>
                    </View>
                    <Text style={styles.regionText}>
                      {REGION_LABELS[item.region_code] ?? item.region_code}
                    </Text>
                    {delta !== null && delta !== 0 && (
                      <Text style={[styles.deltaText, { color: delta > 0 ? Colors.emerald : Colors.red }]}>
                        {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.scoreNum, { color: scoreColor }]}>{item.trend_score}</Text>
                  <Ionicons name="sparkles-outline" size={14} color={Colors.stone300} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.stone100,
    alignItems: "center", justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.stone100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: Colors.stone800 },

  aiCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 12,
    backgroundColor: Colors.orangeBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
  },
  aiCTALeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiCTATitle: { fontSize: 13, fontWeight: "700", color: Colors.stone800 },
  aiCTASub: { fontSize: 11, color: Colors.stone500 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  list: { padding: 12, gap: 8, paddingBottom: 32 },
  listHeader: {
    fontSize: 11, fontWeight: "700", color: Colors.stone400,
    letterSpacing: 0.5, marginBottom: 6, marginLeft: 2,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.stone100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardEmoji: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#FED7AA",
  },
  cardName: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  scoreBadgeText: { fontSize: 9, fontWeight: "800" },
  regionText: { fontSize: 10, color: Colors.stone400 },
  deltaText: { fontSize: 10, fontWeight: "700" },

  cardRight: { alignItems: "center", gap: 4 },
  scoreNum: { fontSize: 18, fontWeight: "900" },

  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: Colors.stone600 },
  emptySub: { fontSize: 12, color: Colors.stone400 },
  emptyAIBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11, marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyAIBtnText: { color: Colors.white, fontWeight: "800", fontSize: 13 },
});
