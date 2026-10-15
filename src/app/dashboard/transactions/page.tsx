'use client';

// ==============================================================================
// TataDana Transactions Page (Part 3 Specification)
// Income, Expense, Wallet Transfer, and Expandable Multi-Item Receipt Breakdown
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Receipt,
  X,
  Sparkles
} from 'lucide-react';
import { TransactionType } from '@/types/database';

export default function TransactionsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';

  const [transactions, setTransactions] = useState(tataDanaDb.getTransactions(userId));
  const [wallets, setWallets] = useState(tataDanaDb.getWallets(userId));
  const [categories, setCategories] = useState(tataDanaDb.getCategories(userId));

  useEffect(() => {
    const handleUpdate = async () => {
      setTransactions([...tataDanaDb.getTransactions(userId)]);
      setWallets([...tataDanaDb.getWallets(userId)]);
      setCategories([...tataDanaDb.getCategories(userId)]);
      try {
        const res = await fetch(`/api/sync?userId=${userId}`);
        if (res.ok) {
          const synced = await res.json();
          if (synced.ok && synced.transactions) {
            tataDanaDb.syncUserState(userId, synced);
            setTransactions([...tataDanaDb.getTransactions(userId)]);
            setWallets([...tataDanaDb.getWallets(userId)]);
            setCategories([...tataDanaDb.getCategories(userId)]);
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

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');

  // Expanded Receipt Item row IDs
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [targetWalletId, setTargetWalletId] = useState(wallets[1]?.id || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!wallets.some(w => w.id === walletId) && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
    if (!wallets.some(w => w.id === targetWalletId) && wallets.length > 1) {
      setTargetWalletId(wallets[1].id);
    }
    if (!categories.some(c => c.id === categoryId) && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [wallets, categories, walletId, targetWalletId, categoryId]);

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    const selectedWallet = wallets.find(w => w.id === walletId);
    const selectedTargetWallet = wallets.find(w => w.id === targetWalletId);
    const selectedCategory = categories.find(c => c.id === categoryId);

    const txPayload = {
      user_id: userId,
      wallet_id: walletId,
      wallet_name: selectedWallet?.name,
      target_wallet_id: txType === 'transfer' ? targetWalletId : undefined,
      target_wallet_name: txType === 'transfer' ? selectedTargetWallet?.name : undefined,
      category_id: txType !== 'transfer' ? categoryId : undefined,
      category_name: txType !== 'transfer' ? selectedCategory?.name : 'Transfer Dompet',
      category_icon: txType !== 'transfer' ? selectedCategory?.icon : '🔄',
      type: txType,
      amount: num,
      transaction_date: new Date(date).toISOString(),
      description: description || (txType === 'transfer' ? `Transfer ke ${selectedTargetWallet?.name}` : 'Transaksi baru'),
      source: 'web_ui' as const,
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

    setTransactions([...tataDanaDb.getTransactions(userId)]);
    setWallets([...tataDanaDb.getWallets(userId)]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    }
    setIsModalOpen(false);
    setAmount('');
    setDescription('');
  };

  // Filtered List
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterWallet !== 'all' && t.wallet_id !== filterWallet) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !(t.category_name || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catatan Transaksi 💳
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Kelola pemasukan, pengeluaran, transfer antar dompet, dan struk belanja.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Catat Transaksi Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi atau catatan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Jenis</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>

          <select
            value={filterWallet}
            onChange={(e) => setFilterWallet(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Coba sesuaikan filter pencarianmu atau tambahkan transaksi baru via web atau bot Telegram.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => {
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const hasItems = tx.items && tx.items.length > 0;
              const isExpanded = !!expandedRows[tx.id];

              return (
                <div key={tx.id} className="transition hover:bg-slate-50/50">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600'
                            : isExpense
                            ? 'bg-orange-50 text-brand-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {isTransfer ? (
                          <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                        ) : (
                          tx.category_icon || (isIncome ? '💰' : '💸')
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {tx.description}
                          {hasItems && (
                            <button
                              onClick={() => toggleRowExpand(tx.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-brand-700 hover:bg-orange-200 transition"
                            >
                              <Receipt className="w-3 h-3" />
                              {tx.items?.length} Item
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500 uppercase">
                            {tx.source.replace('telegram_', 'TG ')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {isTransfer ? `${tx.wallet_name} ➔ ${tx.target_wallet_name}` : tx.wallet_name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm md:text-base font-extrabold ${
                          isIncome
                            ? 'text-emerald-600'
                            : isExpense
                            ? 'text-rose-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {isIncome ? '+ ' : isExpense ? '- ' : ''}
                        {formatRupiah(tx.amount)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isTransfer ? 'Transfer Antar Dompet' : tx.category_name || 'Umum'}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Multi-Item Receipt Breakdown (Part 3 Requirement) */}
                  {hasItems && isExpanded && (
                    <div className="bg-orange-50/40 p-4 border-t border-orange-100 space-y-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        Rincian Item Struk Belanja AI OCR:
                      </div>
                      <div className="bg-white rounded-xl border border-orange-200 overflow-hidden divide-y divide-slate-100 text-xs">
                        {tx.items?.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between">
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-slate-400 text-[11px]">{item.category}</span>
                              <span className="font-bold text-slate-900">{formatRupiah(item.price)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Catat Transaksi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Catat Transaksi Manual</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['expense', 'income', 'transfer'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                    txType === t ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Contoh: 50000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              {txType !== 'transfer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories
                      .filter((c) => (txType === 'expense' ? c.type === 'expense' : c.type === 'income'))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {txType === 'transfer' ? 'Dari Dompet' : 'Dompet'}
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {txType === 'transfer' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ke Dompet</label>
                    <select
                      value={targetWalletId}
                      onChange={(e) => setTargetWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {wallets
                        .filter((w) => w.id !== walletId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({formatRupiah(w.balance)})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat transaksi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
