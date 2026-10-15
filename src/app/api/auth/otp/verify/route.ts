import { NextRequest, NextResponse } from 'next/server';
import { EmailOTPService } from '@/lib/otp/email-otp';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: 'Email dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    const result = EmailOTPService.verifyOTP(email, code);

    if (!result.verified) {
      return NextResponse.json(
        { ok: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal memverifikasi OTP.' },
      { status: 500 }
    );
  }
}
