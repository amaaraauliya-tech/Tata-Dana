'use client';

// ==============================================================================
// TataDana Fintech Landing Page (Part 7 Specification)
// 15 Sections in Exact Mandated Order with Interactive Live Demo & Telegram Bot Preview
// Theme: Modern Orange & Pure White Fintech
// ==============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Bot,
  FileSpreadsheet,
  Zap,
  Star,
  Receipt,
  Mic,
  PieChart,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'lifetime'>('lifetime');
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });

  // Interactive Live Chat Demo State
  const [demoInput, setDemoInput] = useState('');
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'user',
      text: 'Makan siang bakso malang 25rb',
    },
    {
      sender: 'bot',
      text: `📅 Jumat, 13 Maret 2026 — 12:45 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp25.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 BCA Utama
├ Catatan : Makan siang bakso malang 25rb
└ Saldo : Rp5.175.000

📊 Budget Makanan bulan ini:
████████░░ 82% — sisa Rp360.000
⚠️ Hati-hati, budget kategori ini sudah mencapai 82%!`,
    },
  ]);

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSendDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    const userText = demoInput.trim();
    const newChat = [...demoChat, { sender: 'user' as const, text: userText }];

    // Realistic bot instant response
    let botReply = '';
    const lower = userText.toLowerCase();

    if (lower.includes('gaji') || lower.includes('5jt') || lower.includes('masuk')) {
      botReply = `📅 Jumat, 13 Maret 2026 — 13:00 WIB
💰 Pemasukan tercatat!
├ Nominal : Rp5.000.000
├ Kategori : 💼 Pemasukan (Gaji)
├ Dompet : 👛 BCA Utama
└ Saldo baru : Rp10.175.000

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
    } else {
      botReply = `📅 Jumat, 13 Maret 2026 — 13:00 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp35.000
├ Kategori : 🏷️ Belanja Harian
├ Dompet : 👛 BCA Utama
├ Catatan : ${userText}
└ Saldo : Rp5.140.000

📊 Budget Belanja bulan ini:
████░░░░░░ 45% — sisa Rp550.000
👍 Pengeluaran masih aman terkendali.`;
    }

    setDemoChat([...newChat, { sender: 'bot' as const, text: botReply }]);
    setDemoInput('');
  };

  const faqData = [
    {
      q: 'Apakah bisa menggunakan fitur foto struk belanja di paket Starter?',
      a: 'Fitur foto struk belanja dengan AI OCR secara spesifik merupakan fitur eksklusif paket Pro. Pengguna Starter dapat mencatat semua transaksi secara bebas melalui pesan teks Telegram dan Voice Note.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Data keuangan kamu 100% tersimpan di database PostgreSQL privat pada infrastruktur enterprise Supabase dengan Row Level Security (RLS). Token bot Telegram kamu disimpan secara terenkripsi, dan TataDana tidak pernah membagikan data kepada pihak ketiga.',
    },
    {
      q: 'Apakah saya butuh bot Telegram baru untuk setiap anggota keluarga?',
      a: 'Tidak. TataDana menggunakan 1 bot bersama yang terintegrasi. Sistem mengenali akun kamu secara otomatis melalui nomor WhatsApp/HP yang sudah terverifikasi saat mendaftar.',
    },
    {
      q: 'Apakah saya bisa mencatat transaksi dengan mata uang asing?',
      a: 'Secara default TataDana menggunakan Rupiah Indonesia (IDR) dan zona waktu WIB (Asia/Jakarta). Kamu juga dapat mengubah preferensi mata uang ke USD atau SGD di tab Pengaturan.',
    },
    {
      q: 'Bagaimana cara kerja Voice Note (VN) di bot Telegram?',
      a: 'Cukup tahan tombol mic di Telegram dan bicara natural, misal "Isi bensin motor shell 50 ribu". Suara kamu ditranskrip oleh AI Speech-to-Text dan langsung dicatat ke kategori Transportasi.',
    },
    {
      q: 'Apakah paket Pro benar-benar sekali bayar tanpa langganan tersembunyi?',
      a: 'Ya, paket Pro adalah Rp99.000 Sekali Bayar (Lifetime Access). Kamu mendapatkan semua fitur saat ini dan update fitur Pro di masa depan tanpa tagihan bulanan.',
    },
    {
      q: 'Apakah saya bisa mengekspor laporan ke format Excel atau PDF?',
      a: 'Bisa! Di halaman native Laporan pada dashboard, pengguna Pro dapat mengekspor rekap keuangan berdesain rapi ke PDF dan spreadsheet Excel (.xlsx) sesuai rentang tanggal yang dipilih.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* 1. NAVBAR (Sticky) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-xl shadow-md">
              T
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">TataDana</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-brand-600 transition">Fitur</a>
            <a href="#demo" className="hover:text-brand-600 transition">Demo Bot</a>
            <a href="#harga" className="hover:text-brand-600 transition">Harga</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-md transition"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* 2 & 3 & 4. HERO SECTION */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        {/* Pre-headline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-brand-700 border border-orange-200 shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          ✨ Catat keuangan langsung dari Telegram
        </div>

        {/* Headline (H1) with Orange Gradient on Keywords */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Gaji habis sebelum akhir bulan? Sudah saatnya kamu tahu{' '}
          <span className="gradient-orange-text">ke mana uangmu pergi.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        {/* 6. CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
          >
            Mulai Gratis Sekarang <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-sm"
          >
            Lihat cara kerjanya →
          </a>
        </div>

        {/* 5. HERO SECTION VIDEO (Marked Placeholder as specified) */}
        <div className="pt-8">
          {/* // TODO: ganti dengan video asli demo interaksi Telegram TataDana saat beta user live */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 aspect-video max-w-3xl mx-auto flex items-center justify-center group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
              alt="Video Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition duration-500"
            />
            <div className="relative z-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition">
                <Play className="w-7 h-7 fill-white ml-1" />
              </div>
              <p className="text-xs font-semibold text-white/90 tracking-wide uppercase">
                Tonton Video Cara Kerja (1 Menit)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7 & 8. PROBLEM AWARE BULLETS & SOLUTION TRANSITION */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Masalah Nyata Finansial
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Kenapa mencatat pengeluaran selalu terasa berat?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi keuangan tradisional terlalu banyak formulir, dropdown akun, dan loading lama yang bikin malas mencatat saat di kasir.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pengeluaran kecil seperti kopi, jajan, ojol, dan parkir seringkali bocor halus tanpa pernah tercatat di buku.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Budget tanpa pengingat otomatis di aplikasi obrolan yang sering dibuka sama saja dengan tidak ada budget.
              </p>
            </div>
          </div>

          {/* Solution Transition */}
          <div className="text-center pt-6 space-y-2 max-w-xl mx-auto">
            <p className="text-sm md:text-base font-semibold text-slate-600">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </p>
            <div className="text-2xl md:text-3xl font-black text-brand-600">
              Introducing TataDana.
            </div>
          </div>
        </div>
      </section>

      {/* 9. INTERACTIVE DASHBOARD & TELEGRAM BOT PREVIEW */}
      <section id="demo" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Interactive Experience
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Coba Langsung di Sini: Ketik & Lihat Balasannya
          </h2>
          <p className="text-xs text-slate-500">
            Ketik transaksi finansial Indonesia favoritmu di simulasi obrolan Telegram di bawah ini.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Telegram Live Interactive Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[520px]">
            {/* Telegram Header */}
            <div className="bg-[#24A1DE] text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#24A1DE] font-black flex items-center justify-center text-lg shadow">
                T
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">TataDana Bot (@TataDanaBot)</h3>
                <span className="text-[11px] text-sky-100">bot terverifikasi fintech</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFE7DD]/40">
              {demoChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#EEFFDE] text-slate-900 rounded-tr-none'
                        : 'bg-white text-slate-900 rounded-tl-none font-mono text-[11px] whitespace-pre-line'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendDemo} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder='Ketik misal: "Gajian 5jt" atau "Beli bensin 35rb"'
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-500 text-white font-bold rounded-xl text-xs hover:bg-brand-600 transition"
              >
                Kirim
              </button>
            </form>
          </div>

          {/* Interactive Web Dashboard Mockup */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-400 ml-2">app.tatadana.id/dashboard</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-brand-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Real-time Sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Saldo Dompet</span>
                <div className="text-lg font-black text-slate-900 mt-1">Rp5.175.000</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pemasukan Bulan Ini</span>
                <div className="text-lg font-black text-emerald-600 mt-1">Rp9.000.000</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Target Budget Makanan:</span>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Terpakai Rp1.640.000 (82%)</span>
                <span>Sisa Rp360.000</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow"
              >
                Jelajahi Dashboard Lengkap <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FITUR SECTION (3 Alternating Layout Features) */}
      <section id="fitur" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Feature 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-brand-700">
                <Bot className="w-3.5 h-3.5" /> Fitur 1
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Catat via Telegram — Teks, Voice Note, & Foto Struk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tidak perlu login buka aplikasi baru. Cukup chat bot seperti kirim pesan ke teman. AI kami otomatis mengenali format bahasa gaul Indonesia seperti "15rb", "500k", hingga "1.5jt". Khusus akun Pro, kirim foto struk dan item belanjaan akan diekstrak otomatis!
              </p>
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
                <li className="flex items-center gap-2">✓ Parsing natural language berbasis LLM multi-provider</li>
                <li className="flex items-center gap-2">✓ Support Voice Note hingga 60 detik</li>
                <li className="flex items-center gap-2">✓ Deteksi struk multi-item belanja supermarket</li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl bg-orange-50 border border-orange-200 shadow-sm flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1554415707-9e49fe83083f?auto=format&fit=crop&w=600&q=80"
                alt="Receipt Scan"
                className="rounded-2xl shadow-lg w-full max-w-sm object-cover h-64"
              />
            </div>
          </div>

          {/* Feature 2 (Alternating) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow space-y-3 w-full max-w-sm">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>TataDana Laporan PDF & Excel</span>
                  <span className="text-brand-600">On-Demand</span>
                </div>
                <div className="h-20 bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] font-mono text-slate-600">
                  [PDF] Ringkasan Cashflow Maret 2026<br />
                  Total Masuk: Rp9.000.000<br />
                  Total Keluar: Rp4.200.000
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-center text-xs font-bold">
                    PDF Siap Unduh
                  </div>
                  <div className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-center text-xs font-bold">
                    Excel (.xlsx)
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Fitur 2
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Laporan & Export Otomatis di Dashboard
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap transaksi yang dicatat via bot langsung masuk ke dashboard TataDana tanpa jeda. Kamu dapat memfilter berdasarkan dompet, kategori, dan rentang tanggal serta men-generate laporan PDF & Excel resmi secara on-demand.
              </p>
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
                <li className="flex items-center gap-2">✓ Tabel transaksi native dengan sortable kolom</li>
                <li className="flex items-center gap-2">✓ Export laporan PDF berdesain fintech profesional</li>
                <li className="flex items-center gap-2">✓ Simpan riwayat export untuk download ulang kapan saja</li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                <Sparkles className="w-3.5 h-3.5" /> Fitur 3
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                AI Financial Advisor — Peringatan Proaktif
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukan cuma mencatat, TataDana proaktif menjaga dompetmu. Jika pengeluaran satu kategori naik lebih dari 50% atau total belanja mencapai 80% dari pemasukan, AI Financial Advisor langsung mengirim saran taktis langsung di chat Telegram kamu.
              </p>
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2">
                <li className="flex items-center gap-2">✓ Deteksi anomali belanja secara otomatis</li>
                <li className="flex items-center gap-2">✓ Saran personal actionable disesuaikan dengan pola pengeluaran</li>
                <li className="flex items-center gap-2">✓ Notifikasi reminder harian terjadwal (maksimal 2x sehari)</li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl bg-purple-50 border border-purple-200 shadow-sm flex items-center justify-center">
              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow space-y-2 w-full max-w-sm text-xs font-mono">
                <div className="font-bold text-purple-800">🤖 Financial Advisor</div>
                <div className="text-slate-700 leading-relaxed">
                  "Hei Budi! Pengeluaran kategori Makanan melonjak +65% minggu ini. Saran: kurangi pesan antar makanan selama 4 hari ke depan agar budget aman!"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. TESTIMONI (Masonry Grid Placeholder as specified) */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Kata Pengguna Awal
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Dipercaya Profesional Muda Indonesia
          </h2>
          <p className="text-xs text-slate-400">
            {/* // TODO: ganti dengan testimoni asli dari beta user setelah peluncuran */}
            Ulasan simulasi tahap pra-rilis TataDana
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Sebelumnya selalu malas buka app keuangan tiap beli kopi atau naik ojek. Sekarang tinggal ketik di Telegram, langsung tercatat otomatis. Sisa uang bulanan jadi jelas."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                AN
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Aditya Nugraha</span>
                <span className="text-[10px] text-slate-400">Software Engineer, Jakarta</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Fitur foto struk belanja di paket Pro juara banget! Beli barang di minimarket langsung dipecah per-item tanpa harus ketik satu-satu harganya."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                MW
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Maya Wulandari</span>
                <span className="text-[10px] text-slate-400">Freelancer Desain, Bandung</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Budget alert yang dikirim bot pas pengeluaran nyentuh 80% bener-bener penyelamat akhir bulan saya. UI webnya juga bersih dan cepat."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                RP
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Rizky Pratama</span>
                <span className="text-[10px] text-slate-400">Product Manager, Surabaya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. PRICING SECTION (Starter vs Pro) */}
      <section id="harga" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Pilihan Paket Langganan
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Investasi Kecil untuk Kontrol Finansial Seumur Hidup
            </h2>
            <p className="text-xs text-slate-500">
              Mulai gratis dengan paket Starter atau unlock fitur AI penuh dengan Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dasar</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Starter</h3>
                <div className="text-3xl font-black text-slate-900 my-4">
                  Rp49.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Cocok untuk pengguna pemula yang ingin mulai disiplin mencatat transaksi lewat pesan teks Telegram.
                </p>

                <ul className="text-xs space-y-3 text-slate-700">
                  <li className="flex items-center gap-2">✓ Catat transaksi via teks Telegram & Voice Note</li>
                  <li className="flex items-center gap-2">✓ Maksimal 50 transaksi / bulan</li>
                  <li className="flex items-center gap-2">✓ Maksimal 3 dompet & 5 kategori budget</li>
                  <li className="flex items-center gap-2">✓ Ringkasan laporan bulanan</li>
                  <li className="flex items-center gap-2 text-slate-400">✕ Tanpa scan struk via foto</li>
                  <li className="flex items-center gap-2 text-slate-400">✕ Tanpa AI Financial Advisor</li>
                  <li className="flex items-center gap-2 text-slate-400">✕ Tanpa export PDF / Excel</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 text-center rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-900 transition"
              >
                Mulai dengan Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl border-2 border-brand-500 bg-white shadow-xl space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-6 bg-brand-500 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow">
                Paling Populer & Hemat
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Lengkap</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">TataDana Pro</h3>
                <div className="text-3xl font-black text-slate-900 my-4">
                  Rp99.000 <span className="text-xs font-normal text-slate-500">Sekali Bayar Seumur Hidup</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Akses tak terbatas untuk kebebasan finansial penuh dengan AI OCR dan penasihat keuangan pribadi.
                </p>

                <ul className="text-xs space-y-3 text-slate-800 font-medium">
                  <li className="flex items-center gap-2">✨ <strong>Unlimited</strong> transaksi setiap bulan</li>
                  <li className="flex items-center gap-2">✨ <strong>Unlimited</strong> dompet & kategori custom</li>
                  <li className="flex items-center gap-2">✨ Input via foto struk belanja dengan <strong>AI OCR</strong></li>
                  <li className="flex items-center gap-2">✨ <strong>AI Financial Advisor</strong> aktif proaktif</li>
                  <li className="flex items-center gap-2">✨ Laporan lengkap + Export <strong>PDF & Excel</strong></li>
                  <li className="flex items-center gap-2">✨ Sinkronisasi spreadsheet & prioritas support</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 text-center rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-md transition"
              >
                Dapatkan Akses Pro Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION (>= 7 Questions) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">FAQ</span>
          <h2 className="text-3xl font-black text-slate-900">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-xs text-slate-500">
            Semua hal yang perlu kamu ketahui tentang cara kerja TataDana.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {faqData.map((item, idx) => {
            const isOpen = !!faqOpen[idx];
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-brand-600 transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-6">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 14. FINAL CTA SECTION (Orange Gradient) */}
      <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Mulai kendalikan keuanganmu hari ini.
          </h2>
          <p className="text-sm text-orange-100 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pengguna lain yang berhenti menebak-nebak ke mana perginya gaji mereka setiap bulan.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-sm bg-white text-brand-600 hover:bg-orange-50 shadow-2xl transition"
            >
              Mulai Gratis Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 15. FOOTER (4 Columns) */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Logo + Tagline + Sosmed */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-lg">
                T
              </div>
              <span className="text-xl font-black tracking-tight">TataDana</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <a href="#" className="hover:text-white">Instagram</a>
              <span>•</span>
              <a href="#" className="hover:text-white">Twitter/X</a>
              <span>•</span>
              <a href="#" className="hover:text-white">Telegram</a>
            </div>
          </div>

          {/* Col 2: Produk */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Produk</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#fitur" className="hover:text-white">Pencatatan Telegram Bot</a></li>
              <li><a href="#fitur" className="hover:text-white">Scan Foto Struk OCR</a></li>
              <li><a href="#fitur" className="hover:text-white">AI Financial Advisor</a></li>
              <li><a href="#fitur" className="hover:text-white">Laporan PDF & Excel</a></li>
            </ul>
          </div>

          {/* Col 3: Perusahaan */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Perusahaan</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white">Tentang TataDana</a></li>
              <li><a href="#" className="hover:text-white">Karir</a></li>
              <li><a href="#" className="hover:text-white">Blog Literasi Finansial</a></li>
              <li><a href="#" className="hover:text-white">Press Kit</a></li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal & Bantuan</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-white">Keamanan Database</a></li>
              <li><a href="#" className="hover:text-white">Kontak: support@tatadana.id</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} TataDana Indonesia. Hak cipta dilindungi undang-undang.
        </div>
      </footer>
    </div>
  );
}
