import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, Animated, Keyboard, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";
import { LinearGradient } from "expo-linear-gradient";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
};

const QUICK_REPLIES = [
  "🔥 Tren viral sekarang?",
  "🍜 Menu rekomendasi warung",
  "📈 Strategi promosi TikTok",
  "💰 Kuliner paling cuan?",
  "🗺️ Tren di daerahku?",
  "🍗 Ide konten kuliner",
];

const BOT_INTRO: Message = {
  id: "intro",
  role: "bot",
  text: "Halo! Saya asisten AI Trendlify 👋\n\nTanya apa saja soal tren kuliner, strategi promosi, atau ide menu untuk usaha kamu. Saya siap bantu!",
  ts: Date.now(),
};

function TypewriterText({ text, style, speed = 12 }: { text: string; style?: any; speed?: number }) {
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

  return <Text style={style}>{displayed}</Text>;
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
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
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
    <View style={styles.typingBubble}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

function MessageBubble({ msg, isLast, isNew = false }: { msg: Message; isLast: boolean; isNew?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

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
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={13} color={Colors.white} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {isNew && !isUser ? (
          <TypewriterText
            text={msg.text}
            style={[styles.bubbleText, styles.bubbleTextBot]}
            speed={10}
          />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {msg.text}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function PulsingAvatar() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    return () => pulse.stopAnimation();
  }, []);

  return (
    <Animated.View style={[styles.botAvatar, { transform: [{ scale: pulse }] }]}>
      <Ionicons name="sparkles" size={13} color={Colors.white} />
    </Animated.View>
  );
}

export default function ChatScreen() {
  const { token, isLoggedIn } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([BOT_INTRO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newestBotId, setNewestBotId] = useState<string | null>("intro");
  const listRef = useRef<FlatList>(null);

  function scrollToBottom() {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), ts: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_URL}/api/v1/insights/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          trending_product: text.trim(),
          trend_score: null,
          region_code: "ID",
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(), role: "bot",
          text: "Sesi kamu sudah habis. Silakan logout lalu login ulang untuk melanjutkan.",
          ts: Date.now(),
        };
        setMessages((p) => [...p, errMsg]);
        setNewestBotId(errMsg.id);
        return;
      }

      if (!res.ok) {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(), role: "bot",
          text: `Gagal mendapatkan respons dari server (${res.status}). Coba lagi.`,
          ts: Date.now(),
        };
        setMessages((p) => [...p, errMsg]);
        setNewestBotId(errMsg.id);
        return;
      }

      const raw: string = json.insight?.summary ?? json.summary ?? "Maaf, saya tidak bisa memproses pertanyaan itu. Coba tanya hal lain!";
      const clean = raw.replace(/^## .+$/gm, (h) => `\n${h.replace(/^## /, "").toUpperCase()}`).trim();

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", text: clean, ts: Date.now() };
      setMessages((p) => [...p, botMsg]);
      setNewestBotId(botMsg.id);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(), role: "bot",
        text: "Koneksi ke server gagal. Pastikan backend sudah berjalan dan coba lagi.",
        ts: Date.now(),
      };
      setMessages((p) => [...p, errMsg]);
      setNewestBotId(errMsg.id);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  const showQuickReplies = !loading && !input.trim();

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#FB923C", "#F97316", "#EA580C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerAvatarWrap}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trendly AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.gateWrap}>
          <View style={styles.gateIconWrap}>
            <Ionicons name="chatbubbles" size={32} color={Colors.orange} />
          </View>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FB923C", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerAvatarWrap}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trendly AI</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{loading ? "Mengetik…" : "Online"}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => setMessages([BOT_INTRO])}
        >
          <Ionicons name="trash-outline" size={15} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </LinearGradient>

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
          renderItem={({ item, index }) => (
            <MessageBubble msg={item} isLast={index === messages.length - 1} isNew={item.id === newestBotId} />
          )}
          ListFooterComponent={loading ? (
            <View style={styles.msgRowBot}>
              <PulsingAvatar />
              <TypingDots />
            </View>
          ) : null}
        />

        {/* Quick replies — always-visible horizontal scroll */}
        {showQuickReplies && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
            style={styles.quickWrap}
          >
            {QUICK_REPLIES.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => send(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText} numberOfLines={1}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tanya soal tren kuliner…"
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
              : <Ionicons name="send" size={16} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F5" },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.orange, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: Colors.orangeDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  headerAvatarWrap: {
    width: 38, height: 38, borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: "#4ADE80" },
  onlineText: { fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  clearBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center",
  },

  messageList: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 10 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "90%" },
  msgRowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  msgRowBot: { alignSelf: "flex-start" },

  botAvatar: {
    width: 30, height: 30, borderRadius: 99, backgroundColor: Colors.orange,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "100%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.orange, borderBottomRightRadius: 5,
  },
  bubbleBot: {
    backgroundColor: Colors.white, borderBottomLeftRadius: 5,
    borderWidth: 1, borderColor: Colors.stone100,
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white, fontWeight: "500" },
  bubbleTextBot: { color: Colors.stone800 },

  // Typing dots
  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.white, borderRadius: 18, borderBottomLeftRadius: 5,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.stone100,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  typingDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.stone300 },

  // Quick replies — compact horizontal scroll
  quickWrap: { paddingBottom: 6 },
  quickLabel: { fontSize: 10, fontWeight: "700", color: Colors.stone400, textTransform: "uppercase", letterSpacing: 0.5 },
  quickRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 6 },
  quickChip: {
    backgroundColor: Colors.white, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.orangeLight,
    paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0,
  },
  quickChipText: { fontSize: 12, fontWeight: "600", color: Colors.orange },

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
  gateIconWrap: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.orangeBg,
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
});
