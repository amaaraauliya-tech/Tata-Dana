'use client';

// ==============================================================================
// TataDana Register Page
// 2-Step Registration: Step 1 (Account Info) -> Step 2 (Email OTP Verification) -> Admin Approval
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Registration step: 1 = Fill Form, 2 = Enter Email OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // OTP Fields
  const [otpCode, setOtpCode] = useState('');
  const [sentOtpPreview, setSentOtpPreview] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit account details and request Email OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Mohon lengkapi Nama Lengkap, Email, dan Kata Sandi.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Format alamat email tidak valid.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal mengirimkan kode OTP ke email.');
      }

      setSentOtpPreview(data.otpCode || '123456');
      setResendCooldown(30);
      setSuccessMsg(`Kode OTP 6-digit berhasil dikirim ke ${email}.`);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat mengirim OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Gagal mengirim ulang kode OTP.');
      }
      setSentOtpPreview(data.otpCode || '123456');
      setResendCooldown(30);
      setSuccessMsg(`Kode OTP baru berhasil dikirim ke ${email}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize registration
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMsg('Masukkan 6 digit kode OTP yang telah dikirim ke email.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Verify OTP with server
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode.trim() }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.ok) {
        throw new Error(verifyData.error || 'Kode OTP salah atau telah kedaluwarsa.');
      }

      // 2. Register user into database with email_verified: true, approval_status: 'pending', and initial balance Rp 0
      await register({
        full_name: fullName,
        email,
        phone_number: phone || undefined,
      });

      // 3. Navigate to dashboard (which renders the pending approval screen)
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memverifikasi kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* KIRI: 40% Branding Panel */}
      <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-brand-600 to-brand-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-950/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-600 font-extrabold text-2xl shadow-lg">
              T
            </div>
            <span className="text-2xl font-black tracking-tight text-white">TataDana</span>
          </Link>

          <div className="mt-20 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-orange-50 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" /> Pendaftaran Terverifikasi & Aman
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-white tracking-tight">
              Mulai Kendalikan<br />Uangmu Hari Ini.
            </h1>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Daftar sekarang dengan verifikasi kode OTP email dan persetujuan resmi admin. Seluruh saldo awal pengguna dimulai dari nol (Rp 0) untuk kemudahan pencatatan riil.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-3 pt-8 border-t border-white/20">
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Verifikasi email OTP 6-digit real-time</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Saldo awal pengguna murni mulai dari Rp 0</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Persetujuan terpusat oleh Super Administrator</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-orange-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>Didukung database Supabase PostgreSQL</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200">
          © {new Date().getFullYear()} TataDana. Solusi literasi finansial Indonesia.
        </div>
      </div>

      {/* KANAN: 60% Form Panel */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-14 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden flex items-center justify-between pb-4 border-b border-slate-100">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">TataDana</span>
            </Link>
            <Link href="/login" className="text-sm font-semibold text-brand-600">
              Masuk
            </Link>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-brand-500 text-white shadow-md' : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 2 ? '✓' : '1'}
              </div>
              <span className={`text-xs font-bold ${step === 1 ? 'text-brand-600' : 'text-slate-500'}`}>
                1. Data Diri
              </span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-bold ${step === 2 ? 'text-brand-600' : 'text-slate-400'}`}>
                2. Verifikasi Email OTP
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {step === 1 ? 'Buat Akun TataDana 🚀' : 'Verifikasi Email Anda 📬'}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {step === 1
                ? 'Lengkapi data akun untuk menerima kode verifikasi OTP melalui email.'
                : `Masukkan kode OTP 6-digit yang dikirimkan ke ${email}.`}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Form Registrasi Data Diri */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nama Lengkap Anda"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email (Untuk Pengiriman OTP)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor WhatsApp / HP (Opsional, untuk bot Telegram)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 focus:ring-4 focus:ring-brand-200 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Mengirimkan Kode OTP...' : 'Lanjut ke Verifikasi Email OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Verifikasi Kode OTP Email */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5">
              {/* OTP Preview Helper Box for smooth local testing */}
              {sentOtpPreview && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-600" />
                    <div>
                      <span className="text-[11px] text-slate-500 block">Kode OTP Anda:</span>
                      <strong className="text-base font-black font-mono text-brand-700 tracking-wider">
                        {sentOtpPreview}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(sentOtpPreview)}
                    className="px-2.5 py-1 text-xs font-bold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition shadow-xs"
                  >
                    Salin & Isi
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Masukkan 6-Digit Kode OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    placeholder="123456"
                    className="w-full py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.5em] rounded-2xl border-2 border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition text-slate-900 bg-slate-50/50"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Kode berlaku selama 10 menit. Jangan berikan kode ini kepada pihak mana pun.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-500 hover:bg-brand-600 focus:ring-4 focus:ring-brand-200 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Memverifikasi...' : '✓ Verifikasi & Selesaikan Pendaftaran'}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Ubah Email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-brand-600 hover:text-brand-700 font-bold disabled:text-slate-400 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Kode'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-center text-xs text-slate-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
