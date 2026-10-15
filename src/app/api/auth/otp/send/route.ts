import { NextRequest, NextResponse } from 'next/server';
import { EmailOTPService } from '@/lib/otp/email-otp';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Alamat email tidak valid.' },
        { status: 400 }
      );
    }

    const result = await EmailOTPService.sendOTP(email);

    return NextResponse.json({
      ok: true,
      message: result.message,
      // Provide OTP code in response for instant developer & automated preview
      otpCode: result.otpCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal mengirim kode OTP.' },
      { status: 500 }
    );
  }
}
