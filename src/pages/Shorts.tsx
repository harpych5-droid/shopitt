import { useCallback, useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed/FeedCard";
import { FloatingBag } from "@/components/feed/FloatingBag";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { BottomNav } from "@/components/feed/BottomNav";
import type { FeedItem } from "@/data/feed";
import { shopitt } from "@/store/useShopittStore";
import { fetchShortsPosts, fetchPostById, postToFeedItem } from "@/services/postsService";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { setPageMetadata } from "@/lib/seo";

const SHORTS_POSITION_KEY = "shopitt:shorts-position";
const readShortsPosition = () => {
  try { return sessionStorage.getItem(SHORTS_POSITION_KEY); } catch { return null; }
};

const Shorts = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());
  const savedShortId = useRef(readShortsPosition());
  const [searchParams] = useSearchParams();
  const selectedVideoId = searchParams.get("video");

  useEffect(() => {
    document.title = "Shopitt Shorts — Vertical Drops";
  }, []);

  useEffect(() => {
    setPageMetadata({
      title: "Fashion Shorts — Shopitt",
      description: "Discover short-form fashion culture, creativity, style and inspiration on Shopitt.",
      path: "/shorts",
    });
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || !items?.length) return;

    const visibility = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.shortIndex);
          visibility.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        const next = [...visibility.entries()].reduce(
          (best, [index, ratio]) => ratio > best.ratio ? { index, ratio } : best,
          { index: 0, ratio: 0 },
        );
        if (next.ratio > 0) setActiveIndex(next.index);
      },
      { root: feed, threshold: [0, 0.5, 0.75, 1] },
    );

    cardRefs.current.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  const persistPosition = useCallback(() => {
    const item = items?.[activeIndex];
    if (!item) return;
    try { sessionStorage.setItem(SHORTS_POSITION_KEY, item.id); } catch { /* storage is optional */ }
  }, [activeIndex, items]);

  useEffect(() => () => persistPosition(), [persistPosition]);

  useEffect(() => {
    window.addEventListener("pagehide", persistPosition);
    return () => window.removeEventListener("pagehide", persistPosition);
  }, [persistPosition]);

  useEffect(() => {
    if (!items?.length) return;
    const requestedId = selectedVideoId ?? savedShortId.current;
    if (!requestedId) return;
    const index = items.findIndex((item) => item.id === requestedId);
    if (index < 0) return;
    setActiveIndex(index);
    const card = cardRefs.current.get(index);
    const feed = feedRef.current;
    if (card && feed) feed.scrollTo({ top: card.offsetTop, behavior: "auto" });
  }, [items, selectedVideoId]);

  const loadShorts = useCallback(async () => {
    setError(null);
    setItems(null);
    // A single screen only needs a small initial window. FeedCard loads media
    // only for the active Short, preventing concurrent video downloads.
    const { data, error: requestError } = await fetchShortsPosts(12, 0);
    if (requestError) {
      setError(requestError);
      setItems([]);
      return;
    }
    let videos = data.map(postToFeedItem).filter((it) => it.image);
      // A direct link from a deeper Home item still opens that exact Short
      // without making every Shorts visit download a large feed window.
      if (selectedVideoId && !videos.some((item) => item.id === selectedVideoId)) {
        const { data: selected } = await fetchPostById(selectedVideoId);
        if (selected) {
          const item = postToFeedItem(selected);
          if (item.mediaType === "video" && item.image) videos = [item, ...videos];
        }
      }
      const selectedIndex = selectedVideoId
        ? videos.findIndex((item) => item.id === selectedVideoId)
        : -1;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setItems(videos);
  }, [selectedVideoId]);

  useEffect(() => { void loadShorts(); }, [loadShorts]);

  const handleAuthRequired = (action: "like" | "save" | "buy" | "comment", itemId: string) => {
    shopitt.setPending({ type: action, itemId });
    setAuthAction(action);
    setAuthOpen(true);
  };

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <header className="absolute top-0 inset-x-0 z-40 px-4 pt-3 flex items-center justify-between">
        <Link
          to="/"
          aria-label="Back"
          className="h-9 w-9 rounded-full glass-dark flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <span className="text-white font-bold tracking-tight">Shorts</span>
        <span className="h-9 w-9" />
      </header>

      <h1 className="sr-only">Shopitt Shorts</h1>

      {items === null ? (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      ) : error ? (
        <div className="h-full w-full px-6 flex items-center justify-center text-center">
          <div>
            <h2 className="text-lg font-extrabold text-white">Couldn't load Shorts</h2>
            <button type="button" onClick={() => void loadShorts()} className="mt-3 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white">Try again</button>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div ref={feedRef} className="feed-snap h-full w-full overflow-y-auto no-scrollbar">
          {items.map((item, i) => (
            <div
              key={item.id}
              ref={(element) => {
                if (element) cardRefs.current.set(i, element);
                else cardRefs.current.delete(i);
              }}
              data-short-index={i}
            >
              <FeedCard
                item={item}
                index={i}
                isActive={i === activeIndex}
                onAuthRequired={handleAuthRequired}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full w-full px-6 flex items-center justify-center text-center">
          <div>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-brand">
              <Play className="h-6 w-6 text-white" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold text-white">No Shorts yet</h2>
            <p className="mt-1 text-sm text-white/65">Fresh video stories will appear here as creators share them.</p>
          </div>
        </div>
      )}

      <FloatingBag onClick={() => setBagOpen(true)} bottomOffset={88} side="left" />
      <BottomNav />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
    </main>
  );
};

export default Shorts;
