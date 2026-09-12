import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import {
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  fetchLikeCount,
  fetchCommentCount,
  fetchCommentPreview,
  type CommentRow,
} from "@/services/socialService";

/**
 * Real-backend hook for per-post social state.
 * - liked/saved come from shopitt store (hydrated on sign-in) with optimistic updates.
 * - counts are live via Realtime subscriptions.
 */
export function usePostSocial(postId: string, initialLikes = 0, initialComments = 0) {
  const { user, isAuthed } = useIdentity();
  const liked = useShopitt((s) => s.liked.has(postId));
  const saved = useShopitt((s) => s.saved.has(postId));

  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [commentPreview, setCommentPreview] = useState<CommentRow[]>([]);

  const refresh = useCallback(async () => {
    const [l, c, preview] = await Promise.all([
      fetchLikeCount(postId),
      fetchCommentCount(postId),
      fetchCommentPreview(postId),
    ]);
    setLikeCount(l);
    setCommentCount(c);
    setCommentPreview(preview);
  }, [postId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: like & comment count updates
  useEffect(() => {
    const channel = supabase
      .channel(`post-social-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes", filter: `post_id=eq.${postId}` },
        () => fetchLikeCount(postId).then(setLikeCount),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => Promise.all([fetchCommentCount(postId), fetchCommentPreview(postId)]).then(([count, preview]) => {
          setCommentCount(count);
          setCommentPreview(preview);
        }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (!isAuthed || !user) return false;
    const nowLiked = !liked;
    shopitt.toggleLike(postId);
    setLikeCount((c) => c + (nowLiked ? 1 : -1));
    const { error } = nowLiked
      ? await likePost(postId, user.id)
      : await unlikePost(postId, user.id);
    if (error) {
      // rollback
      shopitt.toggleLike(postId);
      setLikeCount((c) => c + (nowLiked ? -1 : 1));
      return false;
    }
    return true;
  }, [isAuthed, user, liked, postId]);

  const toggleSave = useCallback(async () => {
    if (!isAuthed || !user) return false;
    const nowSaved = !saved;
    shopitt.quickToggleSave(postId);
    const { error } = nowSaved
      ? await savePost(postId, user.id)
      : await unsavePost(postId, user.id);
    if (error) {
      shopitt.quickToggleSave(postId);
      return false;
    }
    return true;
  }, [isAuthed, user, saved, postId]);

  return { liked, saved, likeCount, commentCount, commentPreview, toggleLike, toggleSave, refresh };
}
