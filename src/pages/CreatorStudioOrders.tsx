import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle, Loader2, Package, ShieldAlert } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { BackButton } from "@/components/navigation/BackButton";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchSellerOrders, updateOrderStatus, type OrderRow } from "@/services/ordersService";
import { fetchChatProfile, findOrCreateConversation } from "@/services/chatService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const FILTERS = ["all", "pending", "preparing", "delivered", "cancelled"] as const;
type Filter = typeof FILTERS[number];
const label = (status: string) => status === "pending" ? "Order placed" : status === "preparing" ? "Seller confirmed" : status === "delivered" ? "Completed" : "Cancelled";

const CreatorStudioOrders = () => {
  const { id } = useParams();
  const { user, isAuthed } = useIdentity();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const result = await fetchSellerOrders(user.id);
    setOrders(result);
    setOrder(id ? result.find((item) => item.id === id) ?? null : null);
    setLoading(false);
  };

  useEffect(() => { document.title = id ? "Creator Studio order — Shopitt" : "Creator Studio orders — Shopitt"; void load(); }, [id, user?.id]);
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`creator-studio-orders-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `seller_id=eq.${user.id}` }, load).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id, id]);

  const visible = useMemo(() => filter === "all" ? orders : orders.filter((item) => item.status === filter), [filter, orders]);

  if (!isAuthed) return <main className="min-h-[100dvh] flex items-center justify-center p-6"><p className="text-sm text-muted-foreground">Sign in to view received orders.</p></main>;
  if (loading) return <main className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>;

  if (id) return <OrderDetail order={order} userId={user?.id ?? ""} />;

  return <main className="min-h-[100dvh] bg-background pb-32"><Header title="Studio orders" fallback="/creator-studio" /><div className="mx-auto max-w-2xl space-y-4 px-4 pt-5"><div className="flex gap-2 overflow-x-auto pb-1">{FILTERS.map((value) => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold capitalize ${filter === value ? "gradient-brand text-white" : "border border-border bg-card text-muted-foreground"}`}>{value === "pending" ? "New" : value}</button>)}</div>{visible.length === 0 ? <div className="rounded-3xl border border-border bg-card p-8 text-center"><Package className="mx-auto h-8 w-8 text-brand-pink" /><p className="mt-3 text-sm font-bold">No {filter === "all" ? "received" : filter} orders</p><p className="mt-1 text-xs text-muted-foreground">Orders connected to your Looks will appear here.</p></div> : <div className="space-y-2">{visible.map((item) => <OrderRowCard key={item.id} order={item} />)}</div>}</div><BottomNav /></main>;
};

const Header = ({ title, fallback }: { title: string; fallback: string }) => <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"><BackButton fallback={fallback} /><h1 className="font-display text-base font-black">{title}</h1><span className="h-9 w-9" /></div></header>;
const OrderRowCard = ({ order }: { order: OrderRow }) => <Link to={`/creator-studio/orders/${order.id}`} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{order.product_snapshot?.media_url && <img src={order.product_snapshot.media_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="truncate text-sm font-bold">{order.product_snapshot?.title ?? "Shopitt order"}</p><span className="text-[10px] font-bold uppercase text-brand-pink">{order.status === "pending" ? "New" : order.status}</span></div><p className="mt-1 text-[11px] text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()} · {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p><p className="mt-2 text-sm font-black">{order.currency ?? "K"} {Number(order.total_price ?? 0).toLocaleString()}</p></div></Link>;

const OrderDetail = ({ order, userId }: { order: OrderRow | null; userId: string }) => {
  const [saving, setSaving] = useState(false);
  if (!order || order.seller_id !== userId) return <main className="min-h-[100dvh] bg-background flex items-center justify-center p-6"><div className="text-center"><ShieldAlert className="mx-auto h-9 w-9 text-destructive" /><p className="mt-3 text-base font-bold">Order not found</p><p className="mt-1 text-xs text-muted-foreground">This order is not available in your Creator Studio.</p></div></main>;
  const canAdvance = order.status === "pending" || order.status === "preparing";
  const next = order.status === "pending" ? "preparing" : "delivered";
  const advance = async () => { setSaving(true); const result = await updateOrderStatus(order.id, next); setSaving(false); if (result.error) toast.error(result.error); else window.location.reload(); };
  const openChat = async () => {
    const result = await findOrCreateConversation(userId, order.buyer_id);
    if (result.error || !result.id) {
      toast.error(result.error ?? "Could not open buyer chat");
      return;
    }
    const buyerProfile = await fetchChatProfile(order.buyer_id);
    const destination = buyerProfile.data?.username?.trim() || order.buyer_id;
    window.location.assign(`/chats/${encodeURIComponent(destination)}`);
  };
  return <main className="min-h-[100dvh] bg-background pb-32"><Header title={`Order #${order.id.slice(0, 8).toUpperCase()}`} fallback="/creator-studio/orders" /><div className="mx-auto max-w-2xl space-y-4 px-4 pt-5"><section className="rounded-3xl bg-[#121212] p-5 text-white"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-pink">{label(order.status ?? "pending")}</p><h2 className="mt-2 font-display text-2xl font-black">{order.product_snapshot?.title ?? "Shopitt order"}</h2><p className="mt-2 text-sm text-white/60">Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p></section><section className="rounded-3xl border border-border bg-card p-5"><div className="flex gap-3"><div className="h-20 w-20 overflow-hidden rounded-xl bg-muted">{order.product_snapshot?.media_url && <img src={order.product_snapshot.media_url} alt="" className="h-full w-full object-cover" />}</div><div><p className="text-sm font-bold">{order.product_snapshot?.title ?? "Shopitt item"}</p><p className="mt-1 text-xs text-muted-foreground">Quantity {order.quantity ?? 1}{order.size ? ` · ${order.size}` : ""}{order.color ? ` · ${order.color}` : ""}</p></div></div><div className="mt-5 border-t border-border/60 pt-4"><Row label="Order value" value={`${order.currency ?? "K"} ${Number(order.total_price ?? 0).toLocaleString()}`} /><Row label="Estimated revenue" value={`${order.currency ?? "K"} ${Number(order.total_price ?? 0).toLocaleString()}`} /><p className="mt-2 text-[11px] text-muted-foreground">Estimated from the current order total. No separate commission rule is configured.</p></div></section><section className="rounded-3xl border border-border bg-card p-5"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Buyer and delivery</p><p className="mt-3 text-sm font-bold">{order.buyer_name ?? "Shopitt buyer"}</p><p className="mt-1 text-xs text-muted-foreground">{order.delivery_address_snapshot?.address ?? "Delivery details provided with the order"}</p></section><div className="grid grid-cols-2 gap-3"><button onClick={() => void openChat()} className="h-11 rounded-full border border-border bg-card text-sm font-bold inline-flex items-center justify-center gap-2"><MessageCircle className="h-4 w-4" /> Chat with buyer</button>{canAdvance && <button onClick={() => void advance()} disabled={saving} className="h-11 rounded-full gradient-brand text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving" : order.status === "pending" ? "Confirm order" : "Mark completed"}</button>}</div></div><BottomNav /></main>;
};

const Row = ({ label, value }: { label: string; value: string }) => <div className="flex items-center justify-between gap-3 py-1 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>;

export default CreatorStudioOrders;
