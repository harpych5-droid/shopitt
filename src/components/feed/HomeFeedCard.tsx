import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Heart, Bookmark, MessageCircle, Send, MoreHorizontal, MapPin, Volume2, VolumeX, X, ExternalLink, Repeat2, Sparkles } from "lucide-react";
import { REACTION_OPTIONS } from "@/lib/hashtags";
import { Link, useNavigate } from "react-router-dom";
import type { FeedItem } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";
import { usePostSocial } from "@/hooks/usePostSocial";
import { sharePost } from "@/lib/sharePost";
import { toast } from "sonner";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { optimizedImageUrl } from "@/lib/media";
import { VerificationBadge } from "@/components/identity/VerificationBadge";
import { PostTimestamp } from "@/components/feed/PostTimestamp";
import { fetchPostShopTags, type ShopTag } from "@/services/shopTagsService";
import { getMediaCount } from "@/data/feed";
import { AI_TRY_ON_ENABLED, AI_TRY_ON_COPY } from "@/config/featureFlags";
import {
  createReportPayload,
  FEED_HIDDEN_POSTS_KEY,
  FEED_MUTED_CREATORS_KEY,
  FEED_SEE_FEWER_POSTS_KEY,
  getStoredIds,
  markPreference,
  removeStoredId,
} from "@/lib/feedControls";

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
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [shopTags, setShopTags] = useState<ShopTag[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(() => {
    try {
      const raw = window.localStorage.getItem(`shopitt:reaction:${item.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const authed = useShopitt((s) => s.authed);
  const { user } = useIdentity();
  const { liked, saved, likeCount, commentCount, commentPreview, toggleLike } = usePostSocial(item.id, item.likes, item.comments);
  const lastTap = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [videoVisible, setVideoVisible] = useState(false);
  const [mediaRatio, setMediaRatio] = useState<number | null>(null);
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

  useEffect(() => {
    if (isInspiration) return;
    let cancelled = false;
    void fetchPostShopTags(item.id).then(({ data }) => {
      if (!cancelled) setShopTags(data);
    });
    return () => { cancelled = true; };
  }, [isInspiration, item.id]);

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

  const handleReactionChoice = (value: string) => {
    if (!authed) {
      onAuthRequired("like", item.id);
      return;
    }
    setSelectedReaction(value);
    setReactionOpen(false);
    try {
      window.localStorage.setItem(`shopitt:reaction:${item.id}`, JSON.stringify(value));
    } catch {
      // Ignore storage failures - the UI should still work without persistence.
    }
  };
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
  const handleRemix = () => navigate(`/create?remixFrom=${encodeURIComponent(item.id)}`);

  const persistPreference = (key: string, value: string, label: string, undoLabel: string, onUndo: () => void) => {
    const next = markPreference(key, getStoredIds(key), value);
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("shopitt:feed-preferences-changed"));
    toast.success(label, { action: { label: undoLabel, onClick: onUndo } });
  };

  const handleNotInterested = () => {
    const hideValue = item.id;
    const undo = () => {
      removeStoredId(FEED_HIDDEN_POSTS_KEY, hideValue);
      window.dispatchEvent(new CustomEvent("shopitt:feed-preferences-changed"));
    };
    persistPreference(FEED_HIDDEN_POSTS_KEY, hideValue, "Got it. We'll show you fewer Looks like this.", "Undo", undo);
    setMoreOpen(false);
  };

  const handleSeeFewer = () => {
    const value = item.id;
    const undo = () => {
      removeStoredId(FEED_SEE_FEWER_POSTS_KEY, value);
      window.dispatchEvent(new CustomEvent("shopitt:feed-preferences-changed"));
    };
    persistPreference(FEED_SEE_FEWER_POSTS_KEY, value, "We'll show you less content like this.", "Undo", undo);
    setMoreOpen(false);
  };

  const handleMuteCreator = () => {
    if (!item.userId) return;
    const value = item.userId;
    const undo = () => {
      removeStoredId(FEED_MUTED_CREATORS_KEY, value);
      window.dispatchEvent(new CustomEvent("shopitt:feed-preferences-changed"));
    };
    persistPreference(FEED_MUTED_CREATORS_KEY, value, `Muted @${item.brandHandle}`, "Undo", undo);
    setMoreOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await sharePost(item.id, item.title);
      setMoreOpen(false);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") toast.error("Could not copy this link");
    }
  };

  const submitReport = async (reason: string) => {
    const payload = createReportPayload({
      postId: item.id,
      userId: user?.id ?? null,
      creatorId: item.userId ?? null,
      reason,
      description: "Reported from the Look menu",
    });
    try {
      const { error } = await supabase.from("post_reports").insert(payload);
      if (error) throw error;
      toast.success("Thanks for reporting this Look.");
      setReportOpen(false);
      setReportReason(null);
      setMoreOpen(false);
    } catch {
      toast.error("Could not submit the report right now.");
    }
  };

  const openShop = async () => {
    setSelectedTagId(null);
    setShopOpen(true);
    if (shopTags.length > 0) return;
    const { data } = await fetchPostShopTags(item.id);
    setShopTags(data);
  };
  const outfitTotal = shopTags.reduce((total, tag) => total + Number(tag.price || 0), 0);
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
  const mediaCount = getMediaCount(item);
  const showTryOn = !isInspiration && AI_TRY_ON_ENABLED === false;

  return (
    <article className="w-full bg-background border-b border-border/40">
      {/* SELLER ROW */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link to={`/u/${item.brandHandle}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="relative h-14 w-14 rounded-full overflow-hidden">
              {avatar ? (
                <img
                  src={optimizedImageUrl(avatar, 96)}
                  alt={item.brandHandle}
                  referrerPolicy="no-referrer"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              ) : (
                <div className="h-full w-full rounded-full gradient-brand flex items-center justify-center text-sm font-black text-white">
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
              <VerificationBadge verified={item.verified} className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
              {item.location && <MapPin className="h-3 w-3 text-brand-pink" />}
              {item.location && <span className="truncate">{item.location}</span>}
              {item.createdAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <PostTimestamp createdAt={item.createdAt} />
                </>
              )}
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
        {moreOpen && (
          <div className="absolute right-0 top-10 z-30 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl">
            {user?.id === item.userId ? (
              <>
                <button onClick={() => void editPost()} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Edit Look</button>
                <button onClick={() => void deletePost()} className="w-full rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-muted">Delete Look</button>
              </>
            ) : (
              <>
                <button onClick={handleNotInterested} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Not interested</button>
                <button onClick={handleSeeFewer} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">See fewer like this</button>
                {item.userId && (
                  <button onClick={handleMuteCreator} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Mute @{item.brandHandle}</button>
                )}
                <button onClick={() => { setReportOpen(true); setMoreOpen(false); }} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Report</button>
                <button onClick={() => void handleCopyLink()} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Copy link</button>
              </>
            )}
            <button onClick={() => setMoreOpen(false)} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted">Cancel</button>
          </div>
        )}
        </div>
      </header>

      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#121212] p-4 sm:rounded-3xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Why are you reporting this Look?</h3>
                <button type="button" onClick={() => { setReportOpen(false); setReportReason(null); }} className="h-8 w-8 rounded-full bg-white/5 text-white/80" aria-label="Close report sheet">
                  <X className="mx-auto h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  "Spam",
                  "Nudity or sexual content",
                  "Violence or dangerous content",
                  "Hate or harassment",
                  "Scam or fraud",
                  "Copyright / intellectual property",
                  "Impersonation",
                  "Illegal content",
                  "Other",
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setReportReason(reason);
                      void submitReport(reason);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm font-medium text-white/85 hover:bg-white/[0.06]"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEDIA — extended aspect ratio for Instagram-like feel */}
      <Link
        to={`/p/${item.id}`}
        onClick={handleMediaTap}
        className="relative block w-full bg-muted overflow-hidden select-none"
        style={{ aspectRatio: mediaRatio ?? "4 / 5" }}
      >
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
            className="h-full w-full object-contain"
            muted={muted}
            loop
            playsInline
            preload="none"
            onLoadedMetadata={(event) => {
              const { videoWidth, videoHeight } = event.currentTarget;
              if (videoWidth && videoHeight) setMediaRatio(videoWidth / videoHeight);
            }}
          />
        ) : (
          item.image && (
            <img
              src={optimizedImageUrl(item.image, 900)}
              alt={item.title}
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
              sizes="(max-width: 768px) 100vw, 448px"
              className="h-full w-full object-contain"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) setMediaRatio(naturalWidth / naturalHeight);
              }}
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

        {mediaCount > 1 && (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-2 py-1 text-[11px] font-bold text-white">
            1/{mediaCount}
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

        {shopTags.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {shopTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedTagId(tag.id); setShopOpen(true); }}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-black/70 px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
                style={{ left: `${tag.position_x * 100}%`, top: `${tag.position_y * 100}%` }}
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full gradient-brand" />{tag.item_name}
              </button>
            ))}
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
          /* Commerce is available only for persisted shoppable posts. */
          <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
            <div className="h-24 overlay-bottom" />
            <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pointer-events-auto">
              {!shopOpen ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTryOnOpen(true); }}
                    className="rounded-full border border-white/20 bg-white/8 px-3 py-2 text-[10px] font-bold tracking-[0.12em] text-white active:scale-95 transition-transform"
                  >
                    TRY IT ON ✨
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void openShop(); }}
                    className="rounded-full glass-dark px-4 py-2.5 text-[12px] font-bold tracking-[0.14em] text-white active:scale-95 transition-transform"
                  >
                    SHOP
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[19rem] rounded-3xl glass-dark p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Shop tags</p>
                      <p className="mt-1 truncate text-[13px] font-semibold text-white">{item.title}</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShopOpen(false); setSelectedTagId(null); }}
                      aria-label="Close shop"
                      className="h-7 w-7 shrink-0 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {selectedTagId ? (() => {
                      const selectedTag = shopTags.find((tag) => tag.id === selectedTagId);
                      return selectedTag ? (
                        <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                          <p className="text-sm font-bold text-white">{selectedTag.item_name}</p>
                          <p className="mt-1 text-base font-extrabold text-white">K{Number(selectedTag.price).toLocaleString()}</p>
                          {selectedTag.product && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/p/${selectedTag.product?.id}`); }}
                              className="mt-2 text-[10px] font-bold text-white underline underline-offset-2"
                            >
                              <ExternalLink className="mr-0.5 inline h-3 w-3" /> VIEW PRODUCT
                            </button>
                          )}
                        </div>
                      ) : null;
                    })() : shopTags.length === 0 ? (
                      <p className="text-[11px] text-white/65">No outfit tags were added to this look.</p>
                    ) : shopTags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2 text-[11px] text-white/85">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full gradient-brand" />
                        <span className="min-w-0 flex-1 truncate">{tag.item_name} · K{Number(tag.price).toLocaleString()}</span>
                        {tag.product && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/p/${tag.product?.id}`); }}
                            className="shrink-0 text-[10px] font-bold text-white underline underline-offset-2"
                          >
                            <ExternalLink className="mr-0.5 inline h-3 w-3" /> VIEW
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {shopTags.length > 0 && !selectedTagId && (
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
                      <span className="font-semibold text-white/60">TOTAL OUTFIT</span>
                      <span className="font-bold text-white">K{outfitTotal.toLocaleString()}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

      </Link>

      {showTryOn && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => setTryOnOpen(true)}
            className="w-full rounded-2xl border border-brand-pink/30 bg-brand-pink/8 px-3 py-2.5 text-left transition-colors hover:bg-brand-pink/12"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black tracking-tight text-white">TRY IT ON ✨</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/75">COMING SOON</span>
            </div>
            <p className="mt-1 text-xs text-white/70">See yourself in the Look.</p>
          </button>
        </div>
      )}

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

      {/* ENGAGEMENT ROW */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <button onClick={handleLike} aria-label="React" className="relative flex items-center gap-1.5 active:scale-90 transition-transform">
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
              <span className="text-xs font-semibold text-foreground">{likeCount.toLocaleString()}</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setReactionOpen((open) => !open)}
                aria-label="Choose reaction"
                className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-bold text-foreground"
              >
                {selectedReaction ? (
                  <>
                    <span>{REACTION_OPTIONS.find((option) => option.value === selectedReaction)?.emoji ?? "✨"}</span>
                    <span>{REACTION_OPTIONS.find((option) => option.value === selectedReaction)?.label ?? "React"}</span>
                  </>
                ) : (
                  <span>React</span>
                )}
              </button>
              {reactionOpen && (
                <div className="absolute left-0 top-10 z-30 w-44 rounded-2xl border border-border bg-popover p-2 shadow-xl">
                  {REACTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleReactionChoice(option.value)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleComment} aria-label="Open conversation" className="flex items-center gap-1.5 active:scale-90 transition-transform">
            <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={2} />
            <span className="text-xs font-semibold text-foreground">{commentCount.toLocaleString()}</span>
          </button>
          <button onClick={handleShare} aria-label="Share" className="active:scale-90 transition-transform">
            <Send className="h-6 w-6 text-foreground" strokeWidth={2} />
          </button>
          <button onClick={handleRemix} aria-label="Remix this Look" className="flex items-center gap-1.5 active:scale-90 transition-transform">
            <Repeat2 className="h-5 w-5 text-foreground" strokeWidth={2} />
            {item.remixCount ? <span className="text-xs font-semibold text-foreground">{item.remixCount} {item.remixCount === 1 ? "Remix" : "Remixes"}</span> : null}
          </button>
          {showTryOn && (
            <button
              type="button"
              onClick={() => setTryOnOpen(true)}
              aria-label="Try on this look"
              className="flex items-center gap-1.5 active:scale-90 transition-transform"
            >
              <Sparkles className="h-5 w-5 text-foreground" strokeWidth={2} />
              <span className="text-xs font-semibold text-foreground">Try On</span>
            </button>
          )}
        </div>
        <button onClick={handleSave} aria-label="Save" className="active:scale-90 transition-transform">
          <Bookmark
            className={`h-6 w-6 ${saved ? "fill-foreground text-foreground" : "text-foreground"}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* STORY + CONVERSATION */}
      <div className="px-4 pb-4 pt-1">
        {item.caption && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground">THE STORY</p>
        {item.remixedFromPostId && (
          <Link to={`/p/${item.remixedFromPostId}`} className="flex items-center gap-1 px-4 pb-2 text-xs text-muted-foreground">
            <Repeat2 className="h-3.5 w-3.5 text-brand-pink" />
            <span>Remixed from @{item.remixedFromHandle ?? "creator"}'s Look</span>
          </Link>
        )}
            <p className="mt-1 text-sm text-foreground/90 leading-snug">{item.caption}</p>
          </div>
        )}
        {item.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.hashtags.map((h) => (
              <Link
                key={h}
                to={`/search?q=${encodeURIComponent(h)}`}
                className="text-xs font-medium text-brand-pink bg-brand-pink/10 rounded-full px-2.5 py-1 transition-colors hover:bg-brand-pink/15"
              >
                #{h}
              </Link>
            ))}
          </div>
        )}
        {commentPreview.length > 0 && (
          <button
            type="button"
            onClick={handleComment}
            className="mt-3 block w-full text-left space-y-2"
            aria-label="Open conversation preview"
          >
            {commentPreview.map((comment) => (
              <span key={comment.id} className="flex items-start gap-2">
                <span className="h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center gradient-brand text-[10px] font-black text-white">
                      {(comment.profiles?.username?.[0] ?? "S").toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 text-xs leading-snug">
                  <span className="font-semibold text-foreground">{comment.profiles?.username ?? "shopper"}</span>{" "}
                  <span className="text-foreground/80">{comment.text}</span>
                </span>
              </span>
            ))}
          </button>
        )}
        <button onClick={handleComment} className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {commentCount > commentPreview.length ? `View all ${commentCount} conversations` : commentCount > 0 ? "Join the conversation" : "Start the conversation"}
        </button>
      </div>
    </article>
  );
};
