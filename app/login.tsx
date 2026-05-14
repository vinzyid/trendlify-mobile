import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

const BG = "#FFF5EB";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        Alert.alert("Login Gagal", json.errors?.email?.[0] ?? json.message ?? "Email atau password salah.");
        return;
      }
      await login(json.token, json.user);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Decorative background */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Text style={[styles.decEmoji, { top: 40, left: 18 }]}>🥟</Text>
              <Text style={[styles.decEmoji, { top: 20, right: 22 }]}>🍜</Text>
              <Text style={[styles.decEmoji, { top: 100, left: 55 }]}>🍲</Text>
              <Text style={[styles.decStar, { top: 60, right: 75 }]}>✦</Text>
              <Text style={[styles.decStar, { top: 35, left: 140 }]}>✦</Text>
              <Text style={[styles.decStar, { top: 115, right: 18 }]}>✦</Text>
            </View>

            {/* Logo */}
            <View style={styles.logoArea}>
              <View style={styles.logoBox}>
                <Ionicons name="restaurant" size={30} color={Colors.white} />
              </View>
              <Text style={styles.logoTitle}>Trendlify</Text>
              <Text style={styles.logoSub}>
                Kuliner{" "}
                <Text style={styles.logoHighlight}>AI</Text>
                {" "}untuk{" "}
                <Text style={styles.logoHighlight}>UMKM</Text>
                {" "}Indonesia
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Selamat datang!</Text>
              <Text style={styles.cardSub}>
                Masuk untuk melanjutkan dan menemukan{"\n"}tren kuliner terbaik untuk usahamu.
              </Text>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={Colors.orange} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@contoh.com"
                    placeholderTextColor={Colors.stone300}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.orange} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password kamu"
                    placeholderTextColor={Colors.stone300}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.stone300} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember + forgot */}
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                    {rememberMe && <Ionicons name="checkmark" size={11} color={Colors.white} />}
                  </View>
                  <Text style={styles.rememberText}>Ingat saya</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert("Lupa Password", "Hubungi admin untuk reset password.")}>
                  <Text style={styles.forgotText}>Lupa password?</Text>
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.btn, (loading || !email || !password) && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading || !email || !password}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.btnText}>Masuk</Text>
                }
              </TouchableOpacity>

              {/* Demo hint */}
              <View style={styles.demoRow}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.orange} />
                <Text style={styles.demoText}>Demo: demo@trendlify.test · password</Text>
              </View>

              {/* Register link */}
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.bottomLink}>
                  Belum punya akun?{" "}
                  <Text style={styles.bottomLinkHighlight}>Daftar gratis</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom wave decoration */}
      <View style={styles.waveWrap} pointerEvents="none">
        <View style={styles.waveback} />
        <View style={styles.wavefront} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  // Decorative
  decEmoji: { position: "absolute", fontSize: 36, opacity: 0.12 },
  decStar: { position: "absolute", fontSize: 14, color: Colors.orange, opacity: 0.35 },

  // Logo
  logoArea: { alignItems: "center", gap: 10, marginTop: 80, marginBottom: 28 },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoTitle: { fontSize: 28, fontWeight: "900", color: Colors.stone900, letterSpacing: -0.5 },
  logoSub: { fontSize: 13, color: Colors.stone500 },
  logoHighlight: { color: Colors.orange, fontWeight: "800" },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 24,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: "900", color: Colors.stone900, textAlign: "center" },
  cardSub: { fontSize: 13, color: Colors.stone400, textAlign: "center", lineHeight: 20, marginBottom: 4 },

  // Fields
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: "700", color: Colors.stone700 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.stone100,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputIcon: {},
  input: { flex: 1, fontSize: 14, color: Colors.stone800 },
  eyeBtn: { padding: 2 },

  // Remember row
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.stone200,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  rememberText: { fontSize: 13, color: Colors.stone600 },
  forgotText: { fontSize: 13, color: Colors.orange, fontWeight: "700" },

  // Button
  btn: {
    backgroundColor: Colors.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  btnText: { color: Colors.white, fontWeight: "800", fontSize: 16 },

  // Demo
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.orangeBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  demoText: { fontSize: 11, color: Colors.stone500 },

  // Bottom link
  bottomLink: { fontSize: 13, color: Colors.stone400, textAlign: "center" },
  bottomLinkHighlight: { color: Colors.orange, fontWeight: "800" },

  // Wave decoration
  waveWrap: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, overflow: "hidden" },
  waveback: {
    position: "absolute",
    bottom: -20,
    left: -40,
    right: -10,
    height: 100,
    backgroundColor: "#FDBA74",
    borderTopLeftRadius: 120,
    borderTopRightRadius: 70,
  },
  wavefront: {
    position: "absolute",
    bottom: 0,
    left: 30,
    right: -40,
    height: 70,
    backgroundColor: Colors.orange,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 130,
  },
});
