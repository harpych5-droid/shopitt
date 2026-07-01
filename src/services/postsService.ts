import { supabase } from "@/lib/supabase";
import type { FeedItem } from "@/data/feed";

/**
 * Row shape from public.posts (joined with profiles).
 * Only the columns the web feed needs — keeps the surface small.
 */
export type DbPost = {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  media_urls: string[] | null;
  media: string[] | null;
  media_type: string | null;
  price: number | null;
  currency: string | null;
  hashtags: string[] | null;
  post_type: string | null;
  category_name: string | null;
  is_available: boolean | null;
  stock_quantity: number | null;
  delivery_type: string | null;
  has_free_delivery: boolean | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
    country: string | null;
  } | null;
};

const SELECT = `
  id, user_id, title, description, media_url, media_urls, media, media_type,
  price, currency, hashtags, post_type, category_name, is_available,
  stock_quantity, delivery_type, has_free_delivery, rating, review_count, created_at,
  profiles!posts_user_id_fkey ( username, avatar_url, full_name, country )
`;

export async function fetchFeedPosts(limit = 20, offset = 0) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(SELECT)
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { data: [] as DbPost[], error: error.message };
  return { data: (data ?? []) as DbPost[], error: null as string | null };
}

export async function fetchUserPosts(userId: string) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { data: [] as DbPost[], error: error.message };
  return { data: (data ?? []) as DbPost[], error: null as string | null };
}

/** Map a DB post row → the FeedItem shape the UI components expect. */
export function postToFeedItem(p: DbPost): FeedItem {
  const firstMedia =
    p.media_url ||
    (p.media_urls && p.media_urls[0]) ||
    (p.media && p.media[0]) ||
    "";
  const handle = p.profiles?.username ?? "shopitt";
  const brand = p.profiles?.full_name || handle;
  const isInspiration = (p.post_type ?? "").toLowerCase() === "inspiration";

  return {
    id: p.id,
    brand,
    brandHandle: handle,
    title: p.title ?? "Untitled drop",
    drop: p.category_name ?? (isInspiration ? "Inspiration" : "New Drop"),
    image: firstMedia,
    price: Number(p.price ?? 0),
    currency: (p.currency ?? "USD") + " ",
    stockLeft: p.stock_quantity ?? 0,
    freeDelivery: !!p.has_free_delivery,
    category: isInspiration ? "Inspiration" : "Fashion",
    likes: 0,
    sold: 0,
    location: p.profiles?.country ?? "",
    shipsIn: p.delivery_type ?? "—",
    caption: p.description ?? "",
    hashtags: p.hashtags ?? [],
    comments: p.review_count ?? 0,
    kind: isInspiration ? undefined : "product",
    deliveryType:
      p.delivery_type === "international" || p.delivery_type === "country" || p.delivery_type === "local"
        ? (p.delivery_type as FeedItem["deliveryType"])
        : undefined,
    postType: isInspiration ? "inspiration" : "product",
    badge: isInspiration ? "Inspiration" : "Product",
    mediaType: (p.media_type ?? "").toLowerCase() === "video" ? "video" : "image",
  };
}
