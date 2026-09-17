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
  profiles: { username: string | null; avatar_url: string | null; is_verified: boolean | null } | null;
};

export async function fetchComments(postId: string): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      `id, post_id, user_id, text, parent_comment_id, created_at,
      profiles!post_comments_user_id_fkey ( username, avatar_url, is_verified )`,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as CommentRow[];
}

export async function fetchCommentPreview(postId: string, limit = 3): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      `id, post_id, user_id, text, parent_comment_id, created_at,
       profiles!post_comments_user_id_fkey ( username, avatar_url, is_verified )`,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as unknown as CommentRow[])
    .filter((comment) => comment.text.trim().length > 0)
    .reverse();
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
      profiles!post_comments_user_id_fkey ( username, avatar_url, is_verified )`,
    )
    .maybeSingle();
  const comment = data as unknown as CommentRow | null;
  if (!error && comment) void notifyMentionedUsers(text, userId, comment.id, postId);
  return { data: comment, error: error?.message ?? null };
}

async function notifyMentionedUsers(text: string, actorId: string, commentId: string, postId: string) {
  const handles = Array.from(new Set(Array.from(text.matchAll(/@([a-zA-Z0-9_]{2,24})/g), (match) => match[1])));
  if (!handles.length) return;
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("username", handles);
  const rows = (profiles ?? []).filter((profile) => profile.id !== actorId).map((profile) => ({
    user_id: profile.id,
    actor_id: actorId,
    type: "mention",
    title: "You were mentioned in Conversation",
    body: `@${profile.username ?? "shopper"} was mentioned in a Shopitt Look conversation.`,
    message: text.slice(0, 160),
    post_id: postId,
    comment_id: commentId,
    is_read: false,
  }));
  if (rows.length) await supabase.from("notifications").insert(rows);
}

export async function deleteComment(commentId: string, userId: string) {
  const { error } = await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();
  const result = existing
    ? await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId)
    : await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  return { liked: !existing, error: result.error?.message ?? null };
}

export async function fetchCommentLikeCounts(commentIds: string[]) {
  const counts = new Map<string, number>();
  if (!commentIds.length) return counts;
  const { data } = await supabase.from("comment_likes").select("comment_id").in("comment_id", commentIds);
  for (const row of data ?? []) counts.set(row.comment_id, (counts.get(row.comment_id) ?? 0) + 1);
  return counts;
}

export async function fetchCommentCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

/** Fetch visible comment counts for a small feed window in one request. */
export async function fetchCommentCounts(postIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (postIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds);
  if (error) return counts;

  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }
  return counts;
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
  order_id: string | null;
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
      `id, user_id, actor_id, type, title, body, message, post_id, comment_id, order_id, is_read, created_at,
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
