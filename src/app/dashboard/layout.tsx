'use client';

// ==============================================================================
// TataDana User Dashboard Shell Layout
// Responsive Layout with Smartphone Bottom Nav, Floating Chat Bot, & Quick Add Modal
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import MobileNav from '@/components/mobile-nav';
import QuickAddModal from '@/components/quick-add-modal';
import ChatBotWidget from '@/components/chat-bot-widget';
import PhoneSimulatorFrame from '@/components/phone-simulator-frame';
import RealtimeNotificationBanner from '@/components/realtime-notification-banner';
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet as WalletIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Palette,
  PlusCircle,
  Bot,
  Clock,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  XCircle,
  CheckCircle2
} from 'lucide-react';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: Home },
  { name: 'Transaksi', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Budget', href: '/dashboard/budgets', icon: Target },
  { name: 'Wallet', href: '/dashboard/wallets', icon: WalletIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isImpersonating, originalAdmin, exitImpersonation, logout, isLoading, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultType, setQuickAddDefaultType] = useState<'expense' | 'income' | 'transfer'>('expense');

  const isAdminUser = Boolean(user?.is_admin || (user as any)?.role === 'admin');

  const isApproved = isAdminUser || user?.approval_status === 'approved';
  const isPending = !isApproved && (user?.approval_status === 'pending' || !user?.approval_status);
  const isRejected = !isApproved && user?.approval_status === 'rejected';

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleManualCheckStatus = async () => {
    setCheckingStatus(true);
    setStatusMessage('Memeriksa status akun ke server...');
    try {
      const refreshed = await refreshUser();
      if (refreshed?.approval_status === 'approved') {
        setStatusMessage('✅ Akun Anda telah disetujui! Membuka dashboard...');
      } else if (refreshed?.approval_status === 'rejected') {
        setStatusMessage('❌ Pendaftaran akun ditolak oleh Superadmin.');
      } else {
        setStatusMessage('⏳ Akun masih dalam antrean persetujuan Superadmin.');
      }
    } catch (e) {
      setStatusMessage('Gagal menghubungi server.');
    } finally {
      setTimeout(() => setCheckingStatus(false), 800);
    }
  };

  // Auto-poll approval status every 3 seconds if pending
  useEffect(() => {
    if (!user || isApproved) return;

    const interval = setInterval(() => {
      refreshUser();
    }, 3000);

    return () => clearInterval(interval);
  }, [user, isApproved, refreshUser]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Listen to open_quick_add custom event
  useEffect(() => {
    const handleOpenQuickAdd = (e: any) => {
      if (e.detail?.type) {
        setQuickAddDefaultType(e.detail.type);
      }
      setQuickAddOpen(true);
    };

    window.addEventListener('tatadana_open_quick_add', handleOpenQuickAdd);
    return () => window.removeEventListener('tatadana_open_quick_add', handleOpenQuickAdd);
  }, []);

  const handleOpenBot = () => {
    window.dispatchEvent(new CustomEvent('tatadana_open_bot'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-500/30 animate-pulse">
            T
          </div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Memuat TataDana...</p>
        </div>
      </div>
    );
  }

  // Pending / Rejected Approval Screen: Blocks full dashboard until approved by Admin
  if (!isApproved && user) {
    return (
      <PhoneSimulatorFrame>
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 md:p-8">
          {/* Top Branding Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-brand-500/30">
                T
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                  TataDana
                </span>
                <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">
                  Fintech Telegram
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>

          {/* Center Card */}
          <div className="my-auto py-8 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
              {/* Decorative top accent */}
              <div
                className={`absolute top-0 left-0 right-0 h-2 ${
                  isRejected ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-amber-400 via-brand-500 to-orange-500'
                }`}
              />

              {/* Status Icon */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                {isRejected ? (
                  <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shadow-inner">
                    <XCircle className="w-10 h-10" />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-3xl bg-amber-400/20 animate-ping" />
                    <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-inner relative z-10">
                      <Clock className="w-10 h-10" />
                    </div>
                  </>
                )}
              </div>

              {/* Heading & Badge */}
              <div className="space-y-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider font-mono ${
                    isRejected
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}
                  />
                  {isRejected ? 'STATUS: PENDAFTARAN DITOLAK' : 'STATUS: MENUNGGU PERSETUJUAN ADMIN'}
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isRejected ? 'Pendaftaran Akun Ditolak' : 'Menunggu Persetujuan Admin ⏳'}
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                  {isRejected
                    ? 'Mohon maaf, permohonan pendaftaran akun Anda tidak disetujui oleh Super Administrator. Hubungi admin atau buat pendaftaran baru.'
                    : `Halo ${user.full_name}! Pendaftaran akun Anda berhasil dicatat. Demi keamanan data keuangan, akun baru harus diverifikasi dan disetujui oleh Super Administrator sebelum dapat mengakses dashboard.`}
                </p>
              </div>

              {/* Account Overview Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-left space-y-2.5 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Informasi Akun Terdaftar</span>
                  <span className="font-mono text-brand-600">ID: {user.id.slice(0, 14)}...</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Nama Lengkap:
                  </span>
                  <strong className="text-slate-900 font-bold">{user.full_name}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <div className="text-right">
                    <strong className="text-slate-900 font-mono block">{user.email}</strong>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> OTP Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Nomor HP:
                  </span>
                  <strong className="text-slate-900 font-mono">{user.phone_number || '-'}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <WalletIcon className="w-3.5 h-3.5 text-slate-400" /> Saldo Awal:
                  </span>
                  <strong className="text-emerald-600 font-bold font-mono">Rp 0 (Mulai dari Nol)</strong>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal Registrasi:
                  </span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {new Date(user.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </span>
                </div>
              </div>

              {/* Status Message if any */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    statusMessage.startsWith('✅')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : statusMessage.startsWith('❌')
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {!isRejected && (
                  <button
                    type="button"
                    onClick={handleManualCheckStatus}
                    disabled={checkingStatus}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                    {checkingStatus ? 'Memeriksa Persetujuan...' : 'Cek Status Persetujuan / Refresh'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Keluar ke Halaman Login
                </button>
              </div>

              {/* Info text */}
              <div className="pt-2 text-[11px] text-slate-400">
                💡 <span className="font-semibold">Tips:</span> Halaman ini akan otomatis membuka dashboard penuh begitu Super Admin menyetujui akun Anda.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
            © {new Date().getFullYear()} TataDana Fintech Indonesia • Seluruh data tersimpan aman.
          </div>
        </div>
      </PhoneSimulatorFrame>
    );
  }

  return (
    <PhoneSimulatorFrame>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* 1. Superadmin Impersonation Banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-semibold flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-950" />
              <span>
                Mode Impersonasi: Anda sedang login sebagai <strong>{user?.full_name}</strong>.
              </span>
            </div>
            <button
              onClick={exitImpersonation}
              className="px-3 py-1 bg-amber-950 text-white rounded-lg text-xs font-bold hover:bg-black transition flex items-center gap-1.5 shrink-0 ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Keluar Impersonasi
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* 2. Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-64 flex-col bg-white border-r border-slate-200 shrink-0">
            {/* Logo & Brand */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  T
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                    TataDana
                  </span>
                  <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">
                    Fintech Telegram
                  </span>
                </div>
              </Link>
            </div>

            {/* Quick Add Action Button on Sidebar */}
            <div className="p-4 pb-2">
              <button
                type="button"
                onClick={() => {
                  setQuickAddDefaultType('expense');
                  setQuickAddOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Transaksi Baru
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 pt-2 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-brand-50 text-brand-600 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}

              {/* Bot trigger shortcut on desktop sidebar */}
              <button
                type="button"
                onClick={handleOpenBot}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-brand-600 transition text-left"
              >
                <Bot className="w-4 h-4 text-brand-500" />
                Buka Chat Bot
              </button>

              {/* Admin shortcut if user is admin */}
              {isAdminUser && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 text-white shadow-md border border-indigo-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Admin Access
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                        SUPERADMIN
                      </span>
                    </div>
                    <div className="text-xs font-black text-white leading-tight">
                      ⚡ SUPERADMIN CONSOLE
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Platform metrics, multi-provider AI & audit logs.
                    </p>
                    <Link
                      href="/admin"
                      className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      Buka Admin Console →
                    </Link>
                  </div>
                </div>
              )}
            </nav>

            {/* Theme Switcher Quick Button */}
            <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand-500" /> Tema UI
              </span>
              <button
                onClick={toggleTheme}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 transition"
              >
                {theme === 'fintech-orange' ? 'Fintech Orange' : 'Pink/Yellow'}
              </button>
            </div>

            {/* User Profile & Plan Card */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.full_name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.full_name || 'Pengguna'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user?.plan === 'pro'
                          ? 'bg-orange-100 text-brand-700 border border-brand-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {user?.plan === 'pro' ? '★ PRO' : 'STARTER'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <Link href="/dashboard/settings" className="text-slate-500 hover:text-slate-800 font-medium">
                  Pengaturan
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Keluar
                </button>
              </div>
            </div>
          </aside>

          {/* 3. Mobile Header */}
          <div className="lg:hidden w-full fixed top-0 left-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-2.5 flex items-center justify-between shadow-xs">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                T
              </div>
              <span className="font-extrabold text-slate-900 text-base">TataDana</span>
            </Link>

            <div className="flex items-center gap-2">
              {isAdminUser && (
                <Link
                  href="/admin"
                  className="px-2.5 py-1 bg-slate-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  ⚡ Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setQuickAddDefaultType('expense');
                  setQuickAddOpen(true);
                }}
                className="px-3 py-1 bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Catat
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
              <div
                className="w-72 bg-white h-full pt-16 px-4 py-6 flex flex-col justify-between shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                          active
                            ? 'bg-brand-50 text-brand-600 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-brand-500' : 'text-slate-400'}`} />
                        {item.name}
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleOpenBot();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-brand-600 bg-orange-50 mt-2 text-left"
                  >
                    <Bot className="w-4 h-4 text-brand-500" />
                    Buka Chat Bot 🤖
                  </button>

                  {isAdminUser && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-black text-white bg-slate-900 border border-indigo-700/60 mt-2 text-left shadow-sm"
                    >
                      <span className="text-indigo-400">⚡</span>
                      <span>Superadmin Console</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Palette className="w-4 h-4 text-brand-500" /> Tema UI
                    </span>
                    <button
                      onClick={toggleTheme}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition shadow-xs"
                    >
                      {theme === 'fintech-orange' ? 'Fintech Orange' : 'Pink/Yellow'}
                    </button>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 px-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Keluar dari Akun
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Main View Content */}
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 pb-20 lg:pb-8 p-3 sm:p-6 md:p-8 bg-slate-50/70">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* 5. Smartphone Bottom Navigation Bar (Mobile View) */}
        <MobileNav
          onOpenQuickAdd={() => {
            setQuickAddDefaultType('expense');
            setQuickAddOpen(true);
          }}
          onOpenBot={handleOpenBot}
        />

        {/* 6. Quick Add Transaction Modal */}
        <QuickAddModal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          defaultType={quickAddDefaultType}
        />

        {/* 7. Persistent Floating Telegram Chat Bot Widget */}
        <ChatBotWidget />

        {/* 8. Real-time Telegram Transaction Toast/Banner Notification */}
        <RealtimeNotificationBanner />
      </div>
    </PhoneSimulatorFrame>
  );
}
