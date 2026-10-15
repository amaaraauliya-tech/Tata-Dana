import { NextRequest, NextResponse } from 'next/server';
import { PhoneOTPService } from '@/lib/otp/phone-otp';

export async function POST(req: NextRequest) {
  try {
    const { action, phoneNumber, code } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: 'Nomor HP wajib diisi.' }, { status: 400 });
    }

    if (action === 'send') {
      const result = await PhoneOTPService.sendOTP(phoneNumber);
      return NextResponse.json(result);
    } else if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ success: false, message: 'Kode OTP tidak boleh kosong.' }, { status: 400 });
      }
      const result = PhoneOTPService.verifyOTP(phoneNumber, code);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
