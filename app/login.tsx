import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
      if (!res.ok) { Alert.alert("Login Gagal", json.errors?.email?.[0] ?? json.message ?? "Email atau password salah."); return; }
      await login(json.token, json.user);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="restaurant" size={28} color={Colors.white} />
          </View>
          <Text style={styles.logoTitle}>Trendlify</Text>
          <Text style={styles.logoSub}>Kuliner AI untuk UMKM Indonesia</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Masuk ke akun</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email} onChangeText={setEmail}
              placeholder="email@contoh.com" placeholderTextColor={Colors.stone400}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                value={password} onChangeText={setPassword}
                placeholder="Password kamu" placeholderTextColor={Colors.stone400}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.stone400} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin} disabled={loading}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginBtnText}>Masuk</Text>}
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Akun Demo</Text>
            <Text style={styles.demoText}>demo@trendlify.test · password</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerLink}>Belum punya akun? <Text style={{ color: Colors.orange, fontWeight: "700" }}>Daftar gratis</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.orangeBg },
  inner: { flex: 1, padding: 24, justifyContent: "center", gap: 28 },
  logoWrap: { alignItems: "center", gap: 10 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.orange, alignItems: "center", justifyContent: "center" },
  logoTitle: { fontSize: 24, fontWeight: "900", color: Colors.stone900 },
  logoSub: { fontSize: 13, color: Colors.stone500, textAlign: "center" },
  form: { gap: 14, backgroundColor: Colors.white, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.stone200 },
  formTitle: { fontSize: 18, fontWeight: "800", color: Colors.stone900, marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: Colors.stone600 },
  input: { backgroundColor: Colors.stone50, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.stone800 },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.stone50, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingRight: 12 },
  eyeBtn: { padding: 4 },
  loginBtn: { backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },
  demoCard: { backgroundColor: Colors.orangeBg, borderRadius: 12, borderWidth: 1, borderColor: "#FED7AA", padding: 12, gap: 2 },
  demoTitle: { fontSize: 11, fontWeight: "700", color: Colors.orange },
  demoText: { fontSize: 12, color: Colors.stone600 },
  registerLink: { fontSize: 13, color: Colors.stone500, textAlign: "center" },
});
