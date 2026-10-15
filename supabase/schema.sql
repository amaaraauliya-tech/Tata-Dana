-- ==============================================================================
-- TataDana Supabase Database Schema
-- Complete Production Schema for Supabase PostgreSQL
-- Features: Email OTP Verification, Admin Approval Workflow, Zero-Balance Wallets,
-- Multi-Wallet, Budgeting, Telegram Bot Integration & RLS Security
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Users & Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'IDR',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    default_wallet_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. EMAIL OTP VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps(email, code);

-- 3. WALLETS TABLE (All new user wallets start with balance 0.00)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank', 'ewallet')),
    account_number TEXT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    icon TEXT DEFAULT '🏦',
    color TEXT DEFAULT '#005CA9',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'transfer')),
    icon TEXT NOT NULL DEFAULT '🏷️',
    color TEXT NOT NULL DEFAULT '#F97316',
    is_ai_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- 5. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    alert_80_sent BOOLEAN DEFAULT FALSE,
    alert_100_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_cat_month_year UNIQUE (user_id, category_id, month, year)
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    description TEXT,
    source TEXT NOT NULL DEFAULT 'web_ui',
    receipt_url TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);

-- 7. TELEGRAM CONNECTIONS
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bot_token_encrypted TEXT NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    bot_username TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'testing', 'connected', 'error')),
    webhook_url TEXT,
    last_tested_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_tg UNIQUE (user_id)
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 9. WALLET BALANCE TRIGGER (Automatic updates upon transaction)
CREATE OR REPLACE FUNCTION public.handle_transaction_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.target_wallet_id IS NOT NULL THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.target_wallet_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.target_wallet_id IS NOT NULL THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.target_wallet_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_tx_inserted_balance ON public.transactions;
CREATE TRIGGER on_tx_inserted_balance
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_wallet_balance();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to manage own records; Service role bypasses all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Wallets access policy" ON public.wallets FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Transactions access policy" ON public.transactions FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Categories access policy" ON public.categories FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Budgets access policy" ON public.budgets FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 11. INITIAL SEED FOR SUPER ADMIN ("SAYA")
INSERT INTO public.profiles (
    id, email, full_name, phone_number, phone_verified, email_verified,
    plan, currency, is_admin, role, approval_status
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@tatadana.id',
    'Admin TataDana (Saya)',
    '+6281112223334',
    true,
    true,
    'pro',
    'IDR',
    true,
    'admin',
    'approved'
) ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    role = 'admin',
    approval_status = 'approved',
    email_verified = true;

-- Admin Default Wallet with 0 balance
INSERT INTO public.wallets (
    id, user_id, name, type, balance, is_default, icon, color
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Dompet Utama',
    'bank',
    0.00,
    true,
    '🏦',
    '#005CA9'
) ON CONFLICT (id) DO NOTHING;
