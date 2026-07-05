import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Wallet,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Heart,
  Truck,
} from "lucide-react";
import { TopNav } from "@/components/feed/TopNav";
import { BottomNav } from "@/components/feed/BottomNav";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { FEED } from "@/data/feed";
import { useIdentity } from "@/hooks/useIdentity";

const ACTIVITY = [
  { icon: ShoppingBag, title: "Order shipped", desc: "Halo Pro ANC Headphones", time: "2h", to: "/orders/o-1024" },
  { icon: Heart, title: "Maison Noir liked your save", desc: "Oversized Cashmere Knit", time: "5h", to: "/p/p1" },
  { icon: Truck, title: "Out for delivery", desc: "AirGlide 2 — Magenta Fade", time: "1d", to: "/orders/o-1023" },
];

const Dashboard = () => {
  const { profile } = useIdentity();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hidden = useScrollDirection({ target: scrollRef.current, offset: 60 });
  const suggested = FEED.slice(0, 4);

  useEffect(() => {
    document.title = "Dashboard — Shopitt";
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-background">
      <TopNav hidden={hidden} />

      <div ref={scrollRef} className="h-[100dvh] overflow-y-auto no-scrollbar">
        <div className="h-[60px]" />
        <div className="max-w-md mx-auto px-4 pb-32 space-y-5">
          {/* Welcome */}
          <section className="pt-2">
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-brand-pink">Welcome back</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Hey, @{profile?.username ?? "shopper"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in your Shopitt today.</p>
          </section>

          {/* Quick stats */}
          <section className="grid grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/60 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="h-9 w-9 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-black tabular-nums">2</p>
              <p className="text-[11px] text-muted-foreground font-medium">Orders in transit</p>
            </Link>

            <Link
              to="/wallet"
              className="group relative overflow-hidden rounded-3xl gradient-brand shadow-brand p-4 active:scale-[0.98] transition-transform"
            >
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <span className="h-9 w-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-white/80" />
              </div>
              <p className="relative mt-3 text-2xl font-black text-white tabular-nums">ZMW 6,710</p>
              <p className="relative text-[11px] text-white/85 font-medium">Wallet preview</p>
            </Link>
          </section>

          {/* Recent activity */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">
                Recent activity
              </h2>
              <Link to="/alerts" className="text-xs font-bold text-brand-pink">View all</Link>
            </div>
            <ul className="space-y-2">
              {ACTIVITY.map((a, i) => (
                <motion.li
                  key={a.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={a.to}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <span className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      <a.icon className="h-[18px] w-[18px] text-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{a.time}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Suggested feed preview */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">
                Suggested for you
              </h2>
              <Link to="/" className="text-xs font-bold text-brand-pink">Open feed</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory">
              {suggested.map((p) => (
                <Link
                  key={p.id}
                  to={`/p/${p.id}`}
                  className="snap-start shrink-0 w-40 rounded-2xl overflow-hidden bg-card border border-border/60 active:scale-95 transition-transform"
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
          </section>

          {/* Continue shopping CTA */}
          <Link
            to="/"
            className="relative overflow-hidden rounded-3xl gradient-brand shadow-brand p-5 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
            <span className="relative h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div className="relative flex-1 min-w-0">
              <p className="text-sm font-extrabold text-white">Continue shopping</p>
              <p className="text-[11px] text-white/85">42 new drops since you last visited.</p>
            </div>
            <span className="relative inline-flex items-center gap-1 text-xs font-bold text-white">
              Open <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>

      <BottomNav hidden={hidden} />
    </main>
  );
};

export default Dashboard;
