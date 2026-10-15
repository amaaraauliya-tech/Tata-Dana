// ==============================================================================
// TataDana Supabase Repository Layer
// Clean repository pattern for Profiles, Wallets, Transactions, and Email OTPs
// Supports direct Supabase PostgreSQL operations with fallback to reactive local store
// ==============================================================================

import { supabase, isSupabaseConfigured } from './client';
import { supabaseAdmin } from './admin';
import { UserProfile, Wallet, Transaction, UserApprovalStatus } from '../../types/database';
import { tataDanaDb } from '../mock-db';
import { EmailOTPService } from '../otp/email-otp';

/**
 * 1. User / Profile Repository
 */
export const SupabaseUserRepository = {
  /**
   * Fetch user by unique UUID
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }
      } catch (err) {
        console.warn('[SupabaseUserRepository] getUserById remote fallback:', err);
      }
    }
    return tataDanaDb.getUserById(id) || null;
  },

  /**
   * Fetch user by email address
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }
      } catch (err) {
        console.warn('[SupabaseUserRepository] getUserByEmail remote fallback:', err);
      }
    }
    return tataDanaDb.getUserByEmail(cleanEmail) || null;
  },

  /**
   * Create a new user profile with approval workflow and initial 0-balance wallets
   */
  async createUser(profile: Partial<UserProfile>): Promise<UserProfile> {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    const newUser: UserProfile = {
      id: profile.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      full_name: profile.full_name || 'Pengguna Baru',
      phone_number: profile.phone_number || '',
      phone_verified: profile.phone_verified ?? true,
      email_verified: profile.email_verified ?? true,
      plan: profile.plan || 'starter',
      currency: 'IDR',
      avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      is_admin: profile.is_admin ?? false,
      role: profile.role || (profile.is_admin ? 'admin' : 'user'),
      approval_status: profile.approval_status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('profiles')
          .insert([newUser])
          .select()
          .single();

        if (!error && data) {
          tataDanaDb.upsertUser(data as UserProfile);
          tataDanaDb.initUserDefaults(data.id);
          return data as UserProfile;
        }
      } catch (err) {
        console.warn('[SupabaseUserRepository] createUser remote fallback:', err);
      }
    }

    // Local persistent database fallback
    return tataDanaDb.createUser(newUser);
  },

  /**
   * Update user approval status (Admin Only)
   */
  async updateApprovalStatus(
    userId: string,
    status: UserApprovalStatus,
    adminId?: string
  ): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('profiles')
          .update({
            approval_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) {
          tataDanaDb.updateUserApprovalStatus(userId, status, adminId);
          return data as UserProfile;
        }
      } catch (err) {
        console.warn('[SupabaseUserRepository] updateApprovalStatus remote fallback:', err);
      }
    }
    return tataDanaDb.updateUserApprovalStatus(userId, status, adminId) || null;
  },

  /**
   * List all registered users
   */
  async getAllUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          return data as UserProfile[];
        }
      } catch (err) {
        console.warn('[SupabaseUserRepository] getAllUsers remote fallback:', err);
      }
    }
    return tataDanaDb.getUsers();
  },
};

/**
 * 2. Wallet Repository
 */
export const SupabaseWalletRepository = {
  /**
   * Get all wallets for a specific user
   */
  async getWallets(userId: string): Promise<Wallet[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          return data as Wallet[];
        }
      } catch (err) {
        console.warn('[SupabaseWalletRepository] getWallets remote fallback:', err);
      }
    }
    return tataDanaDb.getWallets(userId);
  },

  /**
   * Create wallet
   */
  async createWallet(wallet: Partial<Wallet> & { user_id: string; name: string }): Promise<Wallet> {
    const newWallet: Wallet = {
      id: wallet.id || `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: wallet.user_id,
      name: wallet.name,
      type: wallet.type || 'bank',
      balance: wallet.balance ?? 0,
      is_default: wallet.is_default ?? false,
      icon: wallet.icon || '🏦',
      color: wallet.color || '#005CA9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .insert([newWallet])
          .select()
          .single();

        if (!error && data) {
          tataDanaDb.addWallet(data as Wallet);
          return data as Wallet;
        }
      } catch (err) {
        console.warn('[SupabaseWalletRepository] createWallet remote fallback:', err);
      }
    }
    return tataDanaDb.addWallet(newWallet);
  },

  /**
   * Update wallet balance
   */
  async updateBalance(walletId: string, newBalance: number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', walletId);

        if (!error) return true;
      } catch (err) {
        console.warn('[SupabaseWalletRepository] updateBalance remote fallback:', err);
      }
    }
    const wallet = tataDanaDb.getWalletById(walletId);
    if (wallet) {
      wallet.balance = newBalance;
      wallet.updated_at = new Date().toISOString();
      tataDanaDb.saveToLocalStorage();
      return true;
    }
    return false;
  },
};

/**
 * 3. Transaction Repository
 */
export const SupabaseTransactionRepository = {
  /**
   * Get transactions for a user
   */
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          return data as Transaction[];
        }
      } catch (err) {
        console.warn('[SupabaseTransactionRepository] getTransactions remote fallback:', err);
      }
    }
    return tataDanaDb.getTransactions(userId);
  },

  /**
   * Record new transaction
   */
  async createTransaction(tx: Parameters<typeof tataDanaDb.addTransaction>[0]): Promise<Transaction> {
    const recorded = tataDanaDb.addTransaction(tx);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('transactions').insert([recorded]);
      } catch (err) {
        console.warn('[SupabaseTransactionRepository] createTransaction remote fallback:', err);
      }
    }
    return recorded;
  },
};

/**
 * 4. Email OTP Repository
 */
export const SupabaseEmailOTPRepository = {
  /**
   * Request OTP code sent to email
   */
  async sendOTP(email: string): Promise<{ success: boolean; message: string; otpCode: string }> {
    const result = await EmailOTPService.sendOTP(email);

    if (isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;
        await client.from('email_otps').insert([
          {
            email: EmailOTPService.normalizeEmail(email),
            code: result.otpCode,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            verified: false,
          },
        ]);
      } catch (err) {
        console.warn('[SupabaseEmailOTPRepository] sendOTP remote sync:', err);
      }
    }

    return result;
  },

  /**
   * Verify OTP code for email
   */
  async verifyOTP(email: string, code: string): Promise<{ verified: boolean; message: string }> {
    const localResult = EmailOTPService.verifyOTP(email, code);

    if (localResult.verified && isSupabaseConfigured()) {
      try {
        const client = supabaseAdmin || supabase;
        await client
          .from('email_otps')
          .update({ verified: true })
          .eq('email', EmailOTPService.normalizeEmail(email))
          .eq('code', code.trim());
      } catch (err) {
        console.warn('[SupabaseEmailOTPRepository] verifyOTP remote sync:', err);
      }
    }

    return localResult;
  },

  /**
   * Check if email is verified
   */
  isVerified(email: string): boolean {
    return EmailOTPService.isVerified(email);
  },
};
