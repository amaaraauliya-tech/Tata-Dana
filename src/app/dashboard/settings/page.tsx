'use client';

// ==============================================================================
// TataDana Settings Page (Part 3 & Part 5 Specification)
// Tabs: Profil, Telegram Bot (Functional Test Koneksi & BotFather Guide),
// Reminder Keuangan, Kategori Custom, Subscription & Pembayaran, and Theme Presets
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { tataDanaDb } from '@/lib/mock-db';
import {
  User,
  Bot,
  Bell,
  Tags,
  Crown,
  Palette,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Upload,
  Send,
  MessageSquare
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const userId = user?.id || 'user-budi-101';

  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminder' | 'categories' | 'subscription' | 'theme'>('telegram');

  // Profile Tab States
  const [fullName, setFullName] = useState(user?.full_name || 'Budi Santoso');
  const [currency, setCurrency] = useState(user?.currency || 'IDR');
  const [profileSaved, setProfileSaved] = useState(false);

  // Telegram Tab States (Part 5 Requirements)
  const currentConn = tataDanaDb.getTelegramConnection(userId);
  const [botToken, setBotToken] = useState(currentConn?.bot_token_encrypted || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>(
    currentConn?.status === 'connected' ? 'connected' : 'idle'
  );
  const [testResultMsg, setTestResultMsg] = useState(
    currentConn?.status === 'connected' ? `Terhubung ke @${currentConn.bot_username || 'TataDanaBot'}` : ''
  );
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorChat, setSimulatorChat] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '👋 Halo! Saya TataDana Bot. Coba ketik "Makan siang 25rb" atau /saldo.' }
  ]);
  const [simulating, setSimulating] = useState(false);

  // Reminder Tab States (Part 3 Requirements: Max 2x/day)
  const currentRem = tataDanaDb.getReminder(userId);
  const [reminderActive, setReminderActive] = useState(currentRem?.is_active ?? true);
  const [frequency, setFrequency] = useState<'1x' | '2x'>(currentRem?.frequency || '2x');
  const [time1, setTime1] = useState(currentRem?.time_1 || '08:00');
  const [time2, setTime2] = useState(currentRem?.time_2 || '20:30');
  const [reminderSaved, setReminderSaved] = useState(false);

  // Categories Tab States
  const [categories, setCategories] = useState(tataDanaDb.getCategories(userId));
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Subscription / Payment States
  const isPro = user?.plan === 'pro';
  const [manualProofFile, setManualProofFile] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  const [connectedBotUsername, setConnectedBotUsername] = useState<string>(currentConn?.bot_username || '');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCurrency(user.currency || 'IDR');
    }
    const conn = tataDanaDb.getTelegramConnection(userId);
    if (conn) {
      setBotToken(conn.bot_token_encrypted || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac');
      setTestStatus(conn.status === 'connected' ? 'connected' : 'idle');
      setTestResultMsg(conn.status === 'connected' ? `Terhubung ke @${conn.bot_username || 'TataDanaBot'}` : '');
      setConnectedBotUsername(conn.bot_username || '');
    }
    const rem = tataDanaDb.getReminder(userId);
    if (rem) {
      setReminderActive(rem.is_active ?? true);
      setFrequency(rem.frequency || '2x');
      setTime1(rem.time_1 || '08:00');
      setTime2(rem.time_2 || '20:30');
    }
    setCategories(tataDanaDb.getCategories(userId));
  }, [user, userId]);

  // 1. Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        full_name: fullName,
        currency: currency,
        updated_at: new Date().toISOString(),
      };
      tataDanaDb.upsertUser(updatedUser);
      localStorage.setItem('tatadana_active_user', JSON.stringify(updatedUser));
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register_user', userId, payload: { user: updatedUser } }),
      }).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // 2. Telegram Bot "Test Koneksi" (Part 5 Execution)
  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      setTestStatus('error');
      setTestResultMsg('Token bot Telegram tidak boleh kosong.');
      return;
    }

    setTestStatus('testing');
    setTestResultMsg('⏳ Testing koneksi ke Telegram API...');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken.trim(), userId }),
      });
      const data = await res.json();

      if (data.ok) {
        setTestStatus('connected');
        const botName = data.bot?.username || 'TataDanaBot';
        setConnectedBotUsername(botName);
        setTestResultMsg(`🟢 Terhubung dengan sukses! Bot @${botName} aktif dan siap menerima pesan Telegram.`);

        // Automatically start background polling loop
        try {
          await fetch('/api/telegram/start-polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: botToken.trim(), userId }),
          });
        } catch (pollErr) {
          console.warn('Auto polling trigger note:', pollErr);
        }
      } else {
        setTestStatus('error');
        setTestResultMsg(`🔴 Gagal terhubung: ${data.error || 'Token salah'}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestResultMsg(`🔴 Terjadi kesalahan koneksi: ${err.message}`);
    }
  };

  // Interactive Telegram Simulator on Web
  const handleSendSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorInput.trim()) return;

    const userText = simulatorInput.trim();
    setSimulatorChat(prev => [...prev, { sender: 'user', text: userText }]);
    setSimulatorInput('');
    setSimulating(true);

    try {
      const activeTgId = currentConn?.telegram_user_id || (userId === 'user-siti-102' ? 987654321 : (userId === 'user-budi-101' ? 182749102 : 555000000 + Math.abs(userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 100000)));
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: Date.now(),
          userId,
          userProfile: user,
          telegramConn: currentConn,
          message: {
            text: userText,
            chat: { id: 998877 },
            from: { 
              id: activeTgId,
              first_name: user?.full_name?.split(' ')[0] || 'User',
            },
          },
        }),
      });
      const data = await res.json();
      if (data.wallets || data.transactions || data.budgets) {
        tataDanaDb.syncUserState(userId, {
          transactions: data.transactions,
          wallets: data.wallets,
          budgets: data.budgets,
        });

        // Trigger real-time toast banner notification ONLY when a new transaction was recorded
        if (data.latest_transaction && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('tatadana_telegram_tx_received', {
              detail: {
                transaction: data.latest_transaction,
                replyText: data.reply_text,
                wallets: data.wallets,
                budgets: data.budgets,
              },
            })
          );
        }
      }
      setSimulatorChat(prev => [...prev, { sender: 'bot', text: data.reply_text || 'Pesan diterima.' }]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
      }
    } catch (err) {
      setSimulatorChat(prev => [...prev, { sender: 'bot', text: 'Error memproses pesan simulasi.' }]);
    } finally {
      setSimulating(false);
    }
  };

  // 3. Save Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const remData = {
      is_active: reminderActive,
      frequency,
      time_1: time1,
      time_2: time2,
    };
    tataDanaDb.saveReminder(userId, remData);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register_user', userId, payload: { reminder: remData } }),
    }).catch(() => {});
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  // 4. Add Custom Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const catData = {
      user_id: userId,
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
      color: '#F97316',
    };
    const createdCat = tataDanaDb.addCategory(catData);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_category', userId, payload: createdCat }),
    }).catch(() => {});
    setCategories(tataDanaDb.getCategories(userId));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana_data_updated'));
    }
    setNewCatName('');
  };

  // 5. Submit Manual Payment Proof
  const handleSubmitManualTransfer = async () => {
    setManualProofFile(true);
    const res = await fetch('/api/payment/midtrans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_manual_transfer',
        userId,
        plan: 'pro',
        amount: 99000,
        proofUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=300&q=80',
        notes: 'Bukti transfer BCA mobile sebesar Rp99.000',
      }),
    });
    const data = await res.json();
    setPaymentSuccessMsg(data.message || 'Bukti transfer berhasil dikirim ke admin.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Akun ⚙️
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Konfigurasi profil, integrasi Telegram Bot, reminder pengingat, dan preferensi tema.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'telegram', label: 'Telegram Bot', icon: Bot },
          { id: 'profile', label: 'Profil Saya', icon: User },
          { id: 'reminder', label: 'Reminder Harian', icon: Bell },
          { id: 'categories', label: 'Kelola Kategori', icon: Tags },
          { id: 'subscription', label: 'Langganan / Paket', icon: Crown },
          { id: 'theme', label: 'Tema UI', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                active
                  ? 'border-brand-500 text-brand-600 bg-orange-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TELEGRAM BOT INTEGRATION (PART 5) */}
      {activeTab === 'telegram' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-brand-500" /> Pengaturan Token Telegram Bot
                </h2>
                {/* Real-time Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    testStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : testStatus === 'testing'
                      ? 'bg-amber-100 text-amber-800'
                      : testStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      testStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : testStatus === 'testing'
                        ? 'bg-amber-500 animate-ping'
                        : testStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {testStatus === 'connected'
                    ? '🟢 Terhubung'
                    : testStatus === 'testing'
                    ? '⏳ Testing...'
                    : testStatus === 'error'
                    ? '🔴 Tidak Terhubung'
                    : '⚪ Belum Dites'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan API Token bot dari @BotFather untuk menghubungkan chat Telegram kamu ke TataDana.
              </p>
            </div>

            {/* Single Official Telegram Bot Guide */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 text-xs space-y-2">
              <span className="font-bold text-brand-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Integrasi 1 Bot Telegram Resmi & Terenkripsi:
              </span>
              <p className="text-slate-700 leading-relaxed">
                TataDana menggunakan 1 bot Telegram resmi terenkripsi (<strong>@TataDanaBot</strong>) untuk seluruh transaksi. Anda tidak perlu membuat bot kustom di BotFather. Cukup klik tombol <strong>Hubungkan & Aktifkan Bot</strong> di bawah atau ketik perintah <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono">/link {user?.phone_number || 'nomor_hp'}</code> langsung ke chat Telegram bot.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Token Bot Telegram Resmi (Terenkripsi)</label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 font-medium">
                Token resmi bot terpusat TataDana: <code className="bg-slate-100 text-brand-600 px-1 py-0.5 rounded font-mono select-all">8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac</code>
              </p>

              {testResultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${
                    testStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : testStatus === 'testing'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResultMsg}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      ⏳ Sedang Memverifikasi Token & Menghubungkan...
                    </>
                  ) : (
                    '🚀 Hubungkan & Aktifkan Bot Telegram'
                  )}
                </button>

                {testStatus === 'connected' && connectedBotUsername && (
                  <a
                    href={`https://t.me/${connectedBotUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                  >
                    <Send className="w-4 h-4" /> Buka Bot di Aplikasi Telegram (@{connectedBotUsername}) ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Bot Chat Simulator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[520px]">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">TataDana Telegram Simulator</h3>
                  <span className="text-[10px] text-emerald-600 font-bold">● Online & Siap Digunakan</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Live Web Preview</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 my-2 bg-slate-50/70 rounded-xl">
              {simulatorChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-brand-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-mono text-[11px]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {simulating && (
                <div className="flex justify-start">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-400 italic flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" /> AI sedang memproses transaksi...
                  </div>
                </div>
              )}
            </div>

            {/* Simulator Input */}
            <form onSubmit={handleSendSimulator} className="flex gap-2 pt-2">
              <input
                type="text"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                placeholder='Ketik misal: "Beli bakso 15rb" atau /saldo'
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={simulating}
                className="p-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl space-y-5">
          <h2 className="text-base font-bold text-slate-900">Profil & Mata Uang</h2>

          {profileSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
              Profil berhasil disimpan!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Terverifikasi</label>
              <input
                type="text"
                disabled
                value={user?.phone_number || '+6281234567890'}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Nomor HP ini terhubung ke bot Telegram.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Uang Default</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="IDR">Rupiah Indonesia (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="SGD">Singapore Dollar (SGD)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REMINDER (PART 3 REQUIREMENT: MAX 2X/HARI) */}
      {activeTab === 'reminder' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Reminder Keuangan Harian</h2>
              <p className="text-xs text-slate-500">Notifikasi pengingat via Telegram (Maksimal 2x per hari)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderActive}
                onChange={(e) => setReminderActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {reminderSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
              Pengaturan reminder berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleSaveReminder} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Frekuensi Reminder</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequency('1x')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    frequency === '1x'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  1x Sehari
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('2x')}
                  className={`p-3 rounded-xl border text-center font-bold transition ${
                    frequency === '2x'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  2x Sehari (Rekomendasi)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jam Reminder 1 (WIB)</label>
                <input
                  type="time"
                  value={time1}
                  onChange={(e) => setTime1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {frequency === '2x' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Reminder 2 (WIB)</label>
                  <input
                    type="time"
                    value={time2}
                    onChange={(e) => setTime2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>

            {/* Preview Pesan Reminder (Part 4.8) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Preview Pesan Telegram:
              </span>
              <div className="font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed">
{`⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`}
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition"
            >
              Simpan Jadwal Reminder
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-900">Tambah Kategori Custom</h2>
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori..."
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="text"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                placeholder="Emoji (e.g. 🍜)"
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition"
              >
                + Tambah
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <span className="text-xl">{c.icon}</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{c.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION (PART 6) */}
      {activeTab === 'subscription' && (
        <div className="max-w-3xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Starter Plan Card */}
            <div className={`p-6 rounded-2xl border ${!isPro ? 'border-brand-500 bg-white ring-2 ring-brand-100' : 'border-slate-200 bg-slate-50'}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paket Dasar</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Starter</h3>
              <div className="text-2xl font-black text-slate-900 my-3">
                Rp49.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 mb-6">
                <li>✓ Catat transaksi via teks Telegram</li>
                <li>✓ Maksimal 50 transaksi / bulan</li>
                <li>✓ Maksimal 3 dompet & 5 target budget</li>
                <li className="text-slate-400">✕ Tanpa scan foto struk AI OCR</li>
                <li className="text-slate-400">✕ Tanpa AI Financial Advisor</li>
                <li className="text-slate-400">✕ Tanpa export PDF / Excel</li>
              </ul>
              {!isPro && (
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                  Paket Anda Saat Ini
                </span>
              )}
            </div>

            {/* Pro Plan Card */}
            <div className={`p-6 rounded-2xl border ${isPro ? 'border-brand-500 bg-white ring-2 ring-brand-100' : 'border-brand-500 bg-white shadow-xl relative'}`}>
              <div className="absolute -top-3 right-4 bg-brand-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Sekali Bayar Seumur Hidup
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Paling Hemat</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">TataDana Pro</h3>
              <div className="text-2xl font-black text-slate-900 my-3">
                Rp99.000 <span className="text-xs font-normal text-slate-500">Sekali Bayar</span>
              </div>
              <ul className="text-xs space-y-2 text-slate-700 mb-6 font-medium">
                <li>✨ Unlimited transaksi, dompet & kategori</li>
                <li>✨ Scan struk belanja via foto AI OCR</li>
                <li>✨ AI Financial Advisor otomatis aktif</li>
                <li>✨ Export laporan tak terbatas (PDF & Excel)</li>
                <li>✨ Prioritas support & reminder custom</li>
              </ul>

              {isPro ? (
                <span className="inline-block px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-bold">
                  ✓ Akun Pro Aktif
                </span>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => alert('Membuka Midtrans Payment Gateway Snap Popup... (Simulasi)')}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Bayar Otomatis (Midtrans)
                  </button>
                  <button
                    onClick={handleSubmitManualTransfer}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Kirim Bukti Transfer Manual
                  </button>
                </div>
              )}
            </div>
          </div>

          {paymentSuccessMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              {paymentSuccessMsg}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: THEME PRESETS (DECISION 1 & /generative_ui COMPLIANCE) */}
      {activeTab === 'theme' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-xl space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pilihan Tema TataDana</h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih antara tema oranye fintech default atau tema alternatif Baby Pink & Soft Yellow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('fintech-orange')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                theme === 'fintech-orange' ? 'border-brand-500 bg-orange-50/50' : 'border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 mb-2 shadow" />
              <div className="text-xs font-bold text-slate-900">Fintech Orange (Default)</div>
              <p className="text-[11px] text-slate-400 mt-1">Warna oranye modern, bersih & profesional.</p>
            </button>

            <button
              onClick={() => setTheme('baby-pink-yellow')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                theme === 'baby-pink-yellow' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-400 mb-2 shadow" />
              <div className="text-xs font-bold text-slate-900">Baby Pink & Soft Yellow</div>
              <p className="text-[11px] text-slate-400 mt-1">Preset /generative_ui lembut dan ceria.</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
