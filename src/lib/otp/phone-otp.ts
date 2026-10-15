// ==============================================================================
// TataDana Phone OTP Verification Provider
// Dual Mode: Instant Mock OTP ('123456') & Production SMS Gateway (Fonnte/Twilio)
// ==============================================================================

interface OTPRecord {
  phone: string;
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OTPRecord>();

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim().replace(/[^\d+]/g, '');
  if (clean.startsWith('0')) {
    clean = '+62' + clean.slice(1);
  } else if (clean.startsWith('62')) {
    clean = '+' + clean;
  } else if (!clean.startsWith('+')) {
    clean = '+62' + clean;
  }
  return clean;
}

export class PhoneOTPService {
  /**
   * Request OTP code for a phone number
   */
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string; mockCode?: string }> {
    const normalized = normalizePhoneNumber(phoneNumber);
    const isMock = process.env.ENABLE_MOCK_OTP !== 'false';
    const code = isMock ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(normalized, { phone: normalized, code, expiresAt });

    if (!isMock && process.env.SMS_GATEWAY_API_KEY) {
      // Production SMS Gateway hook (e.g. Fonnte / Twilio)
      try {
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': process.env.SMS_GATEWAY_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: normalized,
            message: `[TataDana] Kode verifikasi keamanan akun Anda: ${code}. Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.`,
          }),
        });
      } catch (err) {
        console.error('SMS Gateway Error:', err);
      }
    }

    return {
      success: true,
      message: `Kode OTP verifikasi telah dikirim ke nomor ${phoneNumber}.`,
      mockCode: isMock ? '123456' : undefined,
    };
  }

  /**
   * Verify entered OTP code
   */
  static verifyOTP(phoneNumber: string, enteredCode: string): { verified: boolean; message: string } {
    const isMock = process.env.ENABLE_MOCK_OTP !== 'false';
    
    // Always permit mock code in mock mode
    if (isMock && enteredCode === '123456') {
      return { verified: true, message: 'Nomor WhatsApp / HP berhasil diverifikasi.' };
    }

    const normalized = normalizePhoneNumber(phoneNumber);
    const record = otpStore.get(normalized);
    if (!record) {
      return { verified: false, message: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan kirim ulang.' };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized);
      return { verified: false, message: 'Kode OTP telah kedaluwarsa.' };
    }

    if (record.code !== enteredCode) {
      return { verified: false, message: 'Kode OTP salah. Silakan periksa kembali.' };
    }

    otpStore.delete(normalized);
    return { verified: true, message: 'Nomor WhatsApp / HP berhasil diverifikasi.' };
  }
}
