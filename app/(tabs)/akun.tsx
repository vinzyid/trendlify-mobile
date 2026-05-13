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

type MenuItem = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

export default function AkunScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  function handleComingSoon() {
    Alert.alert("Segera hadir!");
  }

  function handleLogout() {
    Alert.alert(
      "Keluar",
      "Apakah kamu yakin ingin keluar dari akun?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  }

  const menuItems: MenuItem[] = [
    {
      icon: "person-outline",
      label: "Profil Saya",
      onPress: () => router.push("/profile"),
    },
    {
      icon: "settings-outline",
      label: "Pengaturan",
      onPress: handleComingSoon,
    },
    {
      icon: "notifications-outline",
      label: "Notifikasi",
      onPress: handleComingSoon,
    },
    {
      icon: "card-outline",
      label: "Paket & Langganan",
      onPress: handleComingSoon,
    },
    {
      icon: "receipt-outline",
      label: "Riwayat Pembayaran",
      onPress: handleComingSoon,
    },
    {
      icon: "help-circle-outline",
      label: "Bantuan & FAQ",
      onPress: handleComingSoon,
    },
  ];

  const avatarLetter =
    user?.name?.charAt(0)?.toUpperCase() ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Orange header / profile section ── */}
        <View style={styles.profileHeader}>
          {isLoggedIn && user ? (
            <>
              {/* Avatar + edit row */}
              <View style={styles.profileTopRow}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  {avatarLetter ? (
                    <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                  ) : (
                    <Text style={styles.avatarEmoji}>👤</Text>
                  )}
                </View>

                {/* Name, badge, email */}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={10} color={Colors.amber} />
                    <Text style={styles.premiumBadgeText}>UMKM Premium</Text>
                  </View>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>

                {/* Edit chevron */}
                <TouchableOpacity onPress={() => router.push("/profile")} style={styles.editChevron}>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Not logged in state */
            <View style={styles.loginPrompt}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.loginPromptText}>
                Masuk untuk melanjutkan
              </Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={15} color={Colors.orange} />
                <Text style={styles.loginBtnText}>Masuk</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Premium upgrade card ── */}
        <View style={styles.upgradeCard}>
          <View style={styles.upgradeLeft}>
            <Ionicons name="trophy" size={24} color={Colors.amber} />
          </View>
          <View style={styles.upgradeMiddle}>
            <Text style={styles.upgradeTitle}>Upgrade ke Premium</Text>
            <Text style={styles.upgradeDesc} numberOfLines={2}>
              Dapatkan insight lebih dalam, prediksi lebih akurat, dan fitur
              eksklusif lainnya.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={handleComingSoon}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeBtnText}>Upgrade{"\n"}Sekarang →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Menu list ── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuRow,
                index === menuItems.length - 1 && styles.menuRowLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={Colors.stone600}
                />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.stone400}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Keluar button ── */}
        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, styles.logoutIconWrap]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            </View>
            <Text style={styles.logoutLabel}>Keluar</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.stone400} />
          </TouchableOpacity>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone100,
  },
  scroll: {
    paddingBottom: 32,
  },

  // ── Profile header ──
  profileHeader: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.orange,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
  profileEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  editChevron: {
    padding: 4,
  },

  // Not logged in
  loginPrompt: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  loginPromptText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.orange,
  },

  // ── Premium upgrade card ──
  upgradeCard: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    backgroundColor: "#1C1917",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  upgradeLeft: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeMiddle: {
    flex: 1,
    gap: 3,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.white,
  },
  upgradeDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 16,
  },
  upgradeBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  upgradeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    lineHeight: 16,
  },

  // ── Menu cards ──
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone100,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.stone100,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.stone800,
  },

  // ── Logout card ──
  logoutCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutIconWrap: {
    backgroundColor: "#FEF2F2",
  },
  logoutLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.red,
  },
});
