'use client';

// ==============================================================================
// TataDana Admin Payment Approvals (/admin/payments)
// Midtrans Webhooks, Manual Bank Transfer Approvals with Audit Logs, and Pro Upgrades
// ==============================================================================

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Sparkles,
  X,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { PaymentTransaction } from '@/types/database';

export default function AdminPaymentsPage() {
  const { user: adminUser } = useAuth();
  const [payments, setPayments] = useState(tataDanaDb.getPayments());
  const [selectedProof, setSelectedProof] = useState<PaymentTransaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const approvedCount = payments.filter((p) => p.status === 'approved').length;
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleUpdateStatus = (paymentId: string, status: 'approved' | 'rejected') => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    tataDanaDb.updatePaymentStatus(
      paymentId,
      status,
      adminUser?.id || 'admin',
      adminNotes || (status === 'approved' ? 'Disetujui oleh admin' : 'Ditolak: Bukti tidak cocok')
    );

    // Record Audit Log (Part 10 Requirement)
    tataDanaDb.logAudit({
      admin_id: adminUser?.id || 'admin',
      admin_name: adminUser?.full_name || 'Superadmin',
      action: status === 'approved' ? 'APPROVE_MANUAL_PAYMENT' : 'REJECT_MANUAL_PAYMENT',
      target_user_id: payment.user_id,
      target_user_name: payment.user_name,
      details: {
        paymentId,
        orderId: payment.order_id,
        amount: payment.amount,
        plan: payment.plan,
        notes: adminNotes,
      },
    });

    setPayments([...tataDanaDb.getPayments()]);
    setSelectedProof(null);
    setAdminNotes('');
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              GATEWAY & REVENUE OPERATIONS
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              ● Webhook Ingestion Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Payment Approvals & Gateway 💳
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifikasi transfer manual bukti transfer bank, monitor webhook Midtrans, dan upgrade otomatis ke paket Pro.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Revenue Approved</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{approvedCount} transaksi disetujui</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Pending Verification</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {pendingCount} <span className="text-sm font-bold text-slate-400">Perlu Review</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">SLA rata-rata review &lt;15 menit</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Midtrans Gateway Status</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2 flex items-center gap-2">
            <span>200 OK</span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              CONNECTED
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Webhook instan otomatis</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua Pembayaran ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⏳ Menunggu Approval ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ✓ Disetujui ({approvedCount})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Menampilkan {filteredPayments.length} transaksi
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Order ID & Tanggal</th>
                <th className="p-3.5">Nama Pengguna</th>
                <th className="p-3.5">Paket & Metode</th>
                <th className="p-3.5">Nominal</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPayments.map((p) => {
                const isPending = p.status === 'pending';
                const isApproved = p.status === 'approved';

                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-white block">{p.order_id}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(p.created_at).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{p.user_name}</span>
                      <span className="text-[11px] text-slate-400">{p.user_email}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-brand-400 uppercase">
                        ★ {p.plan}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.payment_method === 'midtrans' ? '⚡ Midtrans Snap' : '🏦 Bank Transfer'}
                      </div>
                    </td>
                    <td className="p-3.5 font-black text-white text-sm">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isPending
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {isApproved ? '✓ APPROVED' : isPending ? '⏳ PENDING REVIEW' : '✕ REJECTED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {p.proof_url && (
                            <button
                              onClick={() => setSelectedProof(p)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Bukti
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/30"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Pro
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'rejected')}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold transition"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {p.admin_notes || 'Selesai diproses'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Bukti Transfer: {selectedProof.order_id}
              </h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black">
              <img
                src={selectedProof.proof_url}
                alt="Bukti Transfer"
                className="w-full h-64 object-cover"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Verifikasi Admin (Audit Trail)
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Contoh: Mutasi BCA tanggal 12/03 cocok nominal Rp99.000..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleUpdateStatus(selectedProof.id, 'rejected')}
                className="w-1/2 py-2.5 rounded-xl bg-red-950 text-red-300 border border-red-800 text-xs font-bold hover:bg-red-900 transition"
              >
                Tolak Bukti
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedProof.id, 'approved')}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
              >
                Setujui & Upgrade Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
