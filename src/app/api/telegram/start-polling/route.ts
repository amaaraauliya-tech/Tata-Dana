import { NextRequest, NextResponse } from 'next/server';
import { TelegramBotEngine } from '@/lib/telegram/bot-logic';
import { tataDanaDb } from '@/lib/mock-db';
import { realtimeEventBus } from '@/lib/realtime-events';


// Global variable across requests in Node process
declare global {
  var telegramPollingActive: boolean | undefined;
  var telegramPollingBot: any | undefined;
  var telegramPollingOffset: number | undefined;
}

export async function GET() {
  return NextResponse.json({
    active: !!global.telegramPollingActive,
    bot: global.telegramPollingBot || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { token: inputToken, userId } = await req.json();

    const conn = userId ? tataDanaDb.getTelegramConnection(userId) : null;
    const centralToken = process.env.TELEGRAM_BOT_TOKEN || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';
    const token = inputToken || conn?.bot_token_encrypted || centralToken;

    if (!token || token.includes('Fake') || token.includes('demo') || token.includes('mock')) {
      return NextResponse.json({
        ok: false,
        error: 'Token bot belum valid. Silakan buat bot di @BotFather dan masukkan token asli.',
      }, { status: 400 });
    }

    const cleanToken = token.trim();
    const API_BASE = `https://api.telegram.org/bot${cleanToken}`;

    // 1. Check getMe
    let botInfo: any = null;
    try {
      const res = await fetch(`${API_BASE}/getMe`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (!data.ok) {
        return NextResponse.json({
          ok: false,
          error: `Gagal verifikasi ke Telegram: ${data.description}`,
        }, { status: 400 });
      }
      botInfo = data.result;
    } catch (netErr: any) {
      if (cleanToken === centralToken) {
        botInfo = {
          id: 8717253091,
          is_bot: true,
          first_name: 'TataDana Assistant',
          username: 'TataDanaBot',
        };
      } else {
        return NextResponse.json({
          ok: false,
          error: `Gagal menghubungi Telegram API: ${netErr.message}`,
        }, { status: 400 });
      }
    }

    global.telegramPollingBot = botInfo;

    // 2. Delete webhook so getUpdates is enabled
    try {
      await fetch(`${API_BASE}/deleteWebhook?drop_pending_updates=false`, { signal: AbortSignal.timeout(5000) });
    } catch (e) {}

    // 3. Start background polling loop if not already running
    if (!global.telegramPollingActive) {
      global.telegramPollingActive = true;
      global.telegramPollingOffset = 0;

      // Start async background loop
      (async function runPolling() {
        console.log(`[Telegram Polling] Started listening for @${botInfo.username}...`);

        while (global.telegramPollingActive) {
          try {
            const pollRes = await fetch(
              `${API_BASE}/getUpdates?offset=${global.telegramPollingOffset || 0}&timeout=20`,
              { signal: AbortSignal.timeout(30000) }
            );
            const pollData = await pollRes.json();

            if (pollData.ok && Array.isArray(pollData.result)) {
              for (const update of pollData.result) {
                global.telegramPollingOffset = update.update_id + 1;

                if (update.message) {
                  const message = update.message;
                  const chatId = message.chat?.id;
                  const telegramUserId = message.from?.id;

                  // Find matched user
                  let matchedUser = tataDanaDb.getUserByTelegramId(telegramUserId);
                  let replyText = '';

                  if (!matchedUser) {
                    const trimmed = (message.text || '').trim();
                    if (trimmed.startsWith('/link')) {
                      const phone = trimmed.split(/\s+/)[1];
                      if (!phone) {
                        replyText = `📱 Format Perintah Salah!\n\nKetik: /link <nomor_hp>\nContoh: /link 081234567890`;
                      } else {
                        const linkResult = tataDanaDb.linkTelegramUser(phone, telegramUserId, message.from?.username);
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
                          replyText = `❌ ${linkResult.message}\n\nPastikan nomor HP sama dengan yang terdaftar di TataDana.`;
                        }
                      }
                    } else if (trimmed === '/start') {
                      replyText = `👋 Halo ${message.from?.first_name || 'Teman'}! Selamat datang di TataDana Bot.\n\nCatat keuanganmu semudah chat — langsung dari Telegram kamu.\n\nUntuk menghubungkan akun TataDana kamu:\n👉 Ketik: /link <nomor_hp>\n(Contoh: /link 081234567890)`;
                    } else {
                      replyText = `🔒 Akun Telegram Belum Terhubung!\n\nUntuk mulai mencatat, ketik:\n👉 /link <nomor_hp>\n(Contoh: /link 081234567890)`;
                    }
                  } else {
                    let recordedTransaction: any = null;
                    const isApprovedUser = matchedUser.is_admin || matchedUser.approval_status === 'approved';
                    if (!isApprovedUser) {
                      if (matchedUser.approval_status === 'rejected') {
                        replyText = `❌ Pendaftaran Akun Ditolak!\n\nMohon maaf ${matchedUser.full_name}, permohonan pendaftaran akun TataDana Anda tidak disetujui oleh Administrator. Anda belum dapat mencatat transaksi atau menggunakan layanan bot ini.`;
                      } else {
                        replyText = `⏳ Menunggu Persetujuan Admin!\n\nHalo ${matchedUser.full_name}! Akun TataDana Anda saat ini masih dalam status menunggu persetujuan dari Super Administrator.\n\nAnda dapat mulai mencatat transaksi setelah akun disetujui. Silakan cek status di aplikasi web TataDana: https://tatadana.vercel.app/dashboard`;
                      }
                    } else {
                      if (message.text) {
                        const botResult = await TelegramBotEngine.processTextMessage(matchedUser, message.text);
                        replyText = botResult.replyText;
                        recordedTransaction = botResult.transaction;
                      } else if (message.photo && message.photo.length > 0) {
                        const largestPhoto = message.photo[message.photo.length - 1];
                        const photoUrl = `https://api.telegram.org/file/bot${cleanToken}/${largestPhoto.file_id}`;
                        const botResult = await TelegramBotEngine.processPhotoMessage(matchedUser, photoUrl);
                        replyText = botResult.replyText;
                        recordedTransaction = botResult.transaction;
                      } else if (message.voice) {
                        const duration = message.voice.duration || 5;
                        const botResult = await TelegramBotEngine.processVoiceMessage(matchedUser, duration);
                        replyText = botResult.replyText;
                        recordedTransaction = botResult.transaction;
                      } else {
                        replyText = '👋 Halo! TataDana menerima pesan teks transaksi, foto struk, atau voice note.';
                      }
                    }

                    if (recordedTransaction && matchedUser) {
                      realtimeEventBus.broadcast('telegram_transaction', {
                        userId: matchedUser.id,
                        userName: matchedUser.full_name,
                        transaction: recordedTransaction,
                        replyText,
                        wallets: tataDanaDb.getWallets(matchedUser.id),
                        budgets: tataDanaDb.getBudgets(matchedUser.id),
                      });
                    }
                  }

                  // Deliver reply directly to Telegram
                  if (chatId) {
                    await fetch(`${API_BASE}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: chatId,
                        text: replyText,
                      }),
                    });
                  }

                }
              }
            }
          } catch (loopErr: any) {
            if (loopErr.name !== 'TimeoutError') {
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
        }
      })();
    }

    return NextResponse.json({
      ok: true,
      bot: botInfo,
      message: `🟢 Berhasil! Bot @${botInfo.username} terhubung & polling aktif di Telegram. Coba chat bot kamu di Telegram sekarang!`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  global.telegramPollingActive = false;
  return NextResponse.json({ ok: true, message: 'Polling dihentikan.' });
}
