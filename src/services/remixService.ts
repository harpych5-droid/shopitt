import { supabase } from "@/lib/supabase";
import { postToFeedItem, type DbPost } from "@/services/postsService";

export async function fetchRemixCounts(postIds: string[]) {
  const counts = new Map<string, number>();
  if (!postIds.length) return counts;
  const { data } = await (supabase as any)
    .from("posts")
    .select("remixed_from_post_id")
    .in("remixed_from_post_id", postIds)
    .eq("is_available", true);
  for (const row of data ?? []) {
    if (row.remixed_from_post_id) counts.set(row.remixed_from_post_id, (counts.get(row.remixed_from_post_id) ?? 0) + 1);
  }
  return counts;
}

export async function createRemixNotification(originalPostId: string, actorId: string, message: string) {
  const { data: original } = await (supabase as any)
    .from("posts")
    .select("user_id")
    .eq("id", originalPostId)
    .maybeSingle();
  if (!original?.user_id || original.user_id === actorId) return { error: null };
  const { error } = await (supabase as any).from("notifications").insert({
    user_id: original.user_id,
    actor_id: actorId,
    type: "remix",
    title: "New Remix",
    body: message,
    message,
    post_id: originalPostId,
    is_read: false,
  });
  return { error: error?.message ?? null };
}

export async function fetchRemixPosts(postId: string, limit = 6) {
  const { data, error } = await (supabase as any)
    .from("posts")
    .select(`
      id, user_id, title, description, media_url, media_urls, media, media_type,
      price, currency, hashtags, post_type, category_name, content_type,
      remixed_from_post_id, is_available, stock_quantity, quantity,
      delivery_type, has_free_delivery, rating, review_count, created_at,
      profiles!posts_user_id_fkey ( username, avatar_url, full_name, country, is_verified ),
      post_badges ( label, badge_type )
    `)
    .eq("remixed_from_post_id", postId)
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: ((data ?? []) as DbPost[]).map(postToFeedItem), error: error?.message ?? null };
}