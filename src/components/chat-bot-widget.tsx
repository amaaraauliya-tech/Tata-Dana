'use client';

// ==============================================================================
// TataDana Floating Telegram Chat Bot Widget
// Interactive In-App Bot Simulator with Real-Time Webhook Execution & Dashboard Sync
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { tataDanaDb } from '@/lib/mock-db';
import { Wallet } from '@/types/database';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  Camera,
  Mic,
  Maximize2,
  Minimize2,
  CheckCheck,
  RefreshCw,
  HelpCircle,
  Paperclip,
  Wallet as WalletIcon
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  isReceipt?: boolean;
  isVoice?: boolean;
}

export default function ChatBotWidget() {
  const { user } = useAuth();
  const userId = user?.id || 'admin-tatadana-001';

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to wallet updates
  useEffect(() => {
    const updateWallets = () => {
      const userWallets = tataDanaDb.getWallets(userId);
      setWallets(userWallets);
      setSelectedWalletId((prev) => {
        if (prev && userWallets.some((w) => w.id === prev)) return prev;
        const def = userWallets.find((w) => w.is_default) || userWallets[0];
        return def ? def.id : '';
      });
    };

    updateWallets();
    window.addEventListener('tatadana_data_updated', updateWallets);
    return () => window.removeEventListener('tatadana_data_updated', updateWallets);
  }, [userId]);

  // Format currency helper
  const formatRupiah = (val: number) => 'Rp' + Math.round(val).toLocaleString('id-ID');

  // Initialize conversation with welcome messages
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: `Halo ${user?.full_name || 'Kak'}! 👋\nSaya TataDana Bot. Kamu bisa mencatat keuangan semudah chatting di sini!\n\n👛 Kamu bisa pilih dompet pengeluaran di atas atau ketik langsung di chat (contoh: "kopi 25k pakai tunai").\n\nCoba ketik pesan natural seperti:\n• "beli bakso 15rb"\n• "kopi 25rb pakai dompet tunai"\n• "gajian 5jt"\n• atau perintah /dompet, /saldo, /budget`,
        time: timeStr,
      },
    ]);
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Listen to open_chatbot custom event from mobile nav
  useEffect(() => {
    const handleOpenBot = () => {
      setIsOpen(true);
    };
    window.addEventListener('tatadana_open_bot', handleOpenBot);
    return () => window.removeEventListener('tatadana_open_bot', handleOpenBot);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    try {
      // Find active user's telegram ID or fallback to standard ID
      const userObj = tataDanaDb.getUserById(userId);
      const userTgConn = tataDanaDb.getTelegramConnection(userId);
      const telegramId = userTgConn?.telegram_user_id || (userObj as any)?.telegram_user_id || (555000000 + Math.abs(userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 100000));

      const payload = {
        update_id: Date.now(),
        userId: userId,
        wallet_id: selectedWalletId, // Explicitly pass selected wallet for expense deduction
        userProfile: user || userObj,
        telegramConn: userTgConn,
        message: {
          message_id: Math.floor(100 + Math.random() * 900),
          from: {
            id: telegramId,
            first_name: user?.full_name || userObj?.full_name || 'Pengguna',
            username: (user?.full_name || userObj?.full_name || 'pengguna').toLowerCase().replace(/\s+/g, '_'),
          },
          chat: {
            id: telegramId,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text,
        },
      };

      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const reply = data.reply_text || 'Pesan berhasil diproses oleh sistem.';

      // Synchronize client-side database with server state
      if (data.wallets || data.transactions || data.budgets) {
        tataDanaDb.syncUserState(userId, {
          transactions: data.transactions,
          wallets: data.wallets,
          budgets: data.budgets,
        });

        if (data.wallets && Array.isArray(data.wallets)) {
          setWallets(data.wallets);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tatadana_data_updated'));

          // Trigger real-time toast banner notification ONLY when a new transaction was recorded
          if (data.latest_transaction) {
            window.dispatchEvent(
              new CustomEvent('tatadana_telegram_tx_received', {
                detail: {
                  transaction: data.latest_transaction,
                  replyText: reply,
                  wallets: data.wallets,
                  budgets: data.budgets,
                },
              })
            );
          }
        }
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      };

      setMessages((prev) => [...prev, botMsg]);

      // Trigger instant reactive reload for dashboard & wallets
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ Terjadi kesalahan koneksi saat memproses pesan. Pastikan bot aktif.',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSimulateReceipt = () => {
    const text = '📷 [Scan Foto Struk] Belanja Supermarket Rp175.000: Minyak Goreng, Telur 1kg, Sayuran';
    handleSendMessage(text);
  };

  const handleSimulateVoice = () => {
    const text = '🎙️ [Voice Note 8 detik] "Catat kopi susu 22 ribu bayar pakai GoPay"';
    handleSendMessage(text);
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-5 z-40 p-3.5 bg-gradient-to-r from-brand-500 to-orange-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2.5 group border-2 border-white"
          title="Buka Chat Bot TataDana"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="font-extrabold text-sm hidden sm:inline-block pr-1">
            TataDana Bot 🤖
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white shadow-2xl border border-slate-200 flex flex-col transition-all duration-200 ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-2xl'
              : 'bottom-0 sm:bottom-6 right-0 sm:right-6 w-full sm:w-[420px] h-[88vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl'
          }`}
        >
          {/* Telegram Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-brand-600 via-brand-500 to-orange-500 text-white flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-black text-xl shadow">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-brand-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-white tracking-tight">
                    TataDana Bot
                  </h4>
                  <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-[11px] text-orange-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  Online • Asia/Jakarta (WIB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition hidden sm:block"
                title={isExpanded ? 'Kecilkan' : 'Perbesar'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition"
                title="Tutup Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dedicated Wallet Selection Bar for Expenses */}
          <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-yellow-50/80 border-b border-orange-200/80 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                <WalletIcon className="w-3.5 h-3.5 text-brand-600" />
                Dompet Pengeluaran:
              </span>
              {selectedWallet && (
                <span className="text-[10px] font-black text-brand-700 bg-white/90 px-2 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                  Saldo: {formatRupiah(selectedWallet.balance)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="flex-1 bg-white border border-orange-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-2xs cursor-pointer"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon || '👛'} {w.name} {w.is_default ? '⭐ (Default)' : ''} — {formatRupiah(w.balance)}
                  </option>
                ))}
              </select>

              {/* Quick 1-click Wallet Selector Chips */}
              <div className="flex items-center gap-1 shrink-0">
                {wallets.slice(0, 3).map((w) => {
                  const isActive = w.id === selectedWalletId;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWalletId(w.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white hover:bg-orange-100 text-slate-600 border border-orange-200'
                      }`}
                      title={`Pilih ${w.name}`}
                    >
                      {w.icon || '👛'} {w.name.replace('Dompet ', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-orange-50/70 border-b border-orange-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-brand-700 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500" /> Coba:
            </span>
            <button
              onClick={() => handleSendMessage('beli bakso 15rb')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              🍜 bakso 15rb
            </button>
            <button
              onClick={() => handleSendMessage('kopi 25k pakai dompet tunai')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              💵 kopi 25k (tunai)
            </button>
            <button
              onClick={() => handleSendMessage('jajan 20k pakai e-wallet')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              📱 jajan 20k (e-wallet)
            </button>
            <button
              onClick={() => handleSendMessage('/dompet')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              👛 /dompet
            </button>
            <button
              onClick={() => handleSendMessage('/pilih_dompet 2')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              ⚙️ /pilih_dompet 2
            </button>
            <button
              onClick={() => handleSendMessage('gajian 5jt')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              💼 gajian 5jt
            </button>
            <button
              onClick={() => handleSendMessage('/saldo')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              /saldo
            </button>
            <button
              onClick={() => handleSendMessage('/budget')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              /budget
            </button>
            <button
              onClick={() => handleSendMessage('/hari ini')}
              className="px-2.5 py-1 bg-white hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-full whitespace-nowrap font-medium text-[11px] transition shadow-2xs"
            >
              /hari ini
            </button>
          </div>

          {/* Messages Feed (Telegram Wallpaper look) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdfbf7]">
            {messages.map((m) => {
              const isMe = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                      isMe
                        ? 'bg-brand-500 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs font-mono sm:font-sans'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-2xl w-28 text-slate-400 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse delay-150" />
                <span className="text-[10px] text-slate-400 font-medium ml-1">Ketik...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Interactive Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            {/* Multi-modal Action Triggers (Foto Struk & Voice Note) */}
            <div className="flex items-center justify-between pb-2 px-1 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateReceipt}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-brand-700 transition flex items-center gap-1.5 text-[11px] font-semibold"
                  title="Simulasikan input foto struk AI OCR"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-500" />
                  Foto Struk (OCR)
                </button>
                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-brand-700 transition flex items-center gap-1.5 text-[11px] font-semibold"
                  title="Simulasikan input Voice Note audio"
                >
                  <Mic className="w-3.5 h-3.5 text-brand-500" />
                  Voice Note
                </button>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Tekan Enter kirim</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ketik 'beli kopi 25rb' atau 'gajian 5jt'..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-inner bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white flex items-center justify-center transition shadow-md disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
