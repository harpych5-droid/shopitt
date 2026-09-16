import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { fetchOrderById, getOrderStatusLabel } from "@/services/ordersService";
import { useIdentity } from "@/hooks/useIdentity";


const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useIdentity();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Order ${id ?? ""} — Shopitt`;
    if (!id || !user) {
      setLoading(false);
      return;
    }

    let active = true;
    void fetchOrderById(id).then(({ data }) => {
      if (active) {
        setOrder(data);
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, [id, user]);

  if (!id || !user) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Sign in to view your order.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-base font-bold">Order not found</p>
          <Link to="/orders" className="mt-3 inline-flex rounded-full gradient-brand px-4 py-2 text-sm font-bold text-white shadow-brand">Back to orders</Link>
        </div>
      </main>
    );
  }

  const status = (order.status ?? "pending").toLowerCase();
  const currentLabel = getOrderStatusLabel(status);
  const productTitle = order.product_snapshot?.title ?? "Product";
  const total = Number(order.total_price ?? 0);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/orders" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Order</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        <section className="flex items-center gap-3 rounded-3xl bg-card border border-border/60 p-3">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted shrink-0">
            {order.product_snapshot?.media_url && <img src={order.product_snapshot.media_url} alt={productTitle} className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{productTitle}</p>
            <p className="text-[11px] text-muted-foreground">Order #{String(id).slice(0, 8).toUpperCase()}</p>
          </div>
          <span className="text-sm font-extrabold tabular-nums">{order.currency ?? "$"}{total.toFixed(2)}</span>
        </section>

        <section className="rounded-3xl bg-card border border-border/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">Status</h2>
            <span className="rounded-full bg-brand-pink/10 px-2.5 py-1 text-[10px] font-bold text-brand-pink">{currentLabel}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">The seller has received this order.</p>
        </section>
      </div>

      <BottomNav />
    </main>
  );
};

export default OrderTracking;
