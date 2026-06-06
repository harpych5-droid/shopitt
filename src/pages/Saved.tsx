import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, Sparkles, Plus, Trash2, Pencil, X } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED } from "@/data/feed";
import { useShopitt, shopitt } from "@/store/useShopittStore";

const Saved = () => {
  const collections = useShopitt((s) => s.collections);
  const postCollections = useShopitt((s) => s.postCollections);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, typeof FEED>();
    collections.forEach((c) => map.set(c.id, []));
    FEED.forEach((post) => {
      const cols = postCollections.get(post.id);
      cols?.forEach((cid) => {
        const arr = map.get(cid);
        if (arr) arr.push(post);
      });
    });
    return map;
  }, [collections, postCollections]);

  const totalSaved = useMemo(() => {
    let n = 0;
    postCollections.forEach((c) => (n += c.size > 0 ? 1 : 0));
    return n;
  }, [postCollections]);

  useEffect(() => {
    document.title = "Saved collections — Shopitt";
  }, []);

  const activeCollection = collections.find((c) => c.id === activeId);
  const activeItems = activeId ? grouped.get(activeId) ?? [] : [];

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    shopitt.createCollection(trimmed);
    setNewName("");
    setCreating(false);
  };

  // Detail view (single collection)
  if (activeCollection) {
    return (
      <main className="min-h-[100dvh] bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setActiveId(null)}
              aria-label="Back"
              className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-base font-bold truncate max-w-[50%]">{activeCollection.name}</h1>
            {activeCollection.id !== "default" ? (
              <button
                onClick={() => {
                  shopitt.deleteCollection(activeCollection.id);
                  setActiveId(null);
                }}
                aria-label="Delete collection"
                className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center text-destructive"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            ) : (
              <span className="h-9 w-9" />
            )}
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 pt-4">
          <p className="text-xs text-muted-foreground mb-3">
            {activeItems.length} {activeItems.length === 1 ? "post" : "posts"}
          </p>
          {activeItems.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">Nothing here yet. Tap save on any post to add it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeItems.map((p) => (
                <Link
                  key={p.id}
                  to={`/p/${p.id}`}
                  className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform shadow-card"
                >
                  <div className="aspect-[4/5] bg-muted">
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold truncate">{p.title}</p>
                    {p.postType !== "inspiration" ? (
                      <p className="text-sm font-display font-extrabold tabular-nums mt-0.5">
                        {p.currency}{p.price}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">@{p.brandHandle}</p>
                    )}
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

  // Index view (all collections)
  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-base font-bold">Collections</h1>
          <button
            onClick={() => setCreating(true)}
            aria-label="New collection"
            className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4">
        <p className="text-xs text-muted-foreground mb-3">
          {totalSaved} saved · {collections.length} {collections.length === 1 ? "collection" : "collections"}
        </p>

        {creating && (
          <div className="mb-4 rounded-2xl bg-card border border-border p-3 flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Collection name…"
              className="flex-1 h-10 rounded-xl bg-muted px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleCreate} className="h-10 px-4 rounded-xl gradient-brand text-white text-sm font-bold">
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); }}
              aria-label="Cancel"
              className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {totalSaved === 0 && !creating ? (
          <div className="rounded-3xl bg-card border border-border p-6 text-center shadow-card">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
              <Bookmark className="h-6 w-6 text-white" />
            </span>
            <h3 className="mt-3 font-display text-base font-extrabold">Save your obsessions ✨</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the bookmark on any post and organise into collections like Dream Closet or Date Night.
            </p>
            <Link
              to="/discover"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              Discover inspiration
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collections.map((c) => {
              const items = grouped.get(c.id) ?? [];
              const covers = items.slice(0, 4);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className="text-left rounded-2xl overflow-hidden bg-card border border-border active:scale-95 transition-transform shadow-card"
                >
                  <div className="aspect-square bg-muted grid grid-cols-2 grid-rows-2 gap-0.5">
                    {covers.length === 0 ? (
                      <div className="col-span-2 row-span-2 flex items-center justify-center text-muted-foreground">
                        <Bookmark className="h-7 w-7" />
                      </div>
                    ) : (
                      Array.from({ length: 4 }).map((_, i) => {
                        const item = covers[i];
                        return (
                          <div key={i} className="bg-muted overflow-hidden">
                            {item && (
                              <img src={item.image} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-display text-sm font-bold truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Saved;
