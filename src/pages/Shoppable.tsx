import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, SearchX } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { TopNav } from "@/components/feed/TopNav";
import { fetchShoppablePosts, postToFeedItem } from "@/services/postsService";
import { setPageMetadata } from "@/lib/seo";
import { optimizedImageUrl } from "@/lib/media";
import type { FeedItem } from "@/data/feed";

const PAGE_SIZE = 12;

const Shoppable = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadMore = async (reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    const currentOffset = reset ? 0 : offsetRef.current;
    const limit = PAGE_SIZE;
    const { data, error: queryError } = await fetchShoppablePosts(limit, currentOffset);
    if (queryError) {
      setError(queryError);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map(postToFeedItem);
    setItems((prev) => reset ? mapped : [...prev, ...mapped.filter((item) => !prev.some((prevItem) => prevItem.id === item.id))]);
    offsetRef.current = reset ? mapped.length : currentOffset + mapped.length;
    setHasMore(mapped.length === limit);
    setLoading(false);
    setRefreshing(false);
    setError(null);
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadMore(true);
  };

  useEffect(() => {
    void loadMore(true);
  }, []);

  useEffect(() => {
    document.title = "Shoppable — Shopitt";
    setPageMetadata({
      title: "Shoppable — Shopitt",
      description: "Discover shoppable fashion content from real creators and drops on Shopitt.",
      path: "/shoppable",
    });
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || loading || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { root, rootMargin: "800px 0px", threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const isEmpty = !loading && items.length === 0;

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <TopNav />
      <div className="h-[60px]" />

      <div ref={scrollRef} className="mx-auto max-w-2xl px-4 pb-8">
        <header className="pt-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-pink">Shoppable</p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Fashion that can be bought.</h1>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
              aria-label="Refresh shoppable feed"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">
            Could not load shoppable posts right now. <button type="button" onClick={() => void refresh()} className="font-bold text-brand-pink">Try again</button>
          </div>
        )}

        {isEmpty ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-pink/10 text-brand-pink">
              <SearchX className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-extrabold">Nothing to shop yet.</h2>
            <p className="mt-2 text-sm text-muted-foreground">New shoppable drops will appear here when creators publish with the shoppable post type.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
                <Link to={`/u/${item.brandHandle}`} className="flex items-center gap-3 p-4">
                  <img
                    src={optimizedImageUrl(item.avatar ?? "", 96)}
                    alt={item.brandHandle}
                    className="h-10 w-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.brandHandle}</p>
                    <p className="text-[11px] text-muted-foreground">{item.location || "Shopitt creator"}</p>
                  </div>
                  <span className="rounded-full bg-brand-pink/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-pink">
                    Shoppable
                  </span>
                </Link>

                <Link to={`/p/${item.id}`} className="block">
                  <img
                    src={optimizedImageUrl(item.image, 900)}
                    alt={item.title}
                    loading="lazy"
                    className="block h-[420px] w-full object-cover"
                  />
                </Link>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.drop || "Drop"}</p>
                      <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">{item.title}</h2>
                    </div>
                    <span className="text-right font-display text-xl font-black tracking-tight">
                      {item.currency}
                      {item.price || 0}
                    </span>
                  </div>

                  {item.caption && <p className="text-sm text-foreground/90">{item.caption}</p>}

                  <div className="flex flex-wrap gap-2">
                    {item.hashtags.slice(0, 4).map((tag) => (
                      <span key={`${item.id}-${tag}`} className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-brand-pink">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link to={`/p/${item.id}`} className="inline-flex flex-1 items-center justify-center rounded-full gradient-brand px-4 py-2.5 text-sm font-bold text-white shadow-brand">
                      View drop
                    </Link>
                    <Link to={`/p/${item.id}`} className="inline-flex items-center justify-center rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground">
                      <Sparkles className="mr-1.5 h-4 w-4 text-brand-pink" />
                      Shop
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasMore && !isEmpty && (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-brand-purple animate-pulse [animation-delay:120ms]" />
              <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Shoppable;
