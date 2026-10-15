'use client';

// ==============================================================================
// TataDana Real-Time Telegram Transaction Banner & Sync Manager
// Listens to Server-Sent Events (SSE) and fast sync heartbeats to instantly
// update all dashboard pages and display immediate feedback toast notifications.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { formatRupiah } from '@/lib/telegram/bot-logic';
import { Transaction } from '@/types/database';
import {
  Bell,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';

interface NotificationItem {
  id: string;
  transaction: Transaction;
  message?: string;
  timestamp: number;
}

export default function RealtimeNotificationBanner() {
  const { user } = useAuth();
  const userId = user?.id || 'user-budi-101';

  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [progress, setProgress] = useState(100);
  const seenTxIdsRef = useRef<Set<string>>(new Set());
  const lastSyncTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize seen IDs with pre-existing transactions to prevent false alerts on mount
  useEffect(() => {
    const existing = tataDanaDb.getTransactions(userId).map((t) => t.id);
    seenTxIdsRef.current = new Set(existing);
  }, [userId]);

  // Subtle web audio synthetic pleasant chime
  const playChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1 (E5 - 659 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (A5 - 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  // Trigger banner and broadcast update
  const triggerNotification = (
    tx: Transaction,
    customMsg?: string,
    serverWallets?: any[],
    serverBudgets?: any[]
  ) => {
    if (!tx || !tx.id) return;
    if (seenTxIdsRef.current.has(tx.id)) return;
    seenTxIdsRef.current.add(tx.id);

    // Synchronize local database if authoritative server state is provided, or add transaction
    if (serverWallets && serverBudgets && Array.isArray(serverWallets)) {
      tataDanaDb.syncUserState(userId, {
        transactions: [tx],
        wallets: serverWallets,
        budgets: serverBudgets,
      });
    } else {
      tataDanaDb.addTransaction(tx);
    }

    // Play alert chime
    playChime();

    // Trigger local reactive refresh across all dashboard pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('tatadana_data_updated', {
          detail: { transaction: tx, wallets: serverWallets, budgets: serverBudgets },
        })
      );
    }

    // Set notification state
    setActiveNotification({
      id: tx.id,
      transaction: tx,
      message: customMsg,
      timestamp: Date.now(),
    });
    setProgress(100);

    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Auto dismiss after 6 seconds
    const duration = 6000;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        setActiveNotification(null);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // 1. Listen to custom event dispatched by ChatBotWidget or in-app actions
  useEffect(() => {
    const handleCustomTx = (e: any) => {
      if (e.detail?.transaction) {
        triggerNotification(
          e.detail.transaction,
          e.detail.replyText,
          e.detail.wallets,
          e.detail.budgets
        );
      }
    };

    window.addEventListener('tatadana_telegram_tx_received', handleCustomTx);
    return () => window.removeEventListener('tatadana_telegram_tx_received', handleCustomTx);
  }, [userId]);

  // 2. Connect to Server-Sent Events (SSE) for sub-second webhook delivery
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let sseActive = false;

    try {
      eventSource = new EventSource(`/api/realtime?userId=${userId}`);

      eventSource.addEventListener('connected', () => {
        sseActive = true;
      });

      eventSource.addEventListener('telegram_transaction', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.payload?.transaction) {
            triggerNotification(
              parsed.payload.transaction,
              parsed.payload.replyText,
              parsed.payload.wallets,
              parsed.payload.budgets
            );
          }
        } catch (err) {
          console.error('[SSE Error parsing telegram_transaction]:', err);
        }
      });

      eventSource.addEventListener('new_transaction', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.payload?.transaction) {
            triggerNotification(
              parsed.payload.transaction,
              undefined,
              parsed.payload.wallets,
              parsed.payload.budgets
            );
          }
        } catch (err) {}
      });

      eventSource.onerror = () => {
        sseActive = false;
        eventSource?.close();
      };
    } catch (e) {
      console.warn('[SSE Init error, falling back to fast polling]:', e);
    }

    // 3. Fast Heartbeat Polling Fallback (every 2.5s) to guarantee updates
    // if SSE drops or behind strict firewalls
    const pollInterval = setInterval(async () => {
      try {
        const sinceTime = lastSyncTimeRef.current;
        const res = await fetch(`/api/sync?userId=${userId}&since=${sinceTime}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.serverTime) {
          lastSyncTimeRef.current = data.serverTime;
        }

        // Check if server delivered new recent events
        if (Array.isArray(data.recentEvents) && data.recentEvents.length > 0) {
          data.recentEvents.forEach((evt: any) => {
            if (
              evt.type === 'telegram_transaction' &&
              evt.payload?.transaction &&
              (!evt.payload.userId || evt.payload.userId === userId)
            ) {
              triggerNotification(
                evt.payload.transaction,
                evt.payload.replyText,
                evt.payload.wallets,
                evt.payload.budgets
              );
            }
          });
        }

        // Also check if latest transaction in server array is unseen and from Telegram
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          const newest = data.transactions[0];
          const txAge = Date.now() - new Date(newest.created_at).getTime();
          if (
            txAge < 20000 &&
            newest.source?.startsWith('telegram_') &&
            !seenTxIdsRef.current.has(newest.id)
          ) {
            triggerNotification(newest, undefined, data.wallets, data.budgets);
          }
        }
      } catch (err) {
        // Silent poll error catch
      }
    }, 2500);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [userId]);

  if (!activeNotification) return null;

  const tx = activeNotification.transaction;
  const isIncome = tx.type === 'income';
  const categoryName = tx.category_name || (isIncome ? 'Pemasukan' : 'Pengeluaran');
  const amountFormatted = formatRupiah(tx.amount);
  const wallet = tataDanaDb.getWallets(userId).find((w) => w.id === tx.wallet_id) || tataDanaDb.getDefaultWallet(userId);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] sm:w-[540px] max-w-full transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-brand-500/80 backdrop-blur-md relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Progress countdown indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-orange-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            {/* Animated Bell & Category Icon */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-brand-500/30">
                {tx.category_icon || (isIncome ? '💰' : '💸')}
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Bell className="w-2.5 h-2.5 text-slate-950 animate-bounce" />
              </span>
            </div>

            {/* Notification Text Header & Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-brand-500/20 text-brand-300 border border-brand-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-400" /> Telegram Bot
                </span>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  ● Real-Time Sync
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-white tracking-tight mt-1 flex items-center gap-1 flex-wrap">
                <span>🔔 Transaksi Telegram Tercatat:</span>
                <span className="text-orange-300 font-black">{categoryName}</span>
                <span className={isIncome ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                  {amountFormatted}!
                </span>
              </h4>

              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                &ldquo;{tx.description}&rdquo;
              </p>

              {wallet && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-brand-400" /> {wallet.name}:{' '}
                    <strong className="text-white">{formatRupiah(wallet.balance)}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300 font-semibold">
                    Saldo otomatis diperbarui
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Close & Action Buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => setActiveNotification(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>

            <Link
              href="/dashboard/transactions"
              onClick={() => setActiveNotification(null)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
            >
              Lihat <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
