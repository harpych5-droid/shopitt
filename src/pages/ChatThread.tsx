import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, ImagePlus, Smile, X, Reply, Flame, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import { fetchMessages, sendMessage, findOrCreateConversation, toggleMessageReaction, type MessageRow } from "@/services/chatService";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";
import { VerificationBadge } from "@/components/identity/VerificationBadge";

const ChatThread = () => {
  const { handle = "" } = useParams();
  const { user, isAuthed } = useIdentity();
  const [otherProfile, setOtherProfile] = useState<{ id: string; username: string | null; avatar_url: string | null; full_name: string | null; is_verified: boolean | null } | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Chat with @${handle} — Shopitt`;
  }, [handle]);

  // Resolve other profile (handle can be username or uuid)
  useEffect(() => {
    if (!isAuthed || !user || !handle) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(handle);
      const q = supabase.from("profiles").select("id, username, avatar_url, full_name, is_verified");
      let { data } = looksLikeUuid
        ? await q.eq("id", handle).maybeSingle()
        : await q.ilike("username", handle).maybeSingle();
      if (!data) {
        const fallback = supabase.from("profiles").select("id, username, avatar_url, is_verified");
        const result = looksLikeUuid
          ? await fallback.eq("id", handle).maybeSingle()
          : await fallback.ilike("username", handle).maybeSingle();
        data = result.data;
      }
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
    if ((!text && !media) || !user || !convId || sending) return;
    setSending(true);
    setDraft("");
    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "video" | "gif" | null = null;
      if (media) {
        const uploaded = await uploadToCloudinary(media, { resourceType: media.type.startsWith("video/") ? "video" : "image", folder: `shopitt/chats/${convId}` });
        mediaUrl = uploaded.secure_url;
        mediaType = media.type.startsWith("video/") ? "video" : "image";
      }
      const { error } = await sendMessage(convId, user.id, text, { mediaUrl, mediaType, replyToMessageId: replyTo?.id });
      if (error) toast.error(error);
      setReplyTo(null); setMedia(null); setMediaPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally { setSending(false); }
  };

  const displayName = otherProfile?.username || otherProfile?.full_name || handle;

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2">
          <Link to="/chats" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link to={otherProfile ? `/u/${otherProfile.username ?? otherProfile.id}` : "#"} className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="relative shrink-0">
              <span className="relative block h-9 w-9 rounded-full overflow-hidden">
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
                <VerificationBadge verified={otherProfile?.is_verified} className="h-3.5 w-3.5" />
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
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`group flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-snug ${m.sender_id === user?.id ? "gradient-brand text-white rounded-br-md shadow-brand" : "bg-card border border-border/60 text-foreground rounded-bl-md"}`}>
                  {m.reply_to_message_id && <p className="mb-2 border-l-2 border-current/40 pl-2 text-xs opacity-70">Replying to a message</p>}
                  {m.media_url && <img src={m.media_url} alt="Shared in chat" className="mb-2 max-h-64 rounded-xl object-cover" />}
                  {m.message_text && <span>{m.message_text}</span>}
                  <div className="mt-2 flex items-center gap-2 text-[10px] opacity-70"><button onClick={() => setReplyTo(m)} aria-label="Reply"><Reply className="h-3.5 w-3.5" /></button><button onClick={async () => { if (!user) { toast.error("Sign in to react"); return; } const result = await toggleMessageReaction(m.id, user.id, "fire"); if (result.error) { console.error("Message reaction failed", result.error); toast.error(`Could not react: ${result.error}`); } }} aria-label="React with fire"><Flame className="h-3.5 w-3.5" /></button><button onClick={async () => { if (!user) { toast.error("Sign in to react"); return; } const result = await toggleMessageReaction(m.id, user.id, "heart"); if (result.error) { console.error("Message reaction failed", result.error); toast.error(`Could not react: ${result.error}`); } }} aria-label="React with heart"><Heart className="h-3.5 w-3.5" /></button></div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom">
        <div className="max-w-md mx-auto px-3 py-2.5 flex flex-col gap-2">
          {replyTo && <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs"><span className="truncate">Replying to: {replyTo.message_text || "shared media"}</span><button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-4 w-4" /></button></div>}
          {mediaPreview && <div className="relative w-fit"><img src={mediaPreview} alt="Selected preview" className="h-16 w-16 rounded-xl object-cover" /><button onClick={() => { setMedia(null); setMediaPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-foreground p-1 text-background" aria-label="Remove media"><X className="h-3 w-3" /></button></div>}
          {emojiOpen && <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-2">{["😀", "😂", "😍", "😮", "🔥", "❤️", "👏", "😭", "✨", "🙌"].map((emoji) => <button key={emoji} onClick={() => setDraft((value) => value + emoji)} className="p-2 text-xl">{emoji}</button>)}</div>}
          <div className="flex items-center gap-2">
          <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-muted/60" aria-label="Attach media"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; setMedia(file); setMediaPreview(file ? URL.createObjectURL(file) : null); }} /></label>
          <button onClick={() => setEmojiOpen((value) => !value)} aria-label="Open emoji picker" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60"><Smile className="h-4 w-4" /></button>
          <div className="flex-1 flex items-center rounded-full bg-muted/60 border border-border/60 px-4 h-11">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message…" disabled={!convId} className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-60" />
          </div>
          <button onClick={send} aria-label="Send" disabled={(!draft.trim() && !media) || !convId || sending} className="h-10 w-10 rounded-full gradient-brand shadow-brand flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
            <Send className="h-4 w-4 text-white" />
          </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatThread;
