import { supabase } from "@/lib/supabase";

export type OrderStatus =
  | "pending"
  | "received"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  post_id: string | null;
  quantity: number | null;
  size: string | null;
  color: string | null;
  price_snapshot: number | null;
  unit_price?: number | null;
  total_price: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  delivery_address_snapshot: any;
  product_snapshot: any;
};

const SELECT = `
  id, buyer_id, seller_id, post_id, quantity, size, color, price_snapshot,
  total_price, currency, status, created_at,
  buyer_name, buyer_phone, delivery_address_snapshot, product_snapshot
`;

const FALLBACK_SELECT = `
  id, buyer_id, seller_id, post_id, quantity, unit_price,
  total_price, currency, status, created_at,
  buyer_name, buyer_phone, province, city, address, notes
`;

function normalizeOrder(row: any): OrderRow {
  const addressSnapshot = row.delivery_address_snapshot ?? {
    province: row.province ?? null,
    city: row.city ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
  };
  return {
    ...row,
    price_snapshot: Number(row.price_snapshot ?? row.unit_price ?? 0),
    total_price: Number(row.total_price ?? (Number(row.unit_price ?? row.price_snapshot ?? 0) * Number(row.quantity ?? 1))),
    delivery_address_snapshot: addressSnapshot,
    product_snapshot: row.product_snapshot ?? {},
  } as OrderRow;
}

export async function fetchBuyerOrders(userId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  if (!error) return (data ?? []).map(normalizeOrder);
  const { data: fallback } = await supabase
    .from("orders")
    .select(FALLBACK_SELECT)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  return (fallback ?? []).map(normalizeOrder);
}

export async function fetchSellerOrders(userId: string): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT)
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (!error) return (data ?? []).map(normalizeOrder);
  const { data: fallback } = await supabase
    .from("orders")
    .select(FALLBACK_SELECT)
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  return (fallback ?? []).map(normalizeOrder);
}

export async function fetchOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!error) return { data: data ? normalizeOrder(data) : null, error: null };
  const { data: fallback, error: fallbackError } = await supabase
    .from("orders")
    .select(FALLBACK_SELECT)
    .eq("id", id)
    .maybeSingle();
  return { data: fallback ? normalizeOrder(fallback) : null, error: fallbackError?.message ?? null };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const patch: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "delivered") patch.delivered_at = new Date().toISOString();
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  return { error: error?.message ?? null };
}

export async function createOrder(input: {
  buyerId: string;
  sellerId: string;
  postId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  size?: string | null;
  color?: string | null;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  productSnapshot: {
    title: string | null;
    media_url: string | null;
  };
}) {
  const total = input.unitPrice * input.quantity;
  const { data, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: input.buyerId,
      seller_id: input.sellerId,
      post_id: input.postId,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      price_snapshot: input.unitPrice,
      total_price: total,
      currency: input.currency,
      size: input.size ?? null,
      color: input.color ?? null,
      status: "pending",
      buyer_name: input.buyerName,
      buyer_phone: input.buyerPhone,
      delivery_address_snapshot: { address: input.deliveryAddress },
      product_snapshot: input.productSnapshot,
    })
    .select("id")
    .maybeSingle();
  if (!error) return { id: data?.id ?? null, error: null };

  const { data: fallback, error: fallbackError } = await supabase
    .from("orders")
    .insert({
      buyer_id: input.buyerId,
      seller_id: input.sellerId,
      post_id: input.postId,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      total_price: total,
      currency: input.currency,
      status: "pending",
      buyer_name: input.buyerName,
      buyer_phone: input.buyerPhone,
      address: input.deliveryAddress,
    })
    .select("id")
    .maybeSingle();
  return { id: fallback?.id ?? null, error: fallbackError?.message ?? null };
}
