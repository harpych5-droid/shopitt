import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Heart, Bookmark, MessageCircle, Send, Truck, MoreHorizontal, MapPin, BadgeCheck, ShoppingBag, CalendarCheck, Sparkles, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeedItem, PostBadge } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import { usePostSocial } from "@/hooks/usePostSocial";

interface HomeFeedCardProps {
  item: FeedItem;
  index: number;
  onAuthRequired: (action: "like" | "save" | "buy" | "comment", itemId: string) => void;
  onOpenSaveSheet: (postId: string) => void;
  onOpenComments: (postId: string) => void;
}

const badgeStyles: Record<PostBadge, string> = {
  Product: "bg-foreground/10 text-foreground",
  Inspiration: "bg-brand-purple/15 text-brand-purple",
  Trend: "bg-brand-pink/15 text-brand-pink",
  "Creator Pick": "bg-warning/15 text-warning",
  Featured: "gradient-brand text-white",
  "New Drop": "bg-success/15 text-success",
};

const badgeIcon = (b: PostBadge) => {
  switch (b) {
    case "Inspiration": return <Sparkles className="h-3 w-3" />;
    case "Trend": return <Flame className="h-3 w-3" />;
    case "Featured": return <BadgeCheck className="h-3 w-3" />;
    default: return null;
  }
};

export const HomeFeedCard = ({ item, index, onAuthRequired, onOpenSaveSheet, onOpenComments }: HomeFeedCardProps) => {
  const [burst, setBurst] = useState(false);
  const authed = useShopitt((s) => s.authed);
  const { liked, saved, likeCount, commentCount, toggleLike } = usePostSocial(item.id, item.likes, item.comments);

  const isInspiration = item.postType === "inspiration";
  const isVideo = item.mediaType === "video";

  const guard = (action: "like" | "save" | "buy" | "comment", run: () => void) => {
    if (!authed) {
      onAuthRequired(action, item.id);
      return;
    }
    run();
  };

  const handleLike = () =>
    guard("like", () => {
      toggleLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    });
  const handleSave = () => guard("save", () => onOpenSaveSheet(item.id));
  const handleBuy = () => guard("buy", () => shopitt.addToBag(item));
  const handleComment = () => onOpenComments(item.id);

  const avatar = item.avatar;
  const initial = (item.brand?.[0] ?? "S").toUpperCase();

  return (
    <article className="w-full bg-background border-b border-border/40">
      {/* SELLER ROW */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link to={`/u/${item.brandHandle}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <span className="absolute -inset-0.5 rounded-full gradient-brand" />
            <div className="relative h-9 w-9 rounded-full bg-background p-[2px]">
              {avatar ? (
                <img
                  src={avatar}
                  alt={item.brandHandle}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              ) : (
                <div className="h-full w-full rounded-full gradient-brand flex items-center justify-center text-[12px] font-black text-white">
                  {initial}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {item.brandHandle}
              </span>
              <BadgeCheck className="h-3.5 w-3.5 text-brand-purple fill-brand-purple/20 shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.location && <MapPin className="h-3 w-3 text-brand-pink" />}
              {item.location && <span className="truncate">{item.location}</span>}
              {!isInspiration && item.shipsIn && item.shipsIn !== "—" && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-semibold">
                  Ships {item.shipsIn}
                </span>
              )}
            </div>
          </div>
        </Link>
        <button aria-label="More" className="h-8 w-8 rounded-full hover:bg-muted/50 flex items-center justify-center">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* MEDIA — extended aspect ratio for Instagram-like feel */}
      <Link to={`/p/${item.id}`} className="relative block w-full aspect-[4/5] bg-muted overflow-hidden">
        {isVideo ? (
          <video
            src={item.image}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          item.image && (
            <img
              src={item.image}
              alt={item.title}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover"
            />
          )
        )}

        {item.drop && (
          <div className="absolute top-3 left-3 z-10 max-w-[65%]">
            <div className="rounded-full glass-dark backdrop-blur-xl bg-black/40 border border-white/10 px-3 py-1.5 flex items-center gap-1">
              {item.badge && badgeIcon(item.badge)}
              <span className="text-[11px] font-bold tracking-wide text-white truncate">
                {item.drop}
              </span>
            </div>
          </div>
        )}

        {!isInspiration && item.stockLeft > 0 && item.stockLeft <= 10 && (
          <div className="absolute top-3 right-3 z-10">
            <div className="rounded-full bg-warning px-2.5 py-1 flex items-center gap-1 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse-soft" />
              <span className="text-[11px] font-bold text-black">
                Only {item.stockLeft} left
              </span>
            </div>
          </div>
        )}

        {isInspiration ? (
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
            <div className="h-28 overlay-bottom" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pointer-events-auto">
              <h3 className="font-display text-xl font-bold text-white leading-tight tracking-tight">
                {item.title}
              </h3>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
            <div className="h-32 overlay-bottom" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 flex items-end justify-between gap-3 pointer-events-auto">
              <div className="min-w-0">
                <div className="font-display text-3xl font-black text-white tracking-tight leading-none">
                  {item.currency}
                  {item.price}
                  {item.oldPrice && (
                    <span className="ml-2 text-sm font-medium text-white/60 line-through align-middle">
                      {item.currency}
                      {item.oldPrice}
                    </span>
                  )}
                </div>
                {item.freeDelivery && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-white/85">
                    <Truck className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Free Delivery</span>
                  </div>
                )}
              </div>
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  handleBuy();
                }}
                whileTap={{ scale: 0.94 }}
                className="shrink-0 rounded-full gradient-brand px-5 py-3 text-sm font-bold text-white shadow-brand flex items-center gap-1.5"
              >
                <span>{item.kind === "service" ? "Book Now" : "Buy Now"}</span>
                {item.kind === "service" ? (
                  <CalendarCheck className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </div>
        )}
      </Link>

      {/* ENGAGEMENT ROW */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} aria-label="Like" className="relative active:scale-90 transition-transform">
            <motion.div animate={burst ? { scale: [1, 1.4, 0.95, 1.1] } : { scale: 1 }} transition={{ duration: 0.5 }}>
              <Heart
                className={`h-6 w-6 ${liked ? "fill-brand-pink text-brand-pink" : "text-foreground"}`}
                strokeWidth={2}
              />
            </motion.div>
            <AnimatePresence>
              {burst && (
                <motion.span
                  initial={{ opacity: 0.7, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-full bg-brand-pink/40 blur-xl"
                />
              )}
            </AnimatePresence>
          </button>
          <button onClick={handleComment} aria-label="Comment" className="active:scale-90 transition-transform">
            <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={2} />
          </button>
          <button aria-label="Share" className="active:scale-90 transition-transform">
            <Send className="h-6 w-6 text-foreground" strokeWidth={2} />
          </button>
        </div>
        <button onClick={handleSave} aria-label="Save" className="active:scale-90 transition-transform">
          <Bookmark
            className={`h-6 w-6 ${saved ? "fill-foreground text-foreground" : "text-foreground"}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* SOCIAL PROOF + CAPTION */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-foreground">
            {likeCount.toLocaleString()} likes
          </span>
        </div>
        {item.caption && (
          <p className="text-sm text-foreground leading-snug">
            <Link to={`/u/${item.brandHandle}`} className="font-semibold mr-1.5">
              {item.brandHandle}
            </Link>
            <span className="text-foreground/90">{item.caption}</span>
          </p>
        )}
        {item.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.hashtags.map((h) => (
              <span
                key={h}
                className="text-xs font-medium text-brand-pink bg-brand-pink/10 rounded-full px-2.5 py-1"
              >
                #{h}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={handleComment}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {commentCount > 0 ? `View all ${commentCount} comments` : "Add a comment"}
        </button>
      </div>
    </article>
  );
};
