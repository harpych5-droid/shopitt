import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchMessages, sendMessage, findOrCreateConversation, type MessageRow } from "@/services/chatService";
import { toast } from "sonner";

const ChatThread = () => {
  const { handle = "" } = useParams();
  const { user, isAuthed } = useIdentity();
  const [otherProfile, setOtherProfile] = useState<{ id: string; username: string | null; avatar_url: string | null; full_name: string | null } | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Chat with @${handle} — Vylogue`;
  }, [handle]);

  // Resolve other profile (handle can be username or uuid)
  useEffect(() => {
    if (!isAuthed || !user || !handle) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(handle);
      const q = supabase.from("profiles").select("id, username, avatar_url, full_name");
      const { data } = looksLikeUuid
        ? await q.eq("id", handle).maybeSingle()
        : await q.eq("username", handle).maybeSingle();
      if (cancelled) return;
      if (!data) { setLoading(false); return; }
      setOtherProfile(data as any);
      const { id, error } = await findOrCreateConversation(user.id, (data as any).id);
      if (error || !id) { toast.error(error ?? "Could not open chat"); setLoading(false); return; }
      setConvId(id);
      const msgs = await fetchMessages(id);
      if (cancelled) return;
      setMessages(msgs);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [handle, isAuthed, user]);

  // Realtime new messages
  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`convo-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (payload) => {
        setMessages((m) => [...m, payload.new as MessageRow]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !user || !convId) return;
    setDraft("");
    const { error } = await sendMessage(convId, user.id, text);
    if (error) toast.error(error);
  };

  const displayName = otherProfile?.full_name || otherProfile?.username || handle;

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2">
          <Link to="/chats" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link to={otherProfile ? `/u/${otherProfile.username ?? otherProfile.id}` : "#"} className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="relative shrink-0">
              <span className="absolute -inset-0.5 rounded-full gradient-brand" />
              <span className="relative block h-9 w-9 rounded-full bg-background p-[2px] overflow-hidden">
                {otherProfile?.avatar_url ? (
                  <img src={otherProfile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center text-xs font-black text-white">
                    {(displayName[0] ?? "S").toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                <BadgeCheck className="h-3.5 w-3.5 text-brand-purple fill-brand-purple/20" />
              </div>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {!isAuthed ? (
            <p className="text-center text-sm text-muted-foreground py-10">Sign in to chat.</p>
          ) : loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10">Say hi 👋</p>
          ) : (
            messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${m.sender_id === user?.id ? "gradient-brand text-white rounded-br-md shadow-brand" : "bg-card border border-border/60 text-foreground rounded-bl-md"}`}>
                  {m.message_text}
                </div>
              </motion.div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-full bg-muted/60 border border-border/60 px-4 h-11">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message…" disabled={!convId} className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-60" />
          </div>
          <button onClick={send} aria-label="Send" disabled={!draft.trim() || !convId} className="h-10 w-10 rounded-full gradient-brand shadow-brand flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default ChatThread;
