import { NextRequest, NextResponse } from 'next/server';
import { TelegramBotEngine } from '@/lib/telegram/bot-logic';
import { tataDanaDb } from '@/lib/mock-db';
import { realtimeEventBus } from '@/lib/realtime-events';

// In-memory update tracker for webhook idempotency
const processedUpdateIds = new Set<number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updateId = body.update_id;

    // 1. Webhook Idempotency Check (Part 2 requirement)
    if (updateId) {
      if (processedUpdateIds.has(updateId)) {
        console.log(`[Telegram Webhook] Duplicate update_id ${updateId} skipped.`);
        return NextResponse.json({ ok: true, status: 'skipped_duplicate' });
      }
      processedUpdateIds.add(updateId);
      // Keep memory bounded to latest 50,000 updates
      if (processedUpdateIds.size > 50000) {
        const first = processedUpdateIds.values().next().value;
        if (first !== undefined) processedUpdateIds.delete(first);
      }
    }

    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true, status: 'no_message_payload' });
    }

    const chatId = message.chat?.id;
    const telegramUserId = message.from?.id;

    // 2. Identify User
    // Check if simulator provided an explicit userId, or lookup by telegram_user_id
    let matchedUser = body.userId ? tataDanaDb.getUserById(body.userId) : undefined;
    if (!matchedUser && body.userId) {
      if (body.userProfile) {
        tataDanaDb.upsertUser(body.userProfile);
      }
      tataDanaDb.initUserDefaults(body.userId);
      if (body.telegramConn) {
        tataDanaDb.setTelegramConnection(body.userId, body.telegramConn);
      }
      matchedUser = tataDanaDb.getUserById(body.userId);
    }
    if (!matchedUser && telegramUserId) {
      matchedUser = tataDanaDb.getUserByTelegramId(telegramUserId);
    }
    if (matchedUser && tataDanaDb.getWallets(matchedUser.id).length === 0) {
      tataDanaDb.initUserDefaults(matchedUser.id);
    }

    let replyText = '';
    let recordedTransaction: any = null;

    // Handle Unlinked Telegram User
    if (!matchedUser) {
      const trimmedText = (message.text || '').trim();

      if (trimmedText.startsWith('/link')) {
        const phoneArg = trimmedText.split(/\s+/)[1];
        if (!phoneArg) {
          replyText = `📱 Format Perintah Salah!

Ketik: /link <nomor_hp>
Contoh: /link 081234567890

Gunakan nomor HP yang kamu daftarkan di dashboard web TataDana.`;
        } else {
          const linkResult = tataDanaDb.linkTelegramUser(phoneArg, telegramUserId || 182749102, message.from?.username);
          if (linkResult.success) {
            const linkedUser = linkResult.user;
            if (linkedUser?.approval_status === 'pending' && !linkedUser.is_admin) {
              replyText = `✅ ${linkResult.message}\n\n⏳ Catatan: Akun Anda saat ini masih berstatus "Menunggu Persetujuan Admin". Anda baru dapat mulai mencatat transaksi setelah disetujui oleh Super Administrator.`;
            } else if (linkedUser?.approval_status === 'rejected') {
              replyText = `⚠️ Akun Telegram terhubung, namun status pendaftaran akun TataDana Anda tidak disetujui (Ditolak).`;
            } else {
              replyText = `✅ ${linkResult.message}\n\nSekarang kamu bisa langsung ketik transaksi pertamamu (contoh: "Beli bakso 15rb" atau /saldo)! 🚀`;
            }
          } else {
            replyText = `❌ ${linkResult.message}\n\nBelum punya akun? Daftar gratis di https://tatadana.vercel.app/register`;
          }
        }
      } else if (trimmedText === '/start') {
        replyText = `👋 Halo ${message.from?.first_name || 'Teman'}! Selamat datang di TataDana Bot.

Catat keuanganmu semudah chat — langsung dari Telegram kamu.

⚠️ Akun Telegram kamu belum terhubung dengan TataDana.
Untuk menghubungkan akun:
1. Pastikan kamu sudah mendaftar di web: https://tatadana.vercel.app
2. Ketik perintah:
   👉 /link <nomor_hp>
   (Contoh: /link 081234567890)

Setelah terhubung, kamu bisa mencatat transaksi lewat teks, foto struk belanja, atau voice note! 🚀`;
      } else {
        replyText = `🔒 Akun Telegram Belum Terhubung!

Halo ${message.from?.first_name || 'Teman'}! Akun Telegram ini belum dihubungkan ke akun TataDana.

Untuk mulai mencatat, ketik:
👉 /link <nomor_hp>
(Contoh: /link 081234567890)

Atau buka dashboard web TataDana:
https://tatadana.vercel.app`;
      }
    } else {
      // 3. User is Linked: Check approval status before permitting application usage
      const isApprovedUser = matchedUser.is_admin || matchedUser.approval_status === 'approved';
      if (!isApprovedUser) {
        if (matchedUser.approval_status === 'rejected') {
          replyText = `❌ Pendaftaran Akun Ditolak!\n\nMohon maaf ${matchedUser.full_name}, permohonan pendaftaran akun TataDana Anda tidak disetujui oleh Administrator. Anda belum dapat mencatat transaksi atau menggunakan layanan bot ini.`;
        } else {
          replyText = `⏳ Menunggu Persetujuan Admin!\n\nHalo ${matchedUser.full_name}! Akun TataDana Anda saat ini masih dalam status menunggu persetujuan dari Super Administrator.\n\nAnda dapat mulai mencatat transaksi setelah akun disetujui. Silakan cek status di aplikasi web TataDana: https://tatadana.vercel.app/dashboard`;
        }
      } else {
        // Preferred wallet specified by client (e.g. Chatbot Widget)
        const preferredWalletId = body.wallet_id || body.preferredWalletId || message.wallet_id;

        // Route according to message payload type
        if (message.text) {
          const botResult = await TelegramBotEngine.processTextMessage(matchedUser, message.text, preferredWalletId);
          replyText = botResult.replyText;
          recordedTransaction = botResult.transaction;
        } else if (message.photo && message.photo.length > 0) {
          // Photo OCR receipt
          const largestPhoto = message.photo[message.photo.length - 1];
          const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac'}/${largestPhoto.file_id}`;
          const botResult = await TelegramBotEngine.processPhotoMessage(matchedUser, photoUrl, preferredWalletId);
          replyText = botResult.replyText;
          recordedTransaction = botResult.transaction;
        } else if (message.voice) {
          // Voice Note
          const durationSeconds = message.voice.duration || 5;
          const botResult = await TelegramBotEngine.processVoiceMessage(matchedUser, durationSeconds, preferredWalletId);
          replyText = botResult.replyText;
          recordedTransaction = botResult.transaction;
        } else {
          replyText = '👋 Halo! TataDana dapat menerima pesan teks transaksi (contoh: "Makan siang 25rb"), foto struk belanja, atau rekaman suara.';
        }
      }
    }

    // 4. Send response back to Telegram Bot API if configured
    const conn = matchedUser ? tataDanaDb.getTelegramConnection(matchedUser.id) : null;
    const botToken = body.botToken || process.env.TELEGRAM_BOT_TOKEN || conn?.bot_token_encrypted || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';
    if (botToken && !botToken.includes('mock') && !botToken.includes('Fake') && !botToken.includes('demo') && chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
          }),
        });
      } catch (err) {
        console.error('[Telegram Webhook] Failed to deliver reply to Telegram API:', err);
      }
    }

    const responseData: any = {
      ok: true,
      processed_user: matchedUser?.full_name || 'Unlinked Telegram User',
      reply_text: replyText,
    };

    if (matchedUser) {
      responseData.transactions = tataDanaDb.getTransactions(matchedUser.id);
      responseData.wallets = tataDanaDb.getWallets(matchedUser.id);
      responseData.budgets = tataDanaDb.getBudgets(matchedUser.id);

      if (recordedTransaction) {
        responseData.latest_transaction = recordedTransaction;
        realtimeEventBus.broadcast('telegram_transaction', {
          userId: matchedUser.id,
          userName: matchedUser.full_name,
          transaction: recordedTransaction,
          replyText,
          wallets: responseData.wallets,
          budgets: responseData.budgets,
        });
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[Telegram Webhook Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
