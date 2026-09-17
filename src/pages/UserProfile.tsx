import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  MoreHorizontal,
  MessageCircle,
  UserPlus,
  PlayCircle,
  Bookmark,
  Sparkles,
  Plus,
  LogIn,
  Share2,
  Star,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/hooks/useAuth";
import { useIdentity } from "@/hooks/useIdentity";
import { toast } from "sonner";
import { setPageMetadata } from "@/lib/seo";
import { VerificationBadge } from "@/components/identity/VerificationBadge";
import { sanitizeUsername } from "@/lib/username";
import { PostTimestamp } from "@/components/feed/PostTimestamp";
import { BackButton } from "@/components/navigation/BackButton";
import { fetchUserBadges, type UserBadge } from "@/services/adminService";

type Tab = "looks" | "remixes" | "inspiration";

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  is_verified: boolean;
};

type PostRow = {
  id: string;
  user_id: string;
  media_url: string | null;
  title: string | null;
  price: number | null;
  content_type: string | null;
  post_type: string | null;
  remixed_from_post_id: string | null;
  created_at: string;
};

type CreatorRating = {
  rating: number;
};

const UserProfile = () => {
  const { handle } = useParams();
  const isSelfRoute = !handle;
  const { user: authUser, profile: globalProfile, loading: identityLoading } = useIdentity();
  const authedUserId = authUser?.id ?? null;

  const [tab, setTab] = useState<Tab>("looks");

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [remixes, setRemixes] = useState<PostRow[]>([]);
  const [ratingRows, setRatingRows] = useState<CreatorRating[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [inspirationCount, setInspirationCount] = useState(0);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const authLoading = identityLoading;

  // Hydrate self-profile straight from global store
  useEffect(() => {
    if (isSelfRoute && globalProfile) {
      setProfile(globalProfile as ProfileRow);
    }
  }, [isSelfRoute, globalProfile]);

  // 2) Resolve target profile -> posts -> stats
  const loadProfile = useCallback(async () => {
    if (authLoading) return;

    // Self route requires auth
    if (isSelfRoute && !authedUserId) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setNotFound(false);

    try {
      let targetProfile: ProfileRow | null = null;

      if (isSelfRoute && authedUserId) {
        // fetch by id
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, country, bio, is_verified")
          .eq("id", authedUserId)
          .maybeSingle();

        if (error) throw error;
        targetProfile = data as ProfileRow | null;

        // Auto-create if missing
        if (!targetProfile) {
          const { data: authData } = await supabase.auth.getUser();
          const meta = (authData.user?.user_metadata ?? {}) as Record<string, any>;
          const fallbackHandle = sanitizeUsername(authData.user?.email?.split("@")[0] ?? `user_${authedUserId.slice(0, 6)}`);

          const insertPayload = {
            id: authedUserId,
            username: fallbackHandle,
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
            is_verified: false,
          };

          const { data: created, error: createErr } = await supabase
            .from("profiles")
            .insert(insertPayload)
            .select("id, username, avatar_url, country, bio, is_verified")
            .maybeSingle();

          if (createErr) {
            console.error("Profile auto-create failed", createErr);
          }
          targetProfile = (created as ProfileRow | null) ?? ({ ...insertPayload, country: null } as ProfileRow);
        }
      } else if (handle) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, country, bio, is_verified")
          .ilike("username", handle)
          .maybeSingle();
        if (error) throw error;
        targetProfile = data as ProfileRow | null;
      }

      console.log("PROFILE:", targetProfile);

      if (!targetProfile) {
        setNotFound(true);
        setProfile(null);
        setPosts([]);
        setFollowers(0);
        setFollowing(0);
        return;
      }

      setProfile(targetProfile);
      void fetchUserBadges(targetProfile.id).then(setBadges);

      // Parallel fetch: posts + follower count + following count + amIFollowing
      const [postsRes, remixesRes, followersRes, followingRes, isFollowingRes, ratingsRes, myRatingRes, inspirationRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, user_id, media_url, title, price, content_type, post_type, remixed_from_post_id, created_at")
          .eq("user_id", targetProfile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select("id, user_id, media_url, title, price, content_type, post_type, remixed_from_post_id, created_at")
          .eq("user_id", targetProfile.id)
          .not("remixed_from_post_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetProfile.id),
        supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetProfile.id),
        authedUserId && authedUserId !== targetProfile.id
          ? supabase
              .from("followers")
              .select("follower_id", { count: "exact", head: true })
              .eq("follower_id", authedUserId)
              .eq("following_id", targetProfile.id)
          : Promise.resolve({ count: 0, error: null } as any),
        supabase.from("creator_ratings").select("rating").eq("creator_id", targetProfile.id),
        authedUserId && authedUserId !== targetProfile.id
          ? supabase.from("creator_ratings").select("rating").eq("creator_id", targetProfile.id).eq("rater_id", authedUserId).maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        isSelfRoute && authedUserId === targetProfile.id
          ? supabase.from("saved_items").select("post_id", { count: "exact", head: true }).eq("user_id", targetProfile.id)
          : Promise.resolve({ count: 0, error: null } as any),
      ]);

      if (postsRes.error) console.error("POSTS error:", postsRes.error);
      console.log("POSTS:", postsRes.data);

      setPosts((postsRes.data as PostRow[] | null) ?? []);
      setRemixes((remixesRes.data as PostRow[] | null) ?? []);
      setRatingRows((ratingsRes.data as CreatorRating[] | null) ?? []);
      setMyRating((myRatingRes.data as CreatorRating | null)?.rating ?? null);
      setInspirationCount(inspirationRes.count ?? 0);
      setFollowers(followersRes.count ?? 0);
      setFollowing(followingRes.count ?? 0);
      setIsFollowing((isFollowingRes.count ?? 0) > 0);
    } catch (err: any) {
      console.error("Profile load failed", err);
      toast.error(err?.message ?? "Failed to load profile");
    } finally {
      setDataLoading(false);
    }
  }, [authLoading, authedUserId, handle, isSelfRoute]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    document.title = profile?.username
      ? `@${profile.username} — Shopitt`
      : "Profile — Shopitt";
  }, [profile?.username]);

  useEffect(() => {
    if (!handle || !profile?.username) return;
    setPageMetadata({
      title: `@${profile.username} — Shopitt`,
      description: `Explore fashion, culture and creative expression from @${profile.username} on Shopitt.`,
      path: `/u/${encodeURIComponent(handle)}`,
      image: profile.avatar_url || undefined,
    });
  }, [handle, profile?.avatar_url, profile?.username]);

  const handleFollowToggle = async () => {
    if (!authedUserId || !profile || authedUserId === profile.id) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setFollowers((c) => c + (next ? 1 : -1));

    if (next) {
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: authedUserId, following_id: profile.id });
      if (error) {
        setIsFollowing(false);
        setFollowers((c) => c - 1);
        toast.error("Could not follow");
      }
    } else {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", authedUserId)
        .eq("following_id", profile.id);
      if (error) {
        setIsFollowing(true);
        setFollowers((c) => c + 1);
        toast.error("Could not unfollow");
      }
    }
  };

  const handleRate = async (rating: number) => {
    if (!authedUserId || !profile || authedUserId === profile.id || ratingSaving) return;
    setRatingSaving(true);
    const { error } = await supabase.from("creator_ratings").upsert(
      { creator_id: profile.id, rater_id: authedUserId, rating, updated_at: new Date().toISOString() },
      { onConflict: "creator_id,rater_id" },
    );
    setRatingSaving(false);
    if (error) {
      toast.error("Could not save your style rating");
      return;
    }
    setMyRating(rating);
    const { data: refreshedRatings } = await supabase.from("creator_ratings").select("rating").eq("creator_id", profile.id);
    setRatingRows((refreshedRatings as CreatorRating[] | null) ?? []);
    toast.success("Style rating updated");
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${username} — Shopitt`, text: profile.bio ?? `Explore @${username}'s style on Shopitt.`, url });
      else await navigator.clipboard.writeText(url);
      toast.success(navigator.share ? "Profile shared" : "Profile link copied");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") toast.error("Could not share profile");
    }
  };

  // ---------- RENDER STATES ----------

  // Unauthed self profile -> sign-in CTA
  if (!authLoading && isSelfRoute && !authedUserId) {
    return <SignInCTA />;
  }

  // Loading skeleton
  if (authLoading || dataLoading) {
    return <ProfileSkeleton />;
  }

  if (notFound || !profile) {
    return <NotFoundState handle={handle} />;
  }

  const isSelf = authedUserId === profile.id;
  const username = profile.username || "shopper";
  const displayName = profile.username || "Shopitt user";
  const location = profile.country || null;
  const styleRating = ratingRows.length >= 3 ? ratingRows.reduce((sum, row) => sum + row.rating, 0) / ratingRows.length : null;
  const isShoppable = (post: PostRow) => (post.content_type ?? post.post_type ?? "").toLowerCase() === "product" || (post.content_type ?? post.post_type ?? "").toLowerCase() === "shoppable";
  const lookPosts = posts.filter((post) => !post.remixed_from_post_id);
  const tabItems = tab === "looks" ? lookPosts : tab === "remixes" ? remixes : [];
  const tabs = [
    { key: "looks" as const, label: "Looks", count: lookPosts.length },
    ...(remixes.length > 0 ? [{ key: "remixes" as const, label: "Remixes", count: remixes.length }] : []),
    ...(isSelf && inspirationCount > 0 ? [{ key: "inspiration" as const, label: "Inspiration", count: inspirationCount }] : []),
  ];

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton fallback="/" />
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-bold truncate">@{username}</h1>
            <VerificationBadge verified={profile.is_verified} className="h-4 w-4" />
          </div>
          <button aria-label="More" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto pb-32">
        <div className="px-4 pt-8">
          {/* PROFILE HEADER */}
          <section>
            <div className="flex items-start gap-5">
              <button
                aria-label="View avatar"
                className="relative shrink-0 overflow-hidden rounded-full ring-4 ring-background shadow-xl active:scale-95 transition-transform"
              >
                <span className="relative block h-28 w-28 rounded-full">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center text-2xl font-black text-white">
                      {displayName[0].toUpperCase()}
                    </span>
                  )}
                </span>
              </button>
              <div className="min-w-0 pt-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-2xl font-black tracking-tight text-foreground">{displayName}</h2>
                  <VerificationBadge verified={profile.is_verified} className="h-5 w-5 shrink-0" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
                {badges.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{badges.slice(0, 3).map((badge) => <span key={badge.assignment_id} title={badge.description} className="rounded-full border border-brand-pink/25 bg-brand-pink/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-pink">{badge.name}</span>)}</div>}
                {styleRating !== null ? (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="font-bold uppercase tracking-[0.14em] text-muted-foreground">Style rating</span>
                    <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star className="h-3.5 w-3.5 fill-brand-pink text-brand-pink" />{styleRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">{ratingRows.length} {ratingRows.length === 1 ? "rating" : "ratings"}</span>
                  </div>
                ) : <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">New creator</span>}
              </div>
            </div>

            <div className="mt-4">
              {profile.bio ? <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-foreground/85">{profile.bio}</p> : <p className="text-sm italic text-muted-foreground">A fashion identity in the making.</p>}
              {location && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-brand-pink" /><span>{location}</span></div>}
            </div>

            <div className="mt-5 flex items-center gap-4 border-y border-border/60 py-3 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{lookPosts.length}</strong> Looks</span>
              <span><strong className="text-foreground">{followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}</strong> community</span>
              <span><strong className="text-foreground">{following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}</strong> following</span>
            </div>

          <div className="mt-4 flex items-center gap-2">
            {isSelf ? (
              <>
                <Link
                  to="/edit-profile"
                  className="flex-1 h-10 rounded-full bg-card border border-border/60 text-sm font-bold flex items-center justify-center hover:bg-muted/40 transition-colors"
                >
                  Edit profile
                </Link>
                <Link
                  to="/seller"
                  className="flex-1 h-10 rounded-full gradient-brand shadow-brand text-sm font-bold text-white flex items-center justify-center"
                >
                  Seller dashboard
                </Link>
                <button onClick={handleShareProfile} aria-label="Share profile" className="h-10 w-10 shrink-0 rounded-full border border-border/60 bg-card flex items-center justify-center hover:bg-muted/40">
                  <Share2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFollowToggle}
                  className={`flex-1 h-10 rounded-full text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isFollowing
                      ? "bg-card border border-border/60 text-foreground"
                      : "gradient-brand text-white shadow-brand"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <Link
                  to={`/chats/${username}`}
                  className="flex-1 h-10 rounded-full bg-card border border-border/60 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-muted/40 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Link>
                <button onClick={handleShareProfile} aria-label="Share profile" className="h-10 w-10 shrink-0 rounded-full border border-border/60 bg-card flex items-center justify-center hover:bg-muted/40">
                  <Share2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {!isSelf && authedUserId && (
            <div className="mt-5 rounded-2xl bg-card border border-border/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rate this creator's style</span>
                {myRating && <span className="text-xs text-muted-foreground">Your pick: {myRating}/5</span>}
              </div>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onClick={() => void handleRate(value)} disabled={ratingSaving} aria-label={`Rate ${value} out of 5`} className="p-1 disabled:opacity-50">
                    <Star className={`h-5 w-5 ${myRating !== null && value <= myRating ? "fill-brand-pink text-brand-pink" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* TABS */}
        <div className="mt-6 sticky top-[57px] z-30 bg-background/90 backdrop-blur-xl -mx-4 px-4">
          <div className="flex border-b border-border/60">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => t.key === "inspiration" ? window.location.assign("/saved") : setTab(t.key)}
                  className="relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold"
                >
                  {t.key === "looks" ? <Sparkles className={`h-4 w-4 ${active ? "text-brand-pink" : "text-muted-foreground"}`} /> : t.key === "remixes" ? <PlayCircle className={`h-4 w-4 ${active ? "text-brand-pink" : "text-muted-foreground"}`} /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                  <span className={active ? "text-foreground" : "text-muted-foreground"}>{t.label}</span>
                  {active && (
                    <motion.span
                      layoutId="profile-tab-underline"
                      className="absolute -bottom-px inset-x-3 h-[2px] gradient-brand rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <section className="mt-3">
          {tabItems.length === 0 ? (
            <EmptyState tab={tab} isSelf={isSelf} />
          ) : (
            <div className="columns-2 gap-3 md:columns-3">
              {tabItems.map((p, index) => (
                <Link
                  key={p.id}
                  to={`/p/${p.id}`}
                  className="relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl bg-muted shadow-card active:opacity-80 transition-opacity"
                >
                  {p.media_url && (
                    <img src={p.media_url} alt={p.title ?? ""} loading="lazy" className={`block w-full object-cover ${index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
                  )}
                  {tab === "remixes" && (
                    <span className="absolute top-1.5 right-1.5">
                      <PlayCircle className="h-4 w-4 text-white drop-shadow" />
                    </span>
                  )}
                  {p.price != null && (
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-white drop-shadow">
                      {p.price}
                    </span>
                  )}
                  {isShoppable(p) && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">Shop the Look</span>}
                  <PostTimestamp createdAt={p.created_at} className="absolute bottom-1 right-1.5 text-[10px] font-semibold text-white drop-shadow" />
                </Link>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>


      <BottomNav />
    </main>
  );
};

// ---------- Sub-components ----------

const SignInCTA = () => {
  const [loading, setLoading] = useState(false);
  const onSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (e: any) {
      toast.error(e?.message ?? "Sign-in failed");
      setLoading(false);
    }
  };
  return (
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Profile</h1>
          <span className="h-9 w-9" />
        </div>
      </header>
      <div className="flex-1 max-w-md w-full mx-auto px-6 flex items-center justify-center">
        <div className="glass rounded-3xl p-7 text-center shadow-soft w-full">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-brand mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </span>
          <h3 className="text-xl font-extrabold tracking-tight">Sign in to Shopitt</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-snug">
            Your profile, drops and saved items live here. Sign in to continue.
          </p>
          <button
            onClick={onSignIn}
            disabled={loading}
            className="mt-5 w-full h-12 rounded-full gradient-brand text-white font-bold inline-flex items-center justify-center gap-2 shadow-brand active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>
      </div>
      <BottomNav />
    </main>
  );
};

const ProfileSkeleton = () => (
  <main className="min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
    <div className="max-w-md mx-auto px-4 pb-32 pt-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 grid grid-cols-3 gap-2 pt-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-24" />
      <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
    <BottomNav />
  </main>
);

const NotFoundState = ({ handle }: { handle?: string }) => (
  <main className="min-h-[100dvh] bg-background flex flex-col">
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold">Profile</h1>
        <span className="h-9 w-9" />
      </div>
    </header>
    <div className="flex-1 flex items-center justify-center px-6 text-center">
      <div>
        <h2 className="text-lg font-extrabold">Profile not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {handle ? `We couldn't find @${handle}.` : "This profile doesn't exist."}
        </p>
        <Link to="/" className="mt-4 inline-flex rounded-full gradient-brand text-white text-sm font-bold px-5 py-2.5 shadow-brand">
          Back to feed
        </Link>
      </div>
    </div>
    <BottomNav />
  </main>
);

const EmptyState = ({ tab, isSelf }: { tab: Tab; isSelf: boolean }) => {
  const copy =
    tab === "looks"
      ? { title: "No Looks yet", desc: "Your style story starts here.", cta: "Create your first Look", to: "/create" }
      : tab === "remixes"
      ? { title: "No Remixes yet", desc: "Your next interpretation could start here.", cta: "Discover Looks", to: "/" }
      : { title: "No Inspiration yet", desc: "Save the Looks that speak to you.", cta: "Discover Looks", to: "/" };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
            className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-muted to-muted/40 border border-border/40"
          />
        ))}
      </div>

      <div className="-mt-24 relative z-10 px-4">
        <div className="glass rounded-3xl p-6 text-center shadow-soft">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </span>
          <h3 className="text-lg font-extrabold text-foreground tracking-tight">{copy.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">
            {isSelf ? copy.desc : "This profile hasn't posted here yet."}
          </p>
          {isSelf && (
            <Link
              to={copy.to}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              {copy.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
