import { useEffect, useState } from "react";
import { FeedCard } from "@/components/feed/FeedCard";
import { FloatingBag } from "@/components/feed/FloatingBag";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED, type FeedItem } from "@/data/feed";
import { shopitt } from "@/store/useShopittStore";
import { fetchFeedPosts, postToFeedItem } from "@/services/postsService";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

const Shorts = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[] | null>(null);

  useEffect(() => {
    document.title = "Vylogue Shorts — Vertical Drops";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await fetchFeedPosts(40, 0);
      if (cancelled) return;
      const videos = (data ?? [])
        .map(postToFeedItem)
        .filter((it) => it.mediaType === "video" && it.image);
      if (videos.length > 0) {
        setItems(videos);
      } else {
        // Fallback: show all posts so Shorts is never empty for the demo
        setItems(FEED);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

      <h1 className="sr-only">Vylogue Shorts</h1>

      {items === null ? (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      ) : (
        <div className="feed-snap h-full w-full overflow-y-auto no-scrollbar">
          {items.map((item, i) => (
            <FeedCard
              key={item.id}
              item={item}
              index={i}
              onAuthRequired={handleAuthRequired}
            />
          ))}
        </div>
      )}

      <FloatingBag onClick={() => setBagOpen(true)} bottomOffset={88} side="right" />
      <BottomNav />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
    </main>
  );
};

export default Shorts;
