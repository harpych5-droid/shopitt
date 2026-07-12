import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  Clock,
  Loader2,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchTransactions, fetchWalletBalance, requestWithdrawal, type WalletBalance, type WalletTransaction } from "@/services/walletService";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const Wallet = () => {
  const { user, isAuthed } = useIdentity();
  const [balance, setBalance] = useState<WalletBalance>({ balance: 0, available_balance: 0, pending_balance: 0, currency: "ZMW" });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    document.title = "Wallet — Shopitt";
  }, []);

  useEffect(() => {
    if (!isAuthed || !user) {
      setLoading(false);
      setTransactions([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const [wallet, tx] = await Promise.all([
        fetchWalletBalance(user.id),
        fetchTransactions(user.id),
      ]);
      if (cancelled) return;
      setBalance(wallet);
      setTransactions(tx.data);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [isAuthed, user]);

  const money = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }), []);
  const currency = balance.currency || "ZMW";

  const withdrawAll = async () => {
    if (!user || balance.available_balance <= 0 || withdrawing) return;
    setWithdrawing(true);
    const { error } = await requestWithdrawal(user.id, balance.available_balance, currency);
    setWithdrawing(false);
    if (error) toast.error(error);
    else toast.success("Withdrawal request sent");
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Wallet</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {!isAuthed ? (
          <div className="rounded-3xl glass p-6 text-center">
            <WalletIcon className="mx-auto h-8 w-8 text-brand-pink" />
            <h2 className="mt-3 text-base font-extrabold">Sign in to view your wallet</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sales, payouts and withdrawals appear here.</p>
          </div>
        ) : loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
        {/* Balance hero */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl gradient-brand shadow-brand p-6"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/85">Total balance</p>
            <p className="mt-1 text-4xl font-black text-white tabular-nums tracking-tight">{currency} {money.format(balance.balance)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Pending</p>
                <p className="mt-0.5 text-lg font-extrabold text-white tabular-nums">{currency} {money.format(balance.pending_balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Available</p>
                <p className="mt-0.5 text-lg font-extrabold text-white tabular-nums">{currency} {money.format(balance.available_balance)}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button onClick={withdrawAll} disabled={balance.available_balance <= 0 || withdrawing} className="h-12 rounded-full bg-foreground text-background text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
            <ArrowUpRight className="h-4 w-4" />
            {withdrawing ? "Requesting…" : "Withdraw"}
          </button>
          <button className="h-12 rounded-full bg-card border border-border/60 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform" onClick={() => toast.info("Top ups are coming soon")}> 
            <WalletIcon className="h-4 w-4" />
            Payout method
          </button>
        </section>

        {/* Transactions */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">
              Transaction history
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Last 30 days
            </span>
          </div>
          {transactions.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border/60 p-6 text-center">
              <p className="text-sm font-bold">No wallet activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Completed sales and withdrawals will show here.</p>
            </div>
          ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const direction = (t.type ?? t.transaction_type ?? "").toLowerCase();
              const isIn = ["credit", "sale", "deposit", "earning", "in"].some((x) => direction.includes(x)) || Number(t.amount) > 0;
              const label = (t.metadata?.title || t.reference || t.transaction_type || t.type || "Wallet transaction") as string;
              return (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3"
              >
                <span
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIn ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}
                >
                  {isIn ? (
                    <ArrowDownLeft className="h-[18px] w-[18px]" />
                  ) : (
                    <ArrowUpRight className="h-[18px] w-[18px]" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })} · {t.status ?? "posted"}</p>
                </div>
                <span
                  className={`text-sm font-extrabold tabular-nums shrink-0 ${
                    isIn ? "text-success" : "text-warning"
                  }`}
                >
                  {isIn ? "+" : "−"}{t.currency ?? currency} {money.format(Math.abs(Number(t.amount ?? 0)))}
                </span>
              </li>
            );})}
          </ul>
          )}
        </section>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground pt-2">
          <WalletIcon className="inline h-3 w-3 mr-1" />
          Payouts processed within 24h via Shopitt Pay.
        </p>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Wallet;
