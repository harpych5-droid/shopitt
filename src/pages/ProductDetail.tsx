import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Heart, Bookmark, Send, Truck, ShoppingBag, BadgeCheck, MapPin,
  MessageCircle, Sparkles, Plus, ChevronLeft, ChevronRight, CalendarCheck, Globe, Loader2,
} from "lucide-react";
import type { FeedItem } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { PlaceOrderSheet } from "@/components/feed/PlaceOrderSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { fetchPostById, postToFeedItem } from "@/services/postsService";
import { usePostSocial } from "@/hooks/usePostSocial";
import { useIdentity } from "@/hooks/useIdentity";
import { followUser, unfollowUser } from "@/services/socialService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DELIVERY_META = {
  international: { icon: Globe, label: "International delivery" },
  country: { icon: Truck, label: "Country-wide delivery" },
  local: { icon: MapPin, label: "Local delivery" },
} as const;

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { user } = useIdentity();
  const [product, setProduct] = useState<FeedItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await fetchPostById(id);
      if (cancelled) return;
      if (!data) { setNotFound(true); setLoading(false); return; }
      setProduct(postToFeedItem(data));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const gallery = useMemo(() => (product ? [product.image] : []), [product]);

  const [slide, setSlide] = useState(0);
  const [following, setFollowing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const authed = useShopitt((s) => s.authed);
  const social = usePostSocial(product?.id ?? "", 0, 0);
  const { liked, saved, likeCount, commentCount, toggleLike, toggleSave } = social;

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) document.title = `${product.title} — Shopitt`;
  }, [product?.title]);

  useEffect(() => {
    if (!user || !product?.userId || user.id === product.userId) return;
    supabase.from("followers").select("*", { count: "exact", head: true })
      .eq("follower_id", user.id).eq("following_id", product.userId)
      .then(({ count }) => setFollowing((count ?? 0) > 0));
  }, [user, product?.userId]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== slide) setSlide(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [slide]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (loading) {
    return <main className="min-h-[100dvh] bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>;
  }
  if (notFound || !product) {
    return (
      <main className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">This post no longer exists.</p>
        <Link to="/" className="rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">Back to feed</Link>
      </main>
    );
  }

  const guard = (action: "like" | "save" | "buy" | "comment", run: () => void) => {
    if (!authed) {
      shopitt.setPending({ type: action, itemId: product.id });
      setAuthAction(action);
      setAuthOpen(true);
      return;
    }
    run();
  };

  const handleBuy = () => guard("buy", () => setOrderOpen(true));
  const handleAddBag = () => guard("buy", () => shopitt.addToBag(product));
  const handleLike = () => guard("like", () => toggleLike());
  const handleSave = () => guard("save", () => toggleSave());
  const handleFollow = async () => {
    if (!user || !product.userId) return;
    const next = !following;
    setFollowing(next);
    const { error } = next
      ? await followUser(user.id, product.userId)
      : await unfollowUser(user.id, product.userId);
    if (error) { setFollowing(!next); toast.error(error); }
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      {/* Floating top bar */}
      <header className="fixed top-0 inset-x-0 z-40">
        <div className="max-w-md mx-auto px-3 pt-3 flex items-center justify-between">
          <Link
            to="/"
            aria-label="Back"
            className="h-10 w-10 rounded-full glass-dark flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              aria-label="Save"
              className="h-10 w-10 rounded-full glass-dark flex items-center justify-center"
            >
              <Bookmark className={`h-5 w-5 ${saved ? "fill-white text-white" : "text-white"}`} />
            </button>
            <button aria-label="Share" className="h-10 w-10 rounded-full glass-dark flex items-center justify-center">
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* GALLERY */}
        <section className="relative">
          <div
            ref={trackRef}
            className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {gallery.map((src, i) => (
              <div key={i} className="relative shrink-0 w-full aspect-[4/5] snap-center bg-muted">
                <img src={src} alt={`${product.title} ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Drop title — top-left, glassmorphism, never blocks subject */}
          <div className="pointer-events-none absolute top-16 left-3 z-10 max-w-[55%]">
            <div className="glass-dark rounded-full px-3 py-1.5 backdrop-blur-xl bg-black/30 border border-white/10">
              <span className="text-xs font-bold tracking-wide text-white/90 truncate block">
                {product.drop}
              </span>
            </div>
          </div>

          {/* Stock urgency — top-right with safe spacing */}
          {product.stockLeft <= 10 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-16 right-3 z-10"
            >
              <div className="rounded-full bg-warning px-2.5 py-1 flex items-center gap-1 shadow-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse-soft" />
                <span className="text-[11px] font-bold text-black">
                  Only {product.stockLeft} left
                </span>
              </div>
            </motion.div>
          )}

          {/* Arrows (desktop friendly) */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={() => goTo(Math.max(0, slide - 1))}
                aria-label="Previous"
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass-dark items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={() => goTo(Math.min(gallery.length - 1, slide + 1))}
                aria-label="Next"
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass-dark items-center justify-center"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  slide === i ? "w-6 gradient-brand" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </section>

        {/* INFO */}
        <section className="px-4 pt-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">
            {product.title}
          </h1>

          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight tabular-nums">
              {product.currency}
              {product.price}
            </span>
            {product.oldPrice && (
              <span className="text-base text-muted-foreground line-through tabular-nums">
                {product.currency}
                {product.oldPrice}
              </span>
            )}
            {product.oldPrice && (
              <span className="ml-auto text-[11px] font-bold text-success bg-success/15 rounded-full px-2 py-0.5">
                Save {Math.round((1 - product.price / product.oldPrice) * 100)}%
              </span>
            )}
          </div>

          {(() => {
            const dKey = product.deliveryType ?? "country";
            const D = DELIVERY_META[dKey];
            return product.freeDelivery ? (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-success/10 border border-success/20 px-3 py-2">
                <Truck className="h-4 w-4 text-success shrink-0" />
                <span className="text-xs font-semibold text-success flex-1">
                  Free Delivery — ships in {product.shipsIn}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                  <D.icon className="h-3 w-3" /> {D.label}
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted/40 border border-border/60 px-3 py-2">
                <D.icon className="h-4 w-4 text-foreground/80 shrink-0" />
                <span className="text-xs font-semibold text-foreground/85 flex-1">
                  {D.label} — ships in {product.shipsIn}
                </span>
              </div>
            );
          })()}
        </section>

        {/* SELLER */}
        <section className="px-4 mt-5">
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3">
            <Link to={`/u/${product.brandHandle}`} className="flex items-center gap-3 flex-1 min-w-0">
              <span className="relative shrink-0">
                <span className="absolute -inset-0.5 rounded-full gradient-brand" />
                <span className="relative block h-11 w-11 rounded-full bg-background p-[2px]">
                  <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center text-sm font-black text-white">
                    {product.brand[0]}
                  </span>
                </span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold truncate">{product.brand}</p>
                  <BadgeCheck className="h-4 w-4 text-brand-purple fill-brand-purple/20" />
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-brand-pink" />
                  <span>{product.location}</span>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setFollowing((v) => !v)}
              className={`rounded-full px-4 h-9 text-xs font-bold transition-colors ${
                following
                  ? "bg-card border border-border/60 text-foreground"
                  : "gradient-brand text-white shadow-brand"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="px-4 mt-5">
          <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">
            About this drop
          </h2>
          <p className="text-sm text-foreground/90 leading-relaxed">{product.caption}</p>
          {product.hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.hashtags.map((h) => (
                <span
                  key={h}
                  className="text-xs font-medium text-brand-pink bg-brand-pink/10 rounded-full px-2.5 py-1"
                >
                  #{h}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* SOCIAL */}
        <section className="px-4 mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} aria-label="Like" className="flex items-center gap-1.5 active:scale-90 transition-transform">
              <Heart className={`h-6 w-6 ${liked ? "fill-brand-pink text-brand-pink" : "text-foreground"}`} />
              <span className="text-sm font-bold tabular-nums">
                {(product.likes + (liked ? 1 : 0)).toLocaleString()}
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-6 w-6 text-foreground" />
              <span className="text-sm font-bold tabular-nums">{product.comments}</span>
            </div>
            <button aria-label="Share" className="active:scale-90 transition-transform">
              <Send className="h-6 w-6 text-foreground" />
            </button>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-success text-[11px] font-bold">
            ✓ {product.sold} sold
          </span>
        </section>

        {/* COMMENTS */}
        <section className="px-4 mt-6">
          <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-3">
            Comments
          </h2>
          <CommentsEmpty onComment={() => guard("comment", () => {})} />
        </section>
      </div>

      {/* STICKY ACTIONS — dynamic Buy / Book based on item kind */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          {(() => {
            const isService = product.kind === "service";
            const secondaryLabel = isService ? "Save for later" : "Add to Bag";
            const primaryLabel = isService ? "Book Now" : "Buy Now";
            const PrimaryIcon = isService ? CalendarCheck : ShoppingBag;
            const SecondaryIcon = isService ? Bookmark : ShoppingBag;
            return (
              <>
                <button
                  onClick={isService ? handleSave : handleAddBag}
                  className="flex-1 h-12 rounded-full bg-card border border-border/60 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <SecondaryIcon className="h-4 w-4" />
                  {secondaryLabel}
                </button>
                <motion.button
                  onClick={handleBuy}
                  whileTap={{ scale: 0.95 }}
                  className="flex-[1.4] h-12 rounded-full gradient-brand text-sm font-extrabold text-white shadow-brand flex items-center justify-center gap-2 animate-glow-pulse"
                >
                  {primaryLabel}
                  <PrimaryIcon className="h-4 w-4" />
                </motion.button>
              </>
            );
          })()}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
      <PlaceOrderSheet open={orderOpen} product={product} onClose={() => setOrderOpen(false)} />
    </main>
  );
};

const CommentsEmpty = ({ onComment }: { onComment: () => void }) => (
  <div className="rounded-3xl glass p-5 text-center">
    <AnimatePresence>
      <motion.span
        key="icon"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </motion.span>
    </AnimatePresence>
    <h3 className="mt-3 text-base font-extrabold">Be the first to comment 🔥</h3>
    <p className="mt-1 text-xs text-muted-foreground">
      Your comment could move this drop to the top of the feed.
    </p>
    <button
      onClick={onComment}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
    >
      <Plus className="h-4 w-4" />
      Add a comment
    </button>
  </div>
);

export default ProductDetail;
