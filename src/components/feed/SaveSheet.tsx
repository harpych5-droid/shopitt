import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, Bookmark, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useIdentity } from "@/hooks/useIdentity";
import {
  fetchCollections,
  ensureDefaultCollection,
  createCollection,
  togglePostInCollection,
  savePost,
  fetchPostMemberships,
  type CollectionRow,
} from "@/services/socialService";
import { toast } from "sonner";

interface SaveSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string | null;
}

export const SaveSheet = ({ open, onClose, postId }: SaveSheetProps) => {
  const { user, isAuthed } = useIdentity();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user || !postId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await ensureDefaultCollection(user.id);
      const [cols, allMem] = await Promise.all([
        fetchCollections(user.id),
        fetchPostMemberships(user.id),
      ]);
      if (cancelled) return;
      setCollections(cols);
      setMemberships(allMem.get(postId) ?? new Set<string>());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, postId]);

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setName("");
    }
  }, [open]);

  if (!postId) return null;

  const handleToggle = async (collectionId: string) => {
    if (!user) return;
    const isMember = memberships.has(collectionId);
    setBusyId(collectionId);
    setMemberships((prev) => {
      const next = new Set(prev);
      isMember ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
    const { error } = await togglePostInCollection(collectionId, postId, isMember);
    if (!isMember) {
      // also record in saved_items for quick lookup
      await savePost(postId, user.id);
    }
    setBusyId(null);
    if (error) toast.error(error);
  };

  const handleCreate = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await createCollection(user.id, trimmed);
    if (error || !data) {
      toast.error(error ?? "Could not create collection");
      return;
    }
    setCollections((prev) => [...prev, data]);
    setName("");
    setCreating(false);
    await togglePostInCollection(data.id, postId, false);
    await savePost(postId, user.id);
    setMemberships((prev) => new Set(prev).add(data.id));
  };

  return (
    <AnimatePresence>
      {open && (
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
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-3xl safe-bottom max-h-[80dvh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-brand-pink" />
                <h2 className="font-display text-lg font-bold">Save to collection</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {!isAuthed ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Sign in to save posts to collections.
                </p>
              ) : loading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul className="space-y-1">
                  {collections.map((c) => {
                    const checked = memberships.has(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => handleToggle(c.id)}
                          disabled={busyId === c.id}
                          className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-2xl hover:bg-muted/60 active:scale-[0.99] transition disabled:opacity-60"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${checked ? "gradient-brand" : "bg-muted"}`}>
                              <Bookmark className={`h-5 w-5 ${checked ? "text-white fill-white" : "text-muted-foreground"}`} />
                            </div>
                            <span className="font-semibold truncate">{c.name}</span>
                          </div>
                          {busyId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : checked ? (
                            <span className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center shrink-0">
                              <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {isAuthed && (
                <div className="mt-3 px-3">
                  {creating ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="e.g. Dream Closet, Date Night…"
                        className="flex-1 h-11 rounded-xl bg-muted px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button onClick={handleCreate} className="h-11 px-4 rounded-xl gradient-brand text-white text-sm font-bold">
                        Create
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-dashed border-border hover:bg-muted/40 transition"
                    >
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-muted-foreground">New collection</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
