'use client';

// ==============================================================================
// TataDana Admin User Management (/admin/users)
// Filter Starter/Pro, Telegram Link Status, Impersonation ("Masuk sebagai User"),
// 1-Click Plan Toggle, Transaction Inspection with Audit Logs, and User Export
// ==============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  Users,
  Search,
  Eye,
  LogIn,
  Crown,
  Download,
  ShieldAlert,
  X,
  Sparkles,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Radio,
  Filter,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { UserProfile, Transaction } from '@/types/database';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentAdmin, impersonateUser } = useAuth();

  const [users, setUsers] = useState(tataDanaDb.getUsers());
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'starter' | 'pro' | 'connected_tg' | 'unlinked_tg'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Auto-refresh when tatadana_data_updated fires
  React.useEffect(() => {
    const refresh = () => setUsers([...tataDanaDb.getUsers()]);
    window.addEventListener('tatadana_data_updated', refresh);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('tatadana_data_updated', refresh);
      clearInterval(interval);
    };
  }, []);

  // Transaction Inspection Modal State
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);
  const [inspectTransactions, setInspectTransactions] = useState<Transaction[]>([]);

  const pendingCount = users.filter((u) => u.approval_status === 'pending').length;
  const approvedCount = users.filter((u) => u.approval_status === 'approved').length;
  const rejectedCount = users.filter((u) => u.approval_status === 'rejected').length;
  const proCount = users.filter((u) => u.plan === 'pro').length;
  const starterCount = users.filter((u) => u.plan === 'starter').length;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone_number.includes(q);

    if (!matchesSearch) return false;

    const tgConn = tataDanaDb.getTelegramConnection(u.id);
    const isTgConnected = tgConn && tgConn.status === 'connected';

    if (filterTab === 'pending') return u.approval_status === 'pending';
    if (filterTab === 'approved') return u.approval_status === 'approved';
    if (filterTab === 'rejected') return u.approval_status === 'rejected';
    if (filterTab === 'pro') return u.plan === 'pro';
    if (filterTab === 'starter') return u.plan === 'starter';
    if (filterTab === 'connected_tg') return isTgConnected;
    if (filterTab === 'unlinked_tg') return !isTgConnected;
    return true;
  });

  const handleApproveUser = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      tataDanaDb.updateUserApprovalStatus(userId, 'approved', currentAdmin?.id);
      setUsers([...tataDanaDb.getUsers()]);
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_approval',
          userId,
          payload: { approval_status: 'approved', adminId: currentAdmin?.id },
        }),
      }).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      tataDanaDb.updateUserApprovalStatus(userId, 'rejected', currentAdmin?.id);
      setUsers([...tataDanaDb.getUsers()]);
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_approval',
          userId,
          payload: { approval_status: 'rejected', adminId: currentAdmin?.id },
        }),
      }).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromotePlan = (userId: string, currentPlan: 'starter' | 'pro') => {
    const newPlan = currentPlan === 'starter' ? 'pro' : 'starter';
    tataDanaDb.updateUserPlan(userId, newPlan);
    setUsers([...tataDanaDb.getUsers()]);

    tataDanaDb.logAudit({
      admin_id: currentAdmin?.id || 'admin',
      admin_name: currentAdmin?.full_name || 'Superadmin',
      action: 'UPDATE_USER_SUBSCRIPTION_PLAN',
      target_user_id: userId,
      details: { newPlan },
    });
  };

  const handleInspectUser = (target: UserProfile) => {
    // Record Audit Log for Privacy Compliance
    tataDanaDb.logAudit({
      admin_id: currentAdmin?.id || 'admin',
      admin_name: currentAdmin?.full_name || 'Superadmin',
      action: 'INSPECT_USER_FINANCIAL_TRANSACTIONS',
      target_user_id: target.id,
      target_user_name: target.full_name,
      details: { reason: 'Customer support / troubleshooting investigation' },
    });

    const txs = tataDanaDb.getTransactions(target.id);
    setInspectTransactions(txs);
    setInspectUser(target);
  };

  const handleStartImpersonation = (target: UserProfile) => {
    impersonateUser(target.id);
    router.push('/dashboard');
  };

  const handleExportAllUsers = () => {
    const exportData = users.map((u) => {
      const conn = tataDanaDb.getTelegramConnection(u.id);
      return {
        ID: u.id,
        Nama: u.full_name,
        Email: u.email,
        No_HP: u.phone_number,
        Telegram_Connected: conn?.status === 'connected',
        Telegram_User_ID: conn?.telegram_user_id || null,
        Plan: u.plan,
        Dibuat: u.created_at,
      };
    });

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = `TataDana_Semua_User_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              USER DIRECTORY & ACCESS CONTROL
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Total {users.length} Akun Terdaftar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            User Management & Impersonation 👥
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola pengguna, status integrasi bot Telegram, beralih ke mode user (impersonasi), dan audit investigasi data.
          </p>
        </div>

        <button
          onClick={handleExportAllUsers}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shadow-sm transition border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-indigo-400" /> Export Data Semua User
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua User ({users.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>⏳ Menunggu Approval</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                pendingCount > 0 ? 'bg-amber-500 text-slate-950 font-black animate-pulse' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              filterTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>✓ Disetujui ({approvedCount})</span>
          </button>
          {rejectedCount > 0 && (
            <button
              onClick={() => setFilterTab('rejected')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-rose-400 hover:text-rose-300'
              }`}
            >
              <span>✕ Ditolak ({rejectedCount})</span>
            </button>
          )}
          <button
            onClick={() => setFilterTab('pro')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterTab === 'pro'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ★ Pro User ({proCount})
          </button>
          <button
            onClick={() => setFilterTab('starter')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterTab === 'starter'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Starter ({starterCount})
          </button>
          <button
            onClick={() => setFilterTab('connected_tg')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterTab === 'connected_tg'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ● Telegram Terhubung
          </button>
          <button
            onClick={() => setFilterTab('unlinked_tg')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              filterTab === 'unlinked_tg'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ○ Belum Terhubung
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau nomor HP..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Nama & Profil</th>
                <th className="p-3.5">WhatsApp / Nomor HP</th>
                <th className="p-3.5">Status Persetujuan</th>
                <th className="p-3.5">Status Telegram</th>
                <th className="p-3.5">Paket Aktif (Toggle)</th>
                <th className="p-3.5">Terdaftar</th>
                <th className="p-3.5 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const tgConn = tataDanaDb.getTelegramConnection(u.id);
                  const isTgConnected = tgConn && tgConn.status === 'connected';
                  const isPending = u.approval_status === 'pending';
                  const isRejected = u.approval_status === 'rejected';
                  const isApproved = u.approval_status === 'approved' || (!u.approval_status && u.is_admin);

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                            alt={u.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{u.full_name}</span>
                              {u.is_admin && (
                                <span className="text-[9px] font-black uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-300">
                        {u.phone_number}
                      </td>

                      {/* Status Persetujuan Admin Column */}
                      <td className="p-3.5">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/70 font-mono animate-pulse">
                            <Clock className="w-3 h-3 text-amber-400" />
                            ⏳ Menunggu Persetujuan
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60 font-mono">
                            <X className="w-3 h-3 text-rose-400" />
                            ✕ Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ✓ Disetujui
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isTgConnected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Connected (ID: {tgConn?.telegram_user_id || 'Active'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                            ○ Belum Terhubung
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handlePromotePlan(u.id, u.plan)}
                          title="Klik untuk ubah plan Starter <-> Pro (Toggle)"
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition flex items-center gap-1 ${
                            u.plan === 'pro'
                              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50 hover:bg-brand-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                          }`}
                        >
                          {u.plan === 'pro' ? '★ PRO USER' : 'STARTER'}
                          <span className="text-[9px] opacity-70">↻ Ubah</span>
                        </button>
                      </td>

                      <td className="p-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approval Action Buttons */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveUser(u.id)}
                                disabled={actionLoadingId === u.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 text-[11px]"
                                title="Setujui pendaftaran pengguna baru ini"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                onClick={() => handleRejectUser(u.id)}
                                disabled={actionLoadingId === u.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white font-bold transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 text-[11px]"
                                title="Tolak pendaftaran pengguna ini"
                              >
                                <UserX className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              disabled={actionLoadingId === u.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 text-[11px]"
                              title="Aktifkan dan setujui pengguna ini"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Aktifkan
                            </button>
                          )}

                          {/* Inspect User Transactions Button */}
                          <button
                            onClick={() => handleInspectUser(u)}
                            className="px-2 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition flex items-center gap-1 text-[11px]"
                            title="Investigasi transaksi dengan audit log"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" /> Cek Data
                          </button>

                          {/* Impersonate User Button (Part 10 Requirement) */}
                          <button
                            onClick={() => handleStartImpersonation(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1 shadow-md shadow-indigo-600/30 active:scale-95 text-[11px]"
                            title="Masuk ke aplikasi sebagai user ini"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Masuk sbg User
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INSPECT USER TRANSACTIONS (WITH MANDATORY AUDIT LOG) */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Audit Data Transaksi: {inspectUser.full_name}
                </h3>
                <span className="text-[11px] text-indigo-400 font-mono mt-0.5 block">
                  🛡️ Akses diawasi & dicatat ke tabel public.audit_logs secara otomatis
                </span>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs divide-y divide-slate-800 pr-1">
              {inspectTransactions.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">Pengguna belum memiliki catatan transaksi.</p>
              ) : (
                inspectTransactions.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{tx.description}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(tx.transaction_date).toLocaleString('id-ID')} • {tx.wallet_name || 'Dompet'} • Sumber: {tx.source}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-xs ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+ ' : '- '}
                        {formatRupiah(tx.amount)}
                      </span>
                      <div className="text-[10px] text-slate-400">{tx.category_name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
