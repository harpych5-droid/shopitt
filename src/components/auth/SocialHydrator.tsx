import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { shopitt } from "@/store/useShopittStore";
import { fetchMyLikedPostIds, fetchMySavedPostIds } from "@/services/socialService";

/**
 * Hydrates the shopitt store's liked/saved sets from the DB
 * whenever the authenticated user changes.
 */
export const SocialHydrator = () => {
  const { user, isAuthed } = useIdentity();

  useEffect(() => {
    if (!isAuthed || !user) {
      shopitt.hydrateLiked([]);
      shopitt.hydrateSaved([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const [likes, saves] = await Promise.all([
        fetchMyLikedPostIds(user.id),
        fetchMySavedPostIds(user.id),
      ]);
      if (cancelled) return;
      shopitt.hydrateLiked(likes);
      shopitt.hydrateSaved(saves);
    })();

    // Realtime: keep in sync
    const channel = supabase
      .channel(`me-social-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const ids = await fetchMyLikedPostIds(user.id);
          shopitt.hydrateLiked(ids);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_items",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const ids = await fetchMySavedPostIds(user.id);
          shopitt.hydrateSaved(ids);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAuthed, user]);

  return null;
};
