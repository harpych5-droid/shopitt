import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Heart, ShoppingBag, MessageCircle, UserPlus, Sparkles, Loader2, CheckCheck, Megaphone, Reply } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/services/socialService";

const PAGE_SIZE = 20;

const iconFor = (type: string | null) => {
  switch ((type ?? "").toLowerCase()) {
    case "like":
    case "comment_like":
    case "post_like": return Heart;
    case "comment":
    case "new_comment": return MessageCircle;
    case "reply":
    case "comment_reply": return Reply;
    case "follow":
    case "new_follower": return UserPlus;
    case "order":
    case "order_received":
    case "order_shipped":
    case "order_delivered":
    case "order_status": return ShoppingBag;
    case "message": return MessageCircle;
    case "announcement":
    case "admin": return Megaphone;
    case "new_drop": return Sparkles;
    default: return Bell;
  }
};

const Alerts = () => {
  const { user, isAuthed } = useIdentity();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Alerts — Shopitt";
  }, []);

  const loadPage = useCallback(async (offset: number, replace: boolean) => {
    if (!user) return;
    const rows = await fetchNotifications(user.id, PAGE_SIZE, offset);
    setHasMore(rows.length === PAGE_SIZE);
    setItems((prev) => (replace ? rows : [...prev, ...rows]));
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]); setUnread(0); setLoading(false); return;
    }
    setLoading(true);
    const [_, count] = await Promise.all([
      loadPage(0, true),
      fetchUnreadNotificationCount(user.id),
    ]);
    setUnread(count);
    setLoading(false);
  }, [user, loadPage]);

  useEffect(() => {
    if (!isAuthed || !user) {
      setItems([]); setUnread(0); setLoading(false); return;
    }
    refresh();
    const channel = supabase
      .channel(`me-notifs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        refresh,
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthed, user, refresh]);

  // infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMore || !hasMore) return;
      setLoadingMore(true);
      await loadPage(items.length, false);
      setLoadingMore(false);
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, hasMore, loading, loadingMore, loadPage]);

  const markAll = useCallback(async () => {
    if (!user) return;
    await markNotificationsRead(user.id);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  const handleOpen = async (n: NotificationRow) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
  };

  const linkFor = (n: NotificationRow) => {
    if (n.post_id) return `/p/${n.post_id}`;
    if (n.actor_id) return `/u/${n.actor_id}`;
    return "#";
  };

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">
            Alerts {unread > 0 && <span className="ml-1 text-xs text-brand-pink">({unread})</span>}
          </h1>
          {unread > 0 ? (
            <button
              onClick={markAll}
              className="h-9 px-3 rounded-full hover:bg-muted/50 flex items-center gap-1 text-xs font-semibold text-brand-pink"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 pb-32">
        {!isAuthed ? (
          <div className="rounded-3xl bg-card border border-border p-6 text-center mt-6">
            <p className="text-sm text-muted-foreground">Sign in to see your alerts.</p>
          </div>
        ) : loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border p-8 text-center mt-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
              <Bell className="h-6 w-6 text-white" />
            </span>
            <h3 className="mt-3 font-display text-base font-extrabold">You're all caught up</h3>
            <p className="mt-1 text-xs text-muted-foreground">Likes, comments, follows, orders and messages land here.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((n) => {
                const Icon = iconFor(n.type);
                const title = n.title ?? n.message ?? "New activity";
                const body = n.body ?? "";
                return (
                  <li key={n.id}>
                    <Link
                      to={linkFor(n)}
                      onClick={() => handleOpen(n)}
                      className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
                        n.is_read ? "bg-card border-border/60" : "bg-brand-pink/5 border-brand-pink/30"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                          </span>
                        </div>
                        {body && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{body}</p>}
                      </div>
                      {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-brand-pink shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div ref={sentinelRef} className="h-8" />
            {loadingMore && (
              <div className="py-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <p className="text-center text-[11px] text-muted-foreground mt-4">You're all caught up ✨</p>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Alerts;
