import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, TrendingUp, Clock, X, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED, CATEGORIES } from "@/data/feed";

const RECENT_INITIAL = ["jordan", "cashmere knit", "fragrance", "headphones"];

const Search = () => {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>(RECENT_INITIAL);

  useEffect(() => {
    document.title = "Search — Vylogue";
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return FEED.filter(
      (f) =>
        f.title.toLowerCase().includes(needle) ||
        f.brand.toLowerCase().includes(needle) ||
        f.hashtags.some((h) => h.includes(needle)),
    );
  }, [q]);

  const trending = FEED.slice().sort((a, b) => b.likes - a.likes).slice(0, 4);

  const submit = (term: string) => {
    setQ(term);
    setRecent((r) => [term, ...r.filter((x) => x !== term)].slice(0, 6));
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
              onKeyDown={(e) => e.key === "Enter" && q && submit(q)}
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
        {/* Quick category filters */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">
            Categories
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => submit(c.toLowerCase())}
                className="shrink-0 rounded-full bg-card border border-border/60 px-4 h-9 text-xs font-bold hover:bg-muted/40 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {q.trim() ? (
          <section>
            <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">
              Results ({results.length})
            </h2>
            {results.length === 0 ? (
              <div className="rounded-3xl glass p-6 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
                  <Sparkles className="h-6 w-6 text-white" />
                </span>
                <h3 className="mt-3 text-base font-extrabold">No matches yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try one of the trending searches below.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.id}`}
                    className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform"
                  >
                    <div className="aspect-[4/5] bg-muted">
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate">{p.title}</p>
                      <p className="text-sm font-extrabold tabular-nums mt-0.5">
                        {p.currency}{p.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Recent */}
            <section>
              <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-2">
                Recent searches
              </h2>
              <ul className="space-y-1.5">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      onClick={() => submit(r)}
                      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left text-sm text-foreground">{r}</span>
                      <X
                        className="h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecent((rs) => rs.filter((x) => x !== r));
                        }}
                      />
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

            {/* Trending */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">
                  Trending now
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] text-brand-pink font-bold">
                  <TrendingUp className="h-3 w-3" /> Hot
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {trending.map((p) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.id}`}
                    className="rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform"
                  >
                    <div className="aspect-[4/5] bg-muted relative">
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                      <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.likes.toLocaleString()} likes
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate">{p.title}</p>
                      <p className="text-sm font-extrabold tabular-nums mt-0.5">
                        {p.currency}{p.price}
                      </p>
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
