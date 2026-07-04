import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Sparkles, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchBuyerOrders, type OrderRow } from "@/services/ordersService";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
] as const;

type TabKey = typeof TABS[number]["key"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  received: "bg-warning/15 text-warning",
  preparing: "bg-brand-purple/15 text-brand-purple",
  ready: "bg-brand-pink/15 text-brand-pink",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

const Orders = () => {
  const { user, isAuthed } = useIdentity();
  const [tab, setTab] = useState<TabKey>("pending");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Orders — Vylogue"; }, []);

  useEffect(() => {
    if (!isAuthed || !user) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      const data = await fetchBuyerOrders(user.id);
      if (!cancelled) { setOrders(data); setLoading(false); }
    };
    load();
    const channel = supabase
      .channel(`me-orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `buyer_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [isAuthed, user]);

  const items = useMemo(() => {
    const match = (s: string | null) => {
      const n = (s ?? "pending").toLowerCase();
      if (tab === "pending") return n === "pending" || n === "received";
      return n === tab;
    };
    return orders.filter((o) => match(o.status));
  }, [orders, tab]);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Orders</h1>
          <span className="h-9 w-9" />
        </div>
        <div className="max-w-md mx-auto px-2 pb-2 overflow-x-auto no-scrollbar">
          <div className="relative flex gap-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`relative shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${active ? "text-white" : "text-muted-foreground hover:text-foreground"}`}>
                  {active && <motion.span layoutId="orders-tab-pill" className="absolute inset-0 rounded-full gradient-brand shadow-brand" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
        {!isAuthed ? (
          <p className="text-center text-sm text-muted-foreground py-10">Sign in to see your orders.</p>
        ) : loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl glass p-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
              <Package className="h-6 w-6 text-white" />
            </span>
            <h3 className="mt-3 text-base font-extrabold">No {tab} orders</h3>
            <p className="mt-1 text-xs text-muted-foreground">Discover new drops and your orders will land here.</p>
            <Link to="/" className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
              <Sparkles className="h-4 w-4" />
              Discover
            </Link>
          </div>
        ) : (
          items.map((o) => {
            const snap = (o.product_snapshot ?? {}) as { title?: string; media_url?: string };
            const statusLabel = (o.status ?? "pending").toLowerCase();
            return (
              <Link key={o.id} to={`/orders/${o.id}`} className="block rounded-3xl bg-card border border-border/60 p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                    {snap.media_url && <img src={snap.media_url} alt={snap.title ?? ""} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold truncate">{snap.title ?? "Order"}</p>
                      <span className={`shrink-0 text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5 ${STATUS_STYLES[statusLabel] ?? "bg-muted"}`}>{statusLabel}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      #{o.id.slice(0, 8)} · {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                    </p>
                    <p className="mt-1.5 text-sm font-extrabold tabular-nums">
                      {o.currency ?? "USD"} {Number(o.total_price ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Orders;
