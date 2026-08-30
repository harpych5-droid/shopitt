import { useCallback, useEffect, useRef, useState } from "react";
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
const HOME_INTENT_KEY = "shopitt:feed-home-intent";
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
  const restoring = useRef(false);
  const savedPosition = useRef(readFeedPosition());
  const lastScroll = useRef(0);
  const scrollTicking = useRef(false);
  const pullStart = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [saveSheetPostId, setSaveSheetPostId] = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const { items: dbItems, loading, error, hasMore, loadMore, refresh } = useFeedPosts(savedPosition.current?.loadedCount);

  const persistFeedPosition = useCallback(() => {
    const root = scrollRef.current;
    if (!root || restoring.current) return;
    let anchor: HTMLElement | null = null;
    postRefs.current.forEach((node) => {
      if (node.offsetTop <= root.scrollTop + 2 && (!anchor || node.offsetTop > anchor.offsetTop)) anchor = node;
    });
    if (!anchor) return;
    sessionStorage.setItem(FEED_POSITION_KEY, JSON.stringify({
      postId: anchor.id,
      offset: root.scrollTop - anchor.offsetTop,
      loadedCount: dbItems.length,
    }));
  }, [dbItems.length]);

  const refreshFeed = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    const succeeded = await refresh();
    if (succeeded) window.dispatchEvent(new CustomEvent("shopitt:feed-seen"));
    setRefreshing(false);
  }, [refresh, refreshing]);

  useEffect(() => {
    const onHomeTap = () => {
      const root = scrollRef.current;
      if (root) root.scrollTo({ top: 0, behavior: "smooth" });
      void refreshFeed();
    };
    window.addEventListener("shopitt:feed-home-tap", onHomeTap);
    window.addEventListener("shopitt:feed-refresh", refreshFeed);
    return () => {
      window.removeEventListener("shopitt:feed-home-tap", onHomeTap);
      window.removeEventListener("shopitt:feed-refresh", refreshFeed);
    };
  }, [refreshFeed]);

  useEffect(() => {
    if (sessionStorage.getItem(HOME_INTENT_KEY) !== "true") return;
    sessionStorage.removeItem(HOME_INTENT_KEY);
    restored.current = true;
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
    void refreshFeed();
    // This only handles a deliberate Home navigation, never browser Back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const active = [...ratios.entries()].reduce((best, current) => current[1] > best[1] ? current : best, ["", 0]);
      if (!active[0] || restoring.current) return;
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
    restoring.current = true;
    let frame = 0;
    let attempts = 0;

    // A mobile browser can lay out images after the feed data has arrived.
    // Retry only while layout is changing; ResizeObserver replaces an
    // arbitrary timeout and prevents a permanently clamped restoration.
    const restore = () => {
      const latestPost = postRefs.current.get(saved.postId);
      if (!latestPost) return;
      const nextTarget = Math.max(0, latestPost.offsetTop + saved.offset);
      root.scrollTop = nextTarget;
      attempts += 1;
      if (Math.abs(root.scrollTop - nextTarget) < 2 || attempts >= 12) {
        restored.current = true;
        restoring.current = false;
      }
    };
    const scheduleRestore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    };
    const resizeObserver = new ResizeObserver(scheduleRestore);
    resizeObserver.observe(root);
    // Images above the saved post can change its offset without changing the
    // scroll container's own box, so watch the rendered feed rows as well.
    postRefs.current.forEach((node) => resizeObserver.observe(node));
    scheduleRestore();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [dbItems]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const y = el.scrollTop;
        const delta = y - lastScroll.current;
        if (Math.abs(delta) > 8) {
          setNavHidden(delta > 0 && y > 80);
          lastScroll.current = y;
        }
        scrollTicking.current = false;
      });
      persistFeedPosition();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [persistFeedPosition]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || loading || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { root, rootMargin: "800px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, loading, loadMore]);

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

  useEffect(() => () => persistFeedPosition(), [persistFeedPosition]);

  useEffect(() => {
    // iOS can freeze a page into the back-forward cache before React's route
    // cleanup runs. Persist the internal scroller at that lifecycle boundary.
    window.addEventListener("pagehide", persistFeedPosition);
    return () => window.removeEventListener("pagehide", persistFeedPosition);
  }, [persistFeedPosition]);

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <TopNav hidden={navHidden} />

      <h1 className="sr-only">Shopitt — Discover drops, shop instantly</h1>

      <div
        ref={scrollRef}
        className="h-[100dvh] w-full overflow-y-auto no-scrollbar"
        aria-busy={refreshing}
        onTouchStart={(event) => { pullStart.current = scrollRef.current?.scrollTop === 0 ? event.touches[0]?.clientY ?? null : null; }}
        onTouchMove={(event) => {
          const start = pullStart.current;
          if (start === null) return;
          setPullDistance(Math.max(0, Math.min(88, (event.touches[0]?.clientY ?? start) - start)));
        }}
        onTouchEnd={(event) => {
          const start = pullStart.current;
          pullStart.current = null;
          const pulledFarEnough = start !== null && (event.changedTouches[0]?.clientY ?? start) - start > 80;
          setPullDistance(0);
          if (pulledFarEnough && !refreshing) void refreshFeed();
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center transition-transform duration-200"
          style={{ transform: `translateY(${refreshing ? 48 : pullDistance * 0.65}px)` }}
          role="status"
          aria-live="polite"
        >
          {(refreshing || pullDistance > 0) && (
            <span className="rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm ring-1 ring-border/60">
              {refreshing ? "Refreshing feed…" : pullDistance >= 80 ? "Release to refresh" : "Pull to refresh"}
            </span>
          )}
        </div>
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
            <div ref={sentinelRef} className="flex items-center justify-center py-10 pb-32">
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
          {error && dbItems.length > 0 && (
            <div className="mx-4 mb-4 rounded-2xl border border-border/60 bg-card px-4 py-3 text-center text-xs text-muted-foreground">
              Couldn't refresh right now. <button type="button" onClick={() => void refreshFeed()} className="font-bold text-brand-pink">Try again</button>
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
