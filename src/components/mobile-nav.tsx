'use client';

// ==============================================================================
// TataDana Smartphone Bottom Navigation Bar
// Sticky bottom navigation for mobile viewports with central elevated (+) action button
// ==============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, Plus, BarChart3, Bot } from 'lucide-react';

interface MobileNavProps {
  onOpenQuickAdd: () => void;
  onOpenBot: () => void;
}

export default function MobileNav({ onOpenQuickAdd, onOpenBot }: MobileNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard';
  const isTransactions = pathname === '/dashboard/transactions';
  const isReports = pathname === '/dashboard/reports';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl px-2 py-1.5 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Beranda */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            isHome ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'text-brand-500 scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5">Beranda</span>
        </Link>

        {/* 2. Transaksi */}
        <Link
          href="/dashboard/transactions"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            isTransactions ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <CreditCard className={`w-5 h-5 ${isTransactions ? 'text-brand-500 scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5">Transaksi</span>
        </Link>

        {/* 3. Central Elevated Action Button (+) */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all border-3 border-white focus:outline-none"
            title="Tambah Transaksi Baru"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[10px] font-bold text-slate-700 mt-0.5">Catat</span>
        </div>

        {/* 4. Laporan */}
        <Link
          href="/dashboard/reports"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            isReports ? 'text-brand-600 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isReports ? 'text-brand-500 scale-110' : ''}`} />
          <span className="text-[10px] mt-0.5">Laporan</span>
        </Link>

        {/* 5. Chat Bot */}
        <button
          type="button"
          onClick={onOpenBot}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-brand-600 transition"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-brand-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] mt-0.5 font-semibold text-brand-600">Bot Chat</span>
        </button>
      </div>
    </div>
  );
}
