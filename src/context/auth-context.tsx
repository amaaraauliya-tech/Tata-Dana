'use client';

// ==============================================================================
// TataDana Authentication Context
// Supports Email, Google OAuth, Phone OTP, and Admin Impersonation
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserPlan } from '@/types/database';
import { tataDanaDb, INITIAL_USERS } from '@/lib/mock-db';
import { PhoneOTPService, normalizePhoneNumber } from '@/lib/otp/phone-otp';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isImpersonating: boolean;
  originalAdmin: UserProfile | null;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<boolean>;
  register: (data: { full_name: string; email: string; phone_number?: string }) => Promise<boolean>;
  logout: () => void;
  impersonateUser: (targetUserId: string) => void;
  exitImpersonation: () => void;
  switchUserRole: (planOrRole: 'starter' | 'pro' | 'admin') => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    tataDanaDb.loadFromLocalStorage();
    const savedUserId = localStorage.getItem('tatadana_user_id');
    const impersonatorId = localStorage.getItem('tatadana_impersonator_id');

    if (impersonatorId) {
      const adminObj = tataDanaDb.getUserById(impersonatorId);
      if (adminObj) setOriginalAdmin(adminObj);
    }

    if (savedUserId) {
      let found = tataDanaDb.getUserById(savedUserId);
      if (!found) {
        try {
          const rawActive = localStorage.getItem('tatadana_active_user');
          if (rawActive) {
            const parsed = JSON.parse(rawActive);
            if (parsed && parsed.id === savedUserId) {
              found = tataDanaDb.upsertUser(parsed);
            }
          }
        } catch (e) {}
      }

      if (found) {
        setUser(found);
        localStorage.removeItem('tatadana_logged_out');
        localStorage.setItem('tatadana_user_id', found.id);
        localStorage.setItem('tatadana_active_user', JSON.stringify(found));
        // Sync user to server store in background in case server was restarted
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_user',
            userId: found.id,
            payload: {
              user: found,
              wallets: tataDanaDb.getWallets(found.id),
              categories: tataDanaDb.getCategories(found.id),
              budgets: tataDanaDb.getBudgets(found.id),
              transactions: tataDanaDb.getTransactions(found.id),
              telegramConn: tataDanaDb.getTelegramConnection(found.id),
              reminder: tataDanaDb.getReminder(found.id),
            },
          }),
        }).catch(() => {});
      } else {
        // Saved user not found; do not fallback to Budi
        setUser(null);
        localStorage.removeItem('tatadana_user_id');
        localStorage.removeItem('tatadana_active_user');
      }
    } else {
      setUser(null);
    }

    setIsLoading(false);

    // Auto-sync when platform data updates
    const handleDataUpdate = () => {
      tataDanaDb.loadFromLocalStorage();
      const activeId = localStorage.getItem('tatadana_user_id');
      if (activeId) {
        const updated = tataDanaDb.getUserById(activeId);
        if (updated) {
          setUser(prev => {
            if (!prev) return updated;
            if (
              prev.approval_status !== updated.approval_status ||
              prev.plan !== updated.plan ||
              prev.full_name !== updated.full_name ||
              prev.is_admin !== updated.is_admin
            ) {
              return { ...updated };
            }
            return prev;
          });
        }
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key === 'tatadana_db_users' || e.key === 'tatadana_active_user') {
        handleDataUpdate();
      }
    };

    window.addEventListener('tatadana_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('tatadana_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const login = async (email: string): Promise<boolean> => {
    tataDanaDb.loadFromLocalStorage();
    const found = tataDanaDb.getUserByEmail(email);
    if (found) {
      setUser(found);
      localStorage.removeItem('tatadana_logged_out');
      localStorage.setItem('tatadana_user_id', found.id);
      localStorage.setItem('tatadana_active_user', JSON.stringify(found));
      // Sync to server in background
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          userId: found.id,
          payload: {
            user: found,
            wallets: tataDanaDb.getWallets(found.id),
            categories: tataDanaDb.getCategories(found.id),
            budgets: tataDanaDb.getBudgets(found.id),
            transactions: tataDanaDb.getTransactions(found.id),
            telegramConn: tataDanaDb.getTelegramConnection(found.id),
            reminder: tataDanaDb.getReminder(found.id),
          },
        }),
      }).catch(() => {});
      return true;
    }
    return false;
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<{ success: boolean; message: string }> => {
    const result = PhoneOTPService.verifyOTP(phone, otp);
    if (!result.verified) {
      return { success: false, message: result.message };
    }

    tataDanaDb.loadFromLocalStorage();
    const normPhone = normalizePhoneNumber(phone);
    let found = tataDanaDb.getUserByPhone(normPhone);
    if (!found) {
      // Auto register user if not found
      found = tataDanaDb.createUser({
        full_name: 'Pengguna TataDana',
        phone_number: normPhone,
        phone_verified: true,
        plan: 'starter',
      });
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_user',
            userId: found.id,
            payload: {
              user: found,
              wallets: tataDanaDb.getWallets(found.id),
              categories: tataDanaDb.getCategories(found.id),
              budgets: tataDanaDb.getBudgets(found.id),
              transactions: tataDanaDb.getTransactions(found.id),
              telegramConn: tataDanaDb.getTelegramConnection(found.id),
              reminder: tataDanaDb.getReminder(found.id),
            },
          }),
        });
      } catch (e) {}
    } else {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          userId: found.id,
          payload: {
            user: found,
            wallets: tataDanaDb.getWallets(found.id),
            categories: tataDanaDb.getCategories(found.id),
            budgets: tataDanaDb.getBudgets(found.id),
            transactions: tataDanaDb.getTransactions(found.id),
            telegramConn: tataDanaDb.getTelegramConnection(found.id),
            reminder: tataDanaDb.getReminder(found.id),
          },
        }),
      }).catch(() => {});
    }

    setUser(found);
    localStorage.removeItem('tatadana_logged_out');
    localStorage.setItem('tatadana_user_id', found.id);
    localStorage.setItem('tatadana_active_user', JSON.stringify(found));
    return { success: true, message: result.message };
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    tataDanaDb.loadFromLocalStorage();
    const googleEmail = 'pengguna.google@gmail.com';
    let found = tataDanaDb.getUserByEmail(googleEmail);
    if (!found) {
      found = tataDanaDb.createUser({
        full_name: 'Pengguna Google',
        email: googleEmail,
        phone_number: '+6281288889999',
        phone_verified: true,
        email_verified: true,
        plan: 'starter',
        approval_status: 'pending',
      });
    }
    setUser(found);
    localStorage.removeItem('tatadana_logged_out');
    localStorage.setItem('tatadana_user_id', found.id);
    localStorage.setItem('tatadana_active_user', JSON.stringify(found));
    return true;
  };

  const register = async (data: { full_name: string; email: string; phone_number?: string }): Promise<boolean> => {
    tataDanaDb.loadFromLocalStorage();
    const normPhone = data.phone_number ? normalizePhoneNumber(data.phone_number) : '';
    const newUser = tataDanaDb.createUser({
      full_name: data.full_name,
      email: data.email,
      phone_number: normPhone || '+628' + Math.floor(100000000 + Math.random() * 900000000),
      phone_verified: true,
      email_verified: true,
      plan: 'starter',
      approval_status: 'pending',
    });

    setUser(newUser);
    localStorage.removeItem('tatadana_logged_out');
    localStorage.setItem('tatadana_user_id', newUser.id);
    localStorage.setItem('tatadana_active_user', JSON.stringify(newUser));

    // Register user profile, default wallet, and categories to server store
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_user',
          userId: newUser.id,
          payload: {
            user: newUser,
            wallets: tataDanaDb.getWallets(newUser.id),
            categories: tataDanaDb.getCategories(newUser.id),
            budgets: tataDanaDb.getBudgets(newUser.id),
            transactions: tataDanaDb.getTransactions(newUser.id),
            telegramConn: tataDanaDb.getTelegramConnection(newUser.id),
            reminder: tataDanaDb.getReminder(newUser.id),
          },
        }),
      });
    } catch (e) {
      console.warn('Failed to register user to server store', e);
    }

    return true;
  };

  const logout = () => {
    setUser(null);
    setOriginalAdmin(null);
    localStorage.setItem('tatadana_logged_out', 'true');
    localStorage.removeItem('tatadana_user_id');
    localStorage.removeItem('tatadana_active_user');
    localStorage.removeItem('tatadana_impersonator_id');
  };

  const impersonateUser = (targetUserId: string) => {
    const target = tataDanaDb.getUserById(targetUserId);
    if (!target) return;

    if (user && user.is_admin && !originalAdmin) {
      setOriginalAdmin(user);
      localStorage.setItem('tatadana_impersonator_id', user.id);

      tataDanaDb.logAudit({
        admin_id: user.id,
        admin_name: user.full_name,
        action: 'IMPERSONATE_USER_LOGIN',
        target_user_id: target.id,
        target_user_name: target.full_name,
        details: { target_email: target.email, target_plan: target.plan },
      });
    }

    setUser(target);
    localStorage.setItem('tatadana_user_id', target.id);
    localStorage.setItem('tatadana_active_user', JSON.stringify(target));
  };

  const exitImpersonation = () => {
    if (originalAdmin) {
      tataDanaDb.logAudit({
        admin_id: originalAdmin.id,
        admin_name: originalAdmin.full_name,
        action: 'EXIT_IMPERSONATION',
        target_user_id: user?.id,
        details: {},
      });

      setUser(originalAdmin);
      localStorage.setItem('tatadana_user_id', originalAdmin.id);
      localStorage.setItem('tatadana_active_user', JSON.stringify(originalAdmin));
      setOriginalAdmin(null);
      localStorage.removeItem('tatadana_impersonator_id');
    }
  };

  const switchUserRole = (planOrRole: 'starter' | 'pro' | 'admin') => {
    let targetUser: UserProfile;
    if (planOrRole === 'admin') {
      targetUser = INITIAL_USERS.find(u => u.is_admin) || INITIAL_USERS[0];
    } else {
      const normalUser = tataDanaDb.getUsers().find(u => !u.is_admin);
      targetUser = normalUser || user || INITIAL_USERS[0];
    }
    setUser(targetUser);
    localStorage.setItem('tatadana_user_id', targetUser.id);
    localStorage.setItem('tatadana_active_user', JSON.stringify(targetUser));
  };

  const refreshUser = async (): Promise<UserProfile | null> => {
    tataDanaDb.loadFromLocalStorage();
    const currentId = user?.id || localStorage.getItem('tatadana_user_id');
    if (!currentId) return null;

    try {
      const res = await fetch(`/api/sync?userId=${currentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          tataDanaDb.upsertUser(data.user);
          setUser(data.user);
          localStorage.setItem('tatadana_active_user', JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (e) {}

    const localUser = tataDanaDb.getUserById(currentId);
    if (localUser) {
      setUser({ ...localUser });
      localStorage.setItem('tatadana_active_user', JSON.stringify(localUser));
      return localUser;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: !!user?.is_admin,
        isImpersonating: !!originalAdmin,
        originalAdmin,
        isLoading,
        login,
        loginWithPhone,
        loginWithGoogle,
        register,
        logout,
        impersonateUser,
        exitImpersonation,
        switchUserRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
