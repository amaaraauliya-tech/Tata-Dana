'use client';

// ==============================================================================
// TataDana Superadmin Platform Overview (/admin)
// Metrics: Total Registered Users, Total Volume Transaksi Platform,
// Gateway Payment Status, Active AI Provider, Live Telemetry, & Audit Logs
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  Users,
  CreditCard,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  ExternalLink,
  DollarSign,
  FileCode,
  Sparkles
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState(tataDanaDb.getPlatformMetrics());
  const [users, setUsers] = useState(tataDanaDb.getUsers());
  const [aiLogs, setAiLogs] = useState(tataDanaDb.getAILogs());
  const [payments, setPayments] = useState(tataDanaDb.getPayments());
  const [auditLogs, setAuditLogs] = useState(tataDanaDb.getAuditLogs());
  const [aiSettings, setAiSettings] = useState(tataDanaDb.getAISettings());
  const [providers, setProviders] = useState(tataDanaDb.getAIProviders());

  useEffect(() => {
    const refresh = () => {
      setMetrics(tataDanaDb.getPlatformMetrics());
      setUsers([...tataDanaDb.getUsers()]);
      setAiLogs([...tataDanaDb.getAILogs()]);
      setPayments([...tataDanaDb.getPayments()]);
      setAuditLogs([...tataDanaDb.getAuditLogs()]);
      setAiSettings({ ...tataDanaDb.getAISettings() });
      setProviders([...tataDanaDb.getAIProviders()]);
    };

    window.addEventListener('tatadana_data_updated', refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('tatadana_data_updated', refresh);
      clearInterval(interval);
    };
  }, []);

  const avgLatency =
    aiLogs.length > 0
      ? Math.round(aiLogs.reduce((acc, l) => acc + l.latency_ms, 0) / aiLogs.length)
      : 0;

  const totalTokens = aiLogs.reduce((acc, l) => acc + l.prompt_tokens + l.completion_tokens, 0);

  const approvedRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((acc, p) => acc + p.amount, 0);

  const primaryProvider = providers.find((p) => p.provider_name === aiSettings.primary_provider);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              PLATFORM OPERATIONAL DASHBOARD
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Platform Overview & Operations ⚡
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring total pengguna terdaftar, volume transaksi lintas platform, payment gateway, dan cluster AI failover.
          </p>
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Kelola Pengguna
          </Link>
          <Link
            href="/admin/ai-providers"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" /> Konfigurasi AI
          </Link>
        </div>
      </div>

      {/* Alert Banner for Pending User Approvals */}
      {(metrics.pendingApprovals || 0) > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-xl shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
              ⏳
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{metrics.pendingApprovals} Pengguna Baru Menunggu Persetujuan Admin</span>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.2 rounded-full animate-pulse">
                  PERLU REVIEW
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Terdapat pendaftaran akun baru yang belum disetujui. Pengguna ini belum dapat mengakses dashboard penuh sampai Anda menyetujuinya.
              </p>
            </div>
          </div>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            Review Pengguna ({metrics.pendingApprovals}) →
          </Link>
        </div>
      )}

      {/* 4 MANDATED CORE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Registered Users */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-indigo-500/60 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Total Registered Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-950/70 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {metrics.totalUsers} <span className="text-base text-slate-400 font-bold">Akun</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                {metrics.proUsers} Pro User
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {metrics.starterUsers} Starter
              </span>
              {(metrics.pendingApprovals || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  {metrics.pendingApprovals} Pending
                </span>
              )}
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Telegram Link Rate:</span>
            <strong className="text-emerald-400">
              {metrics.connectedTgCount} / {metrics.totalUsers} ({Math.round((metrics.connectedTgCount / Math.max(1, metrics.totalUsers)) * 100)}%)
            </strong>
          </div>
        </div>

        {/* KPI 2: Total Volume Transaksi Platform */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-cyan-500/60 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Total Volume Transaksi
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
              {formatRupiah(metrics.totalVolume)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metrics.totalTxCount} total transaksi diproses</span>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rata-rata Transaksi:</span>
            <strong className="text-white">
              {formatRupiah(metrics.totalTxCount > 0 ? metrics.totalVolume / metrics.totalTxCount : 0)}
            </strong>
          </div>
        </div>

        {/* KPI 3: Gateway Payment Status */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-amber-500/60 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Payment Gateway Status
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                {metrics.pendingPayments}
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                Pending Approval
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Revenue: <strong className="text-emerald-400">{formatRupiah(approvedRevenue)}</strong>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Midtrans Webhook:</span>
            <strong className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE (200 OK)
            </strong>
          </div>
        </div>

        {/* KPI 4: Active AI Provider */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-purple-500/60 transition group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Active AI Engine
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-950/70 text-purple-400 border border-purple-800/60 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>{aiSettings.primary_provider}</span>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                PRIMARY
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
              <span className="capitalize font-semibold text-purple-300">
                Mode: {aiSettings.mode === 'parallel' ? '⚡ Parallel Failover' : 'Single Provider'}
              </span>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Model:</span>
            <strong className="font-mono text-indigo-300">{primaryProvider?.model_name || 'gemini-1.5-flash'}</strong>
          </div>
        </div>
      </div>

      {/* PLATFORM ANALYTICS & LIVE TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Platform Health, Failover Flow & Operations */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Failover Architecture Diagram */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Multi-Provider AI Architecture & Failover Chain
                </h3>
                <p className="text-xs text-slate-400">
                  Status failover paralel saat bot menerima parsing transaksi teks, foto struk, dan voice note.
                </p>
              </div>
              <Link
                href="/admin/ai-providers"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Ubah Mode →
              </Link>
            </div>

            {/* Provider Failover Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {providers.map((p, idx) => {
                const isPrimary = p.provider_name === aiSettings.primary_provider;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border relative transition ${
                      isPrimary
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-900/20'
                        : 'bg-slate-800/60 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Tier #{p.priority} {isPrimary ? '• PRIMARY' : '• FALLBACK'}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          p.is_active ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="text-base font-black text-white uppercase">{p.provider_name}</div>
                    <div className="text-xs font-mono text-slate-400 mt-1">{p.model_name}</div>
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-700/60">
                      <span>Status:</span>
                      <strong className={p.is_active ? 'text-emerald-400' : 'text-slate-500'}>
                        {p.is_active ? 'Siap Eksekusi' : 'Nonaktif'}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Admin Navigation Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/users"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 transition group flex flex-col justify-between shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kelola Pengguna</h4>
                  <p className="text-[11px] text-slate-400">Impersonasi & filter Starter/Pro</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-400 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
                Buka Direktori →
              </span>
            </Link>

            <Link
              href="/admin/ai-logs"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 transition group flex flex-col justify-between shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Log & Monitor AI</h4>
                  <p className="text-[11px] text-slate-400">Token usage, latensi & audit</p>
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-400 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
                Lihat Log Request →
              </span>
            </Link>

            <Link
              href="/admin/payments"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 transition group flex flex-col justify-between shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Approval Pembayaran</h4>
                  <p className="text-[11px] text-slate-400">Review transfer manual & Midtrans</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
                Buka Approval ({metrics.pendingPayments}) →
              </span>
            </Link>
          </div>
        </div>

        {/* Right Col: System Health & Audit Log Live Feed */}
        <div className="space-y-6">
          {/* Live System Telemetry Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Platform Infrastructure Telemetry
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400">HTTP Response Time:</span>
                <span className="text-emerald-400 font-bold">{avgLatency > 0 ? avgLatency : 18} ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400">Total AI Tokens:</span>
                <span className="text-indigo-300 font-bold">{totalTokens.toLocaleString('id-ID')} tok</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="text-cyan-400 font-bold">In-Memory + Synced</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <span className="text-slate-400">Webhook Security:</span>
                <span className="text-emerald-400 font-bold">Idempotency Enforced</span>
              </div>
            </div>
          </div>

          {/* Audit Log Feed Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Live Audit Log Feed
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">ENFORCED</span>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-2.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[11px] truncate">{log.action}</span>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/50">
                      LOGGED
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Admin: {log.admin_name}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString('id-ID')} WIB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
