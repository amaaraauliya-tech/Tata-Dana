# TataDana 🇮🇩 — Catat Keuangan Semudah Chat dari Telegram Kamu

TataDana adalah platform manajemen keuangan pribadi (Fintech SaaS) premium Indonesia yang terintegrasi penuh dengan **Telegram Bot** dan **Supabase**. Pengguna dapat mencatat pemasukan dan pengeluaran cukup dengan mengirim chat bahasa natural, pesan suara (Voice Note), atau foto struk belanja belanjaan di Telegram. Setiap transaksi otomatis tersimpan rapi dan diolah menjadi statistik interaktif, visualisasi budget, serta laporan resmi on-demand (PDF & Excel) di dashboard TataDana.

---

## 🌟 Fitur Utama

### 1. Telegram Bot Pintar (Inti Produk)
- **Natural Language Parsing**: Menggunakan AI Multi-Provider (Gemini, OpenAI, DeepSeek) dengan deteksi format slang Indonesia (`15rb`, `500k`, `1.5jt`, `gajian 5jt`).
- **Format Reply Standar Fintech**: Tampilan visual terstruktur lengkap dengan tanggal WIB, nominal, kategori ber-emoji, dompet aktif, dan progress bar visual budget (`████░░░░░░ 40%`).
- **Input Foto Struk (Pro)**: Ekstraksi item belanjaan, harga per item, dan nama merchant dengan AI Vision OCR. Transaksi ditampilkan utuh dan bisa di-expand rinciannya di dashboard web.
- **Input Voice Note (VN)**: Deteksi suara via AI Speech-to-Text (maksimal 60 detik) dengan baris konfirmasi transkrip `🎙️ Transkrip: "[hasil suara]"`.
- **Bot Commands**: `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan`.
- **AI Financial Advisor (Pro)**: Menganalisis lonjakan pengeluaran kategori (>50%) dan rasio belanja bulanan secara otomatis tanpa perintah khusus.
- **Reminder Harian**: Pengingat rutin maksimal 2x sehari sesuai jam pilihan pengguna.

### 2. User Dashboard Web App
- **Beranda Overview**: 4 kartu statistik utama (Total Saldo, Pemasukan, Pengeluaran, Sisa Budget), grafik lingkaran kategori, bar chart komparasi 6 bulan, dan tren pengeluaran harian.
- **Multi-Wallet**: Dukungan rekening Bank (BCA, Mandiri), E-Wallet (GoPay, OVO), dan Uang Tunai, dengan penanda 1 dompet default untuk Telegram.
- **Kategori & Target Budget**: Rekomendasi onboarding awal dari AI, kategori custom dengan emoji dan warna, serta alert visual saat mencapai 80% dan 100%.
- **Laporan Native**: Tabel transaksi sortable per kolom, filter multi-kriteria, metrik net cashflow, top 5 kategori, dan export instan ke **PDF** dan **Excel (.xlsx)**.
- **Settings & Test Koneksi Telegram**: Wizard integrasi BotFather dengan tombol fungsional **Test Koneksi** (`getMe` & `setWebhook` otomatis).
- **Dual Theme Preset**: Tema default Fintech Orange & White (#F97316) dan alternatif Baby Pink & Soft Yellow (`/generative_ui`).

### 3. Superadmin Console
- **Superadmin Impersonation**: Akses langsung ke dashboard pengguna tanpa perlu password atau re-login.
- **Multi-Provider AI Switcher**: Mode Single atau Mode Paralel Failover antar provider (Gemini / OpenAI / DeepSeek).
- **Log Pemanggilan AI**: Monitoring token prompt/output, latency ms, dan estimasi biaya operasional.
- **Review Pembayaran**: Approval atau reject bukti transfer manual upgrade paket Pro.
- **Audit Logs**: Rekam jejak seluruh investigasi data transaksi pengguna demi menjaga privasi.

---

## 🏗️ Struktur Direktori

```
tatadana/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql       # Skema Postgres + RLS + Triggers lengkap
└── src/
    ├── types/
    │   └── database.ts                  # TypeScript definitions
    ├── lib/
    │   ├── supabase/                    # Supabase browser & server clients
    │   ├── mock-db.ts                   # In-memory reactive state & seed data
    │   ├── ai/
    │   │   └── multi-provider.ts        # Engine multi-provider AI & failover
    │   ├── telegram/
    │   │   └── bot-logic.ts             # Logika bot, parser nominal & reply formatter
    │   ├── reports/
    │   │   └── pdf-excel-generator.ts   # jsPDF & SheetJS report builder
    │   └── otp/
    │       └── phone-otp.ts             # Dual-mode OTP (Instant 123456 + SMS Gateway)
    ├── context/
    │   ├── auth-context.tsx             # Auth, role switching & impersonation
    │   └── theme-context.tsx            # Orange vs Pink/Yellow presets
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── page.tsx                     # 15-Section Fintech Landing Page
        ├── login/page.tsx               # 40/60 Split Login + Phone OTP
        ├── register/page.tsx            # 40/60 Split Register + AI Onboarding
        ├── dashboard/
        │   ├── layout.tsx               # Dashboard shell & mobile drawer
        │   ├── page.tsx                 # Beranda overview & 4 stats cards
        │   ├── transactions/page.tsx    # Transaksi & expander rincian struk
        │   ├── reports/page.tsx         # Laporan & export PDF/Excel
        │   ├── budgets/page.tsx         # Target budget & visual progress bar
        │   ├── wallets/page.tsx         # Multi-wallet & default selector
        │   └── settings/page.tsx        # Telegram Bot wizard & test koneksi
        ├── admin/
        │   ├── layout.tsx               # Superadmin shell
        │   ├── page.tsx                 # Admin overview & audit logs
        │   ├── ai-providers/page.tsx    # Manajemen provider & failover
        │   ├── users/page.tsx           # Directory user, impersonate & inspeksi
        │   ├── ai-logs/page.tsx         # Monitor latensi & biaya token
        │   └── payments/page.tsx        # Verifikasi bukti transfer manual
        └── api/
            ├── telegram/webhook/route.ts # Webhook Telegram (idempotent)
            ├── telegram/test-connection/route.ts # getMe & setWebhook caller
            ├── otp/route.ts             # Endpoint kirim/verifikasi OTP
            └── payment/midtrans/route.ts # Midtrans webhook & manual payment handler
```

---

## 🚀 Cara Menjalankan Project

### 1. Instalasi Dependensi
```bash
cd tatadana
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, dan kunci API provider AI kamu. Untuk pengujian instan tanpa SMS gateway berbayar, `ENABLE_MOCK_OTP=true` telah aktif secara bawaan (kode verifikasi OTP: `123456`).

### 3. Migrasi Database Supabase
Jalankan file migrasi di dashboard Supabase (SQL Editor) atau lewat CLI:
```bash
supabase db push
# atau jalankan isi file supabase/migrations/001_initial_schema.sql
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Akun Demo Cepat
Aplikasi menyediakan akun pra-isi untuk pengujian instan di halaman login:
1. **Starter Plan User**: `budi@tatadana.id` (No HP: `+6281234567890`)
2. **Pro Plan User**: `siti@tatadana.id` (No HP: `+6281987654321`)
3. **Superadmin**: `admin@tatadana.id` (No HP: `+6281112223334`)

---

## 🔒 Kebijakan Keamanan & Privasi
- **Timezone WIB (Asia/Jakarta)** diterapkan pada seluruh transaksi dan pesan balasan bot.
- **Idempotensi Webhook**: Update ID dari Telegram dicatat untuk mencegah pencatatan transaksi ganda akibat retry otomatis jaringan.
- **Audit Logging**: Setiap tindakan administratif (inspeksi transaksi pengguna atau impersonation) otomatis tercatat pada riwayat audit sistem.
