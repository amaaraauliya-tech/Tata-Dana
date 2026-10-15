'use client';

// ==============================================================================
// TataDana Dashboard Overview (Part 3 Specification)
// 4 Stats Cards, Category Pie Chart, 6-Month Income vs Expense Bar, Daily Trend Line,
// 10 Recent Transactions, Period Filters, and Onboarding Checklist
// ==============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronRight,
  Filter,
  CreditCard,
  MessageSquare,
  ArrowLeftRight,
  Bot,
  PlusCircle
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';

  // State
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [wallets, setWallets] = useState(tataDanaDb.getWallets(userId));
  const [transactions, setTransactions] = useState(tataDanaDb.getTransactions(userId));
  const [budgets, setBudgets] = useState(tataDanaDb.getBudgets(userId));
  const [telegramConn, setTelegramConn] = useState(tataDanaDb.getTelegramConnection(userId));

  useEffect(() => {
    const refreshData = async () => {
      setWallets([...tataDanaDb.getWallets(userId)]);
      setTransactions([...tataDanaDb.getTransactions(userId)]);
      setBudgets([...tataDanaDb.getBudgets(userId)]);
      setTelegramConn(tataDanaDb.getTelegramConnection(userId));

      try {
        const res = await fetch(`/api/sync?userId=${userId}`);
        if (res.ok) {
          const synced = await res.json();
          if (synced.ok) {
            tataDanaDb.syncUserState(userId, synced);
            setWallets([...tataDanaDb.getWallets(userId)]);
            setTransactions([...tataDanaDb.getTransactions(userId)]);
            setBudgets([...tataDanaDb.getBudgets(userId)]);
            if (synced.telegramConn) setTelegramConn(synced.telegramConn);
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

    refreshData();
    window.addEventListener('tatadana_data_updated', refreshData);
    const interval = setInterval(refreshData, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tatadana_data_updated', refreshData);
    };
  }, [userId]);

  // Total Calculations
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  // Filter transactions according to selected period (harian, mingguan, bulanan, tahunan)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const periodFilteredTransactions = transactions.filter((t) => {
    const txDate = new Date(t.transaction_date);
    if (period === 'harian') {
      return txDate.toDateString() === now.toDateString();
    }
    if (period === 'mingguan') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      return txDate >= sevenDaysAgo;
    }
    if (period === 'bulanan') {
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }
    if (period === 'tahunan') {
      return txDate.getFullYear() === currentYear;
    }
    return true;
  });

  const totalIncome = periodFilteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = periodFilteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const remainingBudget = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  // Category breakdown for Pie Chart simulation
  const categoryExpenses: Record<string, number> = {};
  periodFilteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category_name || 'Lain-lain';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + t.amount;
    });

  const categoryEntries = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);

  // 6-Month Comparison Data
  const monthlyComparison = [
    { month: 'Okt', income: 7500000, expense: 4200000 },
    { month: 'Nov', income: 8200000, expense: 5100000 },
    { month: 'Des', income: 9000000, expense: 6800000 },
    { month: 'Jan', income: 8500000, expense: 4900000 },
    { month: 'Feb', income: 8000000, expense: 4300000 },
    { month: 'Mar', income: 9000000, expense: totalExpense },
  ];

  // Daily Trend Line Data for March
  const dailyTrends = [
    { day: '01', amount: 350000 },
    { day: '03', amount: 120000 },
    { day: '05', amount: 450000 },
    { day: '08', amount: 85000 },
    { day: '10', amount: 500000 },
    { day: '12', amount: 145000 },
    { day: '13', amount: 57000 },
  ];

  // Onboarding checklist status
  const isTelegramConnected = telegramConn && telegramConn.status === 'connected';
  const hasWallets = wallets.length > 0;
  const hasBudgets = budgets.length > 0;
  const showOnboardingBanner = !isTelegramConnected || !hasBudgets;

  return (
    <div className="space-y-6">
      {/* Header & Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Keuangan 📊
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pantau arus kas, realisasi budget, dan transaksi Telegram kamu secara real-time.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
          {(['harian', 'mingguan', 'bulanan', 'tahunan'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                period === p
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Smartphone Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tatadana_open_quick_add', { detail: { type: 'expense' } }));
            }
          }}
          className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 shadow-xs hover:shadow-md transition text-left flex items-center gap-3 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Pengeluaran</div>
            <div className="text-[11px] text-slate-400">Catat belanja</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tatadana_open_quick_add', { detail: { type: 'income' } }));
            }
          }}
          className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition text-left flex items-center gap-3 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Pemasukan</div>
            <div className="text-[11px] text-slate-400">Catat gaji/cuan</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tatadana_open_quick_add', { detail: { type: 'transfer' } }));
            }
          }}
          className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md transition text-left flex items-center gap-3 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">Transfer</div>
            <div className="text-[11px] text-slate-400">Pindah dompet</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tatadana_open_bot'));
            }
          }}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-brand-200 hover:border-brand-400 shadow-xs hover:shadow-md transition text-left flex items-center gap-3 group active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-brand-900 leading-tight">Chat Bot 🤖</div>
            <div className="text-[11px] text-brand-600 font-medium">Ketik natural</div>
          </div>
        </button>
      </div>

      {/* Onboarding Checklist Card (Empty state / guide for new users) */}
      {showOnboardingBanner && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-5 rounded-2xl border border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-700 font-bold text-sm mb-1">
                <Target className="w-4 h-4 text-brand-600" />
                Langkah Cepat Memulai TataDana:
              </div>
              <p className="text-xs text-slate-600">
                Selesaikan 3 langkah mudah ini untuk mengaktifkan otomatisasi pencatatan keuanganmu.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
            >
              Hubungkan Bot Sekarang <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <Link
              href="/dashboard/settings"
              className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-brand-300 transition"
            >
              <div className="flex items-center gap-2.5">
                {isTelegramConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Hubungkan Telegram</div>
                  <div className="text-[11px] text-slate-500">
                    {isTelegramConnected ? 'Sudah Terhubung' : 'Belum dihubungkan'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-brand-600 font-semibold">Buka →</span>
            </Link>

            <Link
              href="/dashboard/wallets"
              className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-brand-300 transition"
            >
              <div className="flex items-center gap-2.5">
                {hasWallets ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Set Dompet Utama</div>
                  <div className="text-[11px] text-slate-500">{wallets.length} Dompet Aktif</div>
                </div>
              </div>
              <span className="text-xs text-brand-600 font-semibold">Atur →</span>
            </Link>

            <Link
              href="/dashboard/budgets"
              className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-brand-300 transition"
            >
              <div className="flex items-center gap-2.5">
                {hasBudgets ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">3. Set Target Budget</div>
                  <div className="text-[11px] text-slate-500">{budgets.length} Budget Disetel</div>
                </div>
              </div>
              <span className="text-xs text-brand-600 font-semibold">Setel →</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-brand-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Saldo Semua Dompet
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(totalBalance)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{wallets.length} Dompet terdaftar</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pemasukan Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatRupiah(totalIncome)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.5% vs bulan lalu
            </div>
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {formatRupiah(totalExpense)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{transactions.filter((t) => t.type === 'expense').length} kali transaksi</span>
            </div>
          </div>
        </div>

        {/* Card 4: Budget Tersisa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sisa Budget Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(remainingBudget)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Dari batas {formatRupiah(totalBudgetLimit)}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID: Category Breakdown + 6 Month Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart / Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengeluaran per Kategori 🥧
              </h2>
              <p className="text-xs text-slate-500">Komposisi pengeluaran bulan ini</p>
            </div>
            <Link
              href="/dashboard/reports"
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Lihat Laporan Detail →
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {categoryEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pengeluaran.</p>
            ) : (
              categoryEntries.slice(0, 5).map(([catName, amount], i) => {
                const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-emerald-500'];
                const color = colors[i % colors.length];

                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        {catName}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {formatRupiah(amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 6-Month Income vs Expense Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pemasukan vs Pengeluaran 6 Bulan Terakhir 📊
              </h2>
              <p className="text-xs text-slate-500">Perbandingan cashflow historis</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-brand-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> Pengeluaran
              </span>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
            {monthlyComparison.map((m) => {
              const maxVal = 10000000;
              const incomeHeight = Math.min(100, Math.round((m.income / maxVal) * 100));
              const expenseHeight = Math.min(100, Math.round((m.expense / maxVal) * 100));

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Income Bar */}
                    <div
                      className="w-3.5 bg-emerald-400 hover:bg-emerald-500 rounded-t-sm transition-all"
                      style={{ height: `${incomeHeight}%` }}
                      title={`Pemasukan: ${formatRupiah(m.income)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-3.5 bg-brand-500 hover:bg-brand-600 rounded-t-sm transition-all"
                      style={{ height: `${expenseHeight}%` }}
                      title={`Pengeluaran: ${formatRupiah(m.expense)}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DAILY EXPENSE TREND LINE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trend Pengeluaran Harian Bulan Ini 📈
            </h2>
            <p className="text-xs text-slate-500">Volatilitas pengeluaran per tanggal di bulan berjalan</p>
          </div>
        </div>

        <div className="h-32 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
          {dailyTrends.map((d) => {
            const maxVal = 600000;
            const h = Math.min(100, Math.round((d.amount / maxVal) * 100));
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div
                  className="w-full max-w-[24px] bg-brand-200 group-hover:bg-brand-500 rounded-t-md transition-all relative flex justify-center"
                  style={{ height: `${h}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                    {formatRupiah(d.amount)}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Tgl {d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10 RECENT TRANSACTIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              10 Transaksi Terbaru 💳
            </h2>
            <p className="text-xs text-slate-500">Transaksi tercatat dari Telegram Bot dan Web</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            Semua Transaksi →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada transaksi. Mulai catat transaksi pertamamu lewat tombol Quick Action atau Chat Bot! 🚀
            </div>
          ) : (
            transactions.slice(0, 10).map((tx) => {
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';

            return (
              <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : isExpense
                        ? 'bg-orange-50 text-brand-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {tx.category_icon || (isIncome ? '💰' : '💸')}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {tx.description}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 uppercase">
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
                      • {tx.wallet_name || 'Dompet'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-extrabold ${
                      isIncome
                        ? 'text-emerald-600'
                        : isExpense
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+ ' : isExpense ? '- ' : ''}
                    {formatRupiah(tx.amount)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {tx.category_name || 'Umum'}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
