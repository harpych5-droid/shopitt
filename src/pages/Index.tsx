import { useEffect, useRef, useState } from "react";
import { TopNav } from "@/components/feed/TopNav";
import { HomeFeedCard } from "@/components/feed/HomeFeedCard";
import { CreatorsRail } from "@/components/feed/CreatorsRail";

import { FloatingBag } from "@/components/feed/FloatingBag";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { SaveSheet } from "@/components/feed/SaveSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { BottomNav } from "@/components/feed/BottomNav";
import { shopitt } from "@/store/useShopittStore";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { setPageMetadata } from "@/lib/seo";

const FEED_POSITION_KEY = "shopitt:feed-position";
type FeedPosition = { postId: string; offset: number; loadedCount: number };

const readFeedPosition = (): FeedPosition | null => {
  try {
    const value = sessionStorage.getItem(FEED_POSITION_KEY);
    return value ? JSON.parse(value) as FeedPosition : null;
  } catch { return null; }
};

const Index = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef(new Map<string, HTMLElement>());
  const restored = useRef(false);
  const savedPosition = useRef(readFeedPosition());
  const lastScroll = useRef(0);
  const pullStart = useRef<number | null>(null);
  const [navHidden, setNavHidden] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [saveSheetPostId, setSaveSheetPostId] = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const { items: dbItems, loading, hasMore, loadMore, refresh } = useFeedPosts(savedPosition.current?.loadedCount);

  const refreshFeed = async () => {
    await refresh();
    window.dispatchEvent(new CustomEvent("shopitt:feed-seen"));
  };

  useEffect(() => {
    const onRefresh = () => { void refreshFeed(); };
    window.addEventListener("shopitt:feed-refresh", onRefresh);
    return () => window.removeEventListener("shopitt:feed-refresh", onRefresh);
  });

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const active = [...ratios.entries()].reduce((best, current) => current[1] > best[1] ? current : best, ["", 0]);
      if (!active[0]) return;
      const post = postRefs.current.get(active[0]);
      if (!post) return;
      sessionStorage.setItem(FEED_POSITION_KEY, JSON.stringify({
        postId: active[0], offset: root.scrollTop - post.offsetTop, loadedCount: dbItems.length,
      }));
    }, { root, threshold: [0.25, 0.5, 0.75] });
    postRefs.current.forEach((post) => observer.observe(post));
    return () => observer.disconnect();
  }, [dbItems]);

  useEffect(() => {
    const saved = savedPosition.current;
    const root = scrollRef.current;
    const post = saved && postRefs.current.get(saved.postId);
    if (restored.current || !root || !post) return;
    restored.current = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.scrollTop = Math.max(0, post.offsetTop + saved.offset);
    }));
  }, [dbItems]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      const delta = y - lastScroll.current;
      if (Math.abs(delta) > 8) {
        setNavHidden(delta > 0 && y > 80);
        lastScroll.current = y;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) loadMore();
      },
      { root, rootMargin: "800px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    document.title = "Shopitt — Shop Drops You Crave";
    const desc = "Shopitt is the social commerce feed for drops you crave. Discover, like, save and buy in one tap.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/");
  }, []);

  const handleAuthRequired = (action: "like" | "save" | "buy" | "comment", itemId: string) => {
    shopitt.setPending({ type: action, itemId });
    setAuthAction(action);
    setAuthOpen(true);
  };

  const isEmpty = !loading && dbItems.length === 0;

  useEffect(() => {
    setPageMetadata({
      title: "Shopitt — Fashion, Culture & Discovery",
      description: "Shopitt is a social fashion platform for discovering style, culture, creativity and inspiration. Explore fashion through people, ideas, stories and the moments that make style feel alive.",
      path: "/",
    });
  }, []);

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <TopNav hidden={navHidden} />

      <h1 className="sr-only">Shopitt — Discover drops, shop instantly</h1>

      <div
        ref={scrollRef}
        className="h-[100dvh] w-full overflow-y-auto no-scrollbar"
        onTouchStart={(event) => { pullStart.current = scrollRef.current?.scrollTop === 0 ? event.touches[0]?.clientY ?? null : null; }}
        onTouchEnd={(event) => {
          const start = pullStart.current;
          pullStart.current = null;
          if (start !== null && (event.changedTouches[0]?.clientY ?? start) - start > 80 && !loading) void refreshFeed();
        }}
      >
        <div className="h-[60px]" />
        <div className="max-w-md mx-auto pb-28">
          <CreatorsRail items={dbItems} />
          {dbItems.map((item, i) => (

            <div key={item.id} id={item.id} ref={(node) => { if (node) postRefs.current.set(item.id, node); else postRefs.current.delete(item.id); }}>
              <HomeFeedCard
                item={item}
                index={i}
                onAuthRequired={handleAuthRequired}
                onOpenSaveSheet={(id) => setSaveSheetPostId(id)}
                onOpenComments={(id) => setCommentsPostId(id)}
              />
            </div>
          ))}

          {isEmpty && (
            <div className="mx-4 mt-6 rounded-3xl bg-card border border-border/60 p-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
                <Sparkles className="h-6 w-6 text-white" />
              </span>
              <h3 className="mt-3 text-base font-extrabold">No drops yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Be the first to drop something in this category.
              </p>
              <Link
                to="/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
              >
                Create a post
              </Link>
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center py-10">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse-soft" />
                <span className="h-2 w-2 rounded-full bg-brand-purple animate-pulse-soft [animation-delay:120ms]" />
                <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse-soft [animation-delay:240ms]" />
              </div>
            </div>
          )}
          {!hasMore && dbItems.length > 0 && (
            <div className="py-6 text-center text-[11px] text-muted-foreground">
              You're all caught up ✨
            </div>
          )}
        </div>
      </div>

      <FloatingBag onClick={() => setBagOpen(true)} bottomOffset={84} side="left" />
      <BottomNav hidden={navHidden} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
      <SaveSheet open={!!saveSheetPostId} postId={saveSheetPostId} onClose={() => setSaveSheetPostId(null)} />
      <CommentsSheet
        open={!!commentsPostId}
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
      />
    </main>
  );
};

export default Index;
