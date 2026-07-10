import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// LIKES  (public.post_likes)
// ---------------------------------------------------------------------------

export async function likePost(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });
  return { error: error?.message ?? null };
}

export async function unlikePost(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function fetchMyLikedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.post_id);
}

export async function fetchLikeCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// SAVES  (public.saved_items + public.collections)
// ---------------------------------------------------------------------------

export async function savePost(postId: string, userId: string) {
  const { error } = await supabase
    .from("saved_items")
    .insert({ post_id: postId, user_id: userId });
  return { error: error?.message ?? null };
}

export async function unsavePost(postId: string, userId: string) {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function fetchMySavedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("post_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((r: any) => r.post_id);
}

export type CollectionRow = {
  id: string;
  name: string;
  is_default: boolean;
  image_url: string | null;
};

export async function fetchCollections(userId: string): Promise<CollectionRow[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, is_default, image_url")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as CollectionRow[];
}

export async function ensureDefaultCollection(userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name: "All Saves", is_default: true })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return created?.id ?? null;
}

export async function createCollection(userId: string, name: string) {
  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: userId, name, is_default: false })
    .select("id, name, is_default, image_url")
    .maybeSingle();
  return { data: data as CollectionRow | null, error: error?.message ?? null };
}

export async function deleteCollection(collectionId: string) {
  const { error } = await supabase.from("collections").delete().eq("id", collectionId);
  return { error: error?.message ?? null };
}

export async function fetchPostMemberships(userId: string) {
  // returns map postId -> Set(collectionId)
  const { data, error } = await supabase
    .from("collection_items")
    .select("post_id, collection_id, collections!inner(user_id)")
    .eq("collections.user_id", userId);
  if (error) return new Map<string, Set<string>>();
  const map = new Map<string, Set<string>>();
  (data ?? []).forEach((r: any) => {
    const cur = map.get(r.post_id) ?? new Set<string>();
    cur.add(r.collection_id);
    map.set(r.post_id, cur);
  });
  return map;
}

export async function togglePostInCollection(
  collectionId: string,
  postId: string,
  isMember: boolean,
) {
  if (isMember) {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("post_id", postId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase
    .from("collection_items")
    .insert({ collection_id: collectionId, post_id: postId });
  return { error: error?.message ?? null };
}

export async function fetchCollectionPosts(collectionId: string) {
  const { data, error } = await supabase
    .from("collection_items")
    .select(
      `post_id, added_at,
       posts!inner ( id, title, price, currency, media_url, media_type, user_id )`,
    )
    .eq("collection_id", collectionId)
    .order("added_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => r.posts);
}

// ---------------------------------------------------------------------------
// COMMENTS  (public.post_comments)
// ---------------------------------------------------------------------------

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
};

export async function fetchComments(postId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      `id, post_id, user_id, text, parent_comment_id, created_at,
       profiles!post_comments_user_id_fkey ( username, avatar_url )`,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as CommentRow[];
}

export async function addComment(
  postId: string,
  userId: string,
  text: string,
  parentId: string | null = null,
) {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: userId, text, parent_comment_id: parentId })
    .select(
      `id, post_id, user_id, text, parent_comment_id, created_at,
       profiles!post_comments_user_id_fkey ( username, avatar_url )`,
    )
    .maybeSingle();
  return { data: data as unknown as CommentRow | null, error: error?.message ?? null };
}

export async function deleteComment(commentId: string, userId: string) {
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function fetchCommentCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// FOLLOWERS  (public.followers)
// ---------------------------------------------------------------------------

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("followers")
    .insert({ follower_id: followerId, following_id: followingId });
  return { error: error?.message ?? null };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  return { error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS  (public.notifications)
// ---------------------------------------------------------------------------

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string | null;
  title: string | null;
  body: string | null;
  message: string | null;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean | null;
  created_at: string;
  actor?: { username: string | null; avatar_url: string | null } | null;
};

export async function fetchNotifications(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, user_id, actor_id, type, title, body, message, post_id, comment_id, is_read, created_at,
       actor:profiles!notifications_actor_id_fkey ( username, avatar_url )`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    const { data: fallback } = await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, title, body, message, post_id, comment_id, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    return (fallback ?? []) as NotificationRow[];
  }
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
  return { error: error?.message ?? null };
}

export async function markNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { error: error?.message ?? null };
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}
