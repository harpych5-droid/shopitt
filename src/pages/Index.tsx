import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/feed/TopNav";
import { CategoryTabs } from "@/components/feed/CategoryTabs";
import { HomeFeedCard } from "@/components/feed/HomeFeedCard";
import { FloatingBag } from "@/components/feed/FloatingBag";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { SaveSheet } from "@/components/feed/SaveSheet";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED, CATEGORY_MAP, type FeedItem } from "@/data/feed";
import { shopitt } from "@/store/useShopittStore";

const PAGE_SIZE = 6;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const Index = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const [navHidden, setNavHidden] = useState(false);
  const [category, setCategory] = useState<string>("All");
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [saveSheetPostId, setSaveSheetPostId] = useState<string | null>(null);

  const baseItems = useMemo(() => {
    const allowed = CATEGORY_MAP[category];
    if (!allowed) return FEED;
    return FEED.filter((f) => allowed.includes(f.category));
  }, [category]);

  const items = useMemo<FeedItem[]>(() => {
    if (baseItems.length === 0) return [];
    const out: FeedItem[] = [];
    for (let p = 0; p < page; p++) {
      const round = p === 0 ? baseItems : shuffle(baseItems);
      round.forEach((it, idx) =>
        out.push({ ...it, id: `${it.id}__${p}_${idx}` })
      );
      if (out.length >= page * PAGE_SIZE) break;
    }
    return out;
  }, [baseItems, page]);

  // Reset paging on category change
  useEffect(() => {
    setPage(1);
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "auto" });
  }, [category]);

  // Hide nav on scroll-down
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

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPage((p) => p + 1);
      },
      { root, rootMargin: "800px 0px", threshold: 0 }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [baseItems.length]);

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

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <TopNav hidden={navHidden} />
      <CategoryTabs active={category} onChange={setCategory} hidden={navHidden} />

      <h1 className="sr-only">Shopitt — Discover drops, shop instantly</h1>

      <div
        ref={scrollRef}
        className="h-[100dvh] w-full overflow-y-auto no-scrollbar"
      >
        {/* Spacer for fixed top nav (54px) + category tabs (~48px) */}
        <div className="h-[108px]" />
        <div className="max-w-md mx-auto pb-28">
          {items.map((item, i) => (
            <HomeFeedCard
              key={item.id}
              item={item}
              index={i}
              onAuthRequired={handleAuthRequired}
              onOpenSaveSheet={(id) => setSaveSheetPostId(id)}
            />
          ))}
          {items.length === 0 && (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No drops in this category yet.
            </div>
          )}
          {items.length > 0 && (
            <div ref={sentinelRef} className="flex items-center justify-center py-10">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse-soft" />
                <span className="h-2 w-2 rounded-full bg-brand-purple animate-pulse-soft [animation-delay:120ms]" />
                <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse-soft [animation-delay:240ms]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <FloatingBag onClick={() => setBagOpen(true)} bottomOffset={84} side="left" />
      <BottomNav hidden={navHidden} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
    </main>
  );
};

export default Index;
