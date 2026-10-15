'use client';

// ==============================================================================
// TataDana Budgets Page (Part 3 Specification)
// Category Budget Management, Visual Progress Bar, 80% and 100% Alert Indicators,
// and Starter Plan Limit Enforcement (Max 5 Budgets)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah, generateVisualProgressBar } from '@/lib/telegram/bot-logic';
import {
  Target,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  X,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Budget } from '@/types/database';

export default function BudgetsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';
  const isStarter = user?.plan === 'starter';

  const [budgets, setBudgets] = useState(tataDanaDb.getBudgets(userId));
  const [categories, setCategories] = useState(tataDanaDb.getCategories(userId).filter((c) => c.type === 'expense'));

  useEffect(() => {
    const handleUpdate = async () => {
      setBudgets([...tataDanaDb.getBudgets(userId)]);
      setCategories([...tataDanaDb.getCategories(userId).filter((c) => c.type === 'expense')]);
      try {
        const res = await fetch(`/api/sync?userId=${userId}`);
        if (res.ok) {
          const synced = await res.json();
          if (synced.ok && synced.budgets) {
            tataDanaDb.syncUserState(userId, synced);
            setBudgets([...tataDanaDb.getBudgets(userId)]);
            setCategories([...tataDanaDb.getCategories(userId).filter((c) => c.type === 'expense')]);
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
      window.removeEventListener('tatadana_data_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [userId]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check Starter limit (max 5 budgets)
    if (isStarter && budgets.length >= 5) {
      setErrorMsg('Batas paket Starter tercapai: Maksimal 5 kategori budget. Upgrade ke Pro untuk unlimited budget!');
      return;
    }

    const limitNum = parseFloat(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setErrorMsg('Masukkan nominal limit yang valid.');
      return;
    }

    const categoryObj = categories.find((c) => c.id === selectedCategoryId);
    if (!categoryObj) {
      setErrorMsg('Pilih kategori yang valid.');
      return;
    }

    const budgetPayload = {
      user_id: userId,
      category_id: selectedCategoryId,
      category_name: categoryObj.name,
      category_icon: categoryObj.icon,
      monthly_limit: limitNum,
      spent: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };

    const newBudget = tataDanaDb.saveBudget(budgetPayload);

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_budget', userId, payload: newBudget }),
    }).catch(() => {});

    setBudgets([...tataDanaDb.getBudgets(userId)]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    }
    setIsModalOpen(false);
    setSelectedCategoryId('');
    setMonthlyLimit('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Target Budget Bulanan 🎯
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Kendalikan pengeluaran dengan limit per kategori dan notifikasi otomatis saat mencapai 80% & 100%.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Set Target Budget
        </button>
      </div>

      {/* Starter Limit Status Banner */}
      {isStarter && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Target className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Paket Starter: <strong>{budgets.length}/5</strong> kategori budget telah digunakan.
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

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const percent = Math.min(100, Math.round((b.spent / b.monthly_limit) * 100));
          const sisa = Math.max(0, b.monthly_limit - b.spent);
          const visualBar = generateVisualProgressBar(percent, 14);

          const isOver100 = percent >= 100;
          const isOver80 = percent >= 80 && percent < 100;

          return (
            <div
              key={b.id}
              className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition ${
                isOver100
                  ? 'border-red-300 ring-2 ring-red-100'
                  : isOver80
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200/80 hover:border-brand-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{b.category_icon || '🏷️'}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{b.category_name}</h3>
                      <span className="text-[11px] text-slate-400">Limit Bulanan</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isOver100 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                      <AlertOctagon className="w-3 h-3 text-red-600" /> 100% Habis
                    </span>
                  ) : isOver80 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> 80% Waspada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Aman
                    </span>
                  )}
                </div>

                {/* Amount Spend vs Limit */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900">{formatRupiah(b.spent)}</span>
                    <span className="text-xs text-slate-400">dari {formatRupiah(b.monthly_limit)}</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver100 ? 'bg-red-500' : isOver80 ? 'bg-amber-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Telegram Bot Visual Progress Format */}
                  <div className="font-mono text-[11px] text-slate-500 pt-1 tracking-tight">
                    {visualBar} {percent}%
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Sisa:{' '}
                  <strong className={isOver100 ? 'text-red-600' : 'text-slate-800'}>
                    {formatRupiah(sisa)}
                  </strong>
                </span>

                <span className="text-[11px] text-brand-600 font-semibold">
                  {isOver80 ? '⚠️ Notifikasi TG Terkirim' : 'Target Aktif'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Setel Budget Kategori</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Kategori Pengeluaran</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Limit Budget per Bulan (Rp)</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  required
                  placeholder="Contoh: 1500000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Target Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
