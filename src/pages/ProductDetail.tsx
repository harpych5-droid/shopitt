import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Heart, Bookmark, Send, Truck, ShoppingBag, MapPin,
  MessageCircle, Sparkles, Plus, ChevronLeft, ChevronRight, CalendarCheck, Globe, Loader2, Repeat2, X,
} from "lucide-react";
import type { FeedItem } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import { AuthModal } from "@/components/feed/AuthModal";
import { BagSheet } from "@/components/feed/BagSheet";
import { PlaceOrderSheet } from "@/components/feed/PlaceOrderSheet";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { fetchFeedPosts, fetchPostById, postToFeedItem } from "@/services/postsService";
import { VerificationBadge } from "@/components/identity/VerificationBadge";
import { usePostSocial } from "@/hooks/usePostSocial";
import { useIdentity } from "@/hooks/useIdentity";
import { followUser, unfollowUser } from "@/services/socialService";
import { supabase } from "@/lib/supabase";
import { sharePost } from "@/lib/sharePost";
import { toast } from "sonner";
import { setPageMetadata } from "@/lib/seo";
import { PostTimestamp } from "@/components/feed/PostTimestamp";
import { fetchCatalogProductById, type CatalogProduct } from "@/services/shopTagsService";
import { fetchRemixCounts, fetchRemixPosts } from "@/services/remixService";
import { AI_TRY_ON_ENABLED, AI_TRY_ON_COPY } from "@/config/featureFlags";

const DELIVERY_META = {
  international: { icon: Globe, label: "International delivery" },
  country: { icon: Truck, label: "Country-wide delivery" },
  local: { icon: MapPin, label: "Local delivery" },
} as const;

function catalogProductToFeedItem(product: CatalogProduct): FeedItem {
  return {
    id: product.id,
    userId: product.seller_id,
    brand: product.profile?.username ?? "Shopitt seller",
    brandHandle: product.profile?.username ?? product.seller_id,
    avatar: product.profile?.avatar_url ?? null,
    title: product.title,
    drop: "Catalog product",
    image: product.image_url,
    mediaUrls: [product.image_url],
    price: Number(product.price_usd),
    currency: "USD ",
    stockLeft: 0,
    freeDelivery: false,
    category: "Fashion",
    likes: 0,
    sold: 0,
    location: "",
    shipsIn: "—",
    caption: product.description ?? "",
    hashtags: [],
    comments: 0,
    kind: "product",
    postType: "product",
    catalogProduct: true,
    mediaType: "image",
  };
}

const ProductDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
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
      if (data) {
        setProduct(postToFeedItem(data));
        const remixCounts = await fetchRemixCounts([data.id]);
        if (!cancelled) setRemixCount(remixCounts.get(data.id) ?? 0);
        const remixResult = await fetchRemixPosts(data.id);
        if (!cancelled) setRemixLooks(remixResult.data);
      } else {
        const catalog = await fetchCatalogProductById(id);
        if (cancelled) return;
        if (!catalog.data) { setNotFound(true); setLoading(false); return; }
        setProduct(catalogProductToFeedItem(catalog.data));
      }
      setLoading(false);
      const related = await fetchFeedPosts(8, 0);
      if (!cancelled) {
        setRelatedLooks(
          related.data
            .map(postToFeedItem)
            .filter((look) => look.id !== id && look.postType === "inspiration")
            .slice(0, 4),
        );
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!product || !id) return;
    setPageMetadata({
      title: `${product.title} — Shopitt`,
      description: product.caption || "Fashion culture and inspiration from the Shopitt community.",
      path: `/p/${encodeURIComponent(id)}`,
      image: product.image || undefined,
    });
  }, [id, product]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const media = product.mediaUrls?.length ? product.mediaUrls : [product.image];
    return media.filter(Boolean);
  }, [product]);

  const [slide, setSlide] = useState(0);
  const [following, setFollowing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authAction, setAuthAction] = useState<"like" | "save" | "buy" | "comment" | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [relatedLooks, setRelatedLooks] = useState<FeedItem[]>([]);
  const [remixCount, setRemixCount] = useState(0);
  const [remixLooks, setRemixLooks] = useState<FeedItem[]>([]);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const authed = useShopitt((s) => s.authed);
  const social = usePostSocial(product?.id ?? "", 0, 0);
  const { liked, saved, likeCount, commentCount, commentPreview, toggleLike, toggleSave } = social;

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

  const isShoppable = product.postType === "product";

  const handleBuy = () => guard("buy", () => setOrderOpen(true));
  const handleAddBag = () => guard("buy", () => shopitt.addToBag(product));
  const handleLike = () => guard("like", () => toggleLike());
  const handleSave = () => guard("save", () => toggleSave());
  const handleShare = async () => {
    try {
      const result = await sharePost(product.id, product.title);
      toast.success(result === "copied" ? "Post link copied" : "Post shared");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") toast.error("Could not share this post");
    }
  };
  const handleRemix = () => navigate(`/create?remixFrom=${encodeURIComponent(product.id)}`);
  const handleTryOn = () => setTryOnOpen(true);
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
    <main className="min-h-[100dvh] bg-[#0E0E0E] text-white pb-32">
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
            <button onClick={handleShare} aria-label="Share" className="h-10 w-10 rounded-full glass-dark flex items-center justify-center">
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl">
        {/* GALLERY */}
        <section className="relative">
          <div
            ref={trackRef}
            className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {gallery.map((src, i) => (
              <div key={i} className="relative shrink-0 w-full aspect-[4/5] snap-center bg-[#121212]">
                {product.mediaType === "video" && i === 0 ? (
                  <video
                    src={src}
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img src={src} alt={`${product.title} ${i + 1}`} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>

          {/* Drop title — top-left, only when set */}
          {product.drop && (
            <div className="pointer-events-none absolute top-16 left-3 z-10 max-w-[55%]">
              <div className="glass-dark rounded-full px-3 py-1.5 backdrop-blur-xl bg-black/30 border border-white/10">
                <span className="text-xs font-bold tracking-wide text-white/90 truncate block">
                  {product.drop}
                </span>
              </div>
            </div>
          )}

          {/* Stock urgency — top-right with safe spacing */}
          {isShoppable && product.stockLeft > 0 && product.stockLeft <= 10 && (
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

        {/* LOOK CONTEXT */}
        <section className="px-5 pt-8">
          {product.remixedFromPostId && (
            <Link to={`/p/${product.remixedFromPostId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/65">
              <Repeat2 className="h-3.5 w-3.5 text-brand-pink" /> Remixed from @{product.remixedFromHandle ?? "creator"}'s Look
            </Link>
          )}
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-pink">{product.drop || "The Look"}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">A Shopitt moment brought to life through style, movement and mood.</p>
        </section>

        {/* SELLER */}
        <section className="px-5 mt-8">
          <div className="flex items-center gap-4 border-y border-white/10 py-4">
            <Link to={`/u/${product.brandHandle}`} className="flex items-center gap-3 flex-1 min-w-0">
              <span className="relative shrink-0">
                <span className="relative block h-14 w-14 rounded-full overflow-hidden">
                  {product.avatar ? (
                    <img
                      src={product.avatar}
                      alt={product.brandHandle}
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = "none";
                        el.parentElement?.classList.add("fallback");
                      }}
                    />
                  ) : (
                    <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center text-sm font-black text-white">
                      {(product.brand?.[0] ?? "S").toUpperCase()}
                    </span>
                  )}
                </span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-base font-bold truncate text-white">@{product.brandHandle}</p>
                  <VerificationBadge verified={product.verified} className="h-4 w-4" />
                </div>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-brand-pink" />
                  <span>{product.location || "Shopitt creator"}</span>
                  <span aria-hidden="true">·</span>
                  <PostTimestamp createdAt={product.createdAt} />
                </div>
              </div>
            </Link>
            <button
              onClick={handleFollow}
              disabled={!user || user.id === product.userId}
                className={`rounded-full px-4 h-9 text-xs font-bold transition-colors disabled:opacity-50 ${
                following
                  ? "bg-white/10 border border-white/15 text-white"
                  : "gradient-brand text-white shadow-brand"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          </div>
        </section>

        {/* DESCRIPTION */}
        <section className="px-5 mt-8">
          <h2 className="text-xs uppercase tracking-[0.18em] font-bold text-white/50 mb-2">
            The Story
          </h2>
          <p className="text-base text-white/85 leading-relaxed">{product.caption || "A style moment from the Shopitt community."}</p>
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

        {isShoppable && <section className="px-5 mt-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-pink">Shop Tags</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-white">Pieces inside the Look</h2>
            </div>
            <Sparkles className="h-5 w-5 text-brand-pink" />
          </div>
          <div className="border border-white/10 bg-[#121212] p-4">
            <div className="flex items-center gap-4">
              <img src={product.image} alt="" className="h-20 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">The piece</p>
                <h3 className="mt-1 truncate text-base font-bold text-white">{product.title}</h3>
                <p className="mt-1 font-display text-xl font-black text-white">{product.currency}{product.price}</p>
              </div>
              <button onClick={handleAddBag} className="shrink-0 rounded-full gradient-brand px-3.5 py-2.5 text-xs font-bold text-white shadow-brand">
                Add to Bag
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-brand-pink/20 bg-brand-pink/6 px-3 py-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-pink">TRY IT ON ✨</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">COMING SOON</p>
              </div>
              <button type="button" onClick={handleTryOn} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">OPEN</button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
              <span>{product.stockLeft > 0 ? `${product.stockLeft} available` : "Availability varies"}</span>
              <span>{product.freeDelivery ? "Free delivery" : product.shipsIn !== "—" ? `Ships ${product.shipsIn}` : "Shopitt delivery"}</span>
            </div>
          </div>
        </section>}

        {/* SOCIAL */}
        <section className="px-5 mt-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} aria-label="Like" className="flex items-center gap-1.5 active:scale-90 transition-transform">
              <Heart className={`h-6 w-6 ${liked ? "fill-brand-pink text-brand-pink" : "text-white"}`} />
              <span className="text-sm font-bold tabular-nums text-white">{likeCount.toLocaleString()}</span>
            </button>
            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-1.5">
              <MessageCircle className="h-6 w-6 text-white" />
              <span className="text-sm font-bold tabular-nums text-white">{commentCount}</span>
            </button>
            <button onClick={handleShare} aria-label="Share" className="active:scale-90 transition-transform">
              <Send className="h-6 w-6 text-foreground" />
            </button>
            <button onClick={handleRemix} aria-label="Remix this Look" className="flex items-center gap-1.5 active:scale-90 transition-transform">
              <Repeat2 className="h-6 w-6 text-white" />
              {remixCount > 0 && <span className="text-sm font-bold tabular-nums text-white">{remixCount}</span>}
            </button>
          </div>
          <button onClick={handleRemix} className="text-xs font-bold text-brand-pink">Remix this Look</button>
        </section>

        {remixLooks.length > 0 && <section className="px-5 mt-10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-pink">Remixes</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-white">{remixCount} {remixCount === 1 ? "Remix" : "Remixes"}</h2>
            </div>
            <button type="button" onClick={handleTryOn} className="rounded-full border border-brand-pink/30 bg-brand-pink/8 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-pink">TRY THIS LOOK ON YOU</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {remixLooks.map((look) => (
              <Link key={look.id} to={`/p/${look.id}`} className="overflow-hidden bg-[#121212]">
                <img src={look.image} alt={look.title} className="aspect-[4/5] w-full object-cover" />
                <div className="p-3"><p className="text-xs font-bold text-white line-clamp-2">{look.title}</p><p className="mt-1 text-[11px] text-white/45">@{look.brandHandle}</p></div>
              </Link>
            ))}
          </div>
        </section>}

        {/* COMMENTS */}
        <section className="px-5 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Fashion Talk</h2>
            <button onClick={() => setCommentsOpen(true)} className="text-xs font-semibold text-brand-pink">
              {commentCount > 0 ? `View all ${commentCount}` : "Join the conversation"}
            </button>
          </div>
          {commentPreview.length > 0 ? (
            <button onClick={() => setCommentsOpen(true)} className="mt-3 w-full space-y-3 text-left">
              {commentPreview.map((comment) => (
                <span key={comment.id} className="flex items-start gap-3">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
                    {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center gradient-brand text-xs font-black text-white">{(comment.profiles?.username?.[0] ?? "S").toUpperCase()}</span>}
                  </span>
                  <span className="min-w-0 text-sm leading-snug text-white/75"><strong className="text-white">{comment.profiles?.username ?? "shopper"}</strong>{" "}{comment.text}</span>
                </span>
              ))}
            </button>
          ) : (
            <button onClick={() => setCommentsOpen(true)} className="mt-3 text-sm text-white/55">Be the first to add to the conversation.</button>
          )}
        </section>

        {relatedLooks.length > 0 && <section className="px-5 mt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-pink">More Like This</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white">More from the style universe</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {relatedLooks.map((look) => (
              <Link key={look.id} to={`/p/${look.id}`} className="group overflow-hidden bg-[#121212]">
                <img src={look.image} alt={look.title} className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="p-3"><p className="text-xs font-bold text-white line-clamp-2">{look.title}</p><p className="mt-1 text-[11px] text-white/45">@{look.brandHandle}</p></div>
              </Link>
            ))}
          </div>
        </section>}
      </div>

      {/* STICKY ACTIONS — dynamic Buy / Book based on item kind */}
      {isShoppable && <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
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
      </div>}

      <AnimatePresence>
        {tryOnOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center"
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#121212] p-5 sm:rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setTryOnOpen(false)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/5 text-white/80"
                aria-label="Close"
              >
                <X className="mx-auto h-4 w-4" />
              </button>
              <div className="mb-4 inline-flex rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-pink">
                COMING SOON
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">{AI_TRY_ON_COPY.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{AI_TRY_ON_COPY.body}</p>
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setTryOnOpen(false)}
                  className="w-full rounded-full bg-gradient-to-r from-brand-pink to-brand-purple px-4 py-3 text-sm font-bold text-white shadow-brand"
                >
                  {AI_TRY_ON_COPY.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setTryOnOpen(false)}
                  className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/80"
                >
                  NOT NOW
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} action={authAction} />
      <BagSheet open={bagOpen} onClose={() => setBagOpen(false)} />
      <PlaceOrderSheet open={orderOpen} product={product} onClose={() => setOrderOpen(false)} />
      <CommentsSheet open={commentsOpen} postId={product.id} onClose={() => setCommentsOpen(false)} />
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
