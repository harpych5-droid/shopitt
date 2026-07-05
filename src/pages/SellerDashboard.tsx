import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Wallet,
  TrendingUp,
  Package,
  Boxes,
  DollarSign,
  Plus,
  ListOrdered,
  Settings,
  Sparkles,
  Camera,
  Truck,
  ChevronRight,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED } from "@/data/feed";
import { useIdentity } from "@/hooks/useIdentity";

const SellerDashboard = () => {
  const { profile } = useIdentity();
  const [hasProducts, setHasProducts] = useState(true);
  // Showcase data (production would pull from API)
  const products = hasProducts ? FEED.slice(0, 4) : [];
  const stats = hasProducts
    ? { sales: 336960, orders: 7, listed: products.length, growth: 18 }
    : { sales: 0, orders: 0, listed: 0, growth: 0 };

  useEffect(() => {
    document.title = "Seller Dashboard — Shopitt";
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/profile" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Seller Dashboard</h1>
          <button aria-label="Settings" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pb-32 pt-4 space-y-5">
        {/* Seller header / wallet */}
        <section className="relative overflow-hidden rounded-3xl gradient-brand p-5 shadow-brand">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username ?? "you"}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <span className="h-12 w-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-base font-black text-white">
                {(profile?.username?.[0] ?? "S").toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-extrabold text-white truncate">
                  @{profile?.username ?? "shopper"}
                </p>
                <BadgeCheck className="h-4 w-4 text-white fill-white/30" />
              </div>
              <p className="text-[11px] text-white/80">
                Verified Seller{profile?.country ? ` · ${profile.country}` : ""}
              </p>
            </div>
            <button
              onClick={() => setHasProducts((v) => !v)}
              className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 text-[10px] font-bold text-white"
              aria-label="Toggle demo data"
            >
              {hasProducts ? "Demo: empty" : "Demo: filled"}
            </button>
          </div>
          <div className="relative mt-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/80">Wallet balance</p>
              <p className="mt-1 text-3xl font-black text-white tracking-tight tabular-nums">
                ZMW {stats.sales.toLocaleString()}.00
              </p>
            </div>
            <button className="rounded-full bg-white text-foreground px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 active:scale-95 transition-transform">
              <Wallet className="h-3.5 w-3.5" />
              Withdraw
            </button>
          </div>
        </section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={DollarSign} label="Total sales" value={`ZMW ${stats.sales.toLocaleString()}`} delta={`+${stats.growth}%`} />
          <StatCard icon={Package} label="Pending orders" value={stats.orders.toString()} delta={stats.orders ? "Action needed" : "All clear"} />
          <StatCard icon={Boxes} label="Listed" value={stats.listed.toString()} delta="Live now" />
          <StatCard icon={TrendingUp} label="Growth" value={`${stats.growth}%`} delta="vs last week" />
        </section>

        {/* Revenue chart */}
        <section className="rounded-3xl bg-card border border-border/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Revenue</p>
              <p className="mt-1 text-xl font-extrabold tracking-tight">ZMW {stats.sales.toLocaleString()}</p>
            </div>
            <div className="flex gap-1.5 text-[11px] font-bold">
              {["7D", "1M", "3M", "1Y"].map((p, i) => (
                <button
                  key={p}
                  className={`px-2.5 py-1 rounded-full ${
                    i === 0 ? "gradient-brand text-white shadow-brand" : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <RevenueChart filled={hasProducts} />
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { icon: Plus, label: "New post", to: "/create", primary: true },
            { icon: ListOrdered, label: "Orders", to: "#orders" },
            { icon: Boxes, label: "Inventory", to: "#inventory" },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform ${
                a.primary ? "gradient-brand text-white shadow-brand" : "bg-card border border-border/60 text-foreground"
              }`}
            >
              <a.icon className="h-5 w-5" />
              <span className="text-[11px] font-bold">{a.label}</span>
            </Link>
          ))}
        </section>

        {/* Products / onboarding */}
        {hasProducts ? (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
                Your products
              </h2>
              <Link to="#inventory" className="text-xs font-bold text-brand-pink">View all</Link>
            </div>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/p/${p.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{p.sold} sold</span>
                        <span className="text-xs text-success font-semibold">{p.stockLeft} left</span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums">
                      {p.currency}{p.price}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <Onboarding />
        )}
      </div>

      <BottomNav />
    </main>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta: string;
}) => (
  <div className="rounded-2xl bg-card border border-border/60 p-4">
    <div className="flex items-center justify-between">
      <span className="h-8 w-8 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[10px] font-bold text-success bg-success/10 rounded-full px-2 py-0.5">
        {delta}
      </span>
    </div>
    <p className="mt-3 text-lg font-extrabold tracking-tight tabular-nums">{value}</p>
    <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
  </div>
);

const RevenueChart = ({ filled }: { filled: boolean }) => {
  const data = filled ? [22, 35, 28, 48, 40, 62, 78] : [4, 6, 5, 8, 6, 9, 7];
  const max = Math.max(...data);
  return (
    <div className="mt-5 h-32 flex items-end gap-2">
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 rounded-t-md gradient-brand opacity-90"
        />
      ))}
    </div>
  );
};

const Onboarding = () => {
  const steps = [
    { icon: Camera, title: "Add your first product", desc: "Photo + price + drop title.", to: "/create" },
    { icon: Truck, title: "Set delivery options", desc: "Free delivery converts 2.4× better.", to: "#delivery" },
    { icon: Sparkles, title: "Promote your drop", desc: "Share to Shorts to 10× reach.", to: "/shorts" },
  ];
  return (
    <section className="space-y-3">
      <div className="rounded-3xl glass p-5 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand shadow-brand">
          <Sparkles className="h-6 w-6 text-white" />
        </span>
        <h3 className="mt-3 text-lg font-extrabold tracking-tight">Start selling in 3 steps</h3>
        <p className="mt-1 text-sm text-muted-foreground">Most sellers post their first product in under 2 minutes.</p>
      </div>

      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link
              to={s.to}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4 hover:bg-muted/40 transition-colors"
            >
              <span className="h-8 w-8 rounded-full gradient-brand text-white text-xs font-black flex items-center justify-center shrink-0 shadow-brand">
                {i + 1}
              </span>
              <span className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-foreground" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-foreground">{s.title}</span>
                <span className="block text-xs text-muted-foreground truncate">{s.desc}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ol>

      <Link
        to="/create"
        className="flex items-center justify-center gap-2 rounded-full gradient-brand py-3 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
      >
        <Plus className="h-4 w-4" />
        Upload your first product
      </Link>
    </section>
  );
};

export default SellerDashboard;
