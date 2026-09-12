import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeedPosts, postToFeedItem } from "@/services/postsService";
import type { FeedItem } from "@/data/feed";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 12;

export function mergeFeedItems(current: FeedItem[], incoming: FeedItem[]) {
  const seen = new Set(current.map((item) => item.id));
  const fresh = incoming.filter((item) => !seen.has(item.id));
  return [...current, ...fresh];
}

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
  const itemsRef = useRef<FeedItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loadMore = useCallback(async () => {
    if (inflight.current || !hasMoreRef.current) return;
    inflight.current = true;
    setLoading(true);
    const limit = offsetRef.current === 0 ? Math.max(PAGE_SIZE, initialCount) : PAGE_SIZE;
    const { data, error } = await fetchFeedPosts(limit, offsetRef.current);
    if (error) {
      setError(error);
      setLoading(false);
      inflight.current = false;
      return;
    }
    if (data.length < limit) {
      hasMoreRef.current = false;
      setHasMore(false);
    }

    const mapped = data.map(postToFeedItem);
    offsetRef.current += mapped.length;
    setItems((prev) => mergeFeedItems(prev, mapped));
    setLoading(false);
    inflight.current = false;
  }, [initialCount]);

  const refresh = useCallback(async () => {
    // Keep the current feed painted while Supabase revalidates it. Re-fetching
    // the loaded window also removes posts deleted since the last visit.
    if (inflight.current) return false;
    inflight.current = true;
    setLoading(true);
    setError(null);

    const limit = Math.max(PAGE_SIZE, itemsRef.current.length, initialCount);
    const { data, error } = await fetchFeedPosts(limit, 0);
    if (error) {
      setError(error);
      setLoading(false);
      inflight.current = false;
      return false;
    }

    const fresh = data.map(postToFeedItem);
    setItems((prev) => mergeFeedItems(prev, fresh));
    offsetRef.current = Math.max(itemsRef.current.length, fresh.length);
    const nextHasMore = data.length === limit;
    hasMoreRef.current = nextHasMore;
    setHasMore(nextHasMore);
    setLoading(false);
    inflight.current = false;
    return true;
  }, [initialCount]);

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

