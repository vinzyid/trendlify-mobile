import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";

type SettingItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  value?: string;
  route?: string;
  danger?: boolean;
};

const AKUN_ITEMS: SettingItem[] = [
  {
    icon: "person-outline",
    iconBg: "#FFF0E6",
    iconColor: Colors.orange,
    label: "Informasi Akun",
    sub: "Lihat dan ubah informasi profil kamu",
    route: "/profile",
  },
  {
    icon: "lock-closed-outline",
    iconBg: "#FFF0E6",
    iconColor: Colors.orange,
    label: "Ubah Password",
    sub: "Perbarui password akun kamu",
    route: "/change-password",
  },
  {
    icon: "shield-checkmark-outline",
    iconBg: "#FFF0E6",
    iconColor: Colors.orange,
    label: "Keamanan Akun",
    sub: "Kelola keamanan dan aktivitas login",
  },
];

const PREFERENSI_ITEMS: SettingItem[] = [
  {
    icon: "heart-outline",
    iconBg: "#FFF0F3",
    iconColor: "#F43F5E",
    label: "Kategori Favorit",
    sub: "Pilih kategori kuliner yang kamu minati",
  },
  {
    icon: "location-outline",
    iconBg: "#F0FDF4",
    iconColor: Colors.emerald,
    label: "Lokasi Trend",
    sub: "Atur lokasi untuk rekomendasi tren",
    value: "Jakarta",
  },
  {
    icon: "notifications-outline",
    iconBg: "#F5F3FF",
    iconColor: "#8B5CF6",
    label: "Notifikasi",
    sub: "Atur jenis notifikasi yang kamu terima",
    route: "/notifications",
  },
  {
    icon: "globe-outline",
    iconBg: "#EFF6FF",
    iconColor: "#3B82F6",
    label: "Bahasa",
    sub: "Pilih bahasa yang kamu gunakan",
    value: "Bahasa Indonesia",
  },
];

const LAINNYA_ITEMS: SettingItem[] = [
  {
    icon: "help-circle-outline",
    iconBg: "#FFFBEB",
    iconColor: "#F59E0B",
    label: "Bantuan & FAQ",
    sub: "Pusat bantuan dan pertanyaan umum",
    route: "/bantuan",
  },
  {
    icon: "document-text-outline",
    iconBg: "#F0FDF4",
    iconColor: Colors.emerald,
    label: "Privasi & Keamanan",
    sub: "Kebijakan privasi dan keamanan data",
  },
  {
    icon: "information-circle-outline",
    iconBg: "#EFF6FF",
    iconColor: "#3B82F6",
    label: "Tentang Trendlify",
    sub: "Informasi aplikasi dan versi terbaru",
  },
];

export default function AkunScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null);

  function handleComingSoon(label: string) {
    setComingSoonLabel(label);
  }

  async function confirmLogout() {
    setShowLogoutModal(false);
    await logout();
    router.replace("/login");
  }

  function handlePress(item: SettingItem) {
    if (item.route) {
      router.push(item.route as any);
    } else {
      handleComingSoon(item.label);
    }
  }

  function SettingRow({ item, isLast }: { item: SettingItem; isLast: boolean }) {
    return (
      <TouchableOpacity
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.rowIcon, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowSub}>{item.sub}</Text>
        </View>
        {item.value ? (
          <Text style={styles.rowValue}>{item.value}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.stone300} />
      </TouchableOpacity>
    );
  }

  const initials = (user?.name ?? "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Top bar */}
        <View style={styles.headerTop}>
          <Text style={styles.headerLabel}>Pengaturan</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/profile")}>
            <Ionicons name="create-outline" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? "Pengguna"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ""}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="storefront-outline" size={11} color={Colors.orange} />
              <Text style={styles.roleText}>UMKM Kuliner</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── AKUN ── */}
        <Text style={styles.sectionLabel}>AKUN</Text>
        <View style={styles.card}>
          {AKUN_ITEMS.map((item, i) => (
            <SettingRow key={item.label} item={item} isLast={i === AKUN_ITEMS.length - 1} />
          ))}
        </View>

        {/* ── PREFERENSI ── */}
        <Text style={styles.sectionLabel}>PREFERENSI</Text>
        <View style={styles.card}>
          {PREFERENSI_ITEMS.map((item, i) => (
            <SettingRow key={item.label} item={item} isLast={i === PREFERENSI_ITEMS.length - 1} />
          ))}
        </View>

        {/* ── LAINNYA ── */}
        <Text style={styles.sectionLabel}>LAINNYA</Text>
        <View style={styles.card}>
          {LAINNYA_ITEMS.map((item, i) => (
            <SettingRow key={item.label} item={item} isLast={i === LAINNYA_ITEMS.length - 1} />
          ))}
        </View>

        {/* ── Keluar ── */}
        <TouchableOpacity style={styles.logoutCard} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: "#FEF2F2" }]}>
            <Ionicons name="exit-outline" size={18} color={Colors.red} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.logoutLabel}>Keluar dari Akun</Text>
            <Text style={styles.rowSub}>Logout dari akun kamu saat ini</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.stone300} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Coming Soon Modal ── */}
      <Modal
        visible={comingSoonLabel !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonLabel(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setComingSoonLabel(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />

            {/* Rocket icon with decorative dots */}
            <View style={styles.csIconArea}>
              <View style={styles.csDot1} />
              <View style={styles.csDot2} />
              <View style={styles.csIconWrap}>
                <Ionicons name="construct-outline" size={30} color={Colors.orange} />
              </View>
            </View>

            <Text style={styles.csTag}>SEGERA HADIR</Text>
            <Text style={styles.modalTitle}>{comingSoonLabel}</Text>
            <Text style={styles.modalSub}>
              Fitur ini sedang dalam pengembangan dan akan segera tersedia. Nantikan pembaruan berikutnya!
            </Text>

            {/* Progress bar decoration */}
            <View style={styles.csProgress}>
              <View style={styles.csProgressFill} />
            </View>
            <Text style={styles.csProgressLabel}>Dalam pengembangan…</Text>

            <TouchableOpacity
              style={styles.csBtnClose}
              onPress={() => setComingSoonLabel(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.csBtnCloseText}>Oke, Mengerti!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Icon */}
            <View style={styles.modalIconWrap}>
              <Ionicons name="exit-outline" size={28} color={Colors.red} />
            </View>

            {/* Text */}
            <Text style={styles.modalTitle}>Keluar dari Akun?</Text>
            <Text style={styles.modalSub}>
              Sesi kamu akan diakhiri dan kamu perlu login ulang untuk mengakses Trendlify.
            </Text>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnLogout}
                onPress={confirmLogout}
                activeOpacity={0.85}
              >
                <Ionicons name="exit-outline" size={16} color={Colors.white} />
                <Text style={styles.modalBtnLogoutText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  // ── Header ──
  header: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.white,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.orange,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 6 },

  // ── Section label ──
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.stone400,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Row ──
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: Colors.stone800 },
  rowSub: { fontSize: 12, color: Colors.stone400 },
  rowValue: { fontSize: 13, fontWeight: "600", color: Colors.orange, marginRight: 4 },

  // ── Logout ──
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutLabel: { fontSize: 14, fontWeight: "700", color: Colors.red },

  // ── Coming Soon Modal ──
  csIconArea: {
    position: "relative",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  csDot1: {
    position: "absolute",
    top: 4,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 99,
    backgroundColor: "#FED7AA",
  },
  csDot2: {
    position: "absolute",
    bottom: 6,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#FDBA74",
  },
  csIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.orangeBg,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
  csTag: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.orange,
    letterSpacing: 1.2,
    backgroundColor: Colors.orangeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    overflow: "hidden",
  },
  csProgress: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.stone100,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 4,
  },
  csProgressFill: {
    width: "65%",
    height: "100%",
    backgroundColor: Colors.orange,
    borderRadius: 99,
  },
  csProgressLabel: {
    fontSize: 11,
    color: Colors.stone400,
    fontWeight: "600",
    marginTop: -4,
    marginBottom: 4,
  },
  csBtnClose: {
    width: "100%",
    backgroundColor: Colors.orange,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  csBtnCloseText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.white,
  },

  // ── Logout Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: "center",
    gap: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: Colors.stone200,
    marginBottom: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.stone900,
    textAlign: "center",
  },
  modalSub: {
    fontSize: 13,
    color: Colors.stone500,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.stone200,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.stone600,
  },
  modalBtnLogout: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.red,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnLogoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.white,
  },
});
