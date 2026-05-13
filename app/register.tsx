import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) { Alert.alert("Lengkapi semua field"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, password, password_confirmation: password }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert("Gagal", json.message ?? "Registrasi gagal."); return; }
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="restaurant" size={28} color={Colors.white} />
            </View>
            <Text style={styles.logoTitle}>Daftar Gratis</Text>
            <Text style={styles.logoSub}>Mulai pantau tren kuliner UMKM kamu</Text>
          </View>

          <View style={styles.form}>
            {[
              { label: "Nama Lengkap", value: name, set: setName, placeholder: "Nama kamu", type: "default" },
              { label: "Email", value: email, set: setEmail, placeholder: "email@contoh.com", type: "email-address" },
              { label: "Password", value: password, set: setPassword, placeholder: "Min. 8 karakter", type: "default", secure: true },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value} onChangeText={f.set}
                  placeholder={f.placeholder} placeholderTextColor={Colors.stone400}
                  keyboardType={f.type as any} autoCapitalize={f.type === "email-address" ? "none" : "words"}
                  secureTextEntry={f.secure}
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Daftar Sekarang</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginLink}>Sudah punya akun? <Text style={{ color: Colors.orange, fontWeight: "700" }}>Masuk</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.orangeBg },
  inner: { padding: 24, gap: 24 },
  logoWrap: { alignItems: "center", gap: 8, paddingTop: 16 },
  logoIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.orange, alignItems: "center", justifyContent: "center" },
  logoTitle: { fontSize: 22, fontWeight: "900", color: Colors.stone900 },
  logoSub: { fontSize: 13, color: Colors.stone500, textAlign: "center" },
  form: { gap: 12, backgroundColor: Colors.white, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.stone200 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: Colors.stone600 },
  input: { backgroundColor: Colors.stone50, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.stone800 },
  btn: { backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },
  loginLink: { fontSize: 13, color: Colors.stone500, textAlign: "center" },
});
