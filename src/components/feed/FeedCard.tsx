import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Bookmark, MessageCircle, Share2, Truck, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { FeedItem } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";

interface FeedCardProps {
  item: FeedItem;
  index: number;
  onAuthRequired: (action: "like" | "save" | "buy" | "comment", itemId: string) => void;
}

// Persist mute state across cards/sessions
const MUTE_KEY = "shopitt:reels:muted";
const getStoredMute = () => {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(MUTE_KEY);
  return v === null ? true : v === "1";
};
const muteListeners = new Set<(m: boolean) => void>();
const useReelMute = () => {
  const [muted, setMuted] = useState<boolean>(getStoredMute);
  useEffect(() => {
    const fn = (m: boolean) => setMuted(m);
    muteListeners.add(fn);
    return () => { muteListeners.delete(fn); };
  }, []);
  const toggle = useCallback(() => {
    const next = !getStoredMute();
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    muteListeners.forEach((l) => l(next));
  }, []);
  return { muted, toggle };
};

export const FeedCard = ({ item, index, onAuthRequired }: FeedCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [burst, setBurst] = useState(false);
  const [dtBurst, setDtBurst] = useState(false);
  const liked = useShopitt((s) => s.liked.has(item.id));
  const saved = useShopitt((s) => s.saved.has(item.id));
  const authed = useShopitt((s) => s.authed);
  const { muted, toggle: toggleMute } = useReelMute();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    if (item.mediaType === "video") { setLoaded(true); return; }
    const img = new Image();
    img.src = item.image;
    img.onload = () => setLoaded(true);
  }, [item.image, item.mediaType]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const guard = (action: "like" | "save" | "buy" | "comment", run: () => void) => {
    if (!authed) { onAuthRequired(action, item.id); return; }
    run();
  };

  const handleLike = () =>
    guard("like", () => {
      shopitt.toggleLike(item.id);
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    });

  const handleSave = () => guard("save", () => shopitt.toggleSave(item.id));
  const handleBuy = () => guard("buy", () => shopitt.addToBag(item));
  const handleComment = () => guard("comment", () => {});

  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      guard("like", () => {
        if (!liked) shopitt.toggleLike(item.id);
        setDtBurst(true);
        setTimeout(() => setDtBurst(false), 700);
      });
      return;
    }
    lastTap.current = now;
  };

  return (
    <article className="feed-item relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* MEDIA */}
      <div className="absolute inset-0" onClick={handleMediaTap}>
        {!loaded && (
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background:
                "linear-gradient(90deg, hsl(0 0% 8%) 0%, hsl(0 0% 14%) 50%, hsl(0 0% 8%) 100%)",
              backgroundSize: "1000px 100%",
            }}
          />
        )}
        {item.mediaType === "video" ? (
          <video
            ref={videoRef}
            src={item.image}
            className="h-full w-full object-cover"
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={item.image}
            alt={item.title}
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        {/* Top + bottom gradient overlays for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 overlay-top" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] overlay-bottom" />

        <AnimatePresence>
          {dtBurst && (
            <motion.div
              key="reel-dt"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              <Heart className="h-28 w-28 fill-brand-pink text-brand-pink drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MUTE TOGGLE — only for videos */}
      {item.mediaType === "video" && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute top-[max(env(safe-area-inset-top,0px)+56px,60px)] right-4 z-30 h-10 w-10 rounded-full glass-dark flex items-center justify-center active:scale-90 transition-transform"
        >
          {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </button>
      )}

      {/* DROP TITLE — TOP-SAFE area, glassmorphism, never blocks subject */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-[max(env(safe-area-inset-top,0px)+12px,16px)] left-4 z-10 max-w-[60%]"
      >
        <div className="glass-dark rounded-full px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-xl bg-black/30 border border-white/10">
          <Sparkles className="h-3.5 w-3.5 text-brand-pink shrink-0" />
          <span className="text-xs font-semibold tracking-wide text-white/90 truncate">
            {item.drop}
          </span>
        </div>
      </motion.div>

      {/* STOCK PILL — TOP RIGHT, safe spacing */}
      {item.stockLeft <= 10 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute top-[max(env(safe-area-inset-top,0px)+12px,16px)] right-4 z-10"
        >
          <div className="rounded-full bg-warning/95 px-3 py-1 flex items-center gap-1.5 shadow-soft animate-pulse-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="text-xs font-bold text-black">
              Only {item.stockLeft} left
            </span>
          </div>
        </motion.div>
      )}

      {/* RIGHT SIDE ACTIONS */}
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">
        <button
          onClick={handleLike}
          className="group flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <div className="relative h-12 w-12 rounded-full glass-dark flex items-center justify-center transition-transform active:scale-90">
            <motion.div
              animate={burst ? { scale: [1, 1.5, 0.9, 1.15] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Heart
                className={`h-6 w-6 transition-colors ${
                  liked ? "fill-brand-pink text-brand-pink" : "text-white"
                }`}
                strokeWidth={2}
              />
            </motion.div>
            <AnimatePresence>
              {burst && (
                <motion.span
                  initial={{ opacity: 0.8, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 rounded-full bg-brand-pink/40 blur-xl"
                />
              )}
            </AnimatePresence>
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow">
            {(item.likes + (liked ? 1 : 0)).toLocaleString()}
          </span>
        </button>

        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1"
          aria-label="Save"
        >
          <motion.div
            whileTap={{ scale: 0.85, rotate: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 14 }}
            className="h-12 w-12 rounded-full glass-dark flex items-center justify-center"
          >
            <Bookmark
              className={`h-6 w-6 transition-colors ${
                saved ? "fill-white text-white" : "text-white"
              }`}
              strokeWidth={2}
            />
          </motion.div>
          <span className="text-[11px] font-semibold text-white drop-shadow">Save</span>
        </button>

        <button
          onClick={handleComment}
          className="flex flex-col items-center gap-1"
          aria-label="Comment"
        >
          <div className="h-12 w-12 rounded-full glass-dark flex items-center justify-center active:scale-90 transition-transform">
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow">128</span>
        </button>

        <button className="flex flex-col items-center gap-1" aria-label="Share">
          <div className="h-12 w-12 rounded-full glass-dark flex items-center justify-center active:scale-90 transition-transform">
            <Share2 className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
        </button>
      </div>

      {/* BOTTOM CONTENT */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-end justify-between gap-4"
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-[11px] font-black">
                {item.brand[0]}
              </div>
              <span className="text-sm font-semibold text-white">@{item.brandHandle}</span>
              <button className="ml-1 px-2.5 py-0.5 rounded-full border border-white/40 text-[11px] font-semibold text-white hover:bg-white/10 transition-colors">
                Follow
              </button>
            </div>
            <h2 className="text-base font-medium text-white/95 leading-snug mb-2 line-clamp-2">
              {item.title}
            </h2>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {item.currency}
                {item.price}
              </span>
              {item.oldPrice && (
                <span className="text-sm font-medium text-white/50 line-through">
                  {item.currency}
                  {item.oldPrice}
                </span>
              )}
            </div>
            {item.freeDelivery && (
              <div className="flex items-center gap-1.5 text-white/70">
                <Truck className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Free Delivery Available</span>
              </div>
            )}
          </div>

          <motion.button
            onClick={handleBuy}
            whileTap={{ scale: 0.94 }}
            className="relative shrink-0 rounded-full gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-brand animate-glow-pulse"
          >
            <span className="relative z-10">Buy Now</span>
          </motion.button>
        </motion.div>
      </div>
    </article>
  );
};
