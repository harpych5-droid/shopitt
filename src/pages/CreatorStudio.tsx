import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Package, Plus, Sparkles, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { BackButton } from "@/components/navigation/BackButton";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchSellerOrders, type OrderRow } from "@/services/ordersService";
import { fetchUserPosts } from "@/services/postsService";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { fetchUserBadges, type UserBadge } from "@/services/adminService";

const money = (currency: string | null, value: number) => `${currency ?? "K"} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const CreatorStudio = () => {
  const { user, profile, isAuthed } = useIdentity();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [lookCount, setLookCount] = useState(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Creator Studio — Shopitt";
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      const [orderResult, postResult] = await Promise.all([fetchSellerOrders(user.id), fetchUserPosts(user.id)]);
      if (cancelled) return;
      setOrders(orderResult);
      setLookCount(postResult.data.length);
      setBadges(await fetchUserBadges(user.id));
      setLoading(false);
    };
    void load();
    const channel = supabase.channel(`creator-studio-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `seller_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { cancelled = true; void supabase.removeChannel(channel); };
  }, [user]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const completed = orders.filter((order) => order.status === "delivered");
    const revenue = completed.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
    return {
      community: "",
      orders: activeOrders.length,
      newOrders: orders.filter((order) => order.status === "pending").length,
      revenue,
      currency: completed[0]?.currency ?? activeOrders[0]?.currency ?? "K",
    };
  }, [orders]);

  if (!isAuthed) {
    return <main className="min-h-[100dvh] bg-background flex items-center justify-center p-6"><p className="text-sm text-muted-foreground">Sign in to open Creator Studio.</p></main>;
  }

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <BackButton fallback="/profile" />
          <h1 className="font-display text-base font-black tracking-tight">Creator Studio</h1>
          <Link to="/settings" aria-label="Studio settings" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center text-xs font-black">•••</Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-6">
        <section className="relative overflow-hidden rounded-[28px] bg-[#121212] p-6 text-white shadow-card">
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-brand-pink/30 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-pink">Your Creator Studio</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight">{profile?.username ? `@${profile.username}` : "Your style, in motion."}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65">Manage your Looks, orders, shop activity and creator identity in one focused workspace.</p>
          </div>
        </section>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Looks" value={lookCount.toString()} icon={Sparkles} />
            <Metric label="Orders" value={stats.orders.toString()} icon={Package} />
            <Metric label="New" value={stats.newOrders.toString()} icon={TrendingUp} />
            <Metric label="Est. revenue" value={money(stats.currency, stats.revenue)} icon={TrendingUp} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Orders</h2><Link to="/creator-studio/orders" className="text-xs font-bold text-brand-pink">View all</Link></div>
            {orders.length === 0 ? <div className="rounded-3xl border border-border bg-card p-6 text-center"><p className="text-sm font-bold">Your received orders will appear here.</p><p className="mt-1 text-xs text-muted-foreground">Keep creating Looks and your shop activity will stay close.</p></div> : <div className="space-y-2">{orders.slice(0, 4).map((order) => <OrderPreview key={order.id} order={order} />)}</div>}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Link to="/create" className="rounded-2xl gradient-brand p-4 text-white shadow-brand"><Plus className="h-5 w-5" /><p className="mt-3 text-sm font-black">Create Look</p><p className="mt-1 text-xs text-white/75">Publish your next style story.</p></Link>
            <Link to="/seller" className="rounded-2xl border border-border bg-card p-4"><Package className="h-5 w-5 text-brand-pink" /><p className="mt-3 text-sm font-black">Manage shop</p><p className="mt-1 text-xs text-muted-foreground">Products and seller tools.</p></Link>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">My badges</h2><span className="text-xs text-muted-foreground">Shopitt recognition</span></div>
            {badges.length > 0 ? <div className="flex flex-wrap gap-2">{badges.map((badge) => <span key={badge.assignment_id} title={badge.description} className="rounded-full border border-brand-pink/25 bg-brand-pink/10 px-3 py-2 text-xs font-bold text-brand-pink">{badge.name}</span>)}</div> : <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Your recognition will appear here when Shopitt awards a badge.</div>}
          </section>
        </>}
      </div>
      <BottomNav />
    </main>
  );
};

const Metric = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) => <div className="rounded-2xl border border-border bg-card p-4"><Icon className="h-4 w-4 text-brand-pink" /><p className="mt-4 text-xl font-black tabular-nums">{value}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p></div>;

const OrderPreview = ({ order }: { order: OrderRow }) => <Link to={`/creator-studio/orders/${order.id}`} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition hover:bg-muted/30"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">{order.product_snapshot?.media_url && <img src={order.product_snapshot.media_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{order.product_snapshot?.title ?? "Shopitt order"}</p><p className="mt-1 text-[11px] text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()} · {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p></div><div className="text-right"><p className="text-sm font-black">{money(order.currency, Number(order.total_price ?? 0))}</p><p className="mt-1 text-[10px] font-bold uppercase text-brand-pink">{order.status === "pending" ? "New" : order.status}</p></div></Link>;

export default CreatorStudio;
