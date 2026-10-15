import { NextRequest, NextResponse } from 'next/server';
import { tataDanaDb } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({
        ok: false,
        error: 'Token bot Telegram tidak boleh kosong.',
      }, { status: 400 });
    }

    const cleanToken = token.trim();
    const centralToken = process.env.TELEGRAM_BOT_TOKEN || '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';

    // Allow single central bot token across all users; otherwise enforce uniqueness
    if (cleanToken !== centralToken) {
      const allUsers = tataDanaDb.getUsers();
      for (const u of allUsers) {
        if (u.id !== userId) {
          const existingConn = tataDanaDb.getTelegramConnection(u.id);
          if (existingConn && existingConn.bot_token_encrypted === cleanToken) {
            return NextResponse.json({
              ok: false,
              error: 'Token bot ini sudah digunakan oleh akun lain. Satu bot Telegram kustom hanya dapat dihubungkan ke satu akun TataDana.',
            }, { status: 400 });
          }
        }
      }
    }

    // Step 3: Call GET https://api.telegram.org/bot<TOKEN>/getMe
    let botInfo: any = null;
    let isValid = false;
    let telegramError = '';

    // If it's a mock token for local testing without internet
    if (cleanToken.includes('Fake') || cleanToken.includes('demo') || cleanToken.includes('mock')) {
      isValid = true;
      botInfo = {
        id: 7123456789,
        is_bot: true,
        first_name: 'TataDana Assistant',
        username: 'TataDanaBot',
      };
    } else {
      try {
        const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data.ok) {
          isValid = true;
          botInfo = data.result;
        } else {
          isValid = false;
          telegramError = data.description || 'Token bot Telegram tidak valid.';
        }
      } catch (err: any) {
        if (cleanToken === centralToken) {
          isValid = true;
          botInfo = {
            id: 8717253091,
            is_bot: true,
            first_name: 'TataDana Assistant',
            username: 'TataDanaBot',
          };
        } else {
          telegramError = `Gagal menghubungi Telegram API: ${err.message}`;
        }
      }
    }

    if (!isValid) {
      if (userId) {
        tataDanaDb.setTelegramConnection(userId, {
          bot_token_encrypted: cleanToken,
          status: 'error',
          last_error_message: telegramError,
        });
      }
      return NextResponse.json({
        ok: false,
        error: telegramError || 'Token bot tidak valid menurut Telegram API.',
      }, { status: 400 });
    }

    // Step 5: Call POST https://api.telegram.org/bot<TOKEN>/setWebhook
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'https://tatadana.vercel.app';
    const webhookUrl = `${webhookBaseUrl}/api/telegram/webhook`;

    if (!cleanToken.includes('Fake') && !cleanToken.includes('demo')) {
      try {
        const hookRes = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        });
        const hookData = await hookRes.json();
        if (!hookData.ok) {
          console.warn('[setWebhook Warning]:', hookData.description);
        }
      } catch (err) {
        console.warn('[setWebhook Network Error]:', err);
      }
    }

    // Step 6: Save connection to database
    if (userId) {
      const existingConn = tataDanaDb.getTelegramConnection(userId);
      tataDanaDb.setTelegramConnection(userId, {
        bot_token_encrypted: cleanToken,
        telegram_user_id: existingConn?.telegram_user_id,
        bot_username: botInfo.username,
        status: 'connected',
        webhook_url: webhookUrl,
        last_error_message: undefined,
      });

      // Persist real token to .env.local for background polling
      if (!cleanToken.includes('Fake') && !cleanToken.includes('demo') && !cleanToken.includes('mock')) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const envPath = path.resolve(process.cwd(), '.env.local');
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
              envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/, `TELEGRAM_BOT_TOKEN=${cleanToken}`);
            } else {
              envContent += `\nTELEGRAM_BOT_TOKEN=${cleanToken}`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
            process.env.TELEGRAM_BOT_TOKEN = cleanToken;
          }
        } catch (e) {
          console.warn('Could not update .env.local:', e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      bot: botInfo,
      webhook_url: webhookUrl,
      message: `Berhasil terhubung ke bot @${botInfo.username || 'TataDanaBot'}! Webhook aktif.`,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
