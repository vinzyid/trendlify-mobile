# Trendlify Mobile — Architecture & System Design


## Overview

Trendlify Mobile adalah aplikasi React Native (Expo) yang melayani UMKM kuliner Indonesia dengan fitur analitik tren berbasis AI. Aplikasi terhubung ke Trendlify Backend API di Railway untuk autentikasi, data tren real-time, AI insight, prediksi, dan chatbot konsultan kuliner.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | React Native 0.81.5 (Expo SDK 54) |
| Language | TypeScript ~5.9 |
| Navigation | expo-router v6 (file-based routing) |
| Auth Storage | expo-secure-store (encrypted on-device) |
| State | React Context API (AuthContext, SelectedKeywordContext) |
| HTTP | Native `fetch` API |
| Icons | @expo/vector-icons (Ionicons) |
| Charts | react-native-svg |
| Markdown | react-native-markdown-display |
| Safe Area | react-native-safe-area-context |
| Deployment | Expo Go (dev) + EAS Build (production APK/IPA) |
| Backend | Trendlify API — `https://trendlify-api.up.railway.app/api/v1` |

---

## Struktur Proyek

```
Trendlify-mobile/
├── app/
│   ├── _layout.tsx              # Root layout — provider wrappers + Stack navigator
│   ├── login.tsx                # Login screen (modal presentation)
│   ├── register.tsx             # Register screen (modal presentation)
│   ├── profile.tsx              # Edit profil & nama usaha
│   ├── change-password.tsx      # Ganti password
│   ├── search.tsx               # Global search tren
│   ├── heatmap.tsx              # Heatmap regional interaktif
│   ├── notifications.tsx        # Notifikasi (placeholder)
│   ├── bantuan.tsx              # Pusat bantuan / FAQ
│   └── (tabs)/
│       ├── _layout.tsx          # Tab bar configuration (5 tabs visible)
│       ├── index.tsx            # Beranda — hero, KPI cards, top tren carousel
│       ├── tren.tsx             # Tren Kuliner — daftar tren dengan filter kategori
│       ├── fitur.tsx            # Hub fitur AI (insight, prediksi, heatmap, dll)
│       ├── chat.tsx             # AI Chatbot (Gemini-powered)
│       ├── akun.tsx             # Akun — info user, navigasi ke profil/password
│       ├── insight.tsx          # AI Insight per keyword (hidden tab, routed dari fitur)
│       ├── prediction.tsx       # Prediksi tren 7 hari (hidden tab, routed dari fitur)
│       ├── promosi.tsx          # Strategi promosi (hidden tab)
│       └── competitors.tsx      # Kompetitor (hidden tab, legacy)
├── contexts/
│   ├── AuthContext.tsx          # Auth state — token, user, login/logout/updateUser
│   └── SelectedKeywordContext.tsx # Shared state keyword terpilih antar screen
├── constants/
│   ├── api.ts                   # API_URL (env-based, mendukung .env.local)
│   └── colors.ts                # Design token warna (orange, stone, emerald, dll)
├── components/
│   └── FoodImage.tsx            # Komponen gambar produk (legacy)
├── app.json                     # Expo app config (name, slug, bundleId, dll)
├── package.json
└── tsconfig.json
```

---

## Navigasi

Aplikasi menggunakan **expo-router** dengan dua level navigator:

### Root Stack (`app/_layout.tsx`)

```
Stack (headerShown: false)
├── (tabs)          ← Tab navigator utama
├── login           ← Modal (slide up)
├── register        ← Modal (slide up)
├── change-password ← Stack screen
├── search          ← Stack screen
└── heatmap         ← Stack screen
```

### Tab Navigator (`app/(tabs)/_layout.tsx`)

| Tab | File | Icon |
|---|---|---|
| Beranda | `index.tsx` | home-outline / home |
| Tren | `tren.tsx` | trending-up-outline / trending-up |
| Fitur | `fitur.tsx` | layers-outline / layers |
| Chat | `chat.tsx` | chatbubble-outline / chatbubble |
| Akun | `akun.tsx` | person-outline / person |

> **Hidden tabs** (tidak tampil di tab bar, hanya bisa diakses via `router.push`):
> `insight`, `prediction`, `promosi`, `competitors`

---

## State Management

### AuthContext (`contexts/AuthContext.tsx`)

Mengelola sesi pengguna secara global. Token dan data user disimpan terenkripsi di expo-secure-store.

```
AuthProvider
├── state: token (string | null)
├── state: user (AuthUser | null)
├── computed: isLoggedIn (!!token)
├── login(token, user)    → simpan ke SecureStore + update state
├── logout()              → hapus dari SecureStore + reset state
└── updateUser(user)      → update SecureStore + update state (tanpa re-login)
```

**AuthUser shape:**
```typescript
{
  id: number;
  name: string;
  email: string;
  role: string;              // "user" | "admin"
  business_category: string | null;
  region_code: string | null;
}
```

**Persistent storage keys:**
- `trendlify_token` — JWT Bearer token
- `trendlify_user` — JSON serialized AuthUser

### SelectedKeywordContext (`contexts/SelectedKeywordContext.tsx`)

Meneruskan keyword tren yang dipilih user dari Beranda/Tren ke screen AI Insight & Prediksi, menghindari prop drilling.

---

## Alur Autentikasi

```
App Launch
    │
    ▼
AuthContext useEffect
    │
    ├─ SecureStore has token? ─── YES ──► Hydrate state → render (tabs)
    │
    └─ NO ──► render (tabs)/index.tsx
                  │
                  └─► Prompt login → navigate to /login (modal)
                              │
                              ▼
                        POST /api/v1/login
                              │
                              ▼
                        login(token, user) → SecureStore
                              │
                              ▼
                        Modal dismiss → (tabs) fully accessible
```

---

## Integrasi API

### Konfigurasi URL (`constants/api.ts`)

```typescript
// Mendukung .env.local untuk testing di perangkat fisik (IP lokal)
export const API_URL = process.env.EXPO_PUBLIC_API_URL
  ?? "https://trendlify-api.up.railway.app";
```

### Pola Request

Semua request ke endpoint privat menyertakan JWT di header:

```typescript
const res = await fetch(`${API_URL}/api/v1/<endpoint>`, {
  method: "GET" | "POST" | "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload), // untuk POST/PUT
});
```

Error non-JSON dari server ditangani dengan pattern:
```typescript
let json: any = {};
try { json = await res.json(); } catch {}
if (!res.ok) { Alert.alert("Gagal", json.message ?? `Error ${res.status}`); }
```

### Endpoint yang Digunakan

| Screen | Method | Endpoint | Keterangan |
|---|---|---|---|
| Login | POST | `/login` | Return JWT + user |
| Register | POST | `/register` | Daftar akun baru |
| Profil (save) | PUT | `/profile` | Update nama & business_category |
| Ganti Password | PUT | `/change-password` | Verifikasi & update password |
| User Info | GET | `/user` | Ambil data user aktif |
| Beranda | GET | `/dashboard/overview` | Hero trend, avg score, total |
| Tren | GET | `/trends?limit=50` | Semua snapshot tren |
| Heatmap | GET | `/regions/heatmap` | Skor rata-rata per provinsi |
| AI Insight | POST | `/insights/generate` | Generate insight per keyword |
| Riwayat Insight | GET | `/insights` | Insight history user |
| Prediksi | GET | `/predictions/:snapshotId` | Prediksi 7 hari |
| Chat | POST | `/chat` | AI chatbot (Gemini) |

---

## Arsitektur Layar Utama

### Beranda (`index.tsx`)
- **Hero section**: Skor tren tertinggi saat ini (dari `/dashboard/overview`)
- **KPI Cards**: Total produk terpantau, rata-rata skor, tren naik
- **Top Trending Carousel**: Horizontal scroll card tren teratas dengan kategori icon dan badge skor
- **AI Konsultan Kuliner section**: Entry point ke fitur AI insight
- **Category icon system**: Ionicons (`cafe-outline`, `restaurant-outline`, `sparkles-outline`, `nutrition-outline`)

### Tren Kuliner (`tren.tsx`)
- **Filter chip kategori**: Semua / Modern / Tradisional / Minuman / Lainnya
- **Daftar tren**: FlatList dengan kategori icon, skor badge, dan persentase perubahan
- **Deduplication**: Client-side `reduce` per `entity_label` — hanya tampil skor tertinggi
- **CATEGORY_MAP**: Record eksplisit ~70 keyword → kategori (menghindari false-positive matching)
- **Touch fix (Android)**: Chip filter menggunakan `View` (bukan `ScrollView`) untuk menghindari konflik touch event dengan FlatList

### AI Insight (`insight.tsx`)
- Menerima keyword dari `SelectedKeywordContext`
- Hit `POST /insights/generate` dengan keyword & region
- Render narasi AI dengan `react-native-markdown-display`
- Tampilkan structured data: skor, kategori, rekomendasi

### Prediksi (`prediction.tsx`)
- Menerima `snapshotId` dari `SelectedKeywordContext`
- Hit `GET /predictions/:snapshotId`
- Tampilkan `predicted_growth_pct`, `confidence_score`, dan narasi AI
- Visualisasi tren 7 hari dengan chart (react-native-svg)

### AI Chat (`chat.tsx`)
- Chat UI dengan bubble pesan (user kiri / AI kanan)
- Hit `POST /chat` per pesan → respons Gemini AI
- Konteks bisnis kuliner dikirim sebagai system prompt oleh backend
- Render respons AI dalam format markdown

### Akun (`akun.tsx`)
- Info user (nama, email, role badge, business category)
- Navigasi ke: Profil, Ganti Password, Bantuan
- Tombol logout dengan bottom sheet confirmation modal
- Logout memanggil `AuthContext.logout()` → hapus SecureStore → redirect ke login

---

## Sistem Kategori Kuliner

Klasifikasi produk kuliner menggunakan `CATEGORY_MAP` — lookup eksplisit per keyword:

| Kategori | Icon (Ionicons) | Contoh Produk |
|---|---|---|
| Modern | `sparkles-outline` | boba, korean bbq, burnt cheesecake, matcha |
| Tradisional | `restaurant-outline` | rendang, soto, rujak buah, nasi goreng |
| Minuman | `cafe-outline` | es teh, kopi susu, wedang jahe |
| Lainnya | `nutrition-outline` | produk yang tidak terklasifikasi |

Warna badge per kategori:
- Modern: biru (#EFF6FF / #3B82F6)
- Tradisional: hijau (#F0FDF4 / #22C55E)
- Minuman: ungu (#F5F3FF / #8B5CF6)
- Lainnya: amber (#FFFBEB / #F59E0B)

---

## Design System

Semua warna didefinisikan di `constants/colors.ts`:

| Token | Hex | Kegunaan |
|---|---|---|
| `orange` | `#F97316` | Warna utama, CTA, badge tren |
| `orangeBg` | `#FFF7ED` | Background kartu, highlight |
| `stone800` | `#292524` | Teks utama |
| `stone500` | `#78716C` | Teks sekunder |
| `stone100` | `#F5F5F4` | Background field, divider |
| `emerald` | `#10B981` | Indikator sukses, tren naik |
| `red` | `#EF4444` | Error, tren turun |
| `white` | `#FFFFFF` | Background layar |

---

## Keamanan

| Aspek | Implementasi |
|---|---|
| Token Storage | `expo-secure-store` — dienkripsi oleh Keychain (iOS) / Keystore (Android) |
| Auth Header | `Bearer <JWT>` di setiap request privat |
| Token tidak di-cache di state global memory | Dibaca dari SecureStore saat app launch |
| Logout | Hapus token + user dari SecureStore, reset state → paksa re-login |
| Validasi input | Client-side validation (nama tidak kosong, password min 8 karakter) sebelum request |

---

## Deployment

### Development
```
Developer Machine
    │
    ▼
expo start ──► Expo Dev Server (Metro bundler)
    │
    ├── Expo Go App (Android/iOS) via QR Code / tunnel
    └── Android Emulator / iOS Simulator
```

### Production Build (EAS)
```
GitHub Repository
    │
    ▼
eas build --platform android|ios
    │
    ▼
Expo Application Services (EAS)
    │
    ├── APK / AAB (Android) ──► Google Play Store / direct install
    └── IPA (iOS)            ──► App Store / TestFlight
```

### Environment Variables

| Variable | Keterangan | File |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Override URL backend (untuk dev lokal) | `.env.local` |

> Default API URL (production): `https://trendlify-api.up.railway.app`

---

## Alur Data End-to-End

```
User Action (tap / input)
        │
        ▼
React Component
        │
        ├─► AuthContext.token       ← JWT dari SecureStore
        │
        ▼
fetch(API_URL + endpoint, { headers: Bearer token })
        │
        ▼
Trendlify API (Railway)
        │
        ├─► JWT verify (requireAuth middleware)
        ├─► Prisma query → Neon PostgreSQL
        └─► Gemini AI call (untuk /chat, /insights, /predictions)
        │
        ▼
JSON Response
        │
        ▼
React State update → UI re-render
```
