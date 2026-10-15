import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const isConfigured = isSupabaseConfigured();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const maskedUrl = rawUrl.replace(/(https?:\/\/)(.{4})(.*)(\.supabase\.co)/, '$1$2****$4');

  if (!isConfigured) {
    return NextResponse.json({
      status: 'mock_mode',
      is_configured: false,
      supabase_url: maskedUrl || 'Belum dikonfigurasi (menggunakan mock/local fallback)',
      connected: true,
      message: 'Aplikasi berjalan menggunakan mode fallback database in-memory & local storage yang reaktif. Untuk menghubungkan ke project live Supabase, isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local atau Vercel Environment Variables.',
    });
  }

  const startTime = Date.now();
  try {
    // Attempt ping / table check
    const { error, count } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json({
        status: 'connection_error',
        is_configured: true,
        supabase_url: maskedUrl,
        connected: false,
        latency_ms: latencyMs,
        error: error.message,
        details: error.details || error.hint,
        message: 'Koneksi ke Supabase gagal atau tabel belum dibuat. Pastikan skrip supabase/schema.sql telah dijalankan di Supabase SQL Editor.',
      }, { status: 502 });
    }

    return NextResponse.json({
      status: 'connected',
      is_configured: true,
      supabase_url: maskedUrl,
      connected: true,
      latency_ms: latencyMs,
      tables: ['profiles', 'email_otps', 'wallets', 'categories', 'budgets', 'transactions', 'audit_logs'],
      message: '✅ Berhasil terhubung ke database Supabase Cloud!',
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'network_error',
      is_configured: true,
      supabase_url: maskedUrl,
      connected: false,
      error: err.message,
      message: 'Gagal menghubungi server Supabase (Network Timeout atau URL salah).',
    }, { status: 500 });
  }
}
