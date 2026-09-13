import { supabase } from "@/lib/supabase";
import { currencyLabel } from "@/lib/currency";
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
  content_type: string | null;
  post_badges: { label: string | null; badge_type: string | null }[] | null;
  is_available: boolean | null;
  stock_quantity: number | null;
  quantity: number | null;
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
    is_verified: boolean | null;
  } | null;
};

/**
 * `posts.content_type` is the database-enforced source of truth for a post
 * experience. Commerce is available only to the shoppable/product experience.
 */
export function isShoppablePost(post: Pick<DbPost, "content_type" | "post_type">): boolean {
  const kind = (post.content_type ?? post.post_type ?? "").toLowerCase();
  return kind === "product" || kind === "shoppable";
}

export function getPostExperience(post: Pick<DbPost, "content_type" | "post_type">): "inspiration" | "product" {
  const kind = (post.content_type ?? post.post_type ?? "").toLowerCase();
  return kind === "inspiration" ? "inspiration" : "product";
}

const VIDEO_URL_PATTERN = /\/video\/upload\/|\.(mp4|webm|mov)(?:$|[?#])/i;

export function isVideoPost(post: Pick<DbPost, "media_type" | "media_url" | "media_urls" | "media">): boolean {
  const mediaType = (post.media_type ?? "").trim().toLowerCase();
  if (["video", "short", "reel", "mp4", "webm", "mov", "video/mp4", "video/webm", "video/quicktime"].includes(mediaType)) return true;
  return [post.media_url, ...(post.media_urls ?? []), ...(post.media ?? [])]
    .filter((url): url is string => !!url)
    .some((url) => VIDEO_URL_PATTERN.test(url));
}

const SELECT = `
  id, user_id, title, description, media_url, media_urls, media, media_type,
  price, currency, hashtags, post_type, category_name, content_type, is_available,
  stock_quantity, quantity, delivery_type, has_free_delivery, rating, review_count, created_at,
  profiles!posts_user_id_fkey ( username, avatar_url, full_name, country, is_verified ),
  post_badges ( label, badge_type )
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

export async function fetchShoppablePosts(limit = 20, offset = 0) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(SELECT)
    .eq("is_available", true)
    .or("content_type.eq.product,content_type.eq.shoppable,post_type.eq.product,post_type.eq.shoppable")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return { data: [] as DbPost[], error: error.message };
  return { data: (data ?? []) as DbPost[], error: null as string | null };
}

/** Fetch Shorts from the server, rather than filtering an arbitrary Home page. */
export async function fetchShortsPosts(limit = 12, offset = 0) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(SELECT)
    .eq("is_available", true)
    // Keep legacy rows with a missing type in the candidate set; isVideoPost
    // verifies their actual media URL before they enter Shorts.
    .or("media_type.ilike.video,media_type.ilike.short,media_type.ilike.reel,media_type.ilike.mp4,media_type.ilike.webm,media_type.ilike.mov,media_type.is.null")
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

export async function fetchPostById(id: string) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: (data as DbPost) ?? null, error: null as string | null };
}

/** Map a DB post row → the FeedItem shape the UI components expect. */
export function postToFeedItem(p: DbPost): FeedItem {
  const mediaUrls = Array.from(new Set([
    ...(p.media_url ? [p.media_url] : []),
    ...((p.media_urls ?? []).filter(Boolean)),
    ...((p.media ?? []).filter(Boolean)),
  ]));
  const isVideo = isVideoPost(p);
  // Some existing rows keep a poster in media_url and the delivered video in
  // the media array. Shorts must select the actual Cloudinary video source.
  const firstMedia = isVideo
    ? mediaUrls.find((url) => VIDEO_URL_PATTERN.test(url)) ?? mediaUrls[0] ?? ""
    : mediaUrls[0] ?? "";
  const handle = p.profiles?.username ?? "shopitt";
  const brand = p.profiles?.full_name || handle;
  const isInspiration = getPostExperience(p) === "inspiration";
  const badge = (p.post_badges ?? [])[0] ?? null;
  const dropLabel = (badge?.label ?? "").trim() || (p.category_name ?? "").trim();

  return {
    id: p.id,
    createdAt: p.created_at,
    userId: p.user_id,
    brand,
    brandHandle: handle,
    avatar: p.profiles?.avatar_url ?? null,
    verified: p.profiles?.is_verified ?? false,
    title: p.title ?? "Untitled drop",
    drop: dropLabel,
    image: firstMedia,
    mediaUrls,
    price: Number(p.price ?? 0),
    currency: currencyLabel(p.currency) + " ",
    // Existing mobile-created posts persist `quantity`; older web posts use
    // stock_quantity. Read the established field first without inventing a
    // replacement column, and preserve a real zero.
    stockLeft: Number.isFinite(Number(p.quantity ?? p.stock_quantity)) ? Number(p.quantity ?? p.stock_quantity) : 0,
    freeDelivery: !!p.has_free_delivery,
    category: isInspiration ? "Inspiration" : "Fashion",
    likes: 0,
    sold: 0,
    location: p.profiles?.country ?? "",
    shipsIn: p.delivery_type ?? "—",
    caption: p.description ?? "",
    hashtags: p.hashtags ?? [],
    comments: 0,
    kind: isInspiration ? undefined : "product",
    deliveryType:
      p.delivery_type === "international" || p.delivery_type === "country" || p.delivery_type === "local"
        ? (p.delivery_type as FeedItem["deliveryType"])
        : undefined,
    postType: isInspiration ? "inspiration" : "product",
    badge: isInspiration ? "Inspiration" : (dropLabel ? undefined : "Product"),
    mediaType: isVideo ? "video" : "image",
  };
}
