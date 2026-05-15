# Trendlify Mobile

Aplikasi mobile berbasis AI untuk membantu pelaku UMKM kuliner Indonesia memantau tren pasar, mendapatkan rekomendasi strategi bisnis, dan memprediksi potensi produk secara real-time.

---

## Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Arsitektur Aplikasi](#arsitektur-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi dan Menjalankan](#instalasi-dan-menjalankan)
- [Konfigurasi](#konfigurasi)

---

## Deskripsi Proyek

Trendlify Mobile adalah aplikasi React Native yang dikembangkan sebagai antarmuka mobile dari platform Trendlify — sistem analitik kuliner berbasis AI yang dirancang khusus untuk UMKM (Usaha Mikro, Kecil, dan Menengah) di Indonesia. Aplikasi ini memungkinkan pengguna mengakses data tren kuliner, menghasilkan insight berbasis AI, serta berinteraksi dengan chatbot asisten bisnis secara langsung dari perangkat mobile.

---

## Teknologi yang Digunakan

### Framework & Runtime

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **React Native** | 0.81.5 | Framework utama pengembangan aplikasi mobile cross-platform |
| **Expo** | ~54.0.33 (SDK 54) | Build toolchain, OTA update, dan akses native API |
| **Expo Router** | ~6.0.23 | File-based routing dan navigasi antar layar |
| **TypeScript** | ~5.9.2 | Static typing untuk keandalan dan keterbacaan kode |
| **React** | 19.1.0 | Library UI, hooks, dan Context API |

### Library UI & Komponen

| Library | Versi | Kegunaan |
|---|---|---|
| **@expo/vector-icons** | ^15.0.3 | Ikon (Ionicons) untuk seluruh antarmuka |
| **react-native-safe-area-context** | ~5.6.0 | Penanganan safe area (notch, status bar) |
| **react-native-screens** | ~4.16.0 | Optimasi performa navigasi native |
| **react-native-svg** | 15.12.1 | Rendering grafik SVG (gauge prediksi, area chart) |
| **react-native-markdown-display** | ^7.0.2 | Rendering teks markdown dari respons AI |
| **expo-linear-gradient** | ~15.0.8 | Efek gradien pada komponen UI |

### Sistem & Utilitas

| Library | Versi | Kegunaan |
|---|---|---|
| **expo-secure-store** | ~15.0.8 | Penyimpanan token autentikasi secara aman di perangkat |
| **expo-constants** | ~18.0.13 | Akses konstanta dan konfigurasi aplikasi |
| **expo-font** | ^55.0.7 | Pemuatan font kustom |
| **expo-linking** | ~8.0.12 | Deep linking dan URL handling |

### Backend & API

- **Backend**: Express.js + Prisma ORM, deployed di Railway
- **Database**: PostgreSQL (Neon) via PgBouncer
- **AI Provider**: Multi-provider dengan fallback otomatis — OpenRouter (utama) → Gemini Flash → Groq → stub
- **Komunikasi**: REST API dengan autentikasi Bearer Token (JWT)

---

## Arsitektur Aplikasi

```
Trendlify Mobile (React Native + Expo Router)
│
├── Root Stack Navigator (_layout.tsx)
│   ├── (tabs)         — Tab navigator utama (5 tab)
│   ├── login          — Modal slide-up
│   ├── register       — Modal slide-up
│   ├── change-password
│   ├── search
│   └── heatmap
│
├── Tab Navigator ((tabs)/_layout.tsx)
│   ├── Beranda   (index.tsx)   — Dashboard & KPI
│   ├── Tren      (tren.tsx)    — Daftar tren kuliner + filter kategori
│   ├── Fitur     (fitur.tsx)   — Hub fitur AI
│   ├── Chat      (chat.tsx)    — AI Chatbot
│   └── Akun      (akun.tsx)   — Profil & pengaturan
│
├── Context API (state management)
│   ├── AuthContext            — token JWT, data user, login/logout/updateUser
│   └── SelectedKeywordContext — berbagi keyword terpilih antar screen
│
└── REST API Layer (constants/api.ts)
    ├── GET  /api/v1/dashboard/overview      → KPI & hero trend
    ├── GET  /api/v1/trends                  → daftar snapshot tren
    ├── GET  /api/v1/regions/heatmap         → skor per provinsi
    ├── POST /api/v1/insights/generate       → generate AI insight per produk
    ├── GET  /api/v1/insights                → riwayat insight user
    ├── GET  /api/v1/predictions/:id         → prediksi tren 7 hari
    └── POST /api/v1/chat                    → chatbot Q&A bisnis UMKM
```

### Pola State Management

Aplikasi menggunakan **React Context API** tanpa library tambahan (Redux, Zustand, dll) untuk menjaga kesederhanaan:

- **AuthContext** — menyimpan token JWT di `expo-secure-store` (dienkripsi), persistent antar sesi. Menyediakan `login`, `logout`, dan `updateUser` agar perubahan profil langsung terrefleksi tanpa re-login.
- **SelectedKeywordContext** — cross-screen sharing, memungkinkan pengguna klik produk di Beranda/Tren dan langsung membuka Insight atau Prediksi tanpa input ulang.

---

## Fitur Utama

### 1. Beranda (Dashboard)
- KPI cards real-time: jumlah produk trending, rata-rata skor tren, tren meningkat
- Kartu hero "Skor Tren Hari Ini" dari endpoint `/dashboard/overview`
- Top Trending carousel — produk teratas dengan kategori icon dan badge skor
- Entry point cepat ke AI Konsultan Kuliner

### 2. Tren Kuliner
- Daftar semua snapshot tren (hingga 50 data) dengan filter chip kategori: **Semua / Modern / Tradisional / Minuman / Lainnya**
- Setiap item menampilkan: kategori icon (Ionicons), nama produk, badge skor/100, delta perubahan
- Klasifikasi kategori via `CATEGORY_MAP` — lookup eksplisit ~70 keyword kuliner
- Deduplication client-side: hanya tampil satu entry per keyword (skor tertinggi)
- Pull-to-refresh

### 3. AI Konsultan Kuliner (Insight)
- Input keyword produk atau pilih langsung dari data trending
- Generate laporan AI mencakup: analisis pasar, strategi promosi, target segmen, caption TikTok siap pakai
- Tampilan terstruktur per seksi (collapsible cards) dengan markdown rendering
- Animasi loading bertahap selama AI memproses

### 4. AI Prediction
- Prediksi pertumbuhan tren 7 hari ke depan per snapshot
- **Confidence Gauge** — semicircle SVG gauge yang menampilkan tingkat keyakinan prediksi
- **Area Chart** — proyeksi skor tren dengan visualisasi SVG path
- Narasi AI penjelasan hasil prediksi

### 5. Trendly Chatbot
- Chatbot khusus Q&A bisnis UMKM — endpoint `/chat` terpisah dari AI Konsultan
- **Conversation history** — AI mengingat konteks seluruh percakapan dalam satu sesi
- Efek typewriter pada respons AI baru
- Animasi typing dots saat AI memproses
- Tombol "Akhiri Sesi" untuk reset percakapan
- Rendering markdown pada respons AI (heading, bold, bullet list)

### 6. Akun
- Info user: nama, email, kategori usaha
- Navigasi ke: Edit Profil, Ganti Password, Bantuan
- Logout dengan bottom sheet confirmation modal

---

## Struktur Proyek

```
trendlify-mobile/
├── app/
│   ├── _layout.tsx              # Root layout, provider wrapping, Stack config
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator konfigurasi (5 tab)
│   │   ├── index.tsx            # Beranda / Dashboard
│   │   ├── tren.tsx             # Tren Kuliner (daftar + filter)
│   │   ├── fitur.tsx            # Hub fitur AI
│   │   ├── chat.tsx             # Trendly Chatbot
│   │   ├── akun.tsx             # Akun & pengaturan
│   │   ├── insight.tsx          # AI Konsultan Kuliner (hidden tab)
│   │   └── prediction.tsx       # AI Prediction (hidden tab)
│   ├── login.tsx                # Halaman Login (modal)
│   ├── register.tsx             # Halaman Registrasi (modal)
│   ├── profile.tsx              # Edit profil & nama usaha
│   ├── change-password.tsx      # Ganti password
│   ├── search.tsx               # Global search tren
│   ├── heatmap.tsx              # Heatmap regional interaktif
│   ├── bantuan.tsx              # Pusat bantuan / FAQ
│   └── notifications.tsx        # Notifikasi
├── constants/
│   ├── colors.ts                # Token warna (design system)
│   └── api.ts                   # Base URL API (env-aware)
├── contexts/
│   ├── AuthContext.tsx          # Autentikasi & manajemen token
│   └── SelectedKeywordContext.tsx # Cross-screen keyword sharing
├── components/
│   └── FoodImage.tsx            # Komponen gambar produk
├── .env.local                   # URL API lokal (tidak di-commit)
└── package.json
```

---

## Instalasi dan Menjalankan

### Prasyarat
- Node.js >= 18
- npm
- Expo Go app di perangkat fisik, atau Android/iOS Emulator

### Langkah Instalasi

```bash
# Clone repositori
git clone https://github.com/vinzyid/trendlify-mobile.git
cd trendlify-mobile

# Install dependensi
npm install --legacy-peer-deps

# Jalankan aplikasi
npx expo start
```

Scan QR code dengan Expo Go (Android) atau kamera (iOS).

---

## Konfigurasi

Buat file `.env.local` di root proyek untuk mengarahkan ke backend lokal saat development:

```env
EXPO_PUBLIC_API_URL=http://<IP_KOMPUTER>:8000
```

Ganti `<IP_KOMPUTER>` dengan IP lokal mesin yang menjalankan backend (cek dengan `ipconfig` / `ifconfig`). Gunakan IP jaringan, bukan `localhost`, agar perangkat fisik bisa terhubung.

Jika tidak di-set, aplikasi otomatis menggunakan URL production:
```
https://trendlify-api.up.railway.app
```

---

## Kontribusi

Proyek ini dikembangkan sebagai bagian dari platform Trendlify untuk kompetisi/presentasi UMKM Indonesia.
