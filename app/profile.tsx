import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [businessName, setBusinessName] = useState(user?.business_category ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Nama tidak boleh kosong.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          business_category: businessName.trim() || null,
        }),
      });
      let json: any = {};
      try { json = await res.json(); } catch {}
      if (!res.ok) {
        Alert.alert("Gagal", json.message ?? `Server error (${res.status})`);
        return;
      }
      await updateUser(json.user);
      Alert.alert("Berhasil", "Profil kamu telah diperbarui.");
      router.back();
    } catch {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.stone800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.editAvatarBtn}>
            <Ionicons name="camera" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
            <Text style={styles.fieldHint}>Email tidak dapat diubah</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nama Usaha (Opsional)</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="cth: Warung Bakso Viral"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
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
  content: { padding: 24 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: Colors.orangeBg,
  },
  avatarLetter: { fontSize: 40, fontWeight: "800", color: Colors.white },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: Colors.stone800,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  form: { gap: 20, marginBottom: 40 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", color: Colors.stone600 },
  input: {
    backgroundColor: Colors.stone50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.stone200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.stone800,
  },
  disabledInput: { backgroundColor: Colors.stone100, color: Colors.stone400 },
  fieldHint: { fontSize: 11, color: Colors.stone400 },
  saveBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },
});
