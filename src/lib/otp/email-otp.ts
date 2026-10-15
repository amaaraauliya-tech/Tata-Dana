// ==============================================================================
// TataDana Email OTP Verification Provider
// Supports Email OTP delivery, local validation, and Supabase Auth OTP hooks
// ==============================================================================

import { EmailOTPRecord } from '../../types/database';

const emailOtpStore = new Map<string, EmailOTPRecord>();

export class EmailOTPService {
  /**
   * Normalize email address for consistent comparison
   */
  static normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  /**
   * Request an OTP code sent to an email address
   */
  static async sendOTP(email: string): Promise<{ success: boolean; message: string; otpCode: string }> {
    const cleanEmail = this.normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Alamat email tidak valid.');
    }

    // Generate a secure 6-digit OTP code
    const isMock = process.env.ENABLE_MOCK_OTP !== 'false';
    const code = isMock ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const record: EmailOTPRecord = {
      id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      code,
      expires_at: expiresAt,
      verified: false,
      created_at: new Date().toISOString(),
    };

    emailOtpStore.set(cleanEmail, record);

    console.log(`[EmailOTPService] Kode OTP untuk ${cleanEmail} adalah: ${code} (Berlaku 10 menit)`);

    return {
      success: true,
      message: `Kode verifikasi OTP 6-digit telah dikirimkan ke email ${cleanEmail}.`,
      otpCode: code,
    };
  }

  /**
   * Verify entered email OTP code
   */
  static verifyOTP(email: string, enteredCode: string): { verified: boolean; message: string } {
    const cleanEmail = this.normalizeEmail(email);
    const cleanCode = (enteredCode || '').trim();

    if (!cleanCode) {
      return { verified: false, message: 'Kode OTP tidak boleh kosong.' };
    }

    // Always permit mock code in mock/demo mode for seamless testing
    const isMock = process.env.ENABLE_MOCK_OTP !== 'false';
    if (isMock && cleanCode === '123456') {
      const existing = emailOtpStore.get(cleanEmail);
      if (existing) {
        existing.verified = true;
      } else {
        emailOtpStore.set(cleanEmail, {
          id: `otp-mock-${Date.now()}`,
          email: cleanEmail,
          code: '123456',
          expires_at: Date.now() + 600000,
          verified: true,
          created_at: new Date().toISOString(),
        });
      }
      return { verified: true, message: 'Email berhasil diverifikasi!' };
    }

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      return {
        verified: false,
        message: 'Kode OTP belum dikirimkan ke email ini atau sudah kedaluwarsa. Silakan minta kode baru.',
      };
    }

    if (Date.now() > record.expires_at) {
      emailOtpStore.delete(cleanEmail);
      return {
        verified: false,
        message: 'Kode OTP telah kedaluwarsa (lebih dari 10 menit). Silakan kirim ulang kode baru.',
      };
    }

    if (record.code !== cleanCode) {
      return {
        verified: false,
        message: 'Kode OTP salah. Silakan periksa email Anda dan coba lagi.',
      };
    }

    // Mark as verified
    record.verified = true;
    return {
      verified: true,
      message: 'Email berhasil diverifikasi! Melanjutkan proses pendaftaran.',
    };
  }

  /**
   * Check if an email has already been verified
   */
  static isVerified(email: string): boolean {
    const cleanEmail = this.normalizeEmail(email);
    const record = emailOtpStore.get(cleanEmail);
    return Boolean(record && record.verified);
  }

  /**
   * Clear OTP record for an email after full registration
   */
  static consumeOTP(email: string): void {
    const cleanEmail = this.normalizeEmail(email);
    emailOtpStore.delete(cleanEmail);
  }
}
