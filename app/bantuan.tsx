import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

const BG = "#FFF5EB";

type FAQItem = { q: string; a: string };
type FAQGroup = {
  key: string;
  category: string;
  icon: string;
  color: string;
  items: FAQItem[];
};

const FAQ_DATA: FAQGroup[] = [
  {
    key: "tentang",
    category: "Tentang Trendlify",
    icon: "information-circle-outline",
    color: Colors.orange,
    items: [
      {
        q: "Apa itu Trendlify?",
        a: "Trendlify adalah platform analitik kuliner berbasis AI khusus untuk UMKM Indonesia. Aplikasi ini membantu kamu memantau tren kuliner secara real-time, mendapatkan rekomendasi strategi promosi, dan memprediksi peluang produk sebelum pesaing bergerak.",
      },
      {
        q: "Apakah Trendlify gratis?",
        a: "Ya, Trendlify sepenuhnya gratis. Semua fitur — AI Konsultan, Prediksi Tren, Trendly Chatbot, dan Riwayat Analisis — dapat diakses tanpa biaya apapun.",
      },
      {
        q: "Data tren kuliner dari mana asalnya?",
        a: "Data tren dikumpulkan dari berbagai sumber digital termasuk Google Trends, platform media sosial, dan marketplace kuliner di Indonesia. Data diperbarui secara berkala untuk memastikan akurasi dan relevansi.",
      },
    ],
  },
  {
    key: "ai",
    category: "Fitur AI",
    icon: "sparkles-outline",
    color: "#8B5CF6",
    items: [
      {
        q: "Apa perbedaan AI Konsultan dengan Trendly Chatbot?",
        a: "AI Konsultan Kuliner (tab Insight) dirancang khusus untuk menganalisis satu produk secara mendalam — menghasilkan laporan lengkap berisi strategi promosi, kalkulasi peluang cuan, profil pembeli, hingga caption TikTok siap pakai.\n\nTrendly Chatbot (tab Chat) adalah asisten bisnis umum yang bisa kamu tanya kapan saja — cocok untuk pertanyaan spontan seputar harga, izin PIRT, strategi promosi, dan bisnis kuliner secara umum.",
      },
      {
        q: "Bagaimana cara membaca skor tren (0–100)?",
        a: "Skor tren menunjukkan tingkat popularitas produk kuliner di pasar digital:\n\n• 86–100 → VIRAL 🔥 (masuk sekarang atau ketinggalan)\n• 71–85 → HOT 🌟 (momentum memuncak)\n• 51–70 → AKTIF ✅ (pasar siap digarap)\n• 31–50 → BERKEMBANG 📈 (peluang early mover)\n• 0–30 → NICHE 🔍 (potensi spesialisasi)",
      },
      {
        q: "Berapa lama AI memproses analisis?",
        a: "Rata-rata 10–30 detik tergantung kondisi jaringan dan beban server. Kamu bisa melihat animasi 3 langkah yang menunjukkan progres analisis secara real-time.",
      },
      {
        q: "Apakah Trendly Chatbot mengingat percakapan?",
        a: "Ya, dalam satu sesi Trendly Chatbot mengingat seluruh konteks percakapan sehingga kamu bisa bertanya secara berkelanjutan. Riwayat direset jika kamu menekan tombol 'Akhiri Sesi'.",
      },
    ],
  },
  {
    key: "prediksi",
    category: "Prediksi & Insight",
    icon: "trending-up-outline",
    color: "#3B82F6",
    items: [
      {
        q: "Seberapa akurat prediksi tren?",
        a: "Prediksi tren dihasilkan berdasarkan pola historis, data tren terkini, dan model AI. Tingkat kepercayaan (confidence) ditampilkan dalam gauge meter. Gunakan prediksi sebagai panduan, bukan kepastian mutlak.",
      },
      {
        q: "Apa yang dimaksud dengan 'Skor Delta'?",
        a: "Skor delta adalah selisih skor tren antara periode saat ini dengan periode sebelumnya. Delta positif (↑) artinya tren naik, delta negatif (↓) artinya tren turun.",
      },
      {
        q: "Riwayat analisis saya tersimpan di mana?",
        a: "Setiap kali kamu menggunakan AI Konsultan, hasil analisis otomatis tersimpan di server dan bisa diakses melalui menu Riwayat Analisis. Riwayat terikat pada akun kamu.",
      },
    ],
  },
  {
    key: "akun",
    category: "Akun & Pengaturan",
    icon: "person-outline",
    color: Colors.emerald,
    items: [
      {
        q: "Bagaimana cara mengubah profil?",
        a: "Buka tab Akun → ketuk 'Profil Saya'. Di sana kamu bisa mengubah nama, email, dan informasi bisnis kamu.",
      },
      {
        q: "Bagaimana cara reset password?",
        a: "Saat ini reset password dilakukan melalui administrator. Hubungi tim Trendlify melalui WhatsApp atau Email yang tersedia di halaman ini.",
      },
      {
        q: "Apakah data saya aman?",
        a: "Ya. Token autentikasi disimpan secara aman di penyimpanan terenkripsi perangkat (Expo SecureStore). Data analisis kamu hanya dapat diakses oleh akun kamu sendiri.",
      },
    ],
  },
  {
    key: "lainnya",
    category: "Lainnya",
    icon: "ellipsis-horizontal-outline",
    color: "#F43F5E",
    items: [
      {
        q: "Kenapa koneksi ke server gagal?",
        a: "Pastikan koneksi internet kamu stabil. Jika server sedang restart, tunggu 30 detik lalu coba lagi. Jika masalah berlanjut, hubungi tim kami.",
      },
      {
        q: "Bagaimana cara memberikan masukan tentang aplikasi?",
        a: "Kamu bisa mengirimkan masukan, saran, atau laporan bug melalui tombol 'Kirim Pertanyaan' di bawah halaman ini atau langsung menghubungi tim via WhatsApp.",
      },
      {
        q: "Apakah ada versi web Trendlify?",
        a: "Trendlify tersedia dalam versi mobile (aplikasi ini) dan sedang dalam pengembangan untuk versi web. Pantau terus update kami!",
      },
    ],
  },
];

export default function BantuanScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeGroup, setActiveGroup] = useState<string>("tentang");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setActiveGroup((prev) => (prev === key ? "" : key));
    setOpenItems(new Set());
  }

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectChip(key: string) {
    setActiveGroup(key);
    setOpenItems(new Set());
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Hero section ── */}
          <View style={styles.hero}>
            {/* Decorative blob */}
            <View style={styles.heroBlob} />

            {/* Back button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={Colors.stone700} />
            </TouchableOpacity>

            {/* Title + robot row */}
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>Bantuan &{"\n"}FAQ</Text>
                <Text style={styles.heroSub}>Kami siap membantu kamu!</Text>
                <View style={styles.heroSparkle}>
                  <Ionicons name="sparkles" size={14} color={Colors.orange} />
                </View>
              </View>
              <View style={styles.heroRight}>
                <View style={styles.speechBubble}>
                  <Text style={styles.speechQ}>?</Text>
                </View>
                <Image
                  source={require("@/assets/chatbot.png")}
                  style={styles.heroRobot}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* ── Contact card ── */}
          <View style={styles.contactCard}>
            <View style={styles.contactLeft}>
              <View style={styles.contactIcon}>
                <Ionicons name="headset-outline" size={24} color={Colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>Butuh bantuan langsung?</Text>
                <Text style={styles.contactSub}>Tim kami siap membantu kamu secepat mungkin.</Text>
              </View>
            </View>
            <View style={styles.contactBtns}>
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: "#22C55E" }]}
                onPress={() => Linking.openURL("https://wa.me/6281234567890")}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#22C55E" />
                <Text style={[styles.contactBtnLabel, { color: "#22C55E" }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: Colors.orange }]}
                onPress={() => Linking.openURL("mailto:support@trendlify.app")}
                activeOpacity={0.85}
              >
                <Ionicons name="mail-outline" size={20} color={Colors.orange} />
                <Text style={[styles.contactBtnLabel, { color: Colors.orange }]}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Category chips ── */}
          <Text style={styles.sectionLabel}>Topik Bantuan</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FAQ_DATA.map((g) => {
              const isActive = activeGroup === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.chip, isActive && { borderColor: g.color }]}
                  onPress={() => selectChip(g.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={g.icon as any}
                    size={20}
                    color={isActive ? g.color : Colors.stone400}
                  />
                  <Text style={[styles.chipLabel, isActive && { color: g.color, fontWeight: "700" }]}>
                    {g.category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── FAQ accordion ── */}
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((group, gi) => {
              const isGroupOpen = activeGroup === group.key;
              const isLast = gi === FAQ_DATA.length - 1;
              return (
                <View key={group.key}>
                  {/* Group header */}
                  <TouchableOpacity
                    style={styles.groupRow}
                    onPress={() => toggleGroup(group.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={group.icon as any} size={18} color={group.color} />
                    <Text style={[styles.groupLabel, { color: group.color }]}>{group.category}</Text>
                    <Ionicons
                      name={isGroupOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={isGroupOpen ? group.color : Colors.stone400}
                    />
                  </TouchableOpacity>

                  {/* Items */}
                  {isGroupOpen && group.items.map((item, ii) => {
                    const itemKey = `${group.key}-${ii}`;
                    const isItemOpen = openItems.has(itemKey);
                    return (
                      <View key={itemKey}>
                        <TouchableOpacity
                          style={styles.itemRow}
                          onPress={() => toggleItem(itemKey)}
                          activeOpacity={0.75}
                        >
                          <View style={[styles.itemDot, { backgroundColor: group.color }]} />
                          <Text style={styles.itemQ}>{item.q}</Text>
                          <Ionicons
                            name={isItemOpen ? "chevron-up" : "chevron-down"}
                            size={14}
                            color={Colors.stone400}
                          />
                        </TouchableOpacity>
                        {isItemOpen && (
                          <View style={styles.itemAnswer}>
                            <Text style={styles.itemA}>{item.a}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {!isLast && <View style={styles.groupDivider} />}
                </View>
              );
            })}
          </View>

          {/* ── Bottom CTA ── */}
          <View style={styles.ctaCard}>
            <View style={styles.ctaIcon}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Tidak menemukan jawaban?</Text>
              <Text style={styles.ctaSub}>
                Kirim pertanyaanmu ke tim kami,{"\n"}kami akan segera membalas.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => Linking.openURL("mailto:support@trendlify.app?subject=Pertanyaan%20Trendlify")}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>Kirim Pertanyaan</Text>
              <Ionicons name="send-outline" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingBottom: 24 },

  // ── Hero ──
  hero: {
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    overflow: "hidden",
  },
  heroBlob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FED7AA",
    opacity: 0.45,
    top: -60,
    right: -50,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  heroLeft: { flex: 1, gap: 6 },
  heroTitle: { fontSize: 30, fontWeight: "900", color: Colors.stone900, lineHeight: 36 },
  heroSub: { fontSize: 14, color: Colors.stone500, fontWeight: "500" },
  heroSparkle: { marginTop: 6 },
  heroRight: { alignItems: "center", position: "relative" },
  speechBubble: {
    position: "absolute",
    top: -10,
    right: 50,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  speechQ: { fontSize: 22, fontWeight: "900", color: Colors.white },
  heroRobot: { width: 110, height: 110, marginRight: 8 },

  // ── Contact card ──
  contactCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.stone100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.orangeBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  contactTitle: { fontSize: 14, fontWeight: "800", color: Colors.stone800 },
  contactSub: { fontSize: 12, color: Colors.stone400, marginTop: 2, lineHeight: 17 },
  contactBtns: { flexDirection: "row", gap: 10 },
  contactBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  contactBtnLabel: { fontSize: 12, fontWeight: "700" },

  // ── Category chips ──
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.stone900,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  chipsRow: { paddingHorizontal: 16, gap: 10 },
  chip: {
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.stone200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 80,
  },
  chipLabel: { fontSize: 11, fontWeight: "600", color: Colors.stone500, textAlign: "center" },

  // ── FAQ ──
  faqContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.stone100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  groupLabel: { flex: 1, fontSize: 14, fontWeight: "700" },
  groupDivider: { height: 1, backgroundColor: Colors.stone100, marginHorizontal: 16 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: Colors.stone50,
    borderTopWidth: 1,
    borderTopColor: Colors.stone100,
  },
  itemDot: { width: 7, height: 7, borderRadius: 99 },
  itemQ: { flex: 1, fontSize: 13, color: Colors.stone700, fontWeight: "500" },
  itemAnswer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingLeft: 37,
    backgroundColor: Colors.stone50,
    borderTopWidth: 1,
    borderTopColor: Colors.stone100,
  },
  itemA: { fontSize: 13, color: Colors.stone500, lineHeight: 21 },

  // ── CTA ──
  ctaCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.stone100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ctaTitle: { fontSize: 13, fontWeight: "800", color: Colors.stone800 },
  ctaSub: { fontSize: 11, color: Colors.stone400, marginTop: 2, lineHeight: 15 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexShrink: 0,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaBtnText: { fontSize: 12, fontWeight: "800", color: Colors.white },
});
