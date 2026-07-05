import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Flame, TrendingUp, Bookmark, Users, Star, Compass } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { TopNav } from "@/components/feed/TopNav";
import { FEED, type FeedItem } from "@/data/feed";

type Section = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  items: FeedItem[];
  layout?: "card" | "tall" | "creator";
};

const InspirationCard = ({ item }: { item: FeedItem }) => (
  <Link
    to={`/p/${item.id}`}
    className="relative shrink-0 w-[170px] aspect-[3/4] rounded-2xl overflow-hidden bg-muted active:scale-[0.97] transition-transform shadow-card"
  >
    <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
    <div className="absolute inset-0 overlay-bottom" />
    {item.badge && (
      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-md">
        {item.badge}
      </span>
    )}
    <div className="absolute inset-x-0 bottom-0 p-2.5">
      <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.title}</p>
      <p className="text-[10px] text-white/70 mt-0.5 truncate">@{item.brandHandle}</p>
    </div>
  </Link>
);

const ProductCard = ({ item }: { item: FeedItem }) => (
  <Link
    to={`/p/${item.id}`}
    className="shrink-0 w-[160px] active:scale-[0.97] transition-transform"
  >
    <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-card">
      <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
    </div>
    <div className="pt-2 px-0.5">
      <p className="text-xs font-semibold truncate">{item.title}</p>
      <p className="text-sm font-display font-extrabold tabular-nums mt-0.5">
        {item.currency}{item.price}
      </p>
    </div>
  </Link>
);

const CreatorChip = ({ item }: { item: FeedItem }) => (
  <Link
    to={`/u/${item.brandHandle}`}
    className="shrink-0 flex flex-col items-center gap-2 w-[80px] active:scale-95 transition-transform"
  >
    <div className="relative">
      <span className="absolute -inset-0.5 rounded-full gradient-brand" />
      <div className="relative h-16 w-16 rounded-full bg-background p-[2px]">
        <div className="h-full w-full rounded-full overflow-hidden bg-muted">
          <img src={item.image} alt={item.brand} className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
    <p className="text-[11px] font-semibold truncate w-full text-center">@{item.brandHandle}</p>
  </Link>
);

const Discover = () => {
  const sections: Section[] = useMemo(() => {
    const products = FEED.filter((f) => f.postType !== "inspiration");
    const inspirations = FEED.filter((f) => f.postType === "inspiration");

    const trending = [...products].sort((a, b) => b.likes - a.likes).slice(0, 8);
    const creatorPicks = FEED.filter((f) => f.badge === "Creator Pick");
    const mostSaved = [...products].sort((a, b) => b.sold - a.sold).slice(0, 8);
    const outfitIdeas = inspirations.filter((i) => i.hashtags.some((h) => /outfit|fit|style/i.test(h)));
    const newCreators = inspirations.slice(0, 6);
    const trends = inspirations.filter((i) => i.badge === "Trend");
    const featured = FEED.filter((f) => f.badge === "Featured");

    return [
      { id: "trending", title: "Trending Fits", subtitle: "What everyone's loving right now", icon: Flame, items: trending },
      { id: "trends", title: "Fashion Trends", subtitle: "Movements shaping the moment", icon: TrendingUp, items: trends, layout: "tall" },
      { id: "creator-picks", title: "Creator Picks", subtitle: "Handpicked by the culture", icon: Star, items: creatorPicks, layout: "tall" },
      { id: "outfit-ideas", title: "Outfit Ideas", subtitle: "Style starters & full looks", icon: Sparkles, items: outfitIdeas, layout: "tall" },
      { id: "most-saved", title: "Most Saved", subtitle: "The pieces people keep coming back to", icon: Bookmark, items: mostSaved },
      { id: "new-creators", title: "New Creators", subtitle: "Voices defining the new wave", icon: Users, items: newCreators, layout: "creator" },
      { id: "featured", title: "Shopitt Featured", subtitle: "Drops worth your attention", icon: Compass, items: featured },
    ].filter((s) => s.items.length > 0) as Section[];
  }, []);

  useEffect(() => {
    document.title = "Discover — Shopitt";
    const desc = "Discover trending fits, outfit ideas, creator picks, and fashion trends on Shopitt.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <TopNav />
      <div className="h-[60px]" />

      {/* Hero */}
      <section className="px-4 pt-4 pb-2 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-brand-pink">Discover</p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight mt-1 tracking-tight">
          Inspiration<br />
          <span className="text-gradient-brand">made to scroll.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Trending looks, creator picks, outfit ideas and fresh drops — curated for the African fashion wave.
        </p>
      </section>

      <div className="max-w-2xl mx-auto">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <section key={s.id} className="pt-6">
              <header className="px-4 mb-3 flex items-end justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-brand-pink" />
                    </span>
                    <h2 className="font-display text-lg font-extrabold tracking-tight">{s.title}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-9">{s.subtitle}</p>
                </div>
              </header>
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
                {s.items.map((item) =>
                  s.layout === "tall" ? (
                    <InspirationCard key={item.id} item={item} />
                  ) : s.layout === "creator" ? (
                    <CreatorChip key={item.id} item={item} />
                  ) : (
                    <ProductCard key={item.id} item={item} />
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
};

export default Discover;
