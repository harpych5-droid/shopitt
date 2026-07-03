import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIdentity } from "@/hooks/useIdentity";
import {
  addComment,
  deleteComment,
  fetchComments,
  type CommentRow,
} from "@/services/socialService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface CommentsSheetProps {
  open: boolean;
  postId: string | null;
  onClose: () => void;
  onCountChange?: (n: number) => void;
}

export const CommentsSheet = ({ open, postId, onClose, onCountChange }: CommentsSheetProps) => {
  const { user, profile, isAuthed } = useIdentity();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !postId) return;
    setLoading(true);
    fetchComments(postId).then((c) => {
      setComments(c);
      setLoading(false);
      onCountChange?.(c.length);
    });

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        async () => {
          const fresh = await fetchComments(postId);
          setComments(fresh);
          onCountChange?.(fresh.length);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, postId, onCountChange]);

  const handleSend = async () => {
    if (!isAuthed || !user || !postId) {
      toast.error("Sign in to comment");
      return;
    }
    const value = text.trim();
    if (!value) return;
    setSending(true);
    const { error } = await addComment(postId, user.id, value);
    setSending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setText("");
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await deleteComment(id, user.id);
    if (error) toast.error(error);
  };

  return (
    <AnimatePresence>
      {open && postId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-3xl safe-bottom h-[80dvh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-brand-pink" />
                <h2 className="font-display text-lg font-bold">
                  Comments {comments.length > 0 && <span className="text-muted-foreground">· {comments.length}</span>}
                </h2>
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  Be the first to comment.
                </div>
              ) : (
                <ul className="space-y-4">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <span className="h-9 w-9 rounded-full bg-muted shrink-0 overflow-hidden">
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="h-full w-full gradient-brand text-white flex items-center justify-center text-xs font-black">
                            {(c.profiles?.username ?? "S")[0].toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold truncate">
                            @{c.profiles?.username ?? "shopper"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: false })}
                          </span>
                          {user?.id === c.user_id && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="ml-auto text-muted-foreground hover:text-destructive"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-foreground/90 leading-snug break-words">
                          {c.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border/60 px-3 py-2.5 flex items-center gap-2">
              <span className="h-9 w-9 rounded-full overflow-hidden bg-muted shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="h-full w-full gradient-brand text-white flex items-center justify-center text-xs font-black">
                    {(profile?.username ?? "S")[0].toUpperCase()}
                  </span>
                )}
              </span>
              <div className="flex-1 flex items-center rounded-full bg-muted/60 border border-border/60 px-4 h-11">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isAuthed ? "Add a comment…" : "Sign in to comment"}
                  disabled={!isAuthed || sending}
                  className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-70"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!isAuthed || sending || !text.trim()}
                className="h-10 w-10 rounded-full gradient-brand shadow-brand flex items-center justify-center shrink-0 disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
