// ==============================================================================
// TataDana In-Memory & Local Database Provider
// Ensures seamless end-to-end functionality across all devices & deployments
// ==============================================================================

import {
  UserProfile,
  Wallet,
  Category,
  Budget,
  Transaction,
  TelegramConnection,
  AIProviderConfig,
  AISettings,
  AILog,
  PaymentTransaction,
  AuditLog,
  UserReminder,
  ExportHistory
} from '../types/database';
import { normalizePhoneNumber } from './otp/phone-otp';

export const CENTRAL_TELEGRAM_BOT_TOKEN = '8717253091:AAHlfzBZdWDR9W5eazunXtk4a9imc-Rq8ac';
export const SHARED_TELEGRAM_BOT_TOKEN = CENTRAL_TELEGRAM_BOT_TOKEN;

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin-tatadana-001',
    email: 'admin@tatadana.id',
    full_name: 'Admin TataDana (Saya)',
    phone_number: '+6281112223334',
    phone_verified: true,
    email_verified: true,
    plan: 'pro',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    currency: 'IDR',
    is_admin: true,
    role: 'admin',
    approval_status: 'approved',
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-03-12T10:00:00+07:00',
  }
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-admin-def',
    user_id: 'admin-tatadana-001',
    name: 'Dompet Utama',
    type: 'bank',
    balance: 0,
    is_default: true,
    icon: '🏦',
    color: '#005CA9',
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-01-01T00:00:00+07:00',
  },
  {
    id: 'wallet-admin-cash',
    user_id: 'admin-tatadana-001',
    name: 'Dompet Tunai',
    type: 'cash',
    balance: 0,
    is_default: false,
    icon: '💵',
    color: '#10B981',
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-01-01T00:00:00+07:00',
  },
  {
    id: 'wallet-admin-ewallet',
    user_id: 'admin-tatadana-001',
    name: 'e-Wallet',
    type: 'ewallet',
    balance: 0,
    is_default: false,
    icon: '📱',
    color: '#00AED6',
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-01-01T00:00:00+07:00',
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-makan-1', user_id: 'admin-tatadana-001', name: 'Makanan & Minuman', type: 'expense', icon: '🍜', color: '#F97316', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-trans-2', user_id: 'admin-tatadana-001', name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3B82F6', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-hiburan-3', user_id: 'admin-tatadana-001', name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8B5CF6', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-tagihan-4', user_id: 'admin-tatadana-001', name: 'Tagihan & Utilitas', type: 'expense', icon: '🏠', color: '#EF4444', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-kesehatan-5', user_id: 'admin-tatadana-001', name: 'Kesehatan', type: 'expense', icon: '💊', color: '#EC4899', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-belanja-6', user_id: 'admin-tatadana-001', name: 'Belanja Harian', type: 'expense', icon: '👕', color: '#F59E0B', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-gaji-7', user_id: 'admin-tatadana-001', name: 'Gaji Bulanan', type: 'income', icon: '💰', color: '#10B981', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
  { id: 'cat-side-8', user_id: 'admin-tatadana-001', name: 'Side Project / Freelance', type: 'income', icon: '💼', color: '#06B6D4', is_ai_recommended: true, created_at: '2026-01-01T08:00:00+07:00' },
];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'ai-prov-gemini',
    provider_name: 'gemini',
    api_key_enc: 'enc_gemini_prod_key_982',
    model_name: 'gemini-1.5-flash',
    is_active: true,
    priority: 1,
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-03-12T00:00:00+07:00',
  },
  {
    id: 'ai-prov-openai',
    provider_name: 'openai',
    api_key_enc: 'enc_openai_prod_key_551',
    model_name: 'gpt-4o-mini',
    is_active: true,
    priority: 2,
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-03-12T00:00:00+07:00',
  },
  {
    id: 'ai-prov-deepseek',
    provider_name: 'deepseek',
    api_key_enc: 'enc_deepseek_prod_key_112',
    model_name: 'deepseek-chat',
    is_active: true,
    priority: 3,
    created_at: '2026-01-01T00:00:00+07:00',
    updated_at: '2026-03-12T00:00:00+07:00',
  }
];

export const INITIAL_AI_SETTINGS: AISettings = {
  id: 1,
  mode: 'parallel',
  primary_provider: 'gemini',
  updated_at: '2026-03-12T00:00:00+07:00',
};

export const INITIAL_AI_LOGS: AILog[] = [];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    admin_id: 'admin-tatadana-001',
    admin_name: 'Admin TataDana (Saya)',
    action: 'SYSTEM_INITIALIZATION',
    details: { message: 'Inisialisasi sistem TataDana Fintech Platform' },
    ip_address: '127.0.0.1',
    created_at: '2026-01-01T00:00:00+07:00',
  }
];

export const INITIAL_TELEGRAM_CONNECTIONS: Record<string, TelegramConnection> = {};

export const INITIAL_REMINDERS: Record<string, UserReminder> = {};

// ==============================================================================
// State Holder & Helper Methods
// ==============================================================================

class TataDanaStore {
  private users: UserProfile[] = [...INITIAL_USERS];
  private wallets: Wallet[] = [...INITIAL_WALLETS];
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private budgets: Budget[] = [...INITIAL_BUDGETS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private aiProviders: AIProviderConfig[] = [...INITIAL_AI_PROVIDERS];
  private aiSettings: AISettings = { ...INITIAL_AI_SETTINGS };
  private aiLogs: AILog[] = [...INITIAL_AI_LOGS];
  private payments: PaymentTransaction[] = [...INITIAL_PAYMENTS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private telegramConnections: Record<string, TelegramConnection> = { ...INITIAL_TELEGRAM_CONNECTIONS };
  private reminders: Record<string, UserReminder> = { ...INITIAL_REMINDERS };
  private exportHistories: ExportHistory[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  public loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedUsers = localStorage.getItem('tatadana_db_users');
      const userMap = new Map<string, UserProfile>();
      INITIAL_USERS.forEach(u => userMap.set(u.id, u));

      if (storedUsers) {
        try {
          const parsedUsers: UserProfile[] = JSON.parse(storedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            parsedUsers.forEach(u => userMap.set(u.id, u));
          }
        } catch (e) {
          console.warn('Failed to parse tatadana_db_users', e);
        }
      }

      // Also check active user in case it was stored individually
      const activeUserRaw = localStorage.getItem('tatadana_active_user');
      if (activeUserRaw) {
        try {
          const activeUser = JSON.parse(activeUserRaw);
          if (activeUser && activeUser.id) {
            userMap.set(activeUser.id, activeUser);
          }
        } catch (e) {}
      }

      this.users = Array.from(userMap.values()).map(u => {
        if (!u.approval_status) {
          u.approval_status = u.is_admin ? 'approved' : 'pending';
        }
        if (!u.role) {
          u.role = u.is_admin ? 'admin' : 'user';
        }
        return u;
      });

      const storedTxs = localStorage.getItem('tatadana_db_transactions');
      if (storedTxs) {
        try {
          const parsedTxs: Transaction[] = JSON.parse(storedTxs);
          if (Array.isArray(parsedTxs)) {
            const txMap = new Map<string, Transaction>();
            INITIAL_TRANSACTIONS.forEach(t => txMap.set(t.id, t));
            parsedTxs.forEach(t => txMap.set(t.id, t));
            this.transactions = Array.from(txMap.values()).sort(
              (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
            );
          }
        } catch (e) {}
      }

      const storedWallets = localStorage.getItem('tatadana_db_wallets');
      if (storedWallets) {
        try {
          const parsedWallets: Wallet[] = JSON.parse(storedWallets);
          if (Array.isArray(parsedWallets)) {
            const walletMap = new Map<string, Wallet>();
            INITIAL_WALLETS.forEach(w => walletMap.set(w.id, w));
            parsedWallets.forEach(w => walletMap.set(w.id, w));
            this.wallets = Array.from(walletMap.values());
            // Sanitize wallets: For any user with 0 transactions, ensure initial balance starts at 0 if it was stale default
            this.wallets.forEach(w => {
              if (w.balance === 1000000) {
                const userTxs = this.transactions.filter(t => t.user_id === w.user_id);
                if (userTxs.length === 0) {
                  w.balance = 0;
                }
              }
            });
          }
        } catch (e) {}
      }

      const storedBudgets = localStorage.getItem('tatadana_db_budgets');
      if (storedBudgets) {
        try {
          const parsedBudgets: Budget[] = JSON.parse(storedBudgets);
          if (Array.isArray(parsedBudgets)) {
            const budgetMap = new Map<string, Budget>();
            INITIAL_BUDGETS.forEach(b => budgetMap.set(b.id, b));
            parsedBudgets.forEach(b => budgetMap.set(b.id, b));
            this.budgets = Array.from(budgetMap.values());
          }
        } catch (e) {}
      }

      const storedCategories = localStorage.getItem('tatadana_db_categories');
      if (storedCategories) {
        try {
          const parsedCategories: Category[] = JSON.parse(storedCategories);
          if (Array.isArray(parsedCategories)) {
            const catMap = new Map<string, Category>();
            INITIAL_CATEGORIES.forEach(c => catMap.set(c.id, c));
            parsedCategories.forEach(c => catMap.set(c.id, c));
            this.categories = Array.from(catMap.values());
          }
        } catch (e) {}
      }

      const storedReminders = localStorage.getItem('tatadana_db_reminders');
      if (storedReminders) {
        try {
          this.reminders = { ...INITIAL_REMINDERS, ...JSON.parse(storedReminders) };
        } catch (e) {}
      }

      const storedTg = localStorage.getItem('tatadana_db_telegram_connections');
      if (storedTg) {
        try {
          const parsedTg = JSON.parse(storedTg);
          this.telegramConnections = { ...INITIAL_TELEGRAM_CONNECTIONS, ...parsedTg };
          // Ensure all connections use the central bot token
          Object.values(this.telegramConnections).forEach((conn) => {
            if (!conn.bot_token_encrypted || conn.bot_token_encrypted.includes('7192837482') || conn.bot_token_encrypted.includes('8700541106')) {
              conn.bot_token_encrypted = CENTRAL_TELEGRAM_BOT_TOKEN;
            }
          });
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to load mock-db from localStorage', e);
    }
  }

  saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('tatadana_db_users', JSON.stringify(this.users));
      localStorage.setItem('tatadana_db_transactions', JSON.stringify(this.transactions));
      localStorage.setItem('tatadana_db_wallets', JSON.stringify(this.wallets));
      localStorage.setItem('tatadana_db_budgets', JSON.stringify(this.budgets));
      localStorage.setItem('tatadana_db_categories', JSON.stringify(this.categories));
      localStorage.setItem('tatadana_db_reminders', JSON.stringify(this.reminders));
      localStorage.setItem('tatadana_db_telegram_connections', JSON.stringify(this.telegramConnections));
    } catch (e) {
      console.warn('Failed to save mock-db to localStorage', e);
    }
  }

  syncUserState(
    userId: string,
    state: {
      transactions?: Transaction[];
      wallets?: Wallet[];
      budgets?: Budget[];
      categories?: Category[];
      telegramConn?: any;
      reminder?: any;
    }
  ) {
    if (state.transactions && Array.isArray(state.transactions)) {
      const otherTxs = this.transactions.filter(t => t.user_id !== userId);
      const myLocalTxs = this.transactions.filter(t => t.user_id === userId);

      const txMap = new Map<string, Transaction>();
      // Keep local first
      myLocalTxs.forEach(t => txMap.set(t.id, t));
      // Overlay server (or include new items from server)
      state.transactions.forEach(t => {
        if (t.user_id === userId) {
          txMap.set(t.id, t);
        }
      });

      const mergedUserTxs = Array.from(txMap.values()).sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      this.transactions = [...mergedUserTxs, ...otherTxs];
    }

    if (state.wallets && Array.isArray(state.wallets)) {
      const otherWallets = this.wallets.filter(w => w.user_id !== userId);
      const myLocalWallets = this.wallets.filter(w => w.user_id === userId);

      if (state.wallets.length > 0) {
        const walletMap = new Map<string, Wallet>();
        myLocalWallets.forEach(w => walletMap.set(w.id, w));
        state.wallets.forEach(w => {
          if (w.user_id === userId) {
            walletMap.set(w.id, w);
          }
        });
        this.wallets = [...Array.from(walletMap.values()), ...otherWallets];
      }
      // If server wallets array is empty, keep local wallets intact (do not wipe)
    }

    if (state.budgets && Array.isArray(state.budgets)) {
      const otherBudgets = this.budgets.filter(b => b.user_id !== userId);
      const myLocalBudgets = this.budgets.filter(b => b.user_id === userId);

      if (state.budgets.length > 0) {
        const budgetMap = new Map<string, Budget>();
        myLocalBudgets.forEach(b => budgetMap.set(b.id, b));
        state.budgets.forEach(b => {
          if (b.user_id === userId) {
            budgetMap.set(b.id, b);
          }
        });
        this.budgets = [...Array.from(budgetMap.values()), ...otherBudgets];
      }
      // If server budgets array is empty, keep local budgets intact
    }

    if (state.categories && Array.isArray(state.categories)) {
      const otherCategories = this.categories.filter(c => c.user_id !== userId);
      const myLocalCats = this.categories.filter(c => c.user_id === userId);

      if (state.categories.length > 0) {
        const catMap = new Map<string, Category>();
        myLocalCats.forEach(c => catMap.set(c.id, c));
        state.categories.forEach(c => {
          if (c.user_id === userId) {
            catMap.set(c.id, c);
          }
        });
        this.categories = [...Array.from(catMap.values()), ...otherCategories];
      }
      // If server categories array is empty, keep local categories intact
    }

    if (state.telegramConn) {
      this.telegramConnections[userId] = {
        ...this.telegramConnections[userId],
        ...state.telegramConn,
      };
    }

    if (state.reminder) {
      this.reminders[userId] = {
        ...this.reminders[userId],
        ...state.reminder,
      };
    }

    this.saveToLocalStorage();
  }

  // Users
  getUsers() { return this.users; }
  getUserById(id: string) { return this.users.find(u => u.id === id); }
  getUserByPhone(phone: string) { 
    const norm = normalizePhoneNumber(phone);
    return this.users.find(u => normalizePhoneNumber(u.phone_number) === norm); 
  }
  getUserByEmail(email: string) { return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }

  getUserByTelegramId(telegramUserId: number): UserProfile | undefined {
    for (const [userId, conn] of Object.entries(this.telegramConnections)) {
      if (conn.telegram_user_id === telegramUserId) {
        return this.getUserById(userId);
      }
    }
    return undefined;
  }

  linkTelegramUser(phoneNumber: string, telegramUserId: number, telegramUsername?: string): { success: boolean; user?: UserProfile; message: string } {
    const user = this.getUserByPhone(phoneNumber);
    if (!user) {
      return {
        success: false,
        message: `Nomor HP ${phoneNumber} belum terdaftar di TataDana. Silakan daftar terlebih dahulu di aplikasi web TataDana.`
      };
    }

    this.setTelegramConnection(user.id, {
      telegram_user_id: telegramUserId,
      bot_username: telegramUsername || 'TataDanaBot',
      status: 'connected',
    });

    return {
      success: true,
      user,
      message: `Akun Telegram berhasil terhubung dengan profil ${user.full_name} (${user.plan.toUpperCase()})!`
    };
  }
  
  upsertUser(user: UserProfile): UserProfile {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...user };
    } else {
      this.users.push(user);
    }
    this.saveToLocalStorage();
    return this.getUserById(user.id)!;
  }

  createUser(profile: Partial<UserProfile>): UserProfile {
    const id = profile.id || `user-${Date.now()}`;
    const newUser: UserProfile = {
      id,
      email: profile.email || `${id}@tatadana.id`,
      full_name: profile.full_name || 'Pengguna Baru',
      phone_number: profile.phone_number || '+6281200000000',
      phone_verified: profile.phone_verified ?? true,
      plan: profile.plan || 'starter',
      currency: 'IDR',
      avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...profile,
      email_verified: profile.email_verified ?? false,
      is_admin: profile.is_admin ?? false,
      role: profile.role || (profile.is_admin ? 'admin' : 'user'),
      approval_status: profile.approval_status || 'pending',
    };
    this.users.push(newUser);
    this.initUserDefaults(newUser.id);
    this.saveToLocalStorage();
    return newUser;
  }

  updateUserApprovalStatus(userId: string, status: 'approved' | 'rejected' | 'pending', adminId?: string) {
    const user = this.getUserById(userId);
    if (user) {
      user.approval_status = status;
      user.updated_at = new Date().toISOString();
      this.saveToLocalStorage();
      this.logAudit({
        admin_id: adminId || 'admin-tatadana-001',
        admin_name: 'Super Admin TataDana',
        action: status === 'approved' ? 'APPROVE_USER_REGISTRATION' : 'REJECT_USER_REGISTRATION',
        target_user_id: userId,
        target_user_name: user.full_name,
        details: { new_status: status },
      });
    }
    return user;
  }

  updateUserPlan(userId: string, plan: 'starter' | 'pro') {
    const user = this.getUserById(userId);
    if (user) {
      user.plan = plan;
      user.updated_at = new Date().toISOString();
      this.saveToLocalStorage();
    }
    return user;
  }

  // Initialize onboarding defaults
  initUserDefaults(userId: string) {
    // Default Wallets (all start with balance Rp 0 upon registration)
    const existingWallets = this.wallets.filter(w => w.user_id === userId);
    let defaultWallet: Wallet;
    if (existingWallets.length === 0) {
      defaultWallet = {
        id: `wallet-${userId}-def`,
        user_id: userId,
        name: 'Dompet Utama',
        type: 'bank',
        balance: 0,
        is_default: true,
        icon: '🏦',
        color: '#005CA9',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const cashWallet: Wallet = {
        id: `wallet-${userId}-cash`,
        user_id: userId,
        name: 'Dompet Tunai',
        type: 'cash',
        balance: 0,
        is_default: false,
        icon: '💵',
        color: '#10B981',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const ewalletWallet: Wallet = {
        id: `wallet-${userId}-ewallet`,
        user_id: userId,
        name: 'e-Wallet',
        type: 'ewallet',
        balance: 0,
        is_default: false,
        icon: '📱',
        color: '#00AED6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.wallets.push(defaultWallet, cashWallet, ewalletWallet);
    } else {
      defaultWallet = existingWallets.find(w => w.is_default) || existingWallets[0];

      // Ensure user also has standard cash and e-wallet for expenses if missing
      const hasCash = existingWallets.some(w => w.type === 'cash' || w.name.toLowerCase().includes('tunai'));
      if (!hasCash) {
        this.wallets.push({
          id: `wallet-${userId}-cash`,
          user_id: userId,
          name: 'Dompet Tunai',
          type: 'cash',
          balance: 0,
          is_default: false,
          icon: '💵',
          color: '#10B981',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const hasEwallet = existingWallets.some(w => w.type === 'ewallet' || w.name.toLowerCase().includes('wallet'));
      if (!hasEwallet) {
        this.wallets.push({
          id: `wallet-${userId}-ewallet`,
          user_id: userId,
          name: 'e-Wallet',
          type: 'ewallet',
          balance: 0,
          is_default: false,
          icon: '📱',
          color: '#00AED6',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const user = this.getUserById(userId);
    if (user && !user.default_wallet_id) {
      user.default_wallet_id = defaultWallet.id;
    }

    // AI Recommended Onboarding Categories (avoid duplicates)
    const existingCats = this.categories.filter(c => c.user_id === userId);
    if (existingCats.length === 0) {
      const recCategories: Array<{ name: string; type: 'expense' | 'income'; icon: string; color: string }> = [
        { name: 'Makanan', type: 'expense', icon: '🍜', color: '#F97316' },
        { name: 'Transport', type: 'expense', icon: '🚗', color: '#3B82F6' },
        { name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8B5CF6' },
        { name: 'Tagihan', type: 'expense', icon: '🏠', color: '#EF4444' },
        { name: 'Kesehatan', type: 'expense', icon: '💊', color: '#EC4899' },
        { name: 'Belanja', type: 'expense', icon: '👕', color: '#F59E0B' },
        { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#6366F1' },
        { name: 'Gaji', type: 'income', icon: '💰', color: '#10B981' },
      ];

      recCategories.forEach((rc, i) => {
        this.categories.push({
          id: `cat-${userId}-${i}`,
          user_id: userId,
          name: rc.name,
          type: rc.type,
          icon: rc.icon,
          color: rc.color,
          is_ai_recommended: true,
          created_at: new Date().toISOString(),
        });
      });
    }

    // Default Reminders
    if (!this.reminders[userId]) {
      this.reminders[userId] = {
        id: `rem-${userId}`,
        user_id: userId,
        is_active: true,
        frequency: '2x',
        time_1: '08:00',
        time_2: '20:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Default Telegram Connection (Single central token)
    if (!this.telegramConnections[userId]) {
      const tgId = Math.floor(200000000 + Math.random() * 700000000);
      this.telegramConnections[userId] = {
        id: `tg-${userId}`,
        user_id: userId,
        bot_token_encrypted: CENTRAL_TELEGRAM_BOT_TOKEN,
        bot_username: 'TataDanaBot',
        status: 'connected',
        telegram_user_id: tgId,
        webhook_url: 'https://tatadana.vercel.app/api/telegram/webhook',
        last_tested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    this.saveToLocalStorage();
  }

  // Wallets
  getWallets(userId: string) {
    let list = this.wallets.filter(w => w.user_id === userId);
    if (list.length === 0 || list.length < 3) {
      this.initUserDefaults(userId);
      list = this.wallets.filter(w => w.user_id === userId);
    }
    const uniqueMap = new Map<string, Wallet>();
    list.forEach(w => uniqueMap.set(w.id, w));
    return Array.from(uniqueMap.values());
  }
  getWalletById(id: string): Wallet | undefined { return this.wallets.find(w => w.id === id); }
  getDefaultWallet(userId: string): Wallet { 
    let w = this.wallets.find(w => w.user_id === userId && w.is_default) || this.wallets.find(w => w.user_id === userId); 
    if (!w) {
      this.initUserDefaults(userId);
      w = this.wallets.find(w => w.user_id === userId && w.is_default) || this.wallets.find(w => w.user_id === userId);
    }
    if (!w) {
      const fallbackWallet: Wallet = {
        id: `wallet-${userId}-def`,
        user_id: userId,
        name: 'Dompet Utama',
        type: 'bank',
        balance: 0,
        is_default: true,
        icon: '🏦',
        color: '#005CA9',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.wallets.push(fallbackWallet);
      this.saveToLocalStorage();
      return fallbackWallet;
    }
    return w;
  }
  addWallet(wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
    const id = wallet.id || `wallet-${Date.now()}`;
    const existing = this.wallets.find(w => w.id === id);
    if (existing) {
      return existing;
    }
    const userWallets = this.wallets.filter(w => w.user_id === wallet.user_id);
    const shouldBeDefault = wallet.is_default || userWallets.length === 0;
    const newWallet: Wallet = {
      ...wallet,
      balance: wallet.balance !== undefined && !isNaN(wallet.balance) ? wallet.balance : 0,
      id,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (newWallet.is_default) {
      this.wallets.forEach(w => {
        if (w.user_id === wallet.user_id) w.is_default = false;
      });
    }
    this.wallets.push(newWallet);
    this.saveToLocalStorage();
    return newWallet;
  }
  setDefaultWallet(userId: string, walletId: string) {
    this.wallets.forEach(w => {
      if (w.user_id === userId) {
        w.is_default = w.id === walletId;
      }
    });
    const user = this.getUserById(userId);
    if (user) {
      user.default_wallet_id = walletId;
    }
    this.saveToLocalStorage();
  }

  transferBetweenWallets(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description?: string,
    txId?: string
  ): Transaction {
    const fromWallet = this.wallets.find(w => w.id === fromWalletId);
    const toWallet = this.wallets.find(w => w.id === toWalletId);

    return this.addTransaction({
      id: txId,
      user_id: userId,
      wallet_id: fromWalletId,
      wallet_name: fromWallet?.name || 'Dompet Sumber',
      target_wallet_id: toWalletId,
      target_wallet_name: toWallet?.name || 'Dompet Tujuan',
      type: 'transfer',
      amount,
      transaction_date: new Date().toISOString(),
      description: description || `Transfer ke ${toWallet?.name || 'Dompet Tujuan'}`,
      source: 'web_ui',
      category_name: 'Transfer Dompet',
      category_icon: '🔄',
    });
  }

  // Categories
  getCategories(userId: string) { return this.categories.filter(c => c.user_id === userId); }
  addCategory(cat: Omit<Category, 'id' | 'created_at'> & { id?: string }) {
    const id = cat.id || `cat-${Date.now()}`;
    const existing = this.categories.find(c => c.id === id);
    if (existing) {
      return existing;
    }
    const newCat: Category = {
      ...cat,
      id,
      created_at: new Date().toISOString(),
    };
    this.categories.push(newCat);
    this.saveToLocalStorage();
    return newCat;
  }

  // Budgets
  getBudgets(userId: string) { return this.budgets.filter(b => b.user_id === userId); }
  saveBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'> & { id?: string }) {
    const existing = this.budgets.find(b => b.user_id === budget.user_id && b.category_id === budget.category_id);
    if (existing) {
      existing.monthly_limit = budget.monthly_limit;
      existing.updated_at = new Date().toISOString();
      this.saveToLocalStorage();
      return existing;
    } else {
      const newBudget: Budget = {
        ...budget,
        id: budget.id || `bgt-${Date.now()}`,
        spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.budgets.push(newBudget);
      this.saveToLocalStorage();
      return newBudget;
    }
  }

  // Transactions
  getTransactions(userId: string) { 
    return this.transactions
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()); 
  }

  getAllTransactions(): Transaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );
  }

  getPlatformMetrics() {
    const allTxs = this.getAllTransactions();
    const totalVolume = allTxs.reduce(
      (sum, t) => sum + (t.type === 'expense' || t.type === 'income' ? t.amount : 0),
      0
    );
    const totalTxCount = allTxs.length;
    const users = this.getUsers();
    const payments = this.getPayments();
    const pendingPayments = payments.filter((p) => p.status === 'pending').length;
    const approvedPayments = payments.filter((p) => p.status === 'approved').length;
    const pendingApprovals = users.filter((u) => u.approval_status === 'pending').length;

    let connectedTgCount = 0;
    users.forEach((u) => {
      const conn = this.getTelegramConnection(u.id);
      if (conn && conn.status === 'connected') connectedTgCount++;
    });

    return {
      totalUsers: users.length,
      proUsers: users.filter((u) => u.plan === 'pro').length,
      starterUsers: users.filter((u) => u.plan === 'starter').length,
      totalVolume,
      totalTxCount,
      pendingPayments,
      approvedPayments,
      pendingApprovals,
      connectedTgCount,
    };
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'created_at'> & { id?: string; created_at?: string }): Transaction {
    const id = tx.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Idempotency check: if transaction with id already exists, return it without double-deduction
    const existing = this.transactions.find(t => t.id === id);
    if (existing) {
      return existing;
    }

    const newTx: Transaction = {
      ...tx,
      id,
      created_at: tx.created_at || new Date().toISOString(),
    };

    // Update Wallet Balances
    let sourceWallet = this.wallets.find(w => w.id === tx.wallet_id && (!tx.user_id || w.user_id === tx.user_id));
    if (!sourceWallet && tx.user_id) {
      sourceWallet = this.getDefaultWallet(tx.user_id);
      if (sourceWallet) {
        newTx.wallet_id = sourceWallet.id;
        newTx.wallet_name = sourceWallet.name;
      }
    }

    if (newTx.type === 'transfer') {
      let targetWallet = this.wallets.find(w => w.id === newTx.target_wallet_id && (!newTx.user_id || w.user_id === newTx.user_id));
      if (!targetWallet && newTx.user_id) {
        targetWallet = this.wallets.find(w => w.user_id === newTx.user_id && w.id !== sourceWallet?.id);
        if (targetWallet) {
          newTx.target_wallet_id = targetWallet.id;
          newTx.target_wallet_name = targetWallet.name;
        }
      }
      if (sourceWallet) {
        sourceWallet.balance -= newTx.amount;
        sourceWallet.updated_at = new Date().toISOString();
      }
      if (targetWallet) {
        targetWallet.balance += newTx.amount;
        targetWallet.updated_at = new Date().toISOString();
      }
    } else if (sourceWallet) {
      if (newTx.type === 'expense') {
        sourceWallet.balance -= newTx.amount;
      } else if (newTx.type === 'income') {
        sourceWallet.balance += newTx.amount;
      }
      sourceWallet.updated_at = new Date().toISOString();
    }

    // Update Budget Spent if expense and trigger alerts
    if (tx.type === 'expense') {
      const budget = this.budgets.find(
        b => b.user_id === tx.user_id && (
          (tx.category_id && b.category_id === tx.category_id) ||
          (tx.category_name && b.category_name?.toLowerCase() === tx.category_name?.toLowerCase())
        )
      );
      if (budget) {
        budget.spent += tx.amount;
        budget.updated_at = new Date().toISOString();
        const percent = Math.round((budget.spent / budget.monthly_limit) * 100);
        if (percent >= 100 && !budget.alert_100_sent) {
          budget.alert_100_sent = true;
          budget.alert_80_sent = true;
        } else if (percent >= 80 && !budget.alert_80_sent) {
          budget.alert_80_sent = true;
        }
      }
    }

    this.transactions.unshift(newTx);
    this.saveToLocalStorage();
    return newTx;
  }

  // Telegram Connection
  getTelegramConnection(userId: string) { 
    let conn = this.telegramConnections[userId]; 
    if (conn) {
      if (!conn.bot_token_encrypted || conn.bot_token_encrypted.includes('7192837482') || conn.bot_token_encrypted.includes('8700541106')) {
        conn.bot_token_encrypted = CENTRAL_TELEGRAM_BOT_TOKEN;
      }
    }
    return conn;
  }
  setTelegramConnection(userId: string, conn: Partial<TelegramConnection>) {
    const existing = this.telegramConnections[userId];
    this.telegramConnections[userId] = {
      id: existing?.id || `tg-${userId}`,
      user_id: userId,
      bot_token_encrypted: conn.bot_token_encrypted !== undefined && conn.bot_token_encrypted.trim() !== ''
        ? conn.bot_token_encrypted
        : (existing?.bot_token_encrypted || CENTRAL_TELEGRAM_BOT_TOKEN),
      status: conn.status || existing?.status || 'connected',
      bot_username: conn.bot_username || existing?.bot_username || 'TataDanaBot',
      telegram_user_id: conn.telegram_user_id !== undefined ? conn.telegram_user_id : existing?.telegram_user_id,
      webhook_url: conn.webhook_url || existing?.webhook_url,
      last_tested_at: conn.last_tested_at || new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error_message: conn.last_error_message,
    };
    this.saveToLocalStorage();
    return this.telegramConnections[userId];
  }

  // Reminders
  getReminder(userId: string) { return this.reminders[userId]; }
  saveReminder(userId: string, rem: Partial<UserReminder>) {
    const existing = this.reminders[userId];
    this.reminders[userId] = {
      id: existing?.id || `rem-${userId}`,
      user_id: userId,
      is_active: rem.is_active !== undefined ? rem.is_active : (existing?.is_active ?? true),
      frequency: rem.frequency || existing?.frequency || '2x',
      time_1: rem.time_1 || existing?.time_1 || '08:00',
      time_2: rem.time_2 || existing?.time_2 || '20:00',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveToLocalStorage();
    return this.reminders[userId];
  }

  // Exports
  getExportHistories(userId: string) { return this.exportHistories.filter(e => e.user_id === userId); }
  addExportHistory(exp: Omit<ExportHistory, 'id' | 'created_at'>) {
    const item: ExportHistory = {
      ...exp,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.exportHistories.unshift(item);
    return item;
  }

  // AI & Admin
  getAIProviders() { return this.aiProviders; }
  saveAIProvider(prov: Partial<AIProviderConfig>) {
    const existing = this.aiProviders.find(p => p.provider_name === prov.provider_name);
    if (existing) {
      Object.assign(existing, prov, { updated_at: new Date().toISOString() });
      return existing;
    }
    const created: AIProviderConfig = {
      id: `ai-${Date.now()}`,
      provider_name: prov.provider_name || 'gemini',
      api_key_enc: prov.api_key_enc || 'key',
      model_name: prov.model_name || 'gemini-1.5-flash',
      is_active: prov.is_active ?? true,
      priority: prov.priority || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.aiProviders.push(created);
    return created;
  }

  getAISettings() { return this.aiSettings; }
  updateAISettings(settings: Partial<AISettings>) {
    Object.assign(this.aiSettings, settings, { updated_at: new Date().toISOString() });
    return this.aiSettings;
  }

  getAILogs() { return this.aiLogs; }
  logAI(log: Omit<AILog, 'id' | 'created_at'>) {
    const item: AILog = {
      ...log,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.aiLogs.unshift(item);
    return item;
  }

  getPayments() { return this.payments; }
  updatePaymentStatus(id: string, status: 'approved' | 'rejected', adminId: string, notes?: string) {
    const payment = this.payments.find(p => p.id === id);
    if (payment) {
      payment.status = status;
      payment.approved_by = adminId;
      payment.admin_notes = notes;
      payment.updated_at = new Date().toISOString();
      if (status === 'approved') {
        this.updateUserPlan(payment.user_id, payment.plan);
      }
    }
    return payment;
  }

  getAuditLogs() { return this.auditLogs; }
  logAudit(audit: Omit<AuditLog, 'id' | 'created_at'>) {
    const item: AuditLog = {
      ...audit,
      id: `audit-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(item);
    return item;
  }
}

// Global Singleton Instance (Preserved across Next.js Route Bundles & Server Execution Contexts)
const globalForDb = globalThis as unknown as { tatadanaStoreInstance?: TataDanaStore };
export const tataDanaDb = globalForDb.tatadanaStoreInstance || new TataDanaStore();
if (!globalForDb.tatadanaStoreInstance) {
  globalForDb.tatadanaStoreInstance = tataDanaDb;
}

