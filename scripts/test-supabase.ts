// ==============================================================================
// Script to test Supabase cloud connection
// Run with: node -r ./node_modules/sucrase/register/ts scripts/test-supabase.ts
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../src/lib/supabase/client';
import { supabaseAdmin } from '../src/lib/supabase/admin';

async function testSupabase() {
  console.log('=== TESTING SUPABASE CONFIGURATION & CONNECTION ===\n');

  const configured = isSupabaseConfigured();
  console.log(`1. Is Live Supabase Configured? : ${configured ? 'YES (Live Cloud)' : 'NO (Using Mock/Fallback)'}`);
  console.log(`2. Project URL                  : ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}`);
  console.log(`3. Anon Key Present?            : ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`);
  console.log(`4. Service Role Key Present?    : ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}\n`);

  if (!configured) {
    console.log('ℹ️  INFO: Aplikasi siap dihubungkan ke Supabase!');
    console.log('Untuk menghubungkan:');
    console.log('1. Buat project baru di https://database.new (Supabase)');
    console.log('2. Masukkan URL dan Anon Key ke file .env.local');
    console.log('3. Jalankan query SQL dari supabase/schema.sql di Supabase SQL Editor\n');
    return;
  }

  try {
    const t0 = Date.now();
    const { data, error } = await supabaseAdmin.from('profiles').select('id, email').limit(1);
    const elapsed = Date.now() - t0;

    if (error) {
      console.error(`❌ Gagal query tabel profiles: ${error.message}`);
      console.error('Pastikan kamu sudah menjalankan supabase/schema.sql di SQL Editor Supabase!');
    } else {
      console.log(`✅ Berhasil terhubung ke Supabase Cloud! Latency: ${elapsed}ms`);
      console.log(`Data profiles ditemukan: ${data?.length || 0} baris`);
    }
  } catch (err: any) {
    console.error('❌ Network Error saat menghubungi Supabase:', err.message);
  }
}

testSupabase();
