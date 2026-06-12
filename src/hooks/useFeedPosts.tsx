import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeedPosts, postToFeedItem } from "@/services/postsService";
import type { FeedItem } from "@/data/feed";

const PAGE_SIZE = 12;

/**
 * Paginated feed loader against public.posts on the external Supabase project.
 * Falls back gracefully: caller can show mock data when items.length === 0 and
 * loading is false (e.g. before any real posts exist in the demo backend).
 */
export function useFeedPosts() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const inflight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inflight.current || !hasMore) return;
    inflight.current = true;
    setLoading(true);
    const { data, error } = await fetchFeedPosts(PAGE_SIZE, offsetRef.current);
    if (error) setError(error);
    if (data.length < PAGE_SIZE) setHasMore(false);
    offsetRef.current += data.length;
    setItems((prev) => [...prev, ...data.map(postToFeedItem)]);
    setLoading(false);
    inflight.current = false;
  }, [hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading, error, hasMore, loadMore };
}
