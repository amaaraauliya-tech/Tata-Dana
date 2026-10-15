// ==============================================================================
// TataDana TypeScript Models & Database Types
// ==============================================================================

export type UserPlan = 'starter' | 'pro';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TelegramStatus = 'disconnected' | 'testing' | 'connected' | 'error';
export type AIProviderName = 'gemini' | 'openai' | 'deepseek';
export type AIFailoverMode = 'single' | 'parallel';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TransactionSource = 'telegram_text' | 'telegram_photo' | 'telegram_voice' | 'web_ui' | 'manual_web';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified?: boolean;
  plan: UserPlan;
  avatar_url?: string;
  currency: string;
  is_admin: boolean;
  role?: 'admin' | 'user';
  default_wallet_id?: string;
  approval_status?: UserApprovalStatus;
  created_at: string;
  updated_at: string;
}

export interface TelegramConnection {
  id: string;
  user_id: string;
  bot_token_encrypted: string;
  telegram_user_id?: number;
  bot_username?: string;
  status: TelegramStatus;
  webhook_url?: string;
  last_tested_at?: string;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet';
  account_number?: string;
  balance: number;
  is_default: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_ai_recommended?: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  monthly_limit: number;
  spent: number;
  month: number;
  year: number;
  alert_80_sent?: boolean;
  alert_100_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  time?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  wallet_name?: string;
  target_wallet_id?: string;
  target_wallet_name?: string;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  type: TransactionType;
  amount: number;
  transaction_date: string; // ISO string with WIB
  description: string;
  source: TransactionSource;
  receipt_url?: string;
  items?: ReceiptItem[];
  google_sheet_synced?: boolean;
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  provider_name: AIProviderName;
  api_key_enc: string;
  model_name: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AISettings {
  id: number;
  mode: AIFailoverMode;
  primary_provider: AIProviderName;
  updated_at: string;
}

export interface AILog {
  id: string;
  user_id?: string;
  user_name?: string;
  provider: string;
  operation_type: 'text_parse' | 'photo_ocr' | 'voice_transcribe' | 'financial_advisor';
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status: 'success' | 'fallback' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  format: 'pdf' | 'xlsx';
  period_type: string;
  start_date?: string;
  end_date?: string;
  total_records: number;
  total_amount: number;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  order_id: string;
  plan: UserPlan;
  amount: number;
  payment_method: 'midtrans' | 'manual_transfer';
  status: PaymentStatus;
  proof_url?: string;
  approved_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action: string;
  target_user_id?: string;
  target_user_name?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface UserReminder {
  id: string;
  user_id: string;
  is_active: boolean;
  frequency: '1x' | '2x';
  time_1: string; // HH:mm:ss
  time_2: string; // HH:mm:ss
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailOTPRecord {
  id: string;
  email: string;
  code: string;
  expires_at: number;
  verified: boolean;
  created_at: string;
}
