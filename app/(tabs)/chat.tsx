import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, Animated, Keyboard, Image, Alert,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
};

const QUICK_REPLIES = [
  { label: "Margin keuntungan ideal", icon: "cash-outline" as const },
  { label: "Cara daftar izin PIRT", icon: "document-text-outline" as const },
  { label: "Tips promosi modal kecil", icon: "megaphone-outline" as const },
  { label: "Hitung harga jual produk", icon: "calculator-outline" as const },
];

const BOT_INTRO: Message = {
  id: "intro",
  role: "bot",
  text: "Halo! 👋\nAku **Trendly AI**, asisten bisnis kuliner kamu.\n\nTanya apa saja seputar:\n- Harga jual & margin keuntungan\n- Izin usaha & regulasi UMKM\n- Tips promosi & pemasaran\n- Strategi mengembangkan bisnis kuliner",
  ts: Date.now(),
};

function TypewriterMarkdown({ text, speed = 8 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return <Markdown style={mdStyles}>{displayed}</Markdown>;
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function bounce(dot: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    }
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.msgRowBot}>
      <Image source={require("@/assets/chatbot.png")} style={styles.botAvatar} />
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ msg, isNew = false }: { msg: Message; isNew?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = msg.role === "user";

  return (
    <Animated.View style={[
      styles.msgRow,
      isUser ? styles.msgRowUser : styles.msgRowBot,
      { opacity, transform: [{ translateY }] },
    ]}>
      {!isUser && (
        <Image source={require("@/assets/chatbot.png")} style={styles.botAvatar} />
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{msg.text}</Text>
        ) : isNew ? (
          <TypewriterMarkdown text={msg.text} speed={8} />
        ) : (
          <Markdown style={mdStyles}>{msg.text}</Markdown>
        )}
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const { token, isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([BOT_INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newestBotId, setNewestBotId] = useState<string | null>("intro");
  const listRef = useRef<FlatList>(null);

  function scrollToBottom() {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function endSession() {
    Alert.alert(
      "Akhiri Sesi",
      "Percakapan ini akan dihapus dan sesi baru akan dimulai. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Akhiri Sesi",
          style: "destructive",
          onPress: () => {
            setMessages([{ ...BOT_INTRO, ts: Date.now() }]);
            setNewestBotId("intro");
            setInput("");
          },
        },
      ]
    );
  }

  async function send(text: string, currentMessages: Message[] = messages) {
    if (!text.trim() || loading) return;
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), ts: Date.now() };
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    // Build history from all messages except the intro
    const history = currentMessages
      .filter((m) => m.id !== "intro")
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const json = await res.json();

      if (res.status === 401) {
        const m: Message = { id: (Date.now() + 1).toString(), role: "bot", text: "Sesi kamu sudah habis. Silakan logout lalu login ulang.", ts: Date.now() };
        setMessages((p) => [...p, m]);
        setNewestBotId(m.id);
        return;
      }
      if (!res.ok) {
        const m: Message = { id: (Date.now() + 1).toString(), role: "bot", text: `Gagal mendapatkan respons (${res.status}). Coba lagi.`, ts: Date.now() };
        setMessages((p) => [...p, m]);
        setNewestBotId(m.id);
        return;
      }

      const raw: string = json.reply ?? "Maaf, saya tidak bisa memproses itu. Coba tanya hal lain!";
      const m: Message = { id: (Date.now() + 1).toString(), role: "bot", text: raw.trim(), ts: Date.now() };
      setMessages((p) => [...p, m]);
      setNewestBotId(m.id);
    } catch {
      const m: Message = { id: (Date.now() + 1).toString(), role: "bot", text: "Koneksi ke server gagal. Pastikan jaringan kamu aktif.", ts: Date.now() };
      setMessages((p) => [...p, m]);
      setNewestBotId(m.id);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  const showQuickReplies = messages.length <= 1 && !loading;

  // Header shared between gate and main view
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={Colors.stone700} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Trendly Chatbot</Text>
        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{loading ? "Mengetik…" : "Online"}</Text>
        </View>
      </View>
      <Image source={require("@/assets/chatbot.png")} style={styles.headerRobot} />
    </View>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header />
        <View style={styles.gateWrap}>
          <Image source={require("@/assets/chatbot.png")} style={{ width: 90, height: 90, marginBottom: 8 }} />
          <Text style={styles.gateTitle}>Login untuk Chat dengan AI</Text>
          <Text style={styles.gateSub}>Tanya strategi kuliner, tren pasar, dan ide promosi langsung ke AI Trendlify</Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push("/login")}>
            <Ionicons name="log-in-outline" size={16} color={Colors.white} />
            <Text style={styles.gateBtnText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isNew={item.id === newestBotId} />
          )}
          ListFooterComponent={loading ? <TypingDots /> : null}
        />

        {/* Quick replies — 2-column grid */}
        {showQuickReplies && (
          <View style={styles.quickGrid}>
            {QUICK_REPLIES.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={styles.quickChip}
                onPress={() => send(q.label)}
                activeOpacity={0.7}
              >
                <Ionicons name={q.icon} size={14} color={Colors.orange} />
                <Text style={styles.quickChipText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Akhiri Sesi bar — only show when conversation has started */}
        {messages.length > 1 && (
          <TouchableOpacity style={styles.endSessionBar} onPress={endSession} activeOpacity={0.8}>
            <Ionicons name="stop-circle-outline" size={15} color={Colors.red} />
            <Text style={styles.endSessionText}>Akhiri Sesi dengan Trendly</Text>
          </TouchableOpacity>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ketik pesan..."
            placeholderTextColor={Colors.stone400}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Ionicons name="send" size={15} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const mdStyles = {
  body: { color: Colors.stone800, fontSize: 14, lineHeight: 22 },
  heading1: { fontSize: 15, fontWeight: "800" as const, color: Colors.stone900, marginTop: 10, marginBottom: 4 },
  heading2: { fontSize: 14, fontWeight: "800" as const, color: Colors.orange, marginTop: 8, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: 0.4 },
  heading3: { fontSize: 13, fontWeight: "700" as const, color: Colors.stone700, marginTop: 6, marginBottom: 2 },
  strong: { fontWeight: "700" as const, color: Colors.stone900 },
  em: { fontStyle: "italic" as const, color: Colors.stone600 },
  bullet_list: { marginTop: 4, marginBottom: 4 },
  ordered_list: { marginTop: 4, marginBottom: 4 },
  list_item: { marginVertical: 2 },
  bullet_list_icon: { color: Colors.orange, marginTop: 5 },
  paragraph: { marginTop: 2, marginBottom: 2 },
  hr: { backgroundColor: Colors.stone200, marginVertical: 8, height: 1 },
  code_inline: { backgroundColor: Colors.stone100, color: Colors.orange, borderRadius: 4, paddingHorizontal: 4, fontSize: 12 },
  fence: { backgroundColor: Colors.stone100, borderRadius: 8, padding: 10, marginVertical: 6 },
  code_block: { backgroundColor: Colors.stone100, borderRadius: 8, padding: 10, fontSize: 12, color: Colors.stone800 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F5" },

  // Header — white
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.stone50, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.stone200,
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.stone900 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: "#4ADE80" },
  onlineText: { fontSize: 10, color: Colors.stone500, fontWeight: "600" },
  headerRobot: { width: 44, height: 44 },

  messageList: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 12 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "88%" },
  msgRowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  msgRowBot: { alignSelf: "flex-start" },

  botAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },

  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  bubbleUser: { backgroundColor: Colors.orange, borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: Colors.white, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.stone100,
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white, fontWeight: "500" },
  bubbleTextBot: { color: Colors.stone800 },

  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.white, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.stone100,
  },
  typingDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.stone300 },

  // Quick replies — 2-column grid
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    paddingHorizontal: 14, paddingBottom: 10,
  },
  quickChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.white, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.orangeLight,
    paddingHorizontal: 14, paddingVertical: 10,
    width: "47%",
  },
  quickChipText: { fontSize: 12, fontWeight: "600", color: Colors.stone700, flexShrink: 1 },

  // End session bar
  endSessionBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 8, backgroundColor: "#FEF2F2",
    borderTopWidth: 1, borderTopColor: "#FECACA",
  },
  endSessionText: { fontSize: 12, fontWeight: "700", color: Colors.red },

  // Input
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.stone100,
  },
  input: {
    flex: 1, backgroundColor: Colors.stone50, borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.stone200, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: Colors.stone800, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 99, backgroundColor: Colors.orange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },

  // Gate
  gateWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  gateTitle: { fontSize: 17, fontWeight: "800", color: Colors.stone800, textAlign: "center" },
  gateSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20 },
  gateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.orange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13, marginTop: 4,
    shadowColor: Colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  gateBtnText: { color: Colors.white, fontWeight: "800", fontSize: 14 },
});
