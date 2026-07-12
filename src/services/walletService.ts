import { supabase } from "@/lib/supabase";

export interface WalletBalance {
  balance: number;
  available_balance: number;
  pending_balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: string | null;
  transaction_type: string | null;
  amount: number;
  currency: string | null;
  wallet_bucket: string | null;
  status: string | null;
  reference: string | null;
  order_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  completed_at: string | null;
}

export async function fetchWalletBalance(userId: string): Promise<WalletBalance> {
  const { data, error } = await supabase
    .from("wallets")
    .select("balance, available_balance, pending_balance, currency")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { balance: 0, available_balance: 0, pending_balance: 0, currency: "ZMW" };
  }

  return {
    balance: Number(data.balance ?? 0),
    available_balance: Number(data.available_balance ?? data.balance ?? 0),
    pending_balance: Number(data.pending_balance ?? 0),
    currency: data.currency ?? "ZMW",
  };
}

export async function fetchTransactions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, transaction_type, amount, currency, wallet_bucket, status, reference, order_id, metadata, created_at, completed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [] as WalletTransaction[], error: error.message };
  return { data: (data ?? []) as WalletTransaction[], error: null as string | null };
}

export async function requestWithdrawal(userId: string, amount: number, currency: string) {
  try {
    const { data, error } = await supabase.rpc("request_wallet_withdrawal", {
      p_user_id: userId,
      p_amount: amount,
      p_currency: currency,
    });
    return { data, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Withdrawal request failed" };
  }
}