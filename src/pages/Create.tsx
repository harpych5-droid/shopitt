import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Box, Video, Briefcase, ChevronRight, Camera } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";

type Mode = null | "product" | "short" | "service";
type PostType = "product" | "inspiration";

const TYPES = [
  { key: "product" as const, icon: Box, title: "Post Product", desc: "Sell fashion, sneakers, accessories…", color: "from-brand-pink to-brand-purple" },
  { key: "short" as const, icon: Video, title: "Post Short Video", desc: "Vertical 9:16 — appears in Shorts", color: "from-brand-pink to-brand-purple" },
  { key: "service" as const, icon: Briefcase, title: "Post Service", desc: "Tailoring, beauty, styling & more", color: "from-brand-purple to-brand-pink" },
];

const Create = () => {
  const [mode, setMode] = useState<Mode>(null);
  const [postType, setPostType] = useState<PostType>("product");

  useEffect(() => {
    document.title = "Create Post — Shopitt";
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {mode ? (
            <button onClick={() => setMode(null)} aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/" aria-label="Close" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
              <X className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-base font-bold">Create Post</h1>
          {mode ? (
            <button className="rounded-full bg-muted px-4 py-1.5 text-xs font-bold text-foreground/70">Post</button>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-6 pb-32">
        {!mode ? (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight">What are you creating?</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your post type to get started</p>

            <ul className="mt-6 space-y-3">
              {TYPES.map((t) => (
                <li key={t.key}>
                  <button
                    onClick={() => setMode(t.key)}
                    className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <span className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-brand`}>
                      <t.icon className="h-6 w-6 text-white" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-foreground">{t.title}</span>
                      <span className="block text-xs text-muted-foreground truncate">{t.desc}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <form className="space-y-5">
            {mode === "product" && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Post type</span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-full bg-muted/50 p-1">
                  {(["product", "inspiration"] as PostType[]).map((t) => {
                    const active = postType === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setPostType(t)}
                        className={`h-9 rounded-full text-xs font-extrabold capitalize transition-all ${
                          active ? "gradient-brand text-white shadow-brand" : "text-muted-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="aspect-square w-32 rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center text-center">
              <Camera className="h-7 w-7 text-brand-pink" />
              <span className="mt-1 text-[11px] font-semibold text-foreground">Add Photo/Video</span>
              <span className="text-[10px] text-muted-foreground">0/5</span>
            </div>


            <div>
              <span className="inline-block rounded-full gradient-brand px-3 py-1 text-[11px] font-bold text-white">Drop Title *</span>
              <input
                type="text"
                placeholder="e.g. Air Jordan 1 Retro High"
                className="mt-2 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">This appears as the hook text on your post — make it count.</p>
            </div>

            <div>
              <label className="text-sm font-semibold">Description</label>
              <textarea
                rows={3}
                placeholder="Tell buyers what makes this special…"
                className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Hashtags</label>
              <input
                type="text"
                placeholder="#fashion #streetwear #shopzambia"
                className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brand-pink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Price *</label>
                <input type="number" placeholder="0" className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink" />
              </div>
              <div>
                <label className="text-sm font-semibold">Quantity *</label>
                <input type="number" placeholder="0" className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink" />
              </div>
            </div>
          </form>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Create;
