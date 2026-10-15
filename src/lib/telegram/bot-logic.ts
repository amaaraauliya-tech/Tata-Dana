// ==============================================================================
// TataDana Telegram Bot Business Engine
// Exact Indonesia Fintech Reply Formatting, Commands, & Plan Limits
// Timezone: Asia/Jakarta (WIB)
// ==============================================================================

import { tataDanaDb } from '../mock-db';
import { MultiProviderAIService } from '../ai/multi-provider';
import { UserProfile, Transaction, Wallet, Budget } from '../../types/database';

// Format Indonesian Date & Time in WIB
export function formatWIBDateTime(date: Date = new Date()): { day: string; dateStr: string; timeStr: string; fullHeader: string } {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Adjust to UTC+7 WIB
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wibDate = new Date(utc + 3600000 * 7);

  const day = days[wibDate.getDay()];
  const d = wibDate.getDate();
  const m = months[wibDate.getMonth()];
  const y = wibDate.getFullYear();
  const dateStr = `${d} ${m} ${y}`;

  const hh = String(wibDate.getHours()).padStart(2, '0');
  const mm = String(wibDate.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm} WIB`;

  return {
    day,
    dateStr,
    timeStr,
    fullHeader: `📅 ${day}, ${dateStr} — ${timeStr}`,
  };
}

// Generate visual progress bar using █ and ░
export function generateVisualProgressBar(percent: number, length: number = 10): string {
  const bounded = Math.max(0, Math.min(100, percent));
  const filledCount = Math.round((bounded / 100) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

// Format Indonesian Currency
export function formatRupiah(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

export interface BotMessageResult {
  replyText: string;
  transaction?: Transaction;
}

/**
 * Detect target wallet for a transaction based on:
 * 1. Explicit mention in message text (e.g., "pakai dompet tunai", "bayar gopay", "bca", "cash", etc.)
 * 2. Explicit preferredWalletId passed from UI / client
 * 3. Default user wallet fallback
 */
export function resolveTargetWallet(
  userId: string,
  rawText: string,
  preferredWalletId?: string
): { wallet: Wallet; matchedInText: boolean } {
  const userWallets = tataDanaDb.getWallets(userId);
  if (userWallets.length === 0) {
    const fallback = tataDanaDb.getDefaultWallet(userId);
    return { wallet: fallback, matchedInText: false };
  }

  const lowerText = rawText.toLowerCase();

  // 1. Check direct wallet names (longest name first so e.g. "dompet tunai" takes precedence over "tunai")
  const sortedByNameLength = [...userWallets].sort((a, b) => b.name.length - a.name.length);
  for (const w of sortedByNameLength) {
    const wName = w.name.toLowerCase().trim();
    if (wName.length >= 3 && lowerText.includes(wName)) {
      return { wallet: w, matchedInText: true };
    }
  }

  // 2. Check keyword aliases for common Indonesian wallet types
  for (const w of userWallets) {
    const wName = w.name.toLowerCase();
    const wType = w.type;

    // Cash / Tunai keywords
    if (wType === 'cash' || wName.includes('tunai') || wName.includes('cash')) {
      const cashRegex = /\b(dompet\s+tunai|tunai|cash)\b/i;
      if (cashRegex.test(lowerText)) {
        return { wallet: w, matchedInText: true };
      }
    }

    // e-Wallet / Digital Wallet keywords
    if (wType === 'ewallet' || wName.includes('wallet') || wName.includes('e-wallet')) {
      const ewalletRegex = /\b(e-wallet|ewallet|gopay|go-pay|ovo|dana|shopeepay|shopee\s*pay|linkaja|qris)\b/i;
      if (ewalletRegex.test(lowerText)) {
        return { wallet: w, matchedInText: true };
      }
    }

    // Bank / Dompet Utama keywords
    if (wType === 'bank' || wName.includes('utama') || wName.includes('bank')) {
      const bankRegex = /\b(dompet\s+utama|utama|bank|bca|mandiri|bri|bni|cimb|jago)\b/i;
      if (bankRegex.test(lowerText)) {
        return { wallet: w, matchedInText: true };
      }
    }
  }

  // 3. If not matched in text, check preferredWalletId
  if (preferredWalletId) {
    const prefWallet = userWallets.find(w => w.id === preferredWalletId);
    if (prefWallet) {
      return { wallet: prefWallet, matchedInText: false };
    }
  }

  // 4. Fallback to default wallet
  const defaultWallet = userWallets.find(w => w.is_default) || userWallets[0] || tataDanaDb.getDefaultWallet(userId);
  return { wallet: defaultWallet, matchedInText: false };
}

export class TelegramBotEngine {
  /**
   * Process incoming text message from Telegram returning structured result with recorded transaction
   */
  static async processTextMessage(
    user: UserProfile,
    rawText: string,
    preferredWalletId?: string
  ): Promise<BotMessageResult> {
    const trimmed = rawText.trim();

    // Check Commands
    if (trimmed.startsWith('/')) {
      return { replyText: this.handleCommand(user, trimmed) };
    }

    // Check Plan Limits (Starter: 50 tx/month)
    const currentMonthTxCount = this.getMonthlyTransactionCount(user.id);
    if (user.plan === 'starter' && currentMonthTxCount >= 50) {
      return {
        replyText: `⚠️ Batas Transaksi Tercapai!

Paket Starter kamu telah mencapai limit maksimal 50 transaksi bulan ini (${currentMonthTxCount}/50).

🚀 Upgrade ke TataDana Pro (Rp99.000 Sekali Bayar) untuk nikmati:
• Unlimited transaksi & unlimited wallet
• Catat via foto struk AI OCR
• Export PDF & Excel
• AI Financial Advisor

Ketik /bantuan atau upgrade via web dashboard:
👉 https://tatadana.vercel.app/dashboard/settings`,
      };
    }

    // Parse with Multi-Provider AI
    const parseResult = await MultiProviderAIService.parseTransactionText(trimmed, user.id);

    if (!parseResult) {
      return {
        replyText: `❌ Format transaksi belum dikenali.

TataDana tidak menemukan nominal atau jenis transaksi yang jelas pada:
"${trimmed}"

💡 Contoh format yang benar:
• "Beli bakso 15rb" (Pengeluaran dompet default)
• "Beli kopi 25rb pakai dompet tunai" (Pengeluaran tunai)
• "Jajan 30k pakai e-wallet" (Pengeluaran e-wallet)
• "Gajian 5jt" (Pemasukan)
• Ketik /dompet untuk melihat daftar dompet Anda.

Coba ketik ulang ya! 😊`,
      };
    }

    // Resolve Target Wallet based on text mention, preferredWalletId, or user default
    const { wallet: targetWallet } = resolveTargetWallet(user.id, trimmed, preferredWalletId);

    // Find Category
    const categories = tataDanaDb.getCategories(user.id);
    const catQuery = parseResult.category.toLowerCase();
    let matchedCategory = categories.find(c => {
      const cName = c.name.toLowerCase();
      return cName === catQuery || catQuery.includes(cName) || cName.includes(catQuery);
    }) 
      || categories.find(c => c.type === parseResult.type)
      || categories[0];

    // Record Transaction
    const newTx = tataDanaDb.addTransaction({
      user_id: user.id,
      wallet_id: targetWallet.id,
      wallet_name: targetWallet.name,
      category_id: matchedCategory?.id,
      category_name: matchedCategory?.name || parseResult.category,
      category_icon: matchedCategory?.icon || (parseResult.type === 'expense' ? '💸' : '💰'),
      type: parseResult.type,
      amount: parseResult.amount,
      transaction_date: new Date().toISOString(),
      description: parseResult.description,
      source: 'telegram_text',
    });

    const refreshedWallet = tataDanaDb.getWalletById(targetWallet.id) || targetWallet;

    // Format Response as per Part 4.4 & 4.5
    const { fullHeader } = formatWIBDateTime();

    let reply = '';
    if (parseResult.type === 'expense') {
      const budget = tataDanaDb.getBudgets(user.id).find(b => b.category_id === matchedCategory?.id);
      let budgetSection = '';

      if (budget) {
        const percent = Math.min(100, Math.round((budget.spent / budget.monthly_limit) * 100));
        const sisa = Math.max(0, budget.monthly_limit - budget.spent);
        const progressBar = generateVisualProgressBar(percent);
        
        let motivation = '';
        if (percent >= 100) {
          motivation = '\n🚨 Peringatan: Budget kategori ini sudah habis!';
        } else if (percent >= 80) {
          motivation = '\n⚠️ Hati-hati, budget kategori ini sudah mencapai ' + percent + '%!';
        } else {
          motivation = '\n👍 Pengeluaran masih aman terkendali.';
        }

        budgetSection = `\n\n📊 Budget ${matchedCategory?.name || 'Kategori'} bulan ini:\n${progressBar} ${percent}% — sisa ${formatRupiah(sisa)}${motivation}`;
      }

      // Check Pro Financial Advisor Trigger
      let advisorSection = '';
      if (user.plan === 'pro' && budget && budget.spent > budget.monthly_limit * 0.8) {
        advisorSection = `\n\n${MultiProviderAIService.generateAdvisorAdvice(user.full_name.split(' ')[0], matchedCategory?.name || 'Makanan', 65, budget.spent)}`;
      }

      reply = `${fullHeader}
💸 Pengeluaran tercatat!
├ Nominal : ${formatRupiah(newTx.amount)}
├ Kategori : ${matchedCategory?.icon || '🏷️'} ${matchedCategory?.name || 'Umum'}
├ Dompet : ${refreshedWallet.icon || '👛'} ${refreshedWallet.name}
├ Catatan : ${newTx.description}
└ Saldo ${refreshedWallet.name} : ${formatRupiah(refreshedWallet.balance)}${budgetSection}${advisorSection}

💡 Tips: Pilih dompet via teks (contoh: "pakai cash") atau ketik /dompet`;
    } else {
      reply = `${fullHeader}
💰 Pemasukan tercatat!
├ Nominal : ${formatRupiah(newTx.amount)}
├ Kategori : 💼 Pemasukan (${matchedCategory?.name || 'Gaji'})
├ Dompet : ${refreshedWallet.icon || '👛'} ${refreshedWallet.name}
└ Saldo baru ${refreshedWallet.name} : ${formatRupiah(refreshedWallet.balance)}

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
    }

    return {
      replyText: reply,
      transaction: newTx,
    };
  }

  /**
   * Process incoming text message from Telegram returning string reply (legacy wrapper)
   */
  static async handleTextMessage(
    user: UserProfile, 
    rawText: string,
    preferredWalletId?: string
  ): Promise<string> {
    const res = await this.processTextMessage(user, rawText, preferredWalletId);
    return res.replyText;
  }


  /**
   * Handle receipt photo upload returning structured result with transaction
   */
  static async processPhotoMessage(
    user: UserProfile, 
    photoUrl: string,
    preferredWalletId?: string
  ): Promise<BotMessageResult> {
    if (user.plan !== 'pro') {
      return {
        replyText: `🔒 Fitur Khusus TataDana Pro!

Fitur catat transaksi otomatis lewat foto struk (AI OCR) hanya tersedia untuk pengguna Pro.

✨ Upgrade ke Pro sekarang (Hanya Rp99.000 Sekali Bayar):
• Scan struk belanja langsung pecah per-item otomatis
• Unlimited transaksi & dompet
• Export laporan PDF & Excel
• AI Financial Advisor

Upgrade langsung via dashboard:
👉 https://tatadana.vercel.app/dashboard/settings`,
      };
    }

    const ocrResult = await MultiProviderAIService.parseReceiptPhoto(photoUrl, user.id);
    const targetWallet = preferredWalletId
      ? (tataDanaDb.getWalletById(preferredWalletId) || tataDanaDb.getDefaultWallet(user.id))
      : tataDanaDb.getDefaultWallet(user.id);

    const categories = tataDanaDb.getCategories(user.id);
    const belanjaCat = categories.find(c => c.name.toLowerCase().includes('belanja')) || categories[0];

    const tx = tataDanaDb.addTransaction({
      user_id: user.id,
      wallet_id: targetWallet?.id || 'default',
      wallet_name: targetWallet?.name || 'Dompet Utama',
      category_id: belanjaCat?.id,
      category_name: 'Belanja Harian',
      category_icon: '🛒',
      type: 'expense',
      amount: ocrResult.totalAmount,
      transaction_date: new Date().toISOString(),
      description: `Struk ${ocrResult.merchantName} (${ocrResult.items.length} item)`,
      source: 'telegram_photo',
      receipt_url: photoUrl,
      items: ocrResult.items,
    });

    const refreshedWallet = targetWallet ? (tataDanaDb.getWalletById(targetWallet.id) || targetWallet) : tataDanaDb.getDefaultWallet(user.id);
    const { fullHeader } = formatWIBDateTime();

    const itemsSummary = ocrResult.items
      .map(i => `  • ${i.name} : ${formatRupiah(i.price)}`)
      .join('\n');

    const reply = `${fullHeader}
🧾 Struk Belanja Tercatat! (${ocrResult.merchantName})
├ Total : ${formatRupiah(ocrResult.totalAmount)}
├ Dompet : ${refreshedWallet?.icon || '👛'} ${refreshedWallet?.name || 'Dompet Utama'}
├ Rincian Item (${ocrResult.items.length} item):
${itemsSummary}
└ Saldo Sekarang : ${formatRupiah(refreshedWallet?.balance || 0)}

✨ Transaksi otomatis tersimpan rapi dan dapat di-expand di dashboard!`;

    return {
      replyText: reply,
      transaction: tx,
    };
  }

  /**
   * Handle receipt photo upload (legacy string wrapper)
   */
  static async handlePhotoMessage(
    user: UserProfile, 
    photoUrl: string,
    preferredWalletId?: string
  ): Promise<string> {
    const res = await this.processPhotoMessage(user, photoUrl, preferredWalletId);
    return res.replyText;
  }

  /**
   * Handle Voice Note returning structured result with transaction
   */
  static async processVoiceMessage(
    user: UserProfile, 
    durationSeconds: number,
    preferredWalletId?: string
  ): Promise<BotMessageResult> {
    const transcribeResult = await MultiProviderAIService.transcribeVoiceNote(durationSeconds, user.id);

    if ('error' in transcribeResult) {
      return { replyText: transcribeResult.error };
    }

    // Process transcript through standard text pipeline (with preferredWalletId and voice wallet detection)
    const textRes = await this.processTextMessage(user, transcribeResult.transcript, preferredWalletId);
    if (textRes.transaction) {
      textRes.transaction.source = 'telegram_voice';
    }

    return {
      replyText: `🎙️ Transkrip: "${transcribeResult.transcript}"\n\n${textRes.replyText}`,
      transaction: textRes.transaction,
    };
  }

  /**
   * Handle Voice Note (legacy string wrapper)
   */
  static async handleVoiceMessage(
    user: UserProfile, 
    durationSeconds: number,
    preferredWalletId?: string
  ): Promise<string> {
    const res = await this.processVoiceMessage(user, durationSeconds, preferredWalletId);
    return res.replyText;
  }

  /**
   * Handle bot slash commands
   */
  static handleCommand(user: UserProfile, cmd: string): string {
    const command = cmd.toLowerCase().trim();

    // 1. /dompet or /wallets
    if (command === '/dompet' || command === '/wallets') {
      const wallets = tataDanaDb.getWallets(user.id);
      const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

      const walletLines = wallets.map((w, idx) => 
        `${idx + 1}. ${w.icon || '👛'} ${w.name} ${w.is_default ? '⭐ (Default/Aktif)' : ''}\n   └ Saldo: ${formatRupiah(w.balance)}`
      ).join('\n\n');

      return `👛 Daftar Dompet Anda:

${walletLines}

💰 Total Seluruh Saldo: ${formatRupiah(totalBalance)}

━━━━━━━━━━━━━━━━━
💡 Cara Memilih Dompet Pengeluaran:
• Ubah dompet default aktif:
  👉 /pilih_dompet <nomor/nama>
  Contoh: /pilih_dompet 2 atau /pilih_dompet Tunai

• Atau langsung sebut di pesan transaksi:
  Contoh: "Beli bakso 15rb pakai dompet tunai"`;
    }

    // 2. /pilih_dompet or /set_dompet
    if (command.startsWith('/pilih_dompet') || command.startsWith('/pilih-dompet') || command.startsWith('/set_dompet')) {
      const parts = cmd.trim().split(/\s+/);
      const targetArg = parts.slice(1).join(' ').trim();
      const wallets = tataDanaDb.getWallets(user.id);

      if (!targetArg) {
        const walletList = wallets.map((w, idx) => `• ${idx + 1} = ${w.name} (${formatRupiah(w.balance)})`).join('\n');
        return `👛 Pilih Dompet Pengeluaran:

Ketik perintah dengan nomor urut atau nama dompet:
👉 /pilih_dompet <nomor/nama>

Daftar dompet Anda:
${walletList}

Contoh:
• /pilih_dompet 1
• /pilih_dompet Tunai
• /pilih_dompet e-Wallet`;
      }

      let matchedWallet: Wallet | undefined;
      // Numeric check (1-based index)
      const num = parseInt(targetArg, 10);
      if (!isNaN(num) && num >= 1 && num <= wallets.length) {
        matchedWallet = wallets[num - 1];
      }

      // Name check
      if (!matchedWallet) {
        const lowerArg = targetArg.toLowerCase();
        matchedWallet = wallets.find(w => w.name.toLowerCase() === lowerArg)
          || wallets.find(w => w.name.toLowerCase().includes(lowerArg))
          || wallets.find(w => lowerArg.includes(w.name.toLowerCase()));
      }

      // Type / Keyword check
      if (!matchedWallet) {
        const lowerArg = targetArg.toLowerCase();
        if (lowerArg.includes('tunai') || lowerArg.includes('cash')) {
          matchedWallet = wallets.find(w => w.type === 'cash' || w.name.toLowerCase().includes('tunai'));
        } else if (lowerArg.includes('wallet') || lowerArg.includes('gopay') || lowerArg.includes('ovo') || lowerArg.includes('dana') || lowerArg.includes('shopee')) {
          matchedWallet = wallets.find(w => w.type === 'ewallet' || w.name.toLowerCase().includes('wallet'));
        } else if (lowerArg.includes('utama') || lowerArg.includes('bank') || lowerArg.includes('bca')) {
          matchedWallet = wallets.find(w => w.type === 'bank' || w.name.toLowerCase().includes('utama'));
        }
      }

      if (!matchedWallet) {
        return `❌ Dompet "${targetArg}" tidak ditemukan.\n\nKetik /dompet untuk melihat daftar nomor dan nama dompet yang tersedia.`;
      }

      tataDanaDb.setDefaultWallet(user.id, matchedWallet.id);

      return `✅ Dompet Pengeluaran Berhasil Diubah!

Terpilih: ${matchedWallet.icon || '👛'} ${matchedWallet.name} ⭐ (Aktif/Default)
Saldo Saat Ini: ${formatRupiah(matchedWallet.balance)}

Mulai sekarang, pengeluaran baru otomatis dipotong dari dompet ini.
(💡 Kamu juga tetap bisa memilih dompet lain di setiap transaksi, contoh: "kopi 20k pakai tunai")`;
    }

    if (command === '/saldo') {
      const wallets = tataDanaDb.getWallets(user.id);
      const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

      const walletLines = wallets.map(w => 
        `├ ${w.icon} ${w.name} ${w.is_default ? '⭐ (Default)' : ''} : ${formatRupiah(w.balance)}`
      ).join('\n');

      return `👛 Ringkasan Saldo Dompet Kamu:
${walletLines}
└ 💰 Total Saldo: ${formatRupiah(totalBalance)}

Ketik transaksimu untuk mencatat pengeluaran/pemasukan baru!
Atau gunakan /dompet untuk mengganti dompet pengeluaran aktif.`;
    }

    if (command === '/hari ini') {
      const txs = tataDanaDb.getTransactions(user.id);
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const todayTxs = txs.filter(t => t.transaction_date.startsWith(todayStr));
      const totalExpense = todayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const totalIncome = todayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

      const txLines = todayTxs.slice(0, 5).map(t => 
        `• ${t.type === 'expense' ? '🔻' : '🔺'} ${formatRupiah(t.amount)} - ${t.description}`
      ).join('\n');

      return `📅 Rekap Transaksi Hari Ini:
├ Total Pengeluaran : ${formatRupiah(totalExpense)}
├ Total Pemasukan : ${formatRupiah(totalIncome)}
└ Jumlah Transaksi : ${todayTxs.length}

${txLines ? `Daftar transaksi:\n${txLines}` : 'Belum ada transaksi yang dicatat hari ini.'}`;
    }

    if (command === '/minggu ini') {
      const txs = tataDanaDb.getTransactions(user.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      const weekTxs = txs.filter(t => new Date(t.transaction_date) >= sevenDaysAgo);

      const totalExpense = weekTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const totalIncome = weekTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

      return `📊 Rekap 7 Hari Terakhir:
├ Pengeluaran : ${formatRupiah(totalExpense)}
├ Pemasukan : ${formatRupiah(totalIncome)}
├ Net Cashflow : ${formatRupiah(totalIncome - totalExpense)}
└ Total Transaksi : ${weekTxs.length}

Tetap jaga keuanganmu ya! 💪`;
    }

    if (command === '/bulan ini') {
      const txs = tataDanaDb.getTransactions(user.id);
      const currentMonth = new Date().getMonth();
      const monthTxs = txs.filter(t => new Date(t.transaction_date).getMonth() === currentMonth);

      const totalExpense = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

      return `📆 Rekap Keuangan Bulan Ini:
├ Total Pemasukan : ${formatRupiah(totalIncome)}
├ Total Pengeluaran : ${formatRupiah(totalExpense)}
└ Net Saldo : ${formatRupiah(totalIncome - totalExpense)}

Buka dashboard web untuk melihat grafik lengkap & laporan per kategori!
👉 https://tatadana.vercel.app/dashboard/reports`;
    }

    if (command === '/budget') {
      const budgets = tataDanaDb.getBudgets(user.id);
      if (budgets.length === 0) {
        return `🎯 Kamu belum menyetel budget bulan ini.
Silakan buat budget kategori di dashboard: https://tatadana.vercel.app/dashboard/budgets`;
      }

      const budgetLines = budgets.map(b => {
        const pct = Math.min(100, Math.round((b.spent / b.monthly_limit) * 100));
        const bar = generateVisualProgressBar(pct, 8);
        return `${b.category_icon || '🏷️'} ${b.category_name}:\n${bar} ${pct}% (${formatRupiah(b.spent)} / ${formatRupiah(b.monthly_limit)})`;
      }).join('\n\n');

      return `🎯 Status Budget Bulan Ini:\n\n${budgetLines}`;
    }

    if (command === '/sheet') {
      return `📄 Sinkronisasi Google Sheets TataDana:
Data transaksimu otomatis tersimpan di database TataDana.
Link Google Sheet pribadi:
👉 https://docs.google.com/spreadsheets/d/1tAtAdAnA_sAmpLe_ShEet_${user.id}

(Catatan: Struk multi-item otomatis dipecah rapi per-baris di Sheet untuk akun Pro!)`;
    }

    if (command === '/start') {
      return `👋 Halo ${user.full_name.split(' ')[0]}! Selamat datang di TataDana Bot.

Catat keuanganmu semudah chat — langsung dari Telegram kamu.

👤 Profil Terhubung : ${user.full_name} (${user.plan.toUpperCase()})
📱 Nomor HP : ${user.phone_number}
👛 Dompet Default : ${tataDanaDb.getDefaultWallet(user.id)?.name || 'Dompet Utama'}

💡 Cara mencatat & memilih dompet:
• Pengeluaran: "Beli bakso 15rb" (dompet default)
• Pilih dompet di pesan: "Kopi 25k pakai dompet tunai" atau "bayar pakai e-wallet"
• Pemasukan: "Gajian 5jt" atau "Project 1.5jt"
• Struk Belanja: Kirim foto struk belanjaanmu (Pro)
• Voice Note: Bicara sambil tahan tombol mic!
• Kelola dompet: /dompet atau /pilih_dompet <nomor/nama>

Ketik /bantuan untuk melihat semua daftar perintah.`;
    }

    if (command.startsWith('/link')) {
      const parts = cmd.trim().split(/\s+/);
      const phoneArg = parts[1];
      if (!phoneArg) {
        return `📱 Cara Menghubungkan Akun TataDana:

Ketik: /link <nomor_hp>
Contoh: /link 081234567890

Pastikan nomor HP sama dengan nomor yang kamu daftarkan di aplikasi web TataDana.`;
      }

      const tgId = (user as any).telegramUserIdTemp || 182749102;
      const res = tataDanaDb.linkTelegramUser(phoneArg, tgId);
      return res.success ? `✅ ${res.message}\n\nKetik transaksimu sekarang untuk mulai mencatat!` : `❌ ${res.message}`;
    }

    // Default /bantuan
    return `🤖 Bantuan Perintah TataDana Bot:

• /start — Mulai bot & cek status akun
• /dompet — Daftar dompet & saldo masing-masing
• /pilih_dompet <nomor/nama> — Ganti dompet aktif pengeluaran
• /saldo — Cek total saldo semua dompet
• /hari ini — Rekap transaksi hari ini
• /minggu ini — Rekap 7 hari terakhir
• /bulan ini — Rekap bulan berjalan
• /budget — Status semua budget bulanan
• /sheet — Link Google Sheet pribadi
• /link <nomor> — Hubungkan nomor HP akun TataDana
• /bantuan — Tampilkan daftar bantuan ini

💡 Tips memilih dompet pengeluaran:
Ketik langsung: "Makan siang 25rb pakai dompet tunai" atau "Kopi 20k pakai e-wallet"! 👛✨`;
  }

  /**
   * Daily Reminder Message Format (Part 4.8 Specification)
   */
  static getDailyReminderMessage(): string {
    return `⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`;
  }

  // Count transactions in current month
  static getMonthlyTransactionCount(userId: string): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const txs = tataDanaDb.getTransactions(userId);

    return txs.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }
}
