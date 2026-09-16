import { supabase } from "@/lib/supabase";

export type OrderStatus = "pending" | "preparing" | "delivered" | "cancelled";

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

export function normalizeOrderStatus(status: string | null | undefined): OrderStatus {
  const normalized = String(status ?? "pending").trim().toLowerCase();
  const map: Record<string, OrderStatus> = {
    pending: "pending",
    received: "pending",
    confirmed: "pending",
    preparing: "preparing",
    ready: "preparing",
    shipped: "preparing",
    completed: "delivered",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  return map[normalized] ?? "pending";
}

export function getOrderStatusLabel(status: string | null | undefined): string {
  switch (normalizeOrderStatus(status)) {
    case "pending": return "Order received";
    case "preparing": return "Preparing";
    case "delivered": return "Completed";
    case "cancelled": return "Cancelled";
    default: return "Order received";
  }
}

export function sanitizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 10) return `260${digits.slice(1)}`;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message?: string) {
  const clean = sanitizePhone(phone);
  if (!clean) return null;
  const base = `https://wa.me/${clean}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export async function fetchSellerContactPhone(sellerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sellerId)
    .maybeSingle();

  if (!data) return null;
  const candidate = data.phone ?? data.mobile_phone ?? data.whatsapp_number ?? data.contact_phone ?? data.contact_number ?? null;
  return typeof candidate === "string" ? sanitizePhone(candidate) : null;
}

function normalizeOrder(row: any): OrderRow {
  const addressSnapshot = row.delivery_address_snapshot ?? {
    province: row.province ?? null,
    city: row.city ?? null,
    address: row.address ?? null,
    notes: row.notes ?? null,
  };
  return {
    ...row,
    status: normalizeOrderStatus(row.status),
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

export async function updateOrderStatus(orderId: string, status: OrderStatus | "received" | "completed") {
  const canonical = normalizeOrderStatus(status);
  const patch: Record<string, any> = {
    status: canonical,
    updated_at: new Date().toISOString(),
  };
  if (canonical === "delivered") patch.delivered_at = new Date().toISOString();
  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  return { error: error?.message ?? null };
}

async function findRecentDuplicateOrder(input: {
  buyerId: string;
  postId: string | null;
  unitPrice: number;
  quantity: number;
}) {
  if (!input.postId) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("id, buyer_id, post_id, quantity, total_price, created_at")
    .eq("buyer_id", input.buyerId)
    .eq("post_id", input.postId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return null;
  const now = Date.now();
  const targetTotal = Number(input.unitPrice) * Number(input.quantity);
  const candidate = (data ?? []).find((row: any) => {
    const createdAt = new Date(row.created_at).getTime();
    const sameQuantity = Number(row.quantity ?? 1) === Number(input.quantity);
    const sameAmount = Number(row.total_price ?? 0) === Number(targetTotal);
    const recent = now - createdAt < 1000 * 60 * 15;
    return sameQuantity && sameAmount && recent;
  });
  return candidate?.id ?? null;
}

export async function createOrder(input: {
  buyerId: string;
  sellerId: string;
  postId: string | null;
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
  const total = Number(input.unitPrice || 0) * Number(input.quantity || 1);
  const localKey = `shopitt.order:${input.buyerId}:${input.postId}:${input.quantity}:${Number(input.unitPrice).toFixed(2)}:${input.currency}`;

  if (typeof window !== "undefined") {
    const existingLocal = sessionStorage.getItem(localKey);
    if (existingLocal) return { id: existingLocal, error: null };
  }

  const duplicateId = await findRecentDuplicateOrder({
    buyerId: input.buyerId,
    postId: input.postId,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
  });
  if (duplicateId) {
    if (typeof window !== "undefined") sessionStorage.setItem(localKey, duplicateId);
    return { id: duplicateId, error: null };
  }

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

  if (!error && data?.id) {
    if (typeof window !== "undefined") sessionStorage.setItem(localKey, data.id);
    return { id: data.id, error: null };
  }

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

  if (!fallbackError && fallback?.id) {
    if (typeof window !== "undefined") sessionStorage.setItem(localKey, fallback.id);
    return { id: fallback.id, error: null };
  }

  return { id: null, error: fallbackError?.message ?? error?.message ?? "Couldn't place your order. Please try again." };
}
