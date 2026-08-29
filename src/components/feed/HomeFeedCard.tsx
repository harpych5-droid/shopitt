import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Heart, Bookmark, MessageCircle, Send, Truck, MoreHorizontal, MapPin, BadgeCheck, ShoppingBag, CalendarCheck, X, Volume2, VolumeX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { FeedItem } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import { usePostSocial } from "@/hooks/usePostSocial";
import { sharePost } from "@/lib/sharePost";
import { toast } from "sonner";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { optimizedImageUrl } from "@/lib/media";

interface HomeFeedCardProps {
  item: FeedItem;
  index: number;
  onAuthRequired: (action: "like" | "save" | "buy" | "comment", itemId: string) => void;
  onOpenSaveSheet: (postId: string) => void;
  onOpenComments: (postId: string) => void;
}

export const HomeFeedCard = ({ item, index, onAuthRequired, onOpenSaveSheet, onOpenComments }: HomeFeedCardProps) => {
  const [burst, setBurst] = useState(false);
  const [dtBurst, setDtBurst] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const authed = useShopitt((s) => s.authed);
  const { user } = useIdentity();
  const { liked, saved, likeCount, commentCount, toggleLike } = usePostSocial(item.id, item.likes, item.comments);
  const lastTap = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [videoVisible, setVideoVisible] = useState(false);
  const navigate = useNavigate();

  const isInspiration = item.postType === "inspiration";
  const isVideo = item.mediaType === "video";

  // Feed cards coordinate through this event so an explicit unmute never
  // leaves audio playing from another post.
  useEffect(() => {
    if (!isVideo) return;
    const onAnotherVideoAudible = (event: Event) => {
      if ((event as CustomEvent<string>).detail === item.id) return;
      setMuted(true);
    };
    window.addEventListener("shopitt:feed-video-audible", onAnotherVideoAudible);
    return () => window.removeEventListener("shopitt:feed-video-audible", onAnotherVideoAudible);
  }, [isVideo, item.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!videoVisible) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  }, [videoVisible]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      setVideoVisible(visible);
      if (!visible) {
        video.pause();
        setMuted(true);
        return;
      }
      // Visibility, rather than mounting, determines video network/playback.
    }, { threshold: [0, 0.5] });
    observer.observe(video);
    return () => observer.disconnect();
  }, [isVideo]);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!nextMuted) window.dispatchEvent(new CustomEvent("shopitt:feed-video-audible", { detail: item.id }));
  };

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
  const handleShare = async () => {
    try {
      const result = await sharePost(item.id, item.title);
      toast.success(result === "copied" ? "Post link copied" : "Post shared");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") toast.error("Could not share this post");
    }
  };
  const editPost = async () => {
    const title = window.prompt("Edit post title", item.title);
    if (title === null || !title.trim()) return;
    const description = window.prompt("Edit caption", item.caption);
    const { error } = await supabase.from("posts").update({ title: title.trim(), description: description ?? item.caption }).eq("id", item.id);
    if (error) toast.error("Could not update post");
    else { toast.success("Post updated"); window.dispatchEvent(new CustomEvent("shopitt:feed-refresh")); }
    setMoreOpen(false);
  };
  const deletePost = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", item.id);
    if (error) toast.error("Could not delete post");
    else { toast.success("Post deleted"); window.dispatchEvent(new CustomEvent("shopitt:feed-refresh")); }
    setMoreOpen(false);
  };

  const handleMediaTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      e.preventDefault();
      lastTap.current = 0;
      guard("like", () => {
        if (!liked) toggleLike();
        setDtBurst(true);
        setTimeout(() => setDtBurst(false), 700);
      });
      return;
    }
    lastTap.current = now;
    // let single tap navigate after a short delay
    setTimeout(() => {
      if (Date.now() - lastTap.current >= 280 && lastTap.current !== 0) {
        lastTap.current = 0;
        navigate(isVideo ? `/shorts?video=${encodeURIComponent(item.id)}` : `/p/${item.id}`);
      }
    }, 300);
    e.preventDefault();
  };

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
                  src={optimizedImageUrl(avatar, 96)}
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
        <div className="relative">
        <button onClick={() => setMoreOpen((open) => !open)} aria-label="More" className="h-8 w-8 rounded-full hover:bg-muted/50 flex items-center justify-center">
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
        {moreOpen && user?.id === item.userId && (
          <div className="absolute right-0 top-10 z-30 w-32 rounded-xl border border-border bg-popover p-1 shadow-lg">
            <button onClick={() => void editPost()} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">Edit</button>
            <button onClick={() => void deletePost()} className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted">Delete</button>
          </div>
        )}
        </div>
      </header>

      {/* MEDIA — extended aspect ratio for Instagram-like feel */}
      <Link to={`/p/${item.id}`} onClick={handleMediaTap} className="relative block w-full aspect-[4/5] bg-muted overflow-hidden select-none">
        <AnimatePresence>
          {dtBurst && (
            <motion.div
              key="dt-heart"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            >
              <Heart className="h-24 w-24 fill-brand-pink text-brand-pink drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
        {isVideo ? (
          <video
            ref={videoRef}
            src={videoVisible ? item.image : undefined}
            className="h-full w-full object-cover"
            muted={muted}
            loop
            playsInline
            preload="none"
          />
        ) : (
          item.image && (
            <img
              src={optimizedImageUrl(item.image, 900)}
              alt={item.title}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              sizes="(max-width: 768px) 100vw, 448px"
              className="h-full w-full object-cover"
            />
          )
        )}

        {isVideo && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleMute();
            }}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm active:scale-90 transition-transform"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}

        {item.mediaUrls.length > 1 && (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2 py-1 text-[11px] font-bold text-white">
            1/{item.mediaUrls.length}
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
          /* SBB 26 — Commerce layer: glassmorphed container, bottom left. Default "SHOP", expands on tap. */
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
            <div className="h-24 overlay-bottom" />
            <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pointer-events-auto">
              {!shopOpen ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShopOpen(true);
                  }}
                  className="rounded-full glass-dark px-4 py-2.5 flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="h-1.5 w-1.5 rounded-full gradient-brand" />
                  <span className="text-[12px] font-bold tracking-[0.14em] text-white">SHOP</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[19rem] rounded-3xl glass-dark p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{item.title}</p>
                      <p className="mt-0.5 font-display text-2xl font-black leading-none text-white tracking-tight">
                        {item.currency}
                        {item.price}
                        {item.oldPrice && (
                          <span className="ml-2 align-middle text-[12px] font-medium text-white/55 line-through">
                            {item.currency}
                            {item.oldPrice}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShopOpen(false);
                      }}
                      aria-label="Close shop"
                      className="shrink-0 h-7 w-7 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/70">
                    {item.stockLeft > 0 ? (
                      <span>{item.stockLeft} available</span>
                    ) : (
                      <span>Out of stock</span>
                    )}
                    {item.freeDelivery && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Free delivery
                      </span>
                    )}
                    {item.shipsIn && item.shipsIn !== "—" && <span>Ships {item.shipsIn}</span>}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        handleBuy();
                      }}
                      whileTap={{ scale: 0.95 }}
                      disabled={item.stockLeft <= 0}
                      className="flex-1 rounded-full gradient-brand px-4 py-2.5 text-[13px] font-bold text-white shadow-brand flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{item.kind === "service" ? "Book Now" : "Add to Bag"}</span>
                      {item.kind === "service" ? (
                        <CalendarCheck className="h-4 w-4" />
                      ) : (
                        <ShoppingBag className="h-4 w-4" />
                      )}
                    </motion.button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/p/${item.id}`);
                      }}
                      className="rounded-full bg-white/10 px-3.5 py-2.5 text-[12px] font-semibold text-white"
                    >
                      View Product
                    </button>
                  </div>
                </motion.div>
              )}
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
          <button onClick={handleShare} aria-label="Share" className="active:scale-90 transition-transform">
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
