'use client';

// ==============================================================================
// TataDana Enterprise Superadmin Layout (Part 10 & Critical Update)
// Deep Slate / Dark Navy / Indigo Visual Aesthetic (#0B0F19)
// Role Guard (403 Access Denied), Header/Sidebar Switcher, System Health Telemetry
// ==============================================================================

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  ShieldAlert,
  Users,
  Cpu,
  Receipt,
  FileCode,
  CreditCard,
  ArrowLeft,
  Activity,
  LogOut,
  Sparkles,
  Server,
  Database,
  Radio,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const adminNav = [
  { name: 'Platform Overview', href: '/admin', icon: Activity, badge: 'LIVE' },
  { name: 'User Management', href: '/admin/users', icon: Users, badge: null },
  { name: 'AI Provider Engine', href: '/admin/ai-providers', icon: Cpu, badge: 'FAILOVER' },
  { name: 'AI Request Logs', href: '/admin/ai-logs', icon: FileCode, badge: null },
  { name: 'Payment Approvals', href: '/admin/payments', icon: CreditCard, badge: 'SLA' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading, switchUserRole, logout } = useAuth();

  const isSuperAdmin = Boolean(user && (user.is_admin || (user as any).role === 'admin'));

  // Listen to platform-wide real-time SSE stream for live admin metrics updates
  useEffect(() => {
    if (typeof window === 'undefined' || !isSuperAdmin) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime');
      const handleEvent = () => {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      };
      eventSource.addEventListener('telegram_transaction', handleEvent);
      eventSource.addEventListener('new_transaction', handleEvent);
    } catch (e) {}

    return () => {
      eventSource?.close();
    };
  }, [user, isSuperAdmin]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 animate-pulse">
            ⚡
          </div>
          <p className="text-sm font-semibold text-slate-400 animate-pulse font-mono">
            Memuat TataDana Superadmin Console...
          </p>
        </div>
      </div>
    );
  }


  // Role Guard: If user is not superadmin (role: 'admin'), render high-impact 403 Access Denied Screen
  if (!user || (!user.is_admin && (user as any).role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-5">
          {/* Ambient red security glow */}
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              403 ACCESS FORBIDDEN
            </span>
            <h1 className="text-xl font-black text-white mt-3">
              Akses Ditolak: Superadmin Saja
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Halaman ini hanya dapat diakses oleh akun dengan otorisasi Super Administrator TataDana. Akun Anda (
              <strong className="text-white">{user?.email || 'Guest'}</strong>) berstatus{' '}
              <span className="uppercase text-amber-400 font-bold">{user?.plan || 'USER'}</span> dan tidak memiliki hak akses platform console.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Sesi Pengguna:</span>
              <strong className="text-white">{user?.full_name || 'Guest'}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Status Role:</span>
              <span className="text-amber-400 font-bold">Bukan Administrator</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard Pengguna
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Superadmin Layout with Deep Slate / Dark Navy / Indigo aesthetic
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. ENTERPRISE SUPERADMIN TOP HEADER */}
      <header className="bg-[#0B0F19] text-white px-4 sm:px-6 py-3 border-b border-slate-800 sticky top-0 z-50 shadow-xl flex items-center justify-between gap-4">
        {/* Left: Branding & Health Indicators */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white leading-tight">
                  SUPERADMIN CONSOLE
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                  v2.5 PROD
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                TataDana Enterprise Control Plane
              </span>
            </div>
          </Link>

          {/* System Health Indicators (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 ml-4 pl-4 border-l border-slate-800 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM: 99.98%
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
              <Cpu className="w-3 h-3 text-indigo-400" />
              AI: PARALLEL FAILOVER
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-700">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              TELEGRAM: ONLINE (WIB)
            </span>
          </div>
        </div>

        {/* Right: Mode Switcher & Admin Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Prominent Mode Switcher Button */}
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 active:scale-95 shrink-0"
            title="Pindah ke Dashboard Pengguna Biasa"
          >
            <span className="hidden sm:inline">👥 Mode Pengguna (Dashboard)</span>
            <span className="sm:hidden">👥 Mode User</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>

          {/* Admin User Chip */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
              alt={user.full_name}
              className="w-8 h-8 rounded-full object-cover border border-indigo-500 ring-2 ring-indigo-500/20"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white truncate max-w-[130px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">
                Super Administrator
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Keluar Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: DARK NAVY SIDEBAR + CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Dark Navy Sidebar */}
        <aside className="w-full md:w-64 bg-[#0B0F19] border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            {/* Quick Switch to User Dashboard in Sidebar */}
            <div className="pb-2">
              <Link
                href="/dashboard"
                className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-500 to-orange-500 hover:from-brand-600 hover:to-orange-600 transition shadow-md shadow-brand-500/20 flex items-center justify-between group active:scale-98"
              >
                <span className="flex items-center gap-2">
                  <span>👥</span>
                  <span>Mode Pengguna</span>
                </span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
                <span>Enterprise Navigation</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* System Status Pill Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Node Engine Status</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>API Latency:</span>
                  <span className="text-emerald-400 font-bold">18 ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Failover Pool:</span>
                  <span className="text-indigo-300 font-bold">3 AI Active</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Memory Store:</span>
                  <span className="text-cyan-400 font-bold">Persistent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-800 mt-6 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
              Test Role Switcher (Demo):
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  switchUserRole('starter');
                  router.push('/dashboard');
                }}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-bold text-amber-300 transition text-center"
              >
                ➔ Starter
              </button>
              <button
                onClick={() => {
                  switchUserRole('pro');
                  router.push('/dashboard');
                }}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-bold text-brand-400 transition text-center"
              >
                ➔ Pro User
              </button>
            </div>
          </div>
        </aside>

        {/* 3. Main Admin Content Area (Deep Slate styling) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-[#070b14]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
