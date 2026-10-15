'use client';

// ==============================================================================
// TataDana Native Reports Page (Part 3 Specification)
// Sortable Columns, Pagination, Multi-Filter, Cashflow Summary, Top 5 Categories,
// On-Demand PDF & Excel (.xlsx) Generator, and Downloadable Export History
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import { generatePDFReport, generateExcelReport, calculateReportSummary } from '@/lib/reports/pdf-excel-generator';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  Lock,
  History,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';
  const isPro = user?.plan === 'pro';

  const [transactions, setTransactions] = useState(tataDanaDb.getTransactions(userId));
  const [exportHistories, setExportHistories] = useState(tataDanaDb.getExportHistories(userId));
  const [wallets, setWallets] = useState(tataDanaDb.getWallets(userId));
  const [categories, setCategories] = useState(tataDanaDb.getCategories(userId));

  useEffect(() => {
    const handleUpdate = async () => {
      setTransactions([...tataDanaDb.getTransactions(userId)]);
      setExportHistories([...tataDanaDb.getExportHistories(userId)]);
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
      window.removeEventListener('tatadana_data_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [userId]);

  // Expanded Receipt Item rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category' | 'wallet'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Export Loading States
  const [exportingType, setExportingType] = useState<'pdf' | 'xlsx' | null>(null);

  // Filter Transactions
  const filtered = transactions.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false;
    if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet) return false;
    if (startDate && new Date(t.transaction_date) < new Date(startDate + 'T00:00:00')) return false;
    if (endDate && new Date(t.transaction_date) > new Date(endDate + 'T23:59:59')) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort Transactions
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') {
      cmp = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    } else if (sortField === 'amount') {
      cmp = a.amount - b.amount;
    } else if (sortField === 'category') {
      cmp = (a.category_name || '').localeCompare(b.category_name || '');
    } else if (sortField === 'wallet') {
      cmp = (a.wallet_name || '').localeCompare(b.wallet_name || '');
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Paginated Slices
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Summary Metrics
  const summary = calculateReportSummary(filtered);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export Handler
  const handleExport = (format: 'pdf' | 'xlsx') => {
    if (!isPro) {
      alert('🔒 Fitur Export PDF & Excel tersedia khusus untuk pengguna TataDana Pro! Silakan upgrade akun Anda di Settings.');
      return;
    }

    setExportingType(format);
    setTimeout(() => {
      const periodTitle = startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode';
      let blob: Blob;
      let filename: string;

      if (format === 'pdf') {
        blob = generatePDFReport(sorted, user?.full_name || 'Pengguna', periodTitle);
        filename = `TataDana_Laporan_${Date.now()}.pdf`;
      } else {
        blob = generateExcelReport(sorted, user?.full_name || 'Pengguna', periodTitle);
        filename = `TataDana_Laporan_${Date.now()}.xlsx`;
      }

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Record in Export History
      tataDanaDb.addExportHistory({
        user_id: userId,
        file_name: filename,
        file_url: url,
        format,
        period_type: periodTitle,
        start_date: startDate,
        end_date: endDate,
        total_records: sorted.length,
        total_amount: summary.totalExpense,
      });
      setExportHistories(tataDanaDb.getExportHistories(userId));

      setExportingType(null);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laporan Keuangan 📊
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Analisis arus kas, top kategori pengeluaran, dan export laporan resmi ke PDF & Excel.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingType !== null}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isPro
                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-600" />
            {exportingType === 'pdf' ? 'Generating...' : 'Export PDF'}
            {!isPro && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => handleExport('xlsx')}
            disabled={exportingType !== null}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isPro
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exportingType === 'xlsx' ? 'Generating...' : 'Export Excel (.xlsx)'}
            {!isPro && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Pemasukan</span>
          <div className="text-xl md:text-2xl font-black text-emerald-600 mt-2">
            {formatRupiah(summary.totalIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Hasil filter periode</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Pengeluaran</span>
          <div className="text-xl md:text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(summary.totalExpense)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Hasil filter periode</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Net Cashflow</span>
          <div
            className={`text-xl md:text-2xl font-black mt-2 ${
              summary.netCashflow >= 0 ? 'text-brand-600' : 'text-rose-600'
            }`}
          >
            {formatRupiah(summary.netCashflow)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pemasukan dikurangi pengeluaran</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Jumlah Data</span>
          <div className="text-xl md:text-2xl font-black text-slate-900 mt-2">
            {summary.transactionCount} Transaksi
          </div>
          <div className="text-xs text-slate-400 mt-1">Sesuai kriteria pencarian</div>
        </div>
      </div>

      {/* TOP 5 EXPENSE CATEGORIES SUMMARY */}
      {summary.topCategories.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" /> Top 5 Kategori Pengeluaran Periode Ini
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {summary.topCategories.map((c, idx) => (
              <div key={c.name} className="p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                <div className="text-xs font-semibold text-slate-700 truncate">{c.name}</div>
                <div className="text-sm font-bold text-brand-700 mt-1">{formatRupiah(c.amount)}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{c.percentage}% dari total belanja</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MULTI-FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Jenis</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          {/* Wallet Filter */}
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Date Range Start */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Mulai Tanggal"
          />
        </div>
      </div>

      {/* TABLE: SORTABLE & PAGINATED */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th
                  onClick={() => toggleSort('date')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    Tanggal <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Jenis</th>
                <th
                  onClick={() => toggleSort('category')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    Kategori <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('wallet')}
                  className="p-3.5 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    Dompet <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3.5">Catatan</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="p-3.5 text-right cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Nominal <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const hasItems = tx.items && tx.items.length > 0;
                  const isExpanded = !!expandedRows[tx.id];

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'income'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                          <span>{tx.category_icon || '🏷️'}</span>
                          <span>{tx.category_name || '-'}</span>
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">{tx.wallet_name || '-'}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{tx.description}</span>
                            {hasItems && (
                              <button
                                onClick={() => toggleRowExpand(tx.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-brand-700 hover:bg-orange-200 transition shrink-0"
                              >
                                <Receipt className="w-3 h-3" />
                                {tx.items?.length} Item
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right font-extrabold whitespace-nowrap">
                          <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'income' ? '+ ' : '- '}
                            {formatRupiah(tx.amount)}
                          </span>
                        </td>
                      </tr>

                      {hasItems && isExpanded && (
                        <tr className="bg-orange-50/40">
                          <td colSpan={6} className="p-4 border-b border-orange-100">
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sorted.length)} dari{' '}
            {sorted.length} transaksi
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2">
              Hal {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* EXPORT HISTORIES LIST (Part 3 Requirement) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-brand-500" /> Riwayat Export Tersimpan
        </h3>

        {exportHistories.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            Belum ada riwayat export laporan. Hasil generate PDF atau Excel akan tersimpan di sini dan bisa didownload ulang kapan saja.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {exportHistories.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{exp.file_name}</span>
                  <div className="text-[11px] text-slate-400">
                    Format: {exp.format.toUpperCase()} • Periode: {exp.period_type} • Dibuat: {new Date(exp.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <a
                  href={exp.file_url}
                  download={exp.file_name}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Ulang
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
