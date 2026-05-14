import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
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

  function handleComingSoon() {
    Alert.alert("Segera hadir!", "Fitur ini sedang dalam pengembangan.");
  }

  function handleLogout() {
    Alert.alert("Keluar dari Akun", "Apakah kamu yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: () => logout() },
    ]);
  }

  function handlePress(item: SettingItem) {
    if (item.route) {
      router.push(item.route as any);
    } else {
      handleComingSoon();
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(tabs)/index")}>
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.7}>
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
});
