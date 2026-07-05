import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Heart, ShoppingBag, MessageCircle, UserPlus, Sparkles, Loader2, CheckCheck } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useNotifications } from "@/hooks/useNotifications";
import { useIdentity } from "@/hooks/useIdentity";
import { formatDistanceToNow } from "date-fns";

const iconFor = (type: string | null) => {
  switch ((type ?? "").toLowerCase()) {
    case "like": return Heart;
    case "comment": return MessageCircle;
    case "follow": return UserPlus;
    case "order":
    case "order_shipped":
    case "order_delivered": return ShoppingBag;
    case "new_drop": return Sparkles;
    default: return Bell;
  }
};

const Alerts = () => {
  const { isAuthed } = useIdentity();
  const { items, unread, loading, markAllRead } = useNotifications();

  useEffect(() => {
    document.title = "Alerts — Shopitt";
  }, []);

  useEffect(() => {
    if (unread > 0) {
      // auto-mark after brief view
      const t = setTimeout(() => markAllRead(), 1200);
      return () => clearTimeout(t);
    }
  }, [unread, markAllRead]);

  const linkFor = (n: (typeof items)[number]) => {
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
          <h1 className="text-base font-bold">Alerts</h1>
          {unread > 0 ? (
            <button
              onClick={markAllRead}
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
            <p className="mt-1 text-xs text-muted-foreground">Alerts about likes, comments, follows and orders land here.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const Icon = iconFor(n.type);
              const title = n.title ?? n.message ?? "New activity";
              const body = n.body ?? "";
              return (
                <li key={n.id}>
                  <Link
                    to={linkFor(n)}
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
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Alerts;
