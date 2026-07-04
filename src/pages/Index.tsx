import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/feed/TopNav";
import { CategoryTabs } from "@/components/feed/CategoryTabs";
import { HomeFeedCard } from "@/components/feed/HomeFeedCard";
import { FloatingBag } from "@/components/feed/FloatingBag";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { SaveSheet } from "@/components/feed/SaveSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { BottomNav } from "@/components/feed/BottomNav";
import { CATEGORY_MAP, type FeedItem } from "@/data/feed";
import { shopitt } from "@/store/useShopittStore";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const [navHidden, setNavHidden] = useState(false);
  const [category, setCategory] = useState<string>("All");
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [saveSheetPostId, setSaveSheetPostId] = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const { items: dbItems, loading, hasMore, loadMore } = useFeedPosts();

  const items = useMemo<FeedItem[]>(() => {
    const allowed = CATEGORY_MAP[category];
    if (!allowed) return dbItems;
    return dbItems.filter((f) => allowed.includes(f.category));
  }, [dbItems, category]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "auto" });
  }, [category]);

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
    document.title = "Vylogue — Shop Drops You Crave";
    const desc = "Vylogue is the social commerce feed for drops you crave. Discover, like, save and buy in one tap.";
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

  const isEmpty = !loading && items.length === 0;

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <TopNav hidden={navHidden} />
      <CategoryTabs active={category} onChange={setCategory} hidden={navHidden} />

      <h1 className="sr-only">Vylogue — Discover drops, shop instantly</h1>

      <div ref={scrollRef} className="h-[100dvh] w-full overflow-y-auto no-scrollbar">
        <div className="h-[108px]" />
        <div className="max-w-md mx-auto pb-28">
          {items.map((item, i) => (
            <HomeFeedCard
              key={item.id}
              item={item}
              index={i}
              onAuthRequired={handleAuthRequired}
              onOpenSaveSheet={(id) => setSaveSheetPostId(id)}
              onOpenComments={(id) => setCommentsPostId(id)}
            />
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
          {!hasMore && items.length > 0 && (
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
