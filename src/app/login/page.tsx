'use client';

// ==============================================================================
// TataDana Login Page
// Split Layout 40/60 with Orange Fintech Theme, Google, & Email/Password (No OTP)
// ==============================================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { ShieldCheck, ArrowRight, Mail, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, switchUserRole } = useAuth();

  const [email, setEmail] = useState('admin@tatadana.id');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const ok = await login(email);
      if (ok) {
        const loggedInUser = tataDanaDb.getUserByEmail(email);
        if (loggedInUser?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setErrorMsg('Email tidak ditemukan atau kredensial salah.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, role: 'starter' | 'pro' | 'admin') => {
    setEmail(presetEmail);
    switchUserRole(role);
    setLoading(true);
    await login(presetEmail);
    if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* KIRI: 40% Branding Panel (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-brand-600 to-brand-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-950/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-600 font-extrabold text-2xl shadow-lg">
              T
            </div>
            <span className="text-2xl font-black tracking-tight text-white">TataDana</span>
          </Link>

          <div className="mt-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-orange-50 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" /> Fintech SaaS Generasi Baru
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-white tracking-tight">
              Keuanganmu.<br />Terkontrol.
            </h1>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Satu-satunya aplikasi pencatat keuangan pintar yang bekerja langsung layaknya aplikasi smartphone dan terintegrasi dengan Telegram bot.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-3 pt-8 border-t border-white/20">
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Ketik natural: "beli bakso 15rb" otomatis tercatat</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Chat bot otomatisasi langsung di dalam aplikasi</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Multi-wallet BCA, Mandiri, GoPay, dan Dompet Tunai</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200">
          © {new Date().getFullYear()} TataDana Indonesia. Aman, terenkripsi, terpercaya.
        </div>
      </div>

      {/* KANAN: 60% Form Panel (Full screen on mobile) */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-14 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header Logo */}
          <div className="md:hidden flex items-center justify-between pb-4 border-b border-slate-100">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">TataDana</span>
            </Link>
            <Link href="/register" className="text-sm font-semibold text-brand-600">
              Daftar
            </Link>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat datang kembali 👋
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Masuk ke akun TataDana kamu menggunakan email untuk mengelola dompet dan laporan keuangan.
            </p>
          </div>

          {/* Akses Cepat Admin (Saya) */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-2.5">
            <div className="text-xs font-bold text-brand-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-500" /> Akses Cepat Superadmin:
              </span>
              <span className="text-[10px] bg-brand-200/80 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                Admin (Saya)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@tatadana.id', 'admin')}
              className="w-full py-2.5 px-3 rounded-xl bg-white border border-brand-300 text-brand-700 hover:bg-brand-500 hover:text-white font-bold transition text-center shadow-xs flex items-center justify-center gap-2 text-xs"
            >
              👑 1-Klik Masuk Sebagai Admin (Saya)
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Email Login Form (No OTP) */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@tatadana.id atau email Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 focus:ring-4 focus:ring-brand-200 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk ke Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">atau masuk dengan</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Masuk dengan Google
          </button>

          {/* Footer Register Link */}
          <p className="text-center text-xs text-slate-500">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Daftar gratis di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
