'use client';

// ==============================================================================
// TataDana Quick Add Transaction Modal (Smartphone Bottom Sheet / Modal)
// Supports Expense, Income, and Transfer with Instant Reactive Updates
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  Tag,
  Calendar,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
}

export default function QuickAddModal({ isOpen, onClose, defaultType = 'expense' }: QuickAddModalProps) {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>(defaultType);
  const [wallets, setWallets] = useState(tataDanaDb.getWallets(userId));
  const [categories, setCategories] = useState(tataDanaDb.getCategories(userId));

  // Form States
  const [amountStr, setAmountStr] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    const refreshModalData = () => {
      const w = tataDanaDb.getWallets(userId);
      const c = tataDanaDb.getCategories(userId);
      setWallets(w);
      setCategories(c);
      const isSelectedValid = w.some((wal) => wal.id === selectedWalletId);
      if (!isSelectedValid && w.length > 0) {
        const defaultWal = w.find((wal) => wal.is_default) || w[0];
        setSelectedWalletId(defaultWal.id);
      }
      const isToValid = w.some((wal) => wal.id === toWalletId);
      if (!isToValid && w.length > 0) {
        const otherWal = w.find((wal) => wal.id !== selectedWalletId) || w[0];
        setToWalletId(otherWal.id);
      }
      const isCatValid = c.some((cat) => cat.id === selectedCategoryId);
      if (!isCatValid && c.length > 0) {
        setSelectedCategoryId(c[0].id);
      }
    };

    if (isOpen) {
      refreshModalData();
      setActiveTab(defaultType);
      setSuccessNotice('');
      window.addEventListener('tatadana_data_updated', refreshModalData);
      return () => window.removeEventListener('tatadana_data_updated', refreshModalData);
    }
  }, [isOpen, userId, defaultType, selectedWalletId, toWalletId, selectedCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Sesi pengguna tidak valid. Silakan muat ulang halaman.');
      return;
    }
    const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!cleanAmount || cleanAmount <= 0) {
      alert('Masukkan nominal transaksi yang valid.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'transfer') {
        if (selectedWalletId === toWalletId) {
          alert('Pilih dompet tujuan yang berbeda.');
          setLoading(false);
          return;
        }

        const addedTx = tataDanaDb.transferBetweenWallets(
          userId,
          selectedWalletId,
          toWalletId,
          cleanAmount,
          description || 'Transfer antar dompet'
        );

        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'transfer',
            userId,
            payload: {
              id: addedTx.id,
              txId: addedTx.id,
              fromWalletId: selectedWalletId,
              toWalletId,
              amount: cleanAmount,
              description: description || 'Transfer antar dompet',
            },
          }),
        }).catch(() => {});
      } else {
        const cat = categories.find((c) => c.id === selectedCategoryId);
        const w = wallets.find((wal) => wal.id === selectedWalletId);

        const txPayload = {
          user_id: userId,
          wallet_id: selectedWalletId,
          wallet_name: w?.name || 'Dompet',
          category_id: activeTab === 'income' ? undefined : selectedCategoryId,
          category_name: activeTab === 'income' ? 'Pemasukan' : cat?.name || 'Umum',
          category_icon: activeTab === 'income' ? '💰' : cat?.icon || '💸',
          type: activeTab,
          amount: cleanAmount,
          description: description || (activeTab === 'income' ? 'Pemasukan' : 'Pengeluaran'),
          transaction_date: `${dateStr}T12:00:00+07:00`,
          source: 'manual_web' as const,
        };

        const addedTx = tataDanaDb.addTransaction(txPayload);

        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_transaction',
            userId,
            payload: addedTx,
          }),
        }).catch(() => {});
      }

      // Notify dashboard and other components to update reactively
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }

      setSuccessNotice(`Berhasil mencatat transaksi ${formatRupiah(cleanAmount)}!`);
      setTimeout(() => {
        setAmountStr('');
        setDescription('');
        setSuccessNotice('');
        onClose();
      }, 700);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Grab Bar for smartphone look */}
        <div className="p-4 sm:p-6 pb-2 border-b border-slate-100 relative">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Tambah Transaksi Baru 💳
              </h3>
              <p className="text-xs text-slate-500">Catat keuangan langsung masuk ke saldo dompet</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'transfer'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successNotice}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nominal Input (Large Display) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-black text-slate-400">Rp</span>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                required
                placeholder="50.000"
                className="w-full pl-12 pr-4 py-3 text-xl font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm text-slate-900"
              />
            </div>
            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[15000, 25000, 50000, 100000, 500000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setAmountStr(amt.toLocaleString('id-ID'))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-[11px] font-semibold text-slate-600 transition"
                >
                  +{amt >= 1000 ? `${amt / 1000}rb` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Selector (Dari Dompet) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              {activeTab === 'transfer' ? 'Dari Dompet Sumber' : 'Pilih Dompet'}
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  👛 {w.name} — Saldo: {formatRupiah(w.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Target Wallet */}
          {activeTab === 'transfer' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-brand-500" />
                Ke Dompet Tujuan
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    📥 {w.name} — Saldo: {formatRupiah(w.balance)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Selector (Expense only) */}
          {activeTab === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" /> Kategori Pengeluaran
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Catatan / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Catatan Transaksi
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={activeTab === 'expense' ? 'Contoh: Makan siang nasi padang' : activeTab === 'income' ? 'Contoh: Bonus project' : 'Contoh: Topup GoPay'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm"
            />
          </div>

          {/* Tanggal Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Tanggal Transaksi
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-sm bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                activeTab === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : activeTab === 'income'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {loading
                ? 'Menyimpan...'
                : activeTab === 'expense'
                ? 'Simpan Pengeluaran'
                : activeTab === 'income'
                ? 'Simpan Pemasukan'
                : 'Eksekusi Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
