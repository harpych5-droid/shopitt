import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  BadgeCheck,
  MoreHorizontal,
  MessageCircle,
  UserPlus,
  Grid3x3,
  PlayCircle,
  Bookmark,
  Sparkles,
  Plus,
  LogIn,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/hooks/useAuth";
import { useIdentity } from "@/hooks/useIdentity";
import { toast } from "sonner";

type Tab = "posts" | "shorts" | "saved";

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  media_url: string | null;
  title: string | null;
  price: number | null;
  created_at: string;
};

const UserProfile = () => {
  const { handle } = useParams();
  const isSelfRoute = !handle;
  const { user: authUser, profile: globalProfile, loading: identityLoading } = useIdentity();
  const authedUserId = authUser?.id ?? null;

  const [tab, setTab] = useState<Tab>("posts");

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

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
          .select("id, username, avatar_url, country")
          .eq("id", authedUserId)
          .maybeSingle();

        if (error) throw error;
        targetProfile = data as ProfileRow | null;

        // Auto-create if missing
        if (!targetProfile) {
          const { data: authData } = await supabase.auth.getUser();
          const meta = (authData.user?.user_metadata ?? {}) as Record<string, any>;
          const fallbackHandle = (authData.user?.email?.split("@")[0] ?? `user_${authedUserId.slice(0, 6)}`)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_");

          const insertPayload = {
            id: authedUserId,
            username: fallbackHandle,
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
          };

          const { data: created, error: createErr } = await supabase
            .from("profiles")
            .insert(insertPayload)
            .select("id, username, avatar_url, country")
            .maybeSingle();

          if (createErr) {
            console.error("Profile auto-create failed", createErr);
          }
          targetProfile = (created as ProfileRow | null) ?? ({ ...insertPayload, country: null } as ProfileRow);
        }
      } else if (handle) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, country")
          .eq("username", handle)
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

      // Parallel fetch: posts + follower count + following count + amIFollowing
      const [postsRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, user_id, media_url, title, price, created_at")
          .eq("user_id", targetProfile.id)
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
      ]);

      if (postsRes.error) console.error("POSTS error:", postsRes.error);
      console.log("POSTS:", postsRes.data);

      setPosts((postsRes.data as PostRow[] | null) ?? []);
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
  const location = profile.country || "—";

  // No 'type' column on posts — Shorts tab stays empty until schema supports it
  const shorts: PostRow[] = [];
  const tabItems = tab === "posts" ? posts : tab === "shorts" ? shorts : [];

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-bold truncate">@{username}</h1>
            <BadgeCheck className="h-4 w-4 text-brand-purple fill-brand-purple/20 shrink-0" />
          </div>
          <button aria-label="More" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto pb-32">
        {/* COVER */}
        <div className="relative h-32 sm:h-40 gradient-brand overflow-hidden">
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="px-4">
          {/* PROFILE HEADER */}
          <section className="-mt-12">
            <div className="flex items-end gap-4">
              <button
                aria-label="View avatar"
                className="relative shrink-0 active:scale-95 transition-transform"
              >
                <span className="absolute -inset-1 rounded-full gradient-brand" />
                <span className="relative block h-24 w-24 rounded-full bg-background p-[3px]">
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
              <div className="flex-1 grid grid-cols-3 gap-2 pb-1.5">
                {[
                  { label: "Posts", value: posts.length },
                  { label: "Followers", value: followers },
                  { label: "Following", value: following },
                ].map((s) => (
                  <button key={s.label} className="text-center active:scale-95 transition-transform">
                    <div className="text-lg font-extrabold text-foreground tabular-nums">
                      {s.value >= 1000 ? (s.value / 1000).toFixed(1) + "k" : s.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-foreground">{displayName}</h2>
              <p className="mt-1 text-sm text-foreground/85 leading-snug">
                Discovering African fashion, one drop at a time. ✨
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-brand-pink" />
                <span>{location}</span>
              </div>
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
              </>
            )}
          </div>
        </section>

        {/* TABS */}
        <div className="mt-6 sticky top-[57px] z-30 bg-background/90 backdrop-blur-xl -mx-4 px-4">
          <div className="grid grid-cols-3 border-b border-border/60">
            {[
              { key: "posts" as const, icon: Grid3x3, label: "Posts" },
              { key: "shorts" as const, icon: PlayCircle, label: "Shorts" },
              { key: "saved" as const, icon: Bookmark, label: "Saved" },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="relative flex items-center justify-center gap-1.5 py-3 text-sm font-semibold"
                >
                  <t.icon className={`h-4 w-4 ${active ? "text-brand-pink" : "text-muted-foreground"}`} />
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
            <div className="grid grid-cols-3 gap-1">
              {tabItems.map((p) => (
                <Link
                  key={p.id}
                  to={`/p/${p.id}`}
                  className="relative aspect-square overflow-hidden bg-muted active:opacity-80 transition-opacity"
                >
                  {p.media_url && (
                    <img src={p.media_url} alt={p.title ?? ""} loading="lazy" className="h-full w-full object-cover" />
                  )}
                  {tab === "shorts" && (
                    <span className="absolute top-1.5 right-1.5">
                      <PlayCircle className="h-4 w-4 text-white drop-shadow" />
                    </span>
                  )}
                  {p.price != null && (
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-bold text-white drop-shadow">
                      {p.price}
                    </span>
                  )}
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
    tab === "posts"
      ? { title: "No drops yet 🔥", desc: "Post a product or short and watch buyers come to you.", cta: "Create your first drop", to: "/create" }
      : tab === "shorts"
      ? { title: "Your stage awaits 🎬", desc: "Post a 9:16 short — Shorts convert 3x faster.", cta: "Record a short", to: "/create" }
      : { title: "Save your obsessions ✨", desc: "Tap the bookmark on any drop to keep it here.", cta: "Discover feed", to: "/" };

  return (
    <div className="pt-6">
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
            className="aspect-square rounded-md bg-gradient-to-br from-muted to-muted/40 border border-border/40"
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
