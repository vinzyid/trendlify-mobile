import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

type Notification = {
  id: number;
  title: string;
  body: string;
  time: string;
  type: "trend" | "system" | "promo";
  isRead: boolean;
};

const MOCK_NOTIFS: Notification[] = [
  {
    id: 1,
    title: "🔥 Tren Baru Terdeteksi!",
    body: "Produk 'Seblak Instan' sedang naik daun di Jakarta Pusat.",
    time: "2 jam yang lalu",
    type: "trend",
    isRead: false,
  },
  {
    id: 2,
    title: "📈 Prediksi Akurat",
    body: "Prediksi kamu untuk 'Kopi Gula Aren' mencapai akurasi 92%.",
    time: "5 jam yang lalu",
    type: "system",
    isRead: false,
  },
  {
    id: 3,
    title: "💡 Tips UMKM Hari Ini",
    body: "Produk dengan skor tren di atas 70 ideal untuk dijadikan menu andalan minggu ini.",
    time: "1 hari yang lalu",
    type: "tip",
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.stone800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <TouchableOpacity>
          <Text style={styles.markRead}>Baca Semua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_NOTIFS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.notifItem, !item.isRead && styles.unreadItem]}
          >
            <View style={[styles.iconWrap, { backgroundColor: getIconBg(item.type) }]}>
              <Ionicons name={getIcon(item.type) as any} size={20} color={getIconColor(item.type)} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifTop}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              <Text style={styles.notifBody}>{item.body}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "trend": return "flame";
    case "promo": return "gift";
    default: return "notifications";
  }
}

function getIconBg(type: string) {
  switch (type) {
    case "trend": return "#FEF2F2";
    case "promo": return "#F5F3FF";
    default: return "#EFF6FF";
  }
}

function getIconColor(type: string) {
  switch (type) {
    case "trend": return Colors.red;
    case "promo": return "#8B5CF6";
    default: return "#3B82F6";
  }
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
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.stone900 },
  markRead: { fontSize: 12, color: Colors.orange, fontWeight: "600" },
  list: { paddingBottom: 20 },
  notifItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone50,
    gap: 14,
    alignItems: "center",
  },
  unreadItem: { backgroundColor: "#FFFBF5" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: { flex: 1, gap: 4 },
  notifTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifTitle: { fontSize: 14, fontWeight: "700", color: Colors.stone900 },
  notifTime: { fontSize: 10, color: Colors.stone400 },
  notifBody: { fontSize: 13, color: Colors.stone500, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.orange },
});
