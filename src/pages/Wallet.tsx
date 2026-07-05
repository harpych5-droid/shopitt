import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  Plus,
  Clock,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";

const TRANSACTIONS = [
  { id: "tx1", title: "Sale — Oversized Cashmere Knit", amount: 5103, type: "in" as const, time: "Today · 09:42" },
  { id: "tx2", title: "Withdrawal to Bank ****4421", amount: 8640, type: "out" as const, time: "Yesterday · 18:10" },
  { id: "tx3", title: "Sale — AirGlide 2", amount: 3915, type: "in" as const, time: "2 days ago · 11:28" },
  { id: "tx4", title: "Refund — Glow Serum", amount: 1296, type: "out" as const, time: "3 days ago · 14:02" },
  { id: "tx5", title: "Sale — Halo Pro ANC", amount: 7533, type: "in" as const, time: "5 days ago · 20:55" },
];

const Wallet = () => {
  useEffect(() => {
    document.title = "Wallet — Shopitt";
  }, []);

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
            <p className="mt-1 text-4xl font-black text-white tabular-nums tracking-tight">ZMW 67,001</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Pending</p>
                <p className="mt-0.5 text-lg font-extrabold text-white tabular-nums">ZMW 9,396</p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/80">Available</p>
                <p className="mt-0.5 text-lg font-extrabold text-white tabular-nums">ZMW 57,605</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button className="h-12 rounded-full bg-foreground text-background text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </button>
          <button className="h-12 rounded-full bg-card border border-border/60 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Plus className="h-4 w-4" />
            Top up
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
          <ul className="space-y-2">
            {TRANSACTIONS.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3"
              >
                <span
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    t.type === "in" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}
                >
                  {t.type === "in" ? (
                    <ArrowDownLeft className="h-[18px] w-[18px]" />
                  ) : (
                    <ArrowUpRight className="h-[18px] w-[18px]" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground">{t.time}</p>
                </div>
                <span
                  className={`text-sm font-extrabold tabular-nums shrink-0 ${
                    t.type === "in" ? "text-success" : "text-warning"
                  }`}
                >
                  {t.type === "in" ? "+" : "−"}ZMW {t.amount}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground pt-2">
          <WalletIcon className="inline h-3 w-3 mr-1" />
          Payouts processed within 24h via Shopitt Pay.
        </p>
      </div>

      <BottomNav />
    </main>
  );
};

export default Wallet;
