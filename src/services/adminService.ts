import { supabase } from "@/lib/supabase";

/**
 * Admin data layer — all reads/writes hit the production backend.
 * Every helper is failure-tolerant: a missing table or column returns
 * an empty result instead of throwing, so the dashboard never blanks out.
 */

const count = async (table: string, apply?: (q: any) => any): Promise<number> => {
  let q = (supabase as any).from(table).select("id", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: c } = await q;
  return c ?? 0;
};

export type AdminCounts = {
  users: number;
  sellers: number;
  posts: number;
  reels: number;
  products: number;
  orders: number;
  comments: number;
  messages: number;
  revenue: number;
  activeToday: number;
};

export async function fetchAdminCounts(): Promise<AdminCounts> {
  const since = (days: number) =>
    new Date(Date.now() - days * 86400000).toISOString();

  const [users, posts, reels, products, orders, comments, messages, sellers, activeToday] =
    await Promise.all([
      count("profiles"),
      count("posts"),
      count("posts", (q) => q.eq("media_type", "video")),
      count("products"),
      count("orders"),
      count("comments"),
      count("messages"),
      count("profiles", (q) => q.eq("is_seller", true)),
      count("profiles", (q) => q.gte("updated_at", since(1))),
    ]);

  const { data: revRows } = await (supabase as any)
    .from("orders")
    .select("total_price, status")
    .neq("status", "cancelled")
    .limit(5000);
  const revenue = (revRows ?? []).reduce(
    (a: number, r: any) => a + Number(r.total_price ?? 0),
    0,
  );

  return {
    users,
    sellers,
    posts,
    reels,
    products,
    orders,
    comments,
    messages,
    revenue,
    activeToday,
  };
}

export type AdminUser = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  role: string | null;
  is_seller: boolean | null;
  is_suspended: boolean | null;
  created_at: string;
};

export async function fetchAdminUsers(search = "", limit = 50): Promise<AdminUser[]> {
  let q = (supabase as any)
    .from("profiles")
    .select("id, username, full_name, avatar_url, country, role, is_seller, is_suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`username.ilike.${s},full_name.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) {
    const { data: basic } = await (supabase as any)
      .from("profiles")
      .select("id, username, avatar_url, country, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (basic ?? []) as AdminUser[];
  }
  return (data ?? []) as AdminUser[];
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", userId);
  return error?.message ?? null;
}

export async function setUserRole(userId: string, role: string) {
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  return error?.message ?? null;
}

export type AdminSeller = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  is_verified: boolean | null;
  plan: string | null;
  posts: number;
  orders: number;
  revenue: number;
};

export async function fetchAdminSellers(limit = 30): Promise<AdminSeller[]> {
  const { data: sellerRows } = await (supabase as any)
    .from("profiles")
    .select("id, username, full_name, avatar_url, country, is_verified, plan, is_seller")
    .eq("is_seller", true)
    .limit(limit);

  let sellers = sellerRows as any[] | null;
  if (!sellers || sellers.length === 0) {
    // Fallback: anyone who has posted with a price is effectively a seller
    const { data: withPosts } = await (supabase as any)
      .from("posts")
      .select("user_id, profiles!posts_user_id_fkey ( id, username, full_name, avatar_url, country )")
      .not("price", "is", null)
      .limit(300);
    const map = new Map<string, any>();
    (withPosts ?? []).forEach((r: any) => {
      if (r.profiles?.id && !map.has(r.profiles.id)) map.set(r.profiles.id, r.profiles);
    });
    sellers = Array.from(map.values()).slice(0, limit);
  }

  const ids = (sellers ?? []).map((s) => s.id);
  if (ids.length === 0) return [];

  const [{ data: posts }, { data: orders }] = await Promise.all([
    (supabase as any).from("posts").select("user_id").in("user_id", ids).limit(5000),
    (supabase as any).from("orders").select("seller_id, total_price, status").in("seller_id", ids).limit(5000),
  ]);

  return (sellers ?? []).map((s: any) => {
    const sellerOrders = (orders ?? []).filter((o: any) => o.seller_id === s.id);
    return {
      id: s.id,
      username: s.username,
      full_name: s.full_name ?? null,
      avatar_url: s.avatar_url ?? null,
      country: s.country ?? null,
      is_verified: s.is_verified ?? null,
      plan: s.plan ?? "Free",
      posts: (posts ?? []).filter((p: any) => p.user_id === s.id).length,
      orders: sellerOrders.length,
      revenue: sellerOrders
        .filter((o: any) => o.status !== "cancelled")
        .reduce((a: number, o: any) => a + Number(o.total_price ?? 0), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export async function setSellerVerified(userId: string, verified: boolean) {
  const { error } = await (supabase as any)
    .from("profiles")
    .update({ is_verified: verified })
    .eq("id", userId);
  return error?.message ?? null;
}

export type AdminOrder = {
  id: string;
  status: string | null;
  total_price: number | null;
  currency: string | null;
  quantity: number | null;
  created_at: string;
  buyer_name: string | null;
  product_title: string | null;
  buyer_id: string;
  seller_id: string;
};

export async function fetchAdminOrders(limit = 60): Promise<AdminOrder[]> {
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("id, status, total_price, currency, quantity, created_at, buyer_name, buyer_id, seller_id, product_snapshot")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    const { data: fb } = await (supabase as any)
      .from("orders")
      .select("id, status, total_price, currency, quantity, created_at, buyer_name, buyer_id, seller_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (fb ?? []).map((o: any) => ({ ...o, product_title: null }));
  }
  return (data ?? []).map((o: any) => ({
    ...o,
    product_title: o.product_snapshot?.title ?? null,
  }));
}

export async function updateOrderStatusAdmin(orderId: string, status: string) {
  const { error } = await (supabase as any)
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  return error?.message ?? null;
}

export type AdminPost = {
  id: string;
  title: string | null;
  drop_title: string | null;
  media_url: string | null;
  media_type: string | null;
  price: number | null;
  currency: string | null;
  is_featured: boolean | null;
  created_at: string;
  username: string | null;
};

export async function fetchAdminPosts(
  kind: "all" | "video" | "image" = "all",
  limit = 40,
): Promise<AdminPost[]> {
  let q = (supabase as any)
    .from("posts")
    .select("id, title, drop_title, media_url, media_urls, media_type, price, currency, is_featured, created_at, profiles!posts_user_id_fkey ( username )")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (kind === "video") q = q.eq("media_type", "video");
  if (kind === "image") q = q.neq("media_type", "video");
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    drop_title: p.drop_title,
    media_url: p.media_url ?? p.media_urls?.[0] ?? null,
    media_type: p.media_type,
    price: p.price,
    currency: p.currency ?? "$",
    is_featured: p.is_featured ?? false,
    created_at: p.created_at,
    username: p.profiles?.username ?? null,
  }));
}

export async function setPostFeatured(postId: string, featured: boolean) {
  const { error } = await (supabase as any)
    .from("posts")
    .update({ is_featured: featured })
    .eq("id", postId);
  return error?.message ?? null;
}

export async function deletePostAdmin(postId: string) {
  const { error } = await (supabase as any).from("posts").delete().eq("id", postId);
  return error?.message ?? null;
}

export type AdminComment = {
  id: string;
  content: string | null;
  created_at: string;
  post_id: string;
  username: string | null;
};

export async function fetchAdminComments(limit = 40): Promise<AdminComment[]> {
  const { data, error } = await (supabase as any)
    .from("comments")
    .select("id, content, created_at, post_id, profiles!comments_user_id_fkey ( username )")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((c: any) => ({
    id: c.id,
    content: c.content ?? c.text ?? null,
    created_at: c.created_at,
    post_id: c.post_id,
    username: c.profiles?.username ?? null,
  }));
}

export async function deleteCommentAdmin(commentId: string) {
  const { error } = await (supabase as any).from("comments").delete().eq("id", commentId);
  return error?.message ?? null;
}

export type AdminActivity = {
  id: string;
  kind: "user" | "post" | "order" | "comment";
  text: string;
  who: string;
  at: string;
};

export async function fetchAdminActivity(): Promise<AdminActivity[]> {
  const [users, posts, orders, comments] = await Promise.all([
    (supabase as any).from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(5),
    (supabase as any).from("posts").select("id, title, drop_title, created_at, profiles!posts_user_id_fkey ( username )").order("created_at", { ascending: false }).limit(5),
    (supabase as any).from("orders").select("id, total_price, currency, created_at, buyer_name").order("created_at", { ascending: false }).limit(5),
    (supabase as any).from("comments").select("id, content, created_at, profiles!comments_user_id_fkey ( username )").order("created_at", { ascending: false }).limit(5),
  ]);

  const rows: AdminActivity[] = [];
  (users.data ?? []).forEach((u: any) =>
    rows.push({ id: `u-${u.id}`, kind: "user", text: "New user registered", who: `@${u.username ?? "user"}`, at: u.created_at }));
  (posts.data ?? []).forEach((p: any) =>
    rows.push({ id: `p-${p.id}`, kind: "post", text: "Post published", who: `@${p.profiles?.username ?? "seller"} · ${p.drop_title ?? p.title ?? "Drop"}`, at: p.created_at }));
  (orders.data ?? []).forEach((o: any) =>
    rows.push({ id: `o-${o.id}`, kind: "order", text: "Order received", who: `${o.buyer_name ?? "Buyer"} · ${o.currency ?? "$"}${Number(o.total_price ?? 0).toLocaleString()}`, at: o.created_at }));
  (comments.data ?? []).forEach((c: any) =>
    rows.push({ id: `c-${c.id}`, kind: "comment", text: "Comment added", who: `@${c.profiles?.username ?? "user"} · ${(c.content ?? "").slice(0, 32)}`, at: c.created_at }));

  return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 10);
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - +new Date(iso)) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
