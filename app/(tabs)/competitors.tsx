import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, StyleSheet, Alert, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Competitor = {
  id: number;
  competitor_name: string;
  channel: string | null;
  notes: string | null;
  created_at: string;
};

const CHANNELS = ["TikTok", "Instagram", "GoFood", "GrabFood", "ShopeeFood", "Tokopedia", "WhatsApp", "Lainnya"];

const CHANNEL_ICONS: Record<string, string> = {
  TikTok: "logo-tiktok",
  Instagram: "logo-instagram",
  GoFood: "fast-food-outline",
  GrabFood: "bicycle-outline",
  ShopeeFood: "storefront-outline",
  Tokopedia: "cart-outline",
  WhatsApp: "chatbubble-ellipses-outline",
  Lainnya: "ellipsis-horizontal-outline",
};

export default function CompetitorsScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [notes, setNotes] = useState("");

  const fetchCompetitors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/competitors`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        setCompetitors(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (isLoggedIn) fetchCompetitors(); }, [isLoggedIn, fetchCompetitors]);

  async function handleAdd() {
    if (!token || !name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ competitor_name: name.trim(), channel: channel || null, notes: notes.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert("Error", json.message ?? "Gagal."); return; }
      if (json.data) setCompetitors((p) => [json.data, ...p]);
      setName(""); setChannel(""); setNotes("");
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    Alert.alert("Hapus Pesaing", "Yakin hapus dari watchlist?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive",
        onPress: async () => {
          setDeleting(id);
          await fetch(`${API_URL}/api/v1/competitors/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token ?? ""}` },
          });
          setCompetitors((p) => p.filter((c) => c.id !== id));
          setDeleting(null);
        },
      },
    ]);
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIconBox}>
            <Ionicons name="eye" size={17} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Competitor Watchlist</Text>
            <Text style={styles.headerSub}>Pantau pesaing kuliner kamu</Text>
          </View>
        </View>
        <View style={styles.gateCard}>
          <View style={styles.gateLockIcon}>
            <Ionicons name="lock-closed" size={28} color={Colors.orange} />
          </View>
          <Text style={styles.gateTitle}>Login diperlukan</Text>
          <Text style={styles.gateSub}>Masuk untuk mengelola dan memantau pesaing kuliner kamu</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/login")}>
            <Ionicons name="log-in-outline" size={16} color={Colors.white} />
            <Text style={styles.gateBtnText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Ionicons name="eye" size={17} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Competitor Watchlist</Text>
          <Text style={styles.headerSub}>Pantau pesaing kuliner kamu</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Count bar */}
      {competitors.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>{competitors.length} pesaing dipantau</Text>
          <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle-outline" size={14} color={Colors.orange} />
            <Text style={styles.addSmallText}>Tambah</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.orange} size="large" />
          <Text style={styles.loadingText}>Memuat daftar pesaing…</Text>
        </View>
      ) : competitors.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="people-outline" size={36} color={Colors.stone300} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada pesaing</Text>
          <Text style={styles.emptySub}>Tambahkan pesaing kuliner yang ingin kamu pantau perkembangannya</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.white} />
            <Text style={styles.gateBtnText}>Tambah Sekarang</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={competitors}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: c, index }) => (
            <View style={[styles.competitorCard, index === competitors.length - 1 && styles.competitorCardLast]}>
              {/* Avatar */}
              <View style={styles.competitorAvatar}>
                <Text style={styles.competitorAvatarText}>{c.competitor_name.charAt(0).toUpperCase()}</Text>
              </View>

              {/* Info */}
              <View style={styles.competitorInfo}>
                <Text style={styles.competitorName}>{c.competitor_name}</Text>
                {c.channel && (
                  <View style={styles.channelBadge}>
                    <Ionicons
                      name={(CHANNEL_ICONS[c.channel] ?? "storefront-outline") as any}
                      size={10}
                      color={Colors.orange}
                    />
                    <Text style={styles.channelText}>{c.channel}</Text>
                  </View>
                )}
                {c.notes && (
                  <Text style={styles.competitorNotes} numberOfLines={1}>{c.notes}</Text>
                )}
              </View>

              {/* Delete */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(c.id)}
                disabled={deleting === c.id}
              >
                {deleting === c.id
                  ? <ActivityIndicator size="small" color={Colors.red} />
                  : <Ionicons name="trash-outline" size={15} color={Colors.red} />
                }
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tambah Pesaing</Text>
              <Text style={styles.modalSub}>Pantau kompetitor kuliner kamu</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={20} color={Colors.stone500} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nama Pesaing <Text style={{ color: Colors.orange }}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="cth: Warung Pak Budi"
                placeholderTextColor={Colors.stone400}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Platform</Text>
              <View style={styles.channelGrid}>
                {CHANNELS.map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.channelOpt, channel === ch && styles.channelOptActive]}
                    onPress={() => setChannel(channel === ch ? "" : ch)}
                  >
                    <Ionicons
                      name={(CHANNEL_ICONS[ch] ?? "storefront-outline") as any}
                      size={12}
                      color={channel === ch ? Colors.orange : Colors.stone400}
                    />
                    <Text style={[styles.channelOptText, channel === ch && styles.channelOptTextActive]}>{ch}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Catatan</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={notes}
                onChangeText={setNotes}
                placeholder="cth: viral TikTok, harga lebih murah, buka 24 jam"
                placeholderTextColor={Colors.stone400}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (!name.trim() || submitting) && styles.saveBtnDisabled]}
              onPress={handleAdd}
              disabled={!name.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={17} color={Colors.white} />
                    <Text style={styles.saveBtnText}>Simpan Pesaing</Text>
                  </>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addHeaderBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },

  // Count bar
  countBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  countText: { fontSize: 12, fontWeight: "600", color: Colors.stone500 },
  addSmallBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  addSmallText: { fontSize: 12, fontWeight: "700", color: Colors.orange },

  // Loading
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: Colors.stone400 },

  // Gate
  gateCard: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12,
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

  // Empty state
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.stone50,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: Colors.stone700 },
  emptySub: { fontSize: 13, color: Colors.stone400, textAlign: "center", lineHeight: 20 },

  // List
  list: { padding: 16, paddingBottom: 28 },
  competitorCard: {
    backgroundColor: Colors.white, borderRadius: 0,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  competitorCardLast: { borderBottomWidth: 0 },
  competitorAvatar: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.orangeBg,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FED7AA",
  },
  competitorAvatarText: { fontSize: 17, fontWeight: "900", color: Colors.orange },
  competitorInfo: { flex: 1, gap: 4 },
  competitorName: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },
  channelBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", backgroundColor: Colors.orangeBg,
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#FED7AA",
  },
  channelText: { fontSize: 10, fontWeight: "700", color: Colors.orange },
  competitorNotes: { fontSize: 12, color: Colors.stone400 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2",
    alignItems: "center", justifyContent: "center",
  },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    padding: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  modalTitle: { fontSize: 17, fontWeight: "900", color: Colors.stone800 },
  modalSub: { fontSize: 12, color: Colors.stone400, marginTop: 2 },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 99, backgroundColor: Colors.stone100,
    alignItems: "center", justifyContent: "center",
  },
  modalBody: { padding: 20, gap: 4, paddingBottom: 40 },
  fieldGroup: { gap: 8, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: Colors.stone700 },
  input: {
    backgroundColor: Colors.stone50, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.stone800,
  },
  inputMultiline: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  channelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  channelOpt: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.stone200,
    paddingHorizontal: 11, paddingVertical: 7, backgroundColor: Colors.white,
  },
  channelOptActive: { borderColor: Colors.orange, backgroundColor: Colors.orangeBg },
  channelOptText: { fontSize: 12, fontWeight: "600", color: Colors.stone500 },
  channelOptTextActive: { color: Colors.orange },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 14, marginTop: 12,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  saveBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },
});
