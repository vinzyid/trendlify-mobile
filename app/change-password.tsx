import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/colors";
import { API_URL } from "@/constants/api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [currentPass, setCurrentPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [confirmPass, setConfirmPass] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checks = [
    { label: "Minimal 8 karakter", ok: newPass.length >= 8 },
    { label: "Mengandung huruf dan angka", ok: /[a-zA-Z]/.test(newPass) && /[0-9]/.test(newPass) },
    { label: "Konfirmasi password cocok", ok: newPass.length > 0 && newPass === confirmPass },
  ];
  const allOk = checks.every(c => c.ok) && currentPass.length > 0;

  async function handleSubmit() {
    if (!allOk) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message ?? "Gagal mengubah password.");
        return;
      }
      setSuccessModal(true);
    } catch {
      setErrorMsg("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ubah Password</Text>
          <Text style={styles.headerSub}>Perbarui keamanan akun kamu</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.white} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.orange} />
          <Text style={styles.infoText}>
            Gunakan password yang kuat dan unik agar akun kamu tetap aman.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Password Lama */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password Lama</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.orange} />
              <TextInput
                style={styles.input}
                value={currentPass}
                onChangeText={setCurrentPass}
                placeholder="Masukkan password saat ini"
                placeholderTextColor={Colors.stone300}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showCurrent ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.stone400}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Password Baru */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password Baru</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.orange} />
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="Min. 8 karakter"
                placeholderTextColor={Colors.stone300}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.stone400}
                />
              </TouchableOpacity>
            </View>
            {newPass.length > 0 && (
              <View style={styles.checksWrap}>
                {checks.slice(0, 2).map((c, i) => (
                  <View key={i} style={styles.checkRow}>
                    <Ionicons
                      name={c.ok ? "checkmark-circle" : "ellipse-outline"}
                      size={15}
                      color={c.ok ? Colors.emerald : Colors.stone300}
                    />
                    <Text style={[styles.checkText, c.ok && styles.checkOk]}>{c.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Konfirmasi Password */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Konfirmasi Password Baru</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.orange} />
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={setConfirmPass}
                placeholder="Ketik ulang password baru"
                placeholderTextColor={Colors.stone300}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.stone400}
                />
              </TouchableOpacity>
            </View>
            {confirmPass.length > 0 && (
              <View style={styles.checksWrap}>
                <View style={styles.checkRow}>
                  <Ionicons
                    name={checks[2].ok ? "checkmark-circle" : "close-circle"}
                    size={15}
                    color={checks[2].ok ? Colors.emerald : Colors.red}
                  />
                  <Text style={[styles.checkText, checks[2].ok ? styles.checkOk : styles.checkError]}>
                    {checks[2].ok ? "Password cocok" : "Password tidak cocok"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Error */}
        {errorMsg && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={16} color={Colors.red} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, (!allOk || loading) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!allOk || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Simpan Password Baru</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.emerald} />
            </View>
            <Text style={styles.modalTitle}>Password Berhasil Diubah!</Text>
            <Text style={styles.modalSub}>
              Password akun kamu sudah diperbarui. Gunakan password baru saat login berikutnya.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setSuccessModal(false); router.back(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnText}>Oke, Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    backgroundColor: Colors.orange,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: Colors.white },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  headerIcon: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },

  scroll: { padding: 16, gap: 12 },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.orangeBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  infoText: { flex: 1, fontSize: 12, color: Colors.stone600, lineHeight: 18 },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: "#F2F2F7", marginVertical: 2 },

  field: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.stone700 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.stone100,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, color: Colors.stone800 },
  eyeBtn: { padding: 4 },

  checksWrap: { gap: 6, paddingLeft: 2 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkText: { fontSize: 12, color: Colors.stone400 },
  checkOk: { color: Colors.emerald },
  checkError: { color: Colors.red },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.red, fontWeight: "600" },

  btn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.orange,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  btnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: "#F0FDF4",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.stone900, textAlign: "center" },
  modalSub: { fontSize: 13, color: Colors.stone500, textAlign: "center", lineHeight: 20 },
  modalBtn: {
    width: "100%",
    backgroundColor: Colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnText: { color: Colors.white, fontWeight: "800", fontSize: 15 },
});
