// ==============================================================================
// TataDana Localhost Telegram Long-Polling Service
// Connects directly to Telegram API via getUpdates and forwards to local webhook
// No Ngrok or public domain required for local development!
// ==============================================================================

import fs from 'fs';
import path from 'path';

// Read token from argument or .env.local or .env
let token = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  try {
    for (const file of ['.env.local', '.env']) {
      const envPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/TELEGRAM_BOT_TOKEN=([^\r\n]+)/);
        if (match && match[1]) {
          token = match[1].trim();
          break;
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

if (!token) {
  token = '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';
}

if (!token || token.includes('Fake') || token.includes('demo')) {
  console.log('------------------------------------------------------------');
  console.log('⚠️ TELEGRAM BOT TOKEN BELUM DIISI ATAU MASIH MOCK!');
  console.log('');
  console.log('Untuk menghubungkan chat bot AI ke Telegram asli:');
  console.log('1. Buka aplikasi Telegram di HP / Laptop.');
  console.log('2. Cari bot resmi: @BotFather');
  console.log('3. Kirim pesan: /newbot');
  console.log('4. Ikuti instruksi (beri nama & username bot, akhiri dengan "_bot")');
  console.log('5. Salin token HTTP API yang diberikan oleh BotFather.');
  console.log('   (Format contoh: 7123456789:AAHfk3829sjd923kjsdkfj...)');
  console.log('6. Jalankan script ini dengan token:');
  console.log('   node scripts/telegram-polling.mjs <TOKEN_BOT_KAMU>');
  console.log('   atau masukkan token di Pengaturan web: http://localhost:3001/dashboard/settings');
  console.log('------------------------------------------------------------');
  process.exit(0);
}

const API_BASE = `https://api.telegram.org/bot${token}`;
const LOCAL_WEBHOOK_URL = process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3001/api/telegram/webhook';

let offset = 0;
let isRunning = true;

async function initBot() {
  try {
    // 1. Check getMe
    const res = await fetch(`${API_BASE}/getMe`);
    const data = await res.json();
    if (!data.ok) {
      console.error('❌ Gagal menghubungi bot Telegram:', data.description);
      process.exit(1);
    }

    const bot = data.result;
    console.log('============================================================');
    console.log(`🤖 TATADANA TELEGRAM BOT TERHUBUNG!`);
    console.log(`Nama Bot     : ${bot.first_name}`);
    console.log(`Username Bot : @${bot.username}`);
    console.log(`Tautan Chat  : https://t.me/${bot.username}`);
    console.log(`Forwarding ke: ${LOCAL_WEBHOOK_URL}`);
    console.log('============================================================');
    console.log('👂 Menunggu pesan dari Telegram... (Ketik transaksi di HP kamu)');

    // 2. Delete webhook so getUpdates works
    await fetch(`${API_BASE}/deleteWebhook?drop_pending_updates=false`);

    // 3. Start Polling Loop
    pollLoop();
  } catch (err) {
    console.error('❌ Error inisialisasi bot:', err.message);
  }
}

async function pollLoop() {
  while (isRunning) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=20`, {
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          if (update.message) {
            const senderName = update.message.from?.first_name || 'User';
            const username = update.message.from?.username ? `@${update.message.from.username}` : '';
            const msgText = update.message.text || (update.message.photo ? '[Foto Struk]' : update.message.voice ? '[Voice Note]' : '[Media]');
            
            console.log(`\n📩 [Telegram Update] dari ${senderName} ${username}: "${msgText}"`);

            // Forward to local TataDana Webhook
            try {
              const webhookRes = await fetch(LOCAL_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...update,
                  botToken: token,
                }),
              });

              const webhookData = await webhookRes.json();
              console.log(`✅ [Tersimpan & Terbalas]: ${webhookData.reply_text ? webhookData.reply_text.split('\n')[0] : 'OK'}`);
            } catch (postErr) {
              console.error('⚠️ Gagal meneruskan ke server lokal:', postErr.message);
            }
          }
        }
      }
    } catch (pollErr) {
      if (pollErr.name !== 'TimeoutError') {
        // Sleep briefly on network error before retrying
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Menghentikan polling bot...');
  isRunning = false;
  process.exit(0);
});

initBot();
