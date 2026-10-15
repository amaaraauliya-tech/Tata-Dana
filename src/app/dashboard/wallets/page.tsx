'use client';

// ==============================================================================
// TataDana Wallets Page (Part 3 Specification)
// Multi-Wallet Management (Bank, E-Wallet, Cash), Default Telegram Wallet Selector,
// and Starter Plan Limit Enforcement (Max 3 Wallets)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  Wallet,
  Plus,
  Star,
  CheckCircle2,
  Building2,
  Smartphone,
  Banknote,
  X,
  Sparkles,
  Lock
} from 'lucide-react';

export default function WalletsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';
  const isStarter = user?.plan === 'starter';

  const [wallets, setWallets] = useState(tataDanaDb.getWallets(userId));

  useEffect(() => {
    const handleUpdate = async () => {
      setWallets([...tataDanaDb.getWallets(userId)]);
      try {
        const res = await fetch(`/api/sync?userId=${userId}`);
        if (res.ok) {
          const synced = await res.json();
          if (synced.ok && synced.wallets) {
            tataDanaDb.syncUserState(userId, synced);
            setWallets([...tataDanaDb.getWallets(userId)]);
          }
        } else if (res.status === 404) {
          const localUser = tataDanaDb.getUserById(userId);
          if (localUser) {
            fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'register_user',
                userId: localUser.id,
                payload: {
                  user: localUser,
                  wallets: tataDanaDb.getWallets(localUser.id),
                  categories: tataDanaDb.getCategories(localUser.id),
                  budgets: tataDanaDb.getBudgets(localUser.id),
                  transactions: tataDanaDb.getTransactions(localUser.id),
                  telegramConn: tataDanaDb.getTelegramConnection(localUser.id),
                  reminder: tataDanaDb.getReminder(localUser.id),
                },
              }),
            }).catch(() => {});
          }
        }
      } catch (e) {
        // Fallback to local DB
      }
    };
    handleUpdate();
    window.addEventListener('tatadana_data_updated', handleUpdate);
    const interval = setInterval(handleUpdate, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tatadana_data_updated', handleUpdate);
    };
  }, [userId]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'bank' | 'ewallet' | 'cash'>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSetDefault = (walletId: string) => {
    tataDanaDb.setDefaultWallet(userId, walletId);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_default_wallet', userId, payload: { walletId } }),
    }).catch(() => {});
    setWallets([...tataDanaDb.getWallets(userId)]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isStarter && wallets.length >= 3) {
      setErrorMsg('Batas paket Starter tercapai: Maksimal 3 dompet. Upgrade ke Pro untuk unlimited wallet!');
      return;
    }

    const bal = initialBalance.trim() === '' ? 0 : parseFloat(initialBalance);
    if (isNaN(bal) || bal < 0) {
      setErrorMsg('Masukkan saldo awal yang valid.');
      return;
    }

    const iconMap = {
      bank: '🏦',
      ewallet: '📱',
      cash: '💵',
    };

    const walletPayload = {
      user_id: userId,
      name: walletName,
      type: walletType,
      account_number: accountNumber || undefined,
      balance: bal,
      is_default: isDefault,
      icon: iconMap[walletType],
      color: walletType === 'bank' ? '#005CA9' : walletType === 'ewallet' ? '#00AED6' : '#10B981',
    };

    const newWal = tataDanaDb.addWallet(walletPayload);

    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_wallet', userId, payload: newWal }),
    }).catch(() => {});

    setWallets([...tataDanaDb.getWallets(userId)]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    }
    setIsModalOpen(false);
    setWalletName('');
    setAccountNumber('');
    setInitialBalance('0');
    setIsDefault(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dompet & Rekening 👛
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Kelola multi-dompet (BCA, Mandiri, GoPay, Tunai) dan tentukan 1 dompet default untuk pencatatan Telegram Bot.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Dompet Baru
        </button>
      </div>

      {/* Starter Limit Status Banner */}
      {isStarter && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Paket Starter: <strong>{wallets.length}/3</strong> dompet aktif.
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-brand-600 font-bold hover:underline shrink-0"
          >
            Upgrade ke Pro →
          </Link>
        </div>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((w) => (
          <div
            key={w.id}
            className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition ${
              w.is_default
                ? 'border-brand-300 ring-2 ring-brand-100'
                : 'border-slate-200/80 hover:border-brand-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm">
                    {w.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{w.name}</h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {w.type === 'bank' ? 'Rekening Bank' : w.type === 'ewallet' ? 'Dompet Digital' : 'Uang Tunai'}
                      {w.account_number ? ` • ${w.account_number}` : ''}
                    </p>
                  </div>
                </div>

                {w.is_default ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-brand-700">
                    <Star className="w-3 h-3 fill-brand-500 text-brand-500" /> Default Telegram
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-brand-600 transition"
                  >
                    Jadikan Default
                  </button>
                )}
              </div>

              <div className="my-3">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Saldo Saat Ini</span>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatRupiah(w.balance)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">
                {w.is_default ? 'Otomatis dipakai saat chat bot' : 'Dipakai jika dipilih di web'}
              </span>
              <span className="font-semibold text-brand-600">Terhubung</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Wallet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Dompet Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddWallet} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Dompet / Rekening</label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  required
                  placeholder="Contoh: Mandiri Livin, BCA, OVO, Cash"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Dompet</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bank', 'ewallet', 'cash'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWalletType(t)}
                      className={`p-2.5 rounded-xl border text-center capitalize font-semibold transition ${
                        walletType === t
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'bank' ? '🏦 Bank' : t === 'ewallet' ? '📱 E-Wallet' : '💵 Tunai'}
                    </button>
                  ))}
                </div>
              </div>

              {walletType !== 'cash' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening / Akun (Opsional)</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  required
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="defaultCheck" className="text-slate-700 font-medium">
                  Jadikan dompet default untuk transaksi Telegram Bot
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
