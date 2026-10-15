import { NextRequest, NextResponse } from 'next/server';
import { tataDanaDb } from '@/lib/mock-db';
import { realtimeEventBus } from '@/lib/realtime-events';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user-budi-101';
    const since = Number(searchParams.get('since') || 0);

    let user = tataDanaDb.getUserById(userId);
    if (!user) {
      user = tataDanaDb.upsertUser({
        id: userId,
        email: `${userId}@tatadana.id`,
        full_name: 'Pengguna TataDana',
        phone_number: '+62812' + Math.floor(10000000 + Math.random() * 90000000),
        phone_verified: true,
        plan: 'starter',
        currency: 'IDR',
        is_admin: false,
        approval_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      tataDanaDb.initUserDefaults(userId);
    }
    if (tataDanaDb.getWallets(userId).length === 0) {
      tataDanaDb.initUserDefaults(userId);
    }

    return NextResponse.json({
      ok: true,
      user,
      transactions: tataDanaDb.getTransactions(userId),
      wallets: tataDanaDb.getWallets(userId),
      budgets: tataDanaDb.getBudgets(userId),
      categories: tataDanaDb.getCategories(userId),
      telegramConn: tataDanaDb.getTelegramConnection(userId),
      reminder: tataDanaDb.getReminder(userId),
      recentEvents: realtimeEventBus.getRecentEvents(since),
      serverTime: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId = 'user-budi-101', payload } = body;

    if (action === 'register_user' && payload) {
      if (payload.user) {
        tataDanaDb.upsertUser(payload.user);
      }
      if (payload.wallets && Array.isArray(payload.wallets) && payload.wallets.length > 0) {
        tataDanaDb.syncUserState(userId, { wallets: payload.wallets });
      }
      if (payload.categories && Array.isArray(payload.categories) && payload.categories.length > 0) {
        tataDanaDb.syncUserState(userId, { categories: payload.categories });
      }
      if (payload.budgets && Array.isArray(payload.budgets) && payload.budgets.length > 0) {
        tataDanaDb.syncUserState(userId, { budgets: payload.budgets });
      }
      if (payload.transactions && Array.isArray(payload.transactions) && payload.transactions.length > 0) {
        tataDanaDb.syncUserState(userId, { transactions: payload.transactions });
      }
      if (payload.telegramConn) {
        tataDanaDb.setTelegramConnection(userId, payload.telegramConn);
      }
      if (payload.reminder) {
        tataDanaDb.saveReminder(userId, payload.reminder);
      }
      if (tataDanaDb.getWallets(userId).length === 0 || tataDanaDb.getCategories(userId).length === 0) {
        tataDanaDb.initUserDefaults(userId);
      }
    } else if (action === 'add_transaction' && payload) {
      if (userId && (!tataDanaDb.getUserById(userId) || tataDanaDb.getWallets(userId).length === 0)) {
        tataDanaDb.initUserDefaults(userId);
      }
      const addedTx = tataDanaDb.addTransaction(payload);
      realtimeEventBus.broadcast('new_transaction', {
        userId,
        transaction: addedTx,
        wallets: tataDanaDb.getWallets(userId),
        budgets: tataDanaDb.getBudgets(userId),
      });
    } else if (action === 'transfer' && payload) {
      if (userId && (!tataDanaDb.getUserById(userId) || tataDanaDb.getWallets(userId).length === 0)) {
        tataDanaDb.initUserDefaults(userId);
      }
      const addedTx = tataDanaDb.transferBetweenWallets(
        userId,
        payload.fromWalletId,
        payload.toWalletId,
        payload.amount,
        payload.description,
        payload.id || payload.txId
      );
      realtimeEventBus.broadcast('new_transaction', {
        userId,
        transaction: addedTx,
        wallets: tataDanaDb.getWallets(userId),
        budgets: tataDanaDb.getBudgets(userId),
      });
    } else if (action === 'add_wallet' && payload) {
      tataDanaDb.addWallet(payload);
    } else if (action === 'set_default_wallet' && payload) {
      tataDanaDb.setDefaultWallet(userId, payload.walletId);
    } else if (action === 'save_budget' && payload) {
      tataDanaDb.saveBudget(payload);
    } else if (action === 'add_category' && payload) {
      tataDanaDb.addCategory(payload);
    } else if (action === 'update_user_approval' && payload) {
      tataDanaDb.updateUserApprovalStatus(
        payload.userId || userId,
        payload.approval_status || payload.status,
        payload.adminId
      );
      const updatedUser = tataDanaDb.getUserById(payload.userId || userId);
      realtimeEventBus.broadcast('user_updated' as any, {
        userId: payload.userId || userId,
        user: updatedUser,
      });
    }

    return NextResponse.json({
      ok: true,
      transactions: tataDanaDb.getTransactions(userId),
      wallets: tataDanaDb.getWallets(userId),
      budgets: tataDanaDb.getBudgets(userId),
      categories: tataDanaDb.getCategories(userId),
      telegramConn: tataDanaDb.getTelegramConnection(userId),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
