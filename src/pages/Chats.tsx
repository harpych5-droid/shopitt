import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchConversations, type ConversationRow } from "@/services/chatService";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

const Chats = () => {
  const { user, isAuthed } = useIdentity();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Chats — Shopitt";
  }, []);

  useEffect(() => {
    if (!isAuthed || !user) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      const list = await fetchConversations(user.id);
      if (!cancelled) { setConversations(list); setLoading(false); }
    };
    load();
    const channel = supabase
      .channel(`me-convos-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [isAuthed, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = c.other;
      return (
        (other?.username ?? "").toLowerCase().includes(q) ||
        (other?.full_name ?? "").toLowerCase().includes(q) ||
        (c.last_message ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, conversations]);

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Chats</h1>
          <span className="w-9" />
        </div>
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-muted/60 border border-border/60 px-4 h-10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto pb-32">
        {!isAuthed ? (
          <EmptyChats title="Sign in to chat" body="Log in to talk to sellers and buyers." />
        ) : loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length > 0 ? (
          <ul className="px-2 pt-2">
            {filtered.map((c) => {
              const other = c.other;
              const name = other?.full_name || other?.username || "Shopper";
              const handle = other?.username || (other?.id ?? "");
              const time = c.updated_at ? formatDistanceToNow(new Date(c.updated_at), { addSuffix: false }) : "";
              return (
                <li key={c.id}>
                  <Link to={`/chats/${handle}`} className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors">
                    <span className="relative shrink-0">
                      <span className="absolute -inset-0.5 rounded-full gradient-brand" />
                      <span className="relative block h-12 w-12 rounded-full bg-background p-[2px] overflow-hidden">
                        {other?.avatar_url ? (
                          <img src={other.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center text-sm font-black text-white">
                            {(name[0] ?? "S").toUpperCase()}
                          </span>
                        )}
                      </span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{name}</p>
                        <span className="text-[11px] text-muted-foreground shrink-0">{time}</span>
                      </div>
                      <p className="text-xs truncate text-muted-foreground mt-0.5">
                        {c.last_message ?? "Start the conversation…"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyChats title="No chats yet" body="Message a seller from any product page to start." />
        )}
      </div>

      <BottomNav />
    </main>
  );
};

const EmptyChats = ({ title, body }: { title: string; body: string }) => (
  <div className="px-6 pt-16 text-center">
    <div className="relative mx-auto h-32 w-32">
      <motion.span animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 rounded-full bg-brand-pink/30 blur-2xl" />
      <div className="relative h-full w-full rounded-3xl gradient-brand shadow-brand flex items-center justify-center">
        <MessageCircle className="h-12 w-12 text-white" />
      </div>
    </div>
    <h2 className="mt-6 text-xl font-extrabold tracking-tight">{title}</h2>
    <p className="mt-1.5 text-sm text-muted-foreground leading-snug">{body}</p>
    <Link to="/" className="mt-5 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-3 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform">
      <Sparkles className="h-4 w-4" />
      Discover Shopitt Feed
    </Link>
  </div>
);

export default Chats;
