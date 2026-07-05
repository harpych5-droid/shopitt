import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, TrendingUp, Clock, X, Sparkles, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { supabase } from "@/lib/supabase";
import { postToFeedItem, type DbPost } from "@/services/postsService";
import type { FeedItem } from "@/data/feed";

const RECENT_KEY = "shopitt:recent-search";
const CATEGORIES = ["Fashion", "Beauty", "Tech", "Footwear", "Inspiration"];

const SELECT = `
  id, user_id, title, description, media_url, media_urls, media, media_type,
  price, currency, hashtags, post_type, category_name, is_available,
  stock_quantity, delivery_type, has_free_delivery, rating, review_count, created_at,
  profiles!posts_user_id_fkey ( username, avatar_url, full_name, country )
`;

const Search = () => {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  });
  const [results, setResults] = useState<FeedItem[]>([]);
  const [trending, setTrending] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Search — Shopitt"; }, []);

  // Trending: newest posts
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("posts").select(SELECT).eq("is_available", true)
        .order("created_at", { ascending: false }).limit(8);
      setTrending(((data ?? []) as DbPost[]).map(postToFeedItem));
    })();
  }, []);

  // Debounced search
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const like = `%${term}%`;
      const { data } = await (supabase as any)
        .from("posts").select(SELECT).eq("is_available", true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .order("created_at", { ascending: false }).limit(30);
      setResults(((data ?? []) as DbPost[]).map(postToFeedItem));
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const submit = (term: string) => {
    setQ(term);
    const next = [term, ...recent.filter((x) => x !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-3 py-3 flex items-center gap-2">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center gap-2 rounded-full bg-muted/60 px-3 h-10">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search drops, brands, hashtags…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear" className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">Categories</h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => submit(c.toLowerCase())}
                className="shrink-0 rounded-full bg-card border border-border/60 px-4 h-9 text-xs font-bold hover:bg-muted/40 transition-colors">
                {c}
              </button>
            ))}
          </div>
        </section>

        {q.trim() ? (
          <section>
            <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">
              Results {!loading && `(${results.length})`}
            </h2>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : results.length === 0 ? (
              <div className="rounded-3xl glass p-6 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
                  <Sparkles className="h-6 w-6 text-white" />
                </span>
                <h3 className="mt-3 text-base font-extrabold">No matches yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">Try one of the trending searches below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {results.map((p) => (
                  <Link key={p.id} to={`/p/${p.id}`}
                    className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform">
                    <div className="aspect-[4/5] bg-muted">
                      <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate">{p.title}</p>
                      <p className="text-sm font-extrabold tabular-nums mt-0.5">{p.currency}{p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">Recent searches</h2>
              <ul className="space-y-1.5">
                {recent.map((r) => (
                  <li key={r}>
                    <button onClick={() => submit(r)}
                      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-3 py-2.5 hover:bg-muted/40 transition-colors">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left text-sm text-foreground">{r}</span>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = recent.filter((x) => x !== r);
                          setRecent(next);
                          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
                        }} />
                    </button>
                  </li>
                ))}
                {recent.length === 0 && (
                  <li className="text-center text-xs text-muted-foreground py-4">
                    No recent searches yet — try the trending drops below.
                  </li>
                )}
              </ul>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">Trending now</h2>
                <span className="inline-flex items-center gap-1 text-[11px] text-brand-pink font-bold">
                  <TrendingUp className="h-3 w-3" /> Hot
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {trending.map((p) => (
                  <Link key={p.id} to={`/p/${p.id}`}
                    className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform">
                    <div className="aspect-[4/5] bg-muted relative">
                      <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                      {p.drop && (
                        <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white truncate max-w-[90%]">
                          {p.drop}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate">{p.title}</p>
                      <p className="text-sm font-extrabold tabular-nums mt-0.5">{p.currency}{p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
};

export default Search;
