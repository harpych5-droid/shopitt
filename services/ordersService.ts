import { supabase } from '@/lib/supabase';

// Uses the `orders` table — no separate `order_items` table in actual schema.
// Shipping address is stored as `shipping_address_snapshot` (jsonb) on the order.

export interface DbOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  post_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  total_price: number;
  currency: string;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  payment_status: string;
  created_at: string;
  updated_at: string;
  shipping_address_snapshot: AddressSnapshot | null;
  product_snapshot: ProductSnapshot | null;
  // Joined
  post?: {
    title: string;
    media_url: string;
    profiles?: { username: string | null; avatar_url: string | null };
  };
  buyer_profile?: { username: string | null; avatar_url: string | null };
}

export function normalizeOrderStatus(status: string | null | undefined): DbOrder['status'] {
  const normalized = String(status ?? 'pending').trim().toLowerCase();
  const map: Record<string, DbOrder['status']> = {
    pending: 'pending',
    received: 'pending',
    confirmed: 'pending',
    preparing: 'preparing',
    ready: 'preparing',
    shipped: 'preparing',
    completed: 'delivered',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  return map[normalized] ?? 'pending';
}

export interface AddressSnapshot {
  full_name?: string;
  phone?: string;
  line1?: string;
  city?: string;
  country?: string;
}

export interface ProductSnapshot {
  title?: string;
  price?: number;
  image?: string;
}

export async function fetchBuyerOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      post:posts (title, media_url, profiles (username, avatar_url))
    `)
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map((row: any) => ({ ...row, status: normalizeOrderStatus(row.status) })) as DbOrder[], error: null };
}

export async function fetchSellerOrders(sellerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      post:posts (title, media_url),
      buyer_profile:profiles!orders_buyer_id_fkey (username, avatar_url)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map((row: any) => ({ ...row, status: normalizeOrderStatus(row.status) })) as DbOrder[], error: null };
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return { data: { ...data, status: normalizeOrderStatus(data.status) } as DbOrder, error: null };
}

export async function createOrder(params: {
  buyerId: string;
  sellerId: string;
  postId: string;
  quantity: number;
  size?: string;
  color?: string;
  totalPrice: number;
  currency?: string;
  shippingAddress: AddressSnapshot;
  productSnapshot?: ProductSnapshot;
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      post_id: params.postId,
      quantity: params.quantity,
      size: params.size ?? null,
      color: params.color ?? null,
      total_price: params.totalPrice,
      currency: params.currency ?? 'USD',
      status: 'pending',
      payment_status: 'unpaid',
      shipping_address_snapshot: params.shippingAddress,
      product_snapshot: params.productSnapshot ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as DbOrder, error: null };
}

export async function updateOrderStatus(orderId: string, status: DbOrder['status']) {
  const canonical = normalizeOrderStatus(status);
  const { error } = await supabase
    .from('orders')
    .update({ status: canonical, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  return { error: error?.message ?? null };
}

export function subscribeToOrderUpdates(orderId: string, onUpdate: (order: DbOrder) => void) {
  return supabase
    .channel(`order:${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, payload => onUpdate(payload.new as DbOrder))
    .subscribe();
}

// ── Address helpers ───────────────────────────────────────────────────────────

export async function fetchUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function saveAddress(userId: string, address: {
  label?: string;
  full_name?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from('addresses')
    .insert({ user_id: userId, ...address })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
