import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";
import { useSelectedKeyword } from "@/contexts/SelectedKeywordContext";

type Trend = {
  id: number;
  entity_label: string;
  trend_score: number;
  region_code: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const { setSelected } = useSelectedKeyword();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchTrends();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  async function searchTrends() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/trends?search=${query}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data ?? []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  function goToInsight(t: Trend) {
    setSelected({ 
      keyword: t.entity_label, 
      score: t.trend_score, 
      region: t.region_code, 
      snapshotId: t.id 
    });
    router.push({
      pathname: "/(tabs)/insight",
      params: { 
        keyword: t.entity_label, 
        score: t.trend_score, 
        region: t.region_code, 
        snapshotId: t.id 
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.stone800} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.stone400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tren kuliner..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.stone400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => goToInsight(item)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="trending-up" size={18} color={Colors.orange} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.entity_label}</Text>
                <Text style={styles.resultRegion}>{item.region_code}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{item.trend_score}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.stone300} />
            </TouchableOpacity>
          )}
        />
      ) : query.length >= 2 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color={Colors.stone200} />
          <Text style={styles.emptyText}>Tidak ada hasil untuk "{query}"</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="restaurant-outline" size={48} color={Colors.stone100} />
          <Text style={styles.hintText}>Ketik minimal 2 karakter untuk mencari</Text>
        </View>
      )}
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
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.stone100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.stone800 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  list: { padding: 16 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone50,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: "700", color: Colors.stone800 },
  resultRegion: { fontSize: 12, color: Colors.stone400 },
  scoreBadge: {
    backgroundColor: Colors.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: { fontSize: 14, fontWeight: "800", color: Colors.orange },
  emptyText: { marginTop: 12, fontSize: 16, color: Colors.stone500, textAlign: "center" },
  hintText: { marginTop: 12, fontSize: 14, color: Colors.stone400, textAlign: "center" },
});
