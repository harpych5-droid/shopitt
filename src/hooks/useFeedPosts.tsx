import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeedPosts, postToFeedItem } from "@/services/postsService";
import type { FeedItem } from "@/data/feed";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 12;

/**
 * Paginated feed loader against public.posts on the external Supabase project.
 * - Infinite scroll: keeps fetching pages until the server returns < PAGE_SIZE.
 * - Realtime: prepends new posts inserted anywhere in the app.
 */
export function useFeedPosts(initialCount = PAGE_SIZE) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const inflight = useRef(false);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (inflight.current || !hasMoreRef.current) return;
    inflight.current = true;
    setLoading(true);
    const limit = offsetRef.current === 0 ? Math.max(PAGE_SIZE, initialCount) : PAGE_SIZE;
    const { data, error } = await fetchFeedPosts(limit, offsetRef.current);
    if (error) setError(error);
    if (data.length < limit) {
      hasMoreRef.current = false;
      setHasMore(false);
    }
    offsetRef.current += data.length;
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const fresh = data.map(postToFeedItem).filter((p) => !seen.has(p.id));
      return [...prev, ...fresh];
    });
    setLoading(false);
    inflight.current = false;
  }, [initialCount]);

  const refresh = useCallback(async () => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setItems([]);
    inflight.current = false;
    await loadMore();
  }, [loadMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: prepend newly inserted posts
  useEffect(() => {
    const channel = supabase
      .channel("feed-posts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as { id?: string; is_available?: boolean };
          if (!row?.is_available) return;
          // We need the profile join — fetch just this one enriched row
          fetchFeedPosts(1, 0).then(({ data }) => {
            const match = data.find((d) => d.id === row.id);
            if (!match) return;
          const item = postToFeedItem(match);
            setItems((prev) => {
              if (prev.some((p) => p.id === item.id)) return prev;
              window.dispatchEvent(new CustomEvent("shopitt:feed-new-post"));
              return [item, ...prev];
            });
            offsetRef.current += 1;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { items, loading, error, hasMore, loadMore, refresh };
}

