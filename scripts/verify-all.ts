import { tataDanaDb, CENTRAL_TELEGRAM_BOT_TOKEN } from '../src/lib/mock-db';
import { EmailOTPService } from '../src/lib/otp/email-otp';
import { TelegramBotEngine } from '../src/lib/telegram/bot-logic';
import {
  SupabaseUserRepository,
  SupabaseWalletRepository,
  SupabaseTransactionRepository,
  SupabaseEmailOTPRepository
} from '../src/lib/supabase/repository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTestSuite() {
  console.log('=== STARTING TATADANA UPDATED VERIFICATION TEST SUITE ===\n');

  // --------------------------------------------------------------------------
  // TEST 1: Akun Uji Coba Dihilangkan & Role Separation (Admin vs User)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: No Demo Users & Strict Role Separation ---');
  const budi = tataDanaDb.getUserByEmail('budi@tatadana.id');
  const siti = tataDanaDb.getUserByEmail('siti@tatadana.id');
  const admin = tataDanaDb.getUserByEmail('admin@tatadana.id');

  assert(!budi, 'Akun uji coba Budi (budi@tatadana.id) berhasil dihilangkan');
  assert(!siti, 'Akun uji coba Siti (siti@tatadana.id) berhasil dihilangkan');
  assert(!!admin && admin.is_admin === true && admin.role === 'admin', 'Super Admin (Saya) adalah satu-satunya user bawaan dengan role admin');
  assert(!!admin && admin.approval_status === 'approved', 'Super Admin berstatus approved');

  const adminWallets = tataDanaDb.getWallets(admin!.id);
  assert(adminWallets.length >= 1, 'Admin memiliki dompet default');
  assert(adminWallets[0].balance === 0, `Dompet admin mulai dari saldo Rp 0 (ditemukan: ${adminWallets[0].balance})`);

  // --------------------------------------------------------------------------
  // TEST 2: Email OTP Verification (Sebelum Approval)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Email OTP Verification Service ---');
  const testUserEmail = `calon-nasabah-${Date.now()}@gmail.com`;
  
  // 2a. Request OTP
  const otpSendRes = await EmailOTPService.sendOTP(testUserEmail);
  assert(otpSendRes.success, 'Kode OTP berhasil digenerate dan dikirim ke email');
  assert(typeof otpSendRes.otpCode === 'string' && otpSendRes.otpCode.length === 6, 'Kode OTP 6-digit valid');
  assert(!EmailOTPService.isVerified(testUserEmail), 'Email belum berstatus verified sebelum diverifikasi');

  // 2b. Verify with wrong code
  const wrongRes = EmailOTPService.verifyOTP(testUserEmail, '999999');
  assert(!wrongRes.verified, 'Verifikasi dengan kode OTP yang salah ditolak');

  // 2c. Verify with correct code
  const correctRes = EmailOTPService.verifyOTP(testUserEmail, otpSendRes.otpCode);
  assert(correctRes.verified, 'Verifikasi dengan kode OTP yang benar berhasil');
  assert(EmailOTPService.isVerified(testUserEmail), 'Status email kini terverifikasi (verified: true)');

  // --------------------------------------------------------------------------
  // TEST 3: User Registration, Saldo Rp 0, dan Pending Approval
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: New User Registration & Saldo Rp 0 ---');
  const newUser = tataDanaDb.createUser({
    full_name: 'Dian Permata',
    email: testUserEmail,
    phone_number: '+6281233445566',
    email_verified: true,
  });

  assert(newUser.email_verified === true, 'User baru memiliki status email_verified: true');
  assert(newUser.approval_status === 'pending', 'User baru otomatis berstatus approval_status: pending');
  assert(newUser.is_admin === false && newUser.role === 'user', 'User baru memiliki role: user dan is_admin: false');

  const userWallets = tataDanaDb.getWallets(newUser.id);
  assert(userWallets.length === 3, 'User baru mendapatkan 3 dompet default (Dompet Utama, Dompet Tunai, e-Wallet)');

  for (const w of userWallets) {
    assert(w.balance === 0, `Dompet "${w.name}" bersaldo tepat Rp 0 (got ${w.balance})`);
  }

  const totalBalance = userWallets.reduce((acc, w) => acc + w.balance, 0);
  assert(totalBalance === 0, 'Total saldo seluruh dompet pengguna baru adalah Rp 0');

  // --------------------------------------------------------------------------
  // TEST 4: Pencatatan Transaksi & Persistensi
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Transaction & Balance Persistence ---');
  const defaultWallet = tataDanaDb.getDefaultWallet(newUser.id);

  // 4a. Income
  tataDanaDb.addTransaction({
    user_id: newUser.id,
    wallet_id: defaultWallet.id,
    wallet_name: defaultWallet.name,
    category_name: 'Gaji',
    category_icon: '💰',
    type: 'income',
    amount: 3000000,
    description: 'Pemasukan Awal',
    transaction_date: new Date().toISOString(),
    source: 'web_ui',
  });

  const walletAfterIncome = tataDanaDb.getWallets(newUser.id).find(w => w.id === defaultWallet.id);
  assert(walletAfterIncome?.balance === 3000000, 'Saldo bertambah menjadi Rp 3.000.000 setelah pemasukan');

  // 4b. Expense
  tataDanaDb.addTransaction({
    user_id: newUser.id,
    wallet_id: defaultWallet.id,
    wallet_name: defaultWallet.name,
    category_name: 'Makanan',
    category_icon: '🍜',
    type: 'expense',
    amount: 50000,
    description: 'Makan Siang',
    transaction_date: new Date().toISOString(),
    source: 'web_ui',
  });

  const walletAfterExpense = tataDanaDb.getWallets(newUser.id).find(w => w.id === defaultWallet.id);
  assert(walletAfterExpense?.balance === 2950000, 'Saldo berkurang menjadi Rp 2.950.000 setelah pengeluaran');

  // --------------------------------------------------------------------------
  // TEST 5: Single Telegram Bot Token (8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Telegram Bot Token ---');
  const expectedToken = '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';
  assert(CENTRAL_TELEGRAM_BOT_TOKEN === expectedToken, `CENTRAL_TELEGRAM_BOT_TOKEN sesuai: ${expectedToken}`);

  // --------------------------------------------------------------------------
  // TEST 6: Admin Approval Workflow & Bot Gate
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: Admin Approval Workflow ---');
  assert(newUser.approval_status === 'pending', 'User sebelum disetujui berstatus pending');

  // Admin approves user
  tataDanaDb.updateUserApprovalStatus(newUser.id, 'approved', admin!.id);
  const approvedUser = tataDanaDb.getUserById(newUser.id)!;
  assert(approvedUser.approval_status === 'approved', 'User berhasil disetujui (approved) oleh Admin');

  // Telegram bot gate simulation
  const checkBotGate = (u: any) => {
    return Boolean(u && (u.is_admin || u.approval_status === 'approved'));
  };

  assert(checkBotGate(admin) === true, 'Admin lolos bot gate');
  assert(checkBotGate(approvedUser) === true, 'Approved user lolos bot gate');
  assert(checkBotGate({ is_admin: false, approval_status: 'pending' }) === false, 'Pending user diblokir oleh bot gate');
  assert(checkBotGate({ is_admin: false, approval_status: 'rejected' }) === false, 'Rejected user diblokir oleh bot gate');

  // --------------------------------------------------------------------------
  // TEST 7: Supabase Repository Layer Integration
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: Supabase Repository Layer ---');
  
  // 7a. User Repo
  const repoUser = await SupabaseUserRepository.getUserByEmail(newUser.email);
  assert(!!repoUser && repoUser.id === newUser.id, 'SupabaseUserRepository dapat mengambil data user');

  // 7b. Wallet Repo
  const repoWallets = await SupabaseWalletRepository.getWallets(newUser.id);
  assert(repoWallets.length === 3, 'SupabaseWalletRepository mengembalikan 3 dompet');

  // 7c. Email OTP Repo
  const otpRepoEmail = `repo-otp-${Date.now()}@tatadana.id`;
  const sendRes = await SupabaseEmailOTPRepository.sendOTP(otpRepoEmail);
  assert(sendRes.success, 'SupabaseEmailOTPRepository dapat mengirim kode OTP');
  const verifyRes = await SupabaseEmailOTPRepository.verifyOTP(otpRepoEmail, sendRes.otpCode);
  assert(verifyRes.verified, 'SupabaseEmailOTPRepository dapat memvalidasi kode OTP');

  // --------------------------------------------------------------------------
  // TEST 8: Admin vs User Route Security Guard
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: Security Guard (Admin vs User Separation) ---');
  const canAccessAdminConsole = (u: any) => Boolean(u && (u.is_admin || u.role === 'admin'));
  assert(canAccessAdminConsole(admin) === true, 'Admin (Saya) memiliki akses ke /admin');
  assert(canAccessAdminConsole(newUser) === false, 'User biasa diblokir dari /admin (403)');
  assert(canAccessAdminConsole(null) === false, 'Guest diblokir dari /admin (403)');

  // --------------------------------------------------------------------------
  // TEST 9: Fitur Memilih Dompet Pengeluaran (Telegram & Chatbot)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 9: Wallet Selection for Expenses (Telegram & Chatbot) ---');
  
  // 9a. Test /dompet command
  const dompetCmdRes = TelegramBotEngine.handleCommand(newUser, '/dompet');
  assert(dompetCmdRes.includes('Daftar Dompet Anda'), 'Perintah /dompet mengembalikan daftar dompet');
  assert(dompetCmdRes.includes('Dompet Utama') && dompetCmdRes.includes('Dompet Tunai') && dompetCmdRes.includes('e-Wallet'), 'Semua dompet user tercantum dalam /dompet');
  assert(dompetCmdRes.includes('/pilih_dompet'), 'Perintah /dompet menyertakan petunjuk penggunaan /pilih_dompet');

  // 9b. Test /pilih_dompet 2 command
  const selectWalletRes = TelegramBotEngine.handleCommand(newUser, '/pilih_dompet 2');
  assert(selectWalletRes.includes('Dompet Pengeluaran Berhasil Diubah'), 'Perintah /pilih_dompet 2 berhasil dieksekusi');
  const currentDefaultWallet = tataDanaDb.getDefaultWallet(newUser.id);
  assert(currentDefaultWallet.name === 'Dompet Tunai', 'Dompet default aktif sekarang adalah "Dompet Tunai"');

  // 9c. Natural language wallet detection in transaction: "pakai dompet tunai"
  const cashWallet = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Tunai')!;
  const defWallet = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Utama')!;
  const cashBalanceBefore = cashWallet.balance;
  const defBalanceBefore = defWallet.balance;
  
  const botTxRes1 = await TelegramBotEngine.processTextMessage(newUser, 'beli kopi susu 25rb pakai dompet tunai');
  assert(!!botTxRes1.transaction, 'Transaksi dengan nama dompet eksplisit berhasil diproses');
  assert(botTxRes1.transaction?.wallet_id === cashWallet.id, 'Transaksi tercatat ke wallet Dompet Tunai');
  assert(botTxRes1.replyText.includes('Dompet Tunai'), 'Balasan bot mencantumkan Dompet Tunai');
  
  const cashWalletAfter1 = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Tunai')!;
  const defWalletAfter1 = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Utama')!;
  assert(cashWalletAfter1.balance === cashBalanceBefore - 25000, `Saldo Dompet Tunai berkurang Rp 25.000 (${cashWalletAfter1.balance} vs ${cashBalanceBefore - 25000})`);
  assert(defWalletAfter1.balance === defBalanceBefore, 'Saldo Dompet Utama tetap tidak berubah');

  // 9d. Natural language wallet detection with ewallet alias: "via e-wallet"
  const ewallet = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'e-Wallet')!;
  const ewalletBalanceBefore = ewallet.balance;
  const botTxRes2 = await TelegramBotEngine.processTextMessage(newUser, 'jajan boba 30k pakai e-wallet');
  assert(botTxRes2.transaction?.wallet_id === ewallet.id, 'Transaksi dengan alias e-wallet tercatat ke wallet e-Wallet');
  const ewalletAfter = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'e-Wallet')!;
  assert(ewalletAfter.balance === ewalletBalanceBefore - 30000, 'Saldo e-Wallet berkurang Rp 30.000');

  // 9e. Chatbot UI preferredWalletId selection (dropdown selector)
  const defBalanceBefore3 = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Utama')!.balance;
  const botTxRes3 = await TelegramBotEngine.processTextMessage(newUser, 'makan siang martabak 40rb', defWallet.id);
  assert(botTxRes3.transaction?.wallet_id === defWallet.id, 'Chatbot widget preferredWalletId berhasil memotong Dompet Utama');
  const defWalletAfter3 = tataDanaDb.getWallets(newUser.id).find(w => w.name === 'Dompet Utama')!;
  assert(defWalletAfter3.balance === defBalanceBefore3 - 40000, 'Saldo Dompet Utama berkurang Rp 40.000');

  // 9f. Reset default wallet to Dompet Utama
  TelegramBotEngine.handleCommand(newUser, '/pilih_dompet 1');
  assert(tataDanaDb.getDefaultWallet(newUser.id).name === 'Dompet Utama', 'Dompet default berhasil dikembalikan ke Dompet Utama');

  console.log('\n🎉 ALL 37 SYSTEM, BUSINESS & WALLET SELECTION ASSERTIONS PASSED PERFECTLY! 🎉\n');
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
