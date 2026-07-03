import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, Sparkles, Plus, Trash2, X, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import {
  fetchCollections,
  ensureDefaultCollection,
  createCollection,
  deleteCollection,
  fetchCollectionPosts,
  type CollectionRow,
} from "@/services/socialService";
import { toast } from "sonner";

const Saved = () => {
  const { user, isAuthed } = useIdentity();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { document.title = "Saved collections — Shopitt"; }, []);

  const loadCollections = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    await ensureDefaultCollection(user.id);
    const cols = await fetchCollections(user.id);
    setCollections(cols);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthed) { setLoading(false); return; }
    loadCollections();
  }, [isAuthed, loadCollections]);

  useEffect(() => {
    if (!activeId) return;
    setActiveLoading(true);
    fetchCollectionPosts(activeId).then((items) => {
      setActiveItems(items);
      setActiveLoading(false);
    });
  }, [activeId]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !user) return;
    const { data, error } = await createCollection(user.id, trimmed);
    if (error) { toast.error(error); return; }
    if (data) setCollections((prev) => [...prev, data]);
    setNewName(""); setCreating(false);
  };

  const activeCollection = collections.find((c) => c.id === activeId);

  if (!isAuthed) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32">
        <div className="max-w-md mx-auto px-6 pt-24 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
            <Bookmark className="h-6 w-6 text-white" />
          </span>
          <h3 className="mt-3 font-display text-base font-extrabold">Sign in to save posts</h3>
          <p className="mt-1 text-xs text-muted-foreground">Build collections like Dream Closet or Date Night.</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (activeCollection) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setActiveId(null)} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-base font-bold truncate max-w-[50%]">{activeCollection.name}</h1>
            {!activeCollection.is_default ? (
              <button onClick={async () => { const { error } = await deleteCollection(activeCollection.id); if (error) toast.error(error); else { setCollections((c) => c.filter((x) => x.id !== activeCollection.id)); setActiveId(null); } }} aria-label="Delete" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (<span className="h-9 w-9" />)}
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 pt-4">
          <p className="text-xs text-muted-foreground mb-3">{activeItems.length} {activeItems.length === 1 ? "post" : "posts"}</p>
          {activeLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : activeItems.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">Nothing here yet. Tap save on any post to add it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeItems.map((p) => (
                <Link key={p.id} to={`/p/${p.id}`} className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform shadow-card">
                  <div className="aspect-[4/5] bg-muted">
                    {p.media_url && <img src={p.media_url} alt={p.title ?? ""} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold truncate">{p.title ?? "Untitled"}</p>
                    {p.price != null && <p className="text-sm font-display font-extrabold tabular-nums mt-0.5">{p.currency ?? ""} {p.price}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-base font-bold">Collections</h1>
          <button onClick={() => setCreating(true)} aria-label="New collection" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {collections.length} {collections.length === 1 ? "collection" : "collections"}
            </p>

            {creating && (
              <div className="mb-4 rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Collection name…" className="flex-1 h-10 rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <button onClick={handleCreate} className="h-10 px-4 rounded-xl gradient-brand text-white text-sm font-bold">Create</button>
                <button onClick={() => { setCreating(false); setNewName(""); }} aria-label="Cancel" className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {collections.length === 0 && !creating ? (
              <div className="rounded-3xl bg-card border border-border p-6 text-center shadow-card">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
                  <Bookmark className="h-6 w-6 text-white" />
                </span>
                <h3 className="mt-3 font-display text-base font-extrabold">Save your obsessions ✨</h3>
                <p className="mt-1 text-xs text-muted-foreground">Tap the bookmark on any post to add it here.</p>
                <Link to="/" className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
                  <Sparkles className="h-4 w-4" />
                  Discover inspiration
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {collections.map((c) => (
                  <button key={c.id} onClick={() => setActiveId(c.id)} className="text-left rounded-2xl overflow-hidden bg-card border border-border active:scale-95 transition-transform shadow-card">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <Bookmark className="h-7 w-7 text-muted-foreground" />}
                    </div>
                    <div className="p-3">
                      <p className="font-display text-sm font-bold truncate">{c.name}</p>
                      {c.is_default && <p className="text-[11px] text-muted-foreground mt-0.5">Default</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Saved;
