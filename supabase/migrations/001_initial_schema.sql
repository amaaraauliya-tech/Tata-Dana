-- ==============================================================================
-- TataDana Supabase Database Schema Migration
-- Complete Schema with RLS, Multi-Wallet, Budgeting, Telegram & Multi-Provider AI
-- Timezone: Asia/Jakarta (WIB)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enum Types
CREATE TYPE user_plan AS ENUM ('starter', 'pro');
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
CREATE TYPE telegram_status AS ENUM ('disconnected', 'testing', 'connected', 'error');
CREATE TYPE ai_provider_name AS ENUM ('gemini', 'openai', 'deepseek');
CREATE TYPE ai_failover_mode AS ENUM ('single', 'parallel');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    plan user_plan DEFAULT 'starter',
    avatar_url TEXT,
    currency TEXT DEFAULT 'IDR',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 2. TELEGRAM CONNECTIONS
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bot_token_encrypted TEXT NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    bot_username TEXT,
    status telegram_status DEFAULT 'disconnected',
    webhook_url TEXT,
    last_tested_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_telegram UNIQUE (user_id)
);

-- 3. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank', -- 'cash', 'bank', 'ewallet'
    account_number TEXT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    icon TEXT DEFAULT '👛',
    color TEXT DEFAULT '#F97316',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type transaction_type NOT NULL DEFAULT 'expense',
    icon TEXT NOT NULL DEFAULT '🏷️',
    color TEXT NOT NULL DEFAULT '#F97316',
    is_ai_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 5. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL,
    month INTEGER NOT NULL, -- 1 to 12
    year INTEGER NOT NULL,  -- e.g. 2026
    alert_80_sent BOOLEAN DEFAULT FALSE,
    alert_100_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL, -- for transfer
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    description TEXT,
    source TEXT NOT NULL DEFAULT 'web_ui', -- 'telegram_text', 'telegram_photo', 'telegram_voice', 'web_ui'
    receipt_url TEXT,
    items JSONB DEFAULT '[]'::jsonb, -- item breakdown for multi-item receipt
    google_sheet_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 7. TELEGRAM IDEMPOTENCY TRACKER
CREATE TABLE IF NOT EXISTS public.telegram_processed_updates (
    update_id BIGINT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 8. AI PROVIDERS CONFIGURATION (Superadmin)
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name ai_provider_name NOT NULL UNIQUE,
    api_key_enc TEXT NOT NULL,
    model_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- AI Configuration Setting
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mode ai_failover_mode DEFAULT 'single',
    primary_provider ai_provider_name DEFAULT 'gemini',
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 9. AI MONITORING LOGS
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'text_parse', 'photo_ocr', 'voice_transcribe', 'financial_advisor'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL, -- 'success', 'fallback', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 10. EXPORT REPORT HISTORIES
CREATE TABLE IF NOT EXISTS public.export_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    format TEXT NOT NULL, -- 'pdf', 'xlsx'
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', 'custom'
    start_date DATE,
    end_date DATE,
    total_records INTEGER DEFAULT 0,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 11. PAYMENT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    plan user_plan NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'midtrans', 'manual_transfer'
    status payment_status DEFAULT 'pending',
    proof_url TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 12. ADMIN AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 13. USER REMINDERS
CREATE TABLE IF NOT EXISTS public.user_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT '1x', -- '1x', '2x'
    time_1 TIME DEFAULT '08:00:00',
    time_2 TIME DEFAULT '20:00:00',
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_reminder UNIQUE (user_id)
);

-- 14. DEFAULT SEED DATA FOR AI PROVIDERS & SETTINGS
INSERT INTO public.ai_settings (id, mode, primary_provider) 
VALUES (1, 'single', 'gemini')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_providers (provider_name, api_key_enc, model_name, is_active, priority)
VALUES 
    ('gemini', 'mock-gemini-key', 'gemini-1.5-flash', true, 1),
    ('openai', 'mock-openai-key', 'gpt-4o-mini', true, 2),
    ('deepseek', 'mock-deepseek-key', 'deepseek-chat', true, 3)
ON CONFLICT (provider_name) DO NOTHING;

-- 15. AUTOMATIC TRIGGER FOR WALLET BALANCE ADJUSTMENT
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

CREATE OR REPLACE TRIGGER on_transaction_inserted_update_balance
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_wallet_balance();

-- Enable RLS on all user data tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;

-- Setup Row Level Security Policies
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own telegram config" ON public.telegram_connections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own export histories" ON public.export_histories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reminders" ON public.user_reminders
    FOR ALL USING (auth.uid() = user_id);
