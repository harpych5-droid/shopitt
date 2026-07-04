import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Store, ShoppingBag, FileImage, BarChart3, TrendingUp,
  Package, CreditCard, LifeBuoy, Settings as SettingsIcon, Search, Bell, Menu as MenuIcon,
  X, ArrowUpRight, ArrowDownRight, Star, Megaphone, Sparkles, Eye, MoreHorizontal,
  CheckCircle2, AlertTriangle, Activity, LogOut, ChevronRight,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";

type Section =
  | "overview" | "users" | "sellers" | "content" | "orders"
  | "subscriptions" | "analytics" | "trends" | "featured"
  | "cj" | "announcements" | "support" | "settings";

const NAV: { key: Section; label: string; icon: any }[] = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "sellers", label: "Sellers", icon: Store },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "content", label: "Content", icon: FileImage },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "trends", label: "Trends", icon: TrendingUp },
  { key: "cj", label: "CJ Products", icon: Package },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { key: "featured", label: "Featured", icon: Star },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "support", label: "Support", icon: LifeBuoy },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const Admin = () => {
  const { isAdmin, loading } = useIsAdmin();
  const { user } = useIdentity();
  const [section, setSection] = useState<Section>("overview");
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Verifying access…</div>
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh] bg-muted/30 text-foreground -ml-0 lg:-ml-60">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border/60 transform transition-transform lg:translate-x-0 ${
          drawer ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg gradient-brand grid place-items-center text-white text-[11px] font-black">S</span>
            <div className="leading-tight">
              <div className="text-sm font-bold">Vylogue</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin</div>
            </div>
          </div>
          <button onClick={() => setDrawer(false)} className="lg:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100dvh-3.5rem-3.5rem)]">
          {NAV.map((n) => {
            const active = n.key === section;
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => { setSection(n.key); setDrawer(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="h-14 border-t border-border/60 px-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ← Exit admin
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {drawer && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setDrawer(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur-xl border-b border-border/60 flex items-center gap-3 px-4">
          <button onClick={() => setDrawer(true)} className="lg:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-muted">
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="hidden sm:flex flex-1 max-w-md items-center gap-2 h-9 px-3 rounded-lg bg-muted/60 border border-border/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
              placeholder="Search users, orders, products…"
            />
            <kbd className="hidden md:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
          <div className="flex-1 sm:hidden" />
          <button className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-pink" />
          </button>
          <div className="h-8 w-8 rounded-full gradient-brand grid place-items-center text-white text-xs font-bold">
            {(user.email?.[0] ?? "A").toUpperCase()}
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {section === "overview" && <Overview />}
          {section === "users" && <UsersPage />}
          {section === "sellers" && <SellersPage />}
          {section === "orders" && <OrdersPage />}
          {section === "content" && <ContentPage />}
          {section === "analytics" && <AnalyticsPage />}
          {section === "trends" && <TrendsPage />}
          {section === "cj" && <CJPage />}
          {section === "subscriptions" && <SubsPage />}
          {section === "featured" && <FeaturedPage />}
          {section === "announcements" && <AnnouncementsPage />}
          {section === "support" && <SupportPage />}
          {section === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default Admin;

/* ============================== Shared UI ============================== */

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-background border border-border/60 rounded-xl ${className}`}>{children}</div>
);

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Pill = ({ tone, children }: { tone: "green" | "red" | "yellow" | "blue" | "gray" | "pink"; children: React.ReactNode }) => {
  const map: Record<string, string> = {
    green: "bg-success/10 text-success",
    red: "bg-destructive/10 text-destructive",
    yellow: "bg-warning/15 text-warning",
    blue: "bg-brand-purple/10 text-brand-purple",
    pink: "bg-brand-pink/10 text-brand-pink",
    gray: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[tone]}`}>{children}</span>;
};

/* ============================== Overview ============================== */

function KpiCard({ label, value, delta, deltaTone = "green", icon: Icon }: any) {
  const ToneIcon = deltaTone === "green" ? ArrowUpRight : ArrowDownRight;
  const toneClass = deltaTone === "green" ? "text-success" : "text-destructive";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {delta && (
        <div className={`mt-1 inline-flex items-center gap-0.5 text-xs font-semibold ${toneClass}`}>
          <ToneIcon className="h-3 w-3" />
          {delta}
        </div>
      )}
    </Card>
  );
}

const Overview = () => {
  const [counts, setCounts] = useState({ users: 0, products: 0, posts: 0 });
  useEffect(() => {
    (async () => {
      const [u, p, po] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
      ]);
      setCounts({ users: u.count ?? 0, products: p.count ?? 0, posts: po.count ?? 0 });
    })();
  }, []);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <>
      <SectionHeader
        title="Operations Overview"
        subtitle="Realtime snapshot of the Vylogue platform."
        action={<Pill tone="green"><span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Systems healthy</Pill>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiCard label="Total Users" value={fmt(counts.users || 12480)} delta="+8.2% wk" icon={Users} />
        <KpiCard label="Total Sellers" value={fmt(1284)} delta="+3.1% wk" icon={Store} />
        <KpiCard label="Total Creators" value={fmt(842)} delta="+12.4% wk" icon={Sparkles} />
        <KpiCard label="Total Orders" value={fmt(38219)} delta="+5.6% wk" icon={ShoppingBag} />
        <KpiCard label="Total Posts" value={fmt(counts.posts || 7320)} delta="+2.9% wk" icon={FileImage} />
        <KpiCard label="Total Reels" value={fmt(2104)} delta="+14.7% wk" icon={Activity} />
        <KpiCard label="Total Comments" value={fmt(54820)} delta="+6.0% wk" icon={ChevronRight} />
        <KpiCard label="Total Messages" value={fmt(98412)} delta="+9.3% wk" icon={ChevronRight} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <KpiCard label="Total Revenue" value="$482,910" delta="+11.4% mo" icon={CreditCard} />
        <KpiCard label="Growth Plan" value="$118,402" delta="+7.8% mo" icon={CreditCard} />
        <KpiCard label="Business Plan" value="$214,778" delta="+12.1% mo" icon={CreditCard} />
        <KpiCard label="Brand Plan" value="$98,210" delta="+4.5% mo" icon={CreditCard} />
        <KpiCard label="CJ Product Revenue" value="$51,520" delta="+18.2% mo" icon={Package} />
        <KpiCard label="Active Today" value="3,841" delta="+2.4%" icon={Activity} />
        <KpiCard label="Active This Week" value="9,820" delta="+6.7%" icon={Activity} />
        <KpiCard label="Active This Month" value="22,140" delta="+10.1%" icon={Activity} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Revenue (last 30 days)</h3>
              <p className="text-xs text-muted-foreground">Subscription + CJ + commerce fees</p>
            </div>
            <Pill tone="green"><ArrowUpRight className="h-3 w-3" /> +11.4%</Pill>
          </div>
          <SparkChart />
        </Card>
        <ActivityFeed />
      </div>
    </>
  );
};

const SparkChart = () => {
  const points = useMemo(() => Array.from({ length: 30 }, () => 30 + Math.random() * 70), []);
  const max = Math.max(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${100 - (p / max) * 100}`).join(" ");
  return (
    <div className="mt-4 h-44">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand-pink))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--brand-pink))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={d} fill="none" stroke="hsl(var(--brand-pink))" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <polygon points={`0,100 ${d} 100,100`} fill="url(#g)" />
      </svg>
    </div>
  );
};

const ACTIVITY = [
  { t: "2m", text: "New seller joined", who: "@bellatextiles", tone: "green" as const, icon: Store },
  { t: "5m", text: "Order received", who: "ORD-48201 · $128", tone: "blue" as const, icon: ShoppingBag },
  { t: "8m", text: "Reel uploaded", who: "@kemiafro", tone: "pink" as const, icon: Activity },
  { t: "12m", text: "Subscription activated", who: "Growth · @adaobi", tone: "green" as const, icon: CreditCard },
  { t: "18m", text: "Comment added", who: "@tariq · “Love this!”", tone: "gray" as const, icon: ChevronRight },
  { t: "22m", text: "User reported", who: "@spam_user · 3 reports", tone: "yellow" as const, icon: AlertTriangle },
  { t: "31m", text: "New user registered", who: "@nia.styles", tone: "green" as const, icon: Users },
  { t: "44m", text: "Post published", who: "@hauteafrika · Lookbook 03", tone: "blue" as const, icon: FileImage },
];

const ActivityFeed = () => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Live activity</h3>
      <Pill tone="pink"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink animate-pulse" /> Live</Pill>
    </div>
    <ul className="mt-4 space-y-3">
      {ACTIVITY.map((a, i) => {
        const Icon = a.icon;
        return (
          <li key={i} className="flex items-start gap-3">
            <span className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0">
              <Icon className="h-4 w-4 text-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{a.text}</div>
              <div className="text-xs text-muted-foreground truncate">{a.who}</div>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{a.t}</span>
          </li>
        );
      })}
    </ul>
  </Card>
);

/* ============================== Users ============================== */

const USERS = [
  { name: "Adaobi Okeke", handle: "adaobi", email: "adaobi@example.com", role: "Creator", joined: "Mar 12, 2025", status: "Active" },
  { name: "Kemi Afolabi", handle: "kemiafro", email: "kemi@example.com", role: "Seller", joined: "Apr 02, 2025", status: "Active" },
  { name: "Tariq Bello", handle: "tariq", email: "tariq@example.com", role: "Buyer", joined: "Apr 18, 2025", status: "Active" },
  { name: "Nia Styles", handle: "nia.styles", email: "nia@example.com", role: "Creator", joined: "May 09, 2025", status: "Suspended" },
  { name: "Bella Textiles", handle: "bellatextiles", email: "ops@bella.co", role: "Seller", joined: "May 22, 2025", status: "Active" },
  { name: "Marcus Cole", handle: "marcus", email: "marcus@example.com", role: "Admin", joined: "Feb 01, 2025", status: "Active" },
];

const UsersPage = () => {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "Creators" | "Buyers" | "Sellers" | "Admins">("All");
  const rows = USERS.filter((u) =>
    (filter === "All" || u.role + "s" === filter) &&
    (u.name.toLowerCase().includes(q.toLowerCase()) || u.handle.includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()))
  );
  return (
    <>
      <SectionHeader
        title="Users"
        subtitle="Search, filter, and moderate every account."
        action={<button className="text-xs font-semibold px-3 py-2 rounded-lg bg-foreground text-background">Export CSV</button>}
      />
      <Card className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/60 border border-border/60 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="bg-transparent outline-none text-sm flex-1" />
          </div>
          {(["All", "Creators", "Buyers", "Sellers", "Admins"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-2 rounded-lg font-medium ${filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left font-medium px-4 py-3">Role</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((u) => (
                <tr key={u.handle} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-full gradient-brand grid place-items-center text-white text-xs font-bold">
                        {u.name[0]}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">@{u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Pill tone={u.role === "Admin" ? "pink" : u.role === "Seller" ? "blue" : "gray"}>{u.role}</Pill>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3">
                    <Pill tone={u.status === "Active" ? "green" : "red"}>{u.status}</Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="h-8 w-8 rounded-md hover:bg-muted grid place-items-center ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

/* ============================== Sellers ============================== */

const SELLERS = [
  { store: "Bella Textiles", owner: "@bellatextiles", sales: 1284, tier: "Business", revenue: "$48,210", orders: 412, status: "Verified" },
  { store: "Haute Afrika", owner: "@hauteafrika", sales: 982, tier: "Growth", revenue: "$28,940", orders: 318, status: "Verified" },
  { store: "Kemi Couture", owner: "@kemiafro", sales: 612, tier: "Free", revenue: "$11,200", orders: 184, status: "Pending" },
  { store: "Adaobi Studio", owner: "@adaobi", sales: 1820, tier: "Brand", revenue: "$72,180", orders: 612, status: "Verified" },
];

const SellersPage = () => (
  <>
    <SectionHeader title="Sellers" subtitle="Stores, tiers, and revenue across the marketplace." />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left font-medium px-4 py-3">Store</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Owner</th>
              <th className="text-left font-medium px-4 py-3">Tier</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Sales</th>
              <th className="text-left font-medium px-4 py-3">Revenue</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Orders</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {SELLERS.map((s) => (
              <tr key={s.store} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{s.store}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{s.owner}</td>
                <td className="px-4 py-3"><Pill tone={s.tier === "Brand" ? "pink" : s.tier === "Business" ? "blue" : "gray"}>{s.tier}</Pill></td>
                <td className="px-4 py-3 hidden sm:table-cell">{s.sales}</td>
                <td className="px-4 py-3 font-semibold">{s.revenue}</td>
                <td className="px-4 py-3 hidden lg:table-cell">{s.orders}</td>
                <td className="px-4 py-3"><Pill tone={s.status === "Verified" ? "green" : "yellow"}>{s.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button className="h-8 w-8 rounded-md hover:bg-muted grid place-items-center ml-auto">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </>
);

/* ============================== Orders ============================== */

const ORDERS = [
  { no: "ORD-48201", buyer: "@tariq", seller: "@bellatextiles", product: "Ankara Maxi Dress", amount: "$128", status: "Received", date: "Today" },
  { no: "ORD-48199", buyer: "@adaobi", seller: "@kemiafro", product: "Beaded Clutch", amount: "$64", status: "Preparing", date: "Today" },
  { no: "ORD-48180", buyer: "@nia.styles", seller: "@hauteafrika", product: "Silk Headwrap", amount: "$32", status: "Ready", date: "Yesterday" },
  { no: "ORD-48142", buyer: "@marcus", seller: "@adaobi", product: "Two-piece Set", amount: "$210", status: "Delivered", date: "2d ago" },
  { no: "ORD-48101", buyer: "@kemi", seller: "@bellatextiles", product: "Wax Print Shirt", amount: "$48", status: "Cancelled", date: "3d ago" },
];

const statusTone = (s: string) =>
  s === "Delivered" ? "green" : s === "Ready" ? "blue" : s === "Preparing" ? "yellow" : s === "Cancelled" ? "red" : "pink";

const OrdersPage = () => (
  <>
    <SectionHeader title="Orders" subtitle="Track every order across the platform." />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left font-medium px-4 py-3">Order</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Buyer</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Seller</th>
              <th className="text-left font-medium px-4 py-3">Product</th>
              <th className="text-left font-medium px-4 py-3">Amount</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {ORDERS.map((o) => (
              <tr key={o.no} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{o.no}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.buyer}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.seller}</td>
                <td className="px-4 py-3">{o.product}</td>
                <td className="px-4 py-3 font-semibold">{o.amount}</td>
                <td className="px-4 py-3"><Pill tone={statusTone(o.status) as any}>{o.status}</Pill></td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </>
);

/* ============================== Content ============================== */

const ContentPage = () => {
  const [tab, setTab] = useState<"Posts" | "Reels" | "Comments" | "Reports">("Posts");
  return (
    <>
      <SectionHeader title="Content Moderation" subtitle="Approve, remove, or feature content across Vylogue." />
      <div className="flex gap-2 mb-4">
        {(["Posts", "Reels", "Comments", "Reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-2 rounded-lg font-medium ${tab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 grid place-items-center">
              <FileImage className="h-6 w-6 text-foreground/30" />
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold truncate">@creator_{i + 1}</div>
              <div className="text-[11px] text-muted-foreground">{tab.slice(0, -1)} · 2h ago</div>
              <div className="mt-2 flex gap-1.5">
                <button className="flex-1 text-[11px] py-1 rounded-md bg-foreground text-background font-semibold">Approve</button>
                <button className="flex-1 text-[11px] py-1 rounded-md bg-muted text-foreground font-semibold">Remove</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

/* ============================== Analytics ============================== */

const AnalyticsPage = () => (
  <>
    <SectionHeader title="Analytics" subtitle="Growth and engagement across the platform." />
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h3 className="font-semibold">Active users</h3>
        <p className="text-xs text-muted-foreground">DAU · WAU · MAU</p>
        <SparkChart />
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">New signups</h3>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
        <SparkChart />
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Posts & Reels created</h3>
        <SparkChart />
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold">Orders</h3>
        <SparkChart />
      </Card>
    </div>
    <div className="grid md:grid-cols-3 gap-4 mt-4">
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top Creators</h3>
        {["@adaobi", "@kemiafro", "@hauteafrika", "@nia.styles", "@tariq"].map((h, i) => (
          <div key={h} className="flex items-center justify-between py-1.5 text-sm">
            <span className="font-medium">{i + 1}. {h}</span>
            <span className="text-muted-foreground text-xs">{(120 - i * 14)}k</span>
          </div>
        ))}
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top Sellers</h3>
        {SELLERS.map((s, i) => (
          <div key={s.store} className="flex items-center justify-between py-1.5 text-sm">
            <span className="font-medium">{i + 1}. {s.store}</span>
            <span className="text-muted-foreground text-xs">{s.revenue}</span>
          </div>
        ))}
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top Categories</h3>
        {["Ankara", "Aso-Oke", "Streetwear", "Bridal", "Accessories"].map((c, i) => (
          <div key={c} className="flex items-center justify-between py-1.5 text-sm">
            <span className="font-medium">{i + 1}. {c}</span>
            <span className="text-muted-foreground text-xs">{(820 - i * 110)} drops</span>
          </div>
        ))}
      </Card>
    </div>
  </>
);

/* ============================== Trends ============================== */

const TrendsPage = () => (
  <>
    <SectionHeader title="Trend Engine" subtitle="Auto-calculated trending content across Vylogue." />
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { title: "Trending Hashtags", items: ["#ankaraseason", "#asoebibella", "#streetafrika", "#bridalgoals", "#lookbook2026"] },
        { title: "Most Viewed Posts", items: ["Lookbook 03 · @hauteafrika", "Sunset Drop · @adaobi", "Beaded Set · @kemiafro", "Headwrap Tutorial", "Owambe Fits"] },
        { title: "Most Saved Posts", items: ["Owambe Fits", "Bridal Mood", "Two-piece Set", "Wax Print Shirt", "Silk Headwrap"] },
        { title: "Trending Creators", items: ["@adaobi", "@kemiafro", "@hauteafrika", "@nia.styles", "@tariq"] },
      ].map((b) => (
        <Card key={b.title} className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-brand-pink" /> {b.title}</h3>
          <ol className="space-y-2">
            {b.items.map((it, i) => (
              <li key={it} className="flex items-center justify-between text-sm">
                <span className="font-medium">{i + 1}. {it}</span>
                <Pill tone="pink">+{50 - i * 7}%</Pill>
              </li>
            ))}
          </ol>
        </Card>
      ))}
    </div>
  </>
);

/* ============================== CJ Products ============================== */

const CJPage = () => (
  <>
    <SectionHeader title="CJ Products" subtitle="Manage CJ-sourced product margins and visibility." />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Supplier</th>
              <th className="text-left px-4 py-3 font-medium">Final</th>
              <th className="text-left px-4 py-3 font-medium">Margin</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-br from-brand-pink/30 to-brand-purple/30" />
                    <div>
                      <div className="font-semibold">CJ Streetwear #{1000 + i}</div>
                      <div className="text-xs text-muted-foreground">SKU CJ-{2400 + i}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">${(12 + i).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">${(28 + i * 1.4).toFixed(2)}</td>
                <td className="px-4 py-3"><Pill tone="green">+{42 + i}%</Pill></td>
                <td className="px-4 py-3"><Pill tone={i % 3 === 0 ? "gray" : "blue"}>{i % 3 === 0 ? "Draft" : "Published"}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-md bg-muted hover:bg-foreground hover:text-background">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </>
);

/* ============================== Subscriptions ============================== */

const SubsPage = () => (
  <>
    <SectionHeader title="Subscriptions" subtitle="Tier mix and MRR." />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <KpiCard label="MRR" value="$92,400" delta="+8.2%" />
      <KpiCard label="Active Subs" value="1,284" delta="+3.4%" />
      <KpiCard label="Expiring 30d" value="142" delta="−4.1%" deltaTone="red" />
      <KpiCard label="Upgrades 30d" value="218" delta="+12.6%" />
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: "Free", count: 6210, color: "gray" },
        { name: "Growth", count: 482, color: "blue" },
        { name: "Business", count: 312, color: "pink" },
        { name: "Brand", count: 84, color: "pink" },
      ].map((p) => (
        <Card key={p.name} className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{p.name}</h3>
            <Pill tone={p.color as any}>{p.count} subs</Pill>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-brand" style={{ width: `${Math.min(100, p.count / 70)}%` }} />
          </div>
        </Card>
      ))}
    </div>
  </>
);

/* ============================== Featured ============================== */

const FeaturedPage = () => (
  <>
    <SectionHeader title="Featured Content" subtitle="Homepage placements and editor picks." />
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {["Hero banner", "Trending row", "Featured creators", "Top sellers", "New drops", "Editor's pick"].map((slot) => (
        <Card key={slot} className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{slot}</h3>
            <Pill tone="green"><CheckCircle2 className="h-3 w-3" /> Live</Pill>
          </div>
          <div className="mt-3 aspect-[16/9] rounded-lg bg-gradient-to-br from-brand-pink/20 to-brand-purple/20 grid place-items-center text-xs text-muted-foreground">
            Drag content here
          </div>
          <button className="mt-3 w-full text-xs font-semibold py-2 rounded-md bg-foreground text-background">Manage slot</button>
        </Card>
      ))}
    </div>
  </>
);

/* ============================== Announcements ============================== */

const AnnouncementsPage = () => {
  const [audience, setAudience] = useState<"All Users" | "Sellers Only" | "Creators Only">("All Users");
  return (
    <>
      <SectionHeader title="Announcements" subtitle="Broadcast platform-wide notifications." />
      <Card className="p-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audience</label>
        <div className="mt-2 flex gap-2 flex-wrap">
          {(["All Users", "Sellers Only", "Creators Only"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`text-xs px-3 py-2 rounded-lg font-medium ${audience === a ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
            >
              {a}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
        <input className="mt-2 w-full h-10 px-3 rounded-lg bg-muted/60 border border-border/60 outline-none text-sm" placeholder="Maintenance window tonight" />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
        <textarea rows={4} className="mt-2 w-full p-3 rounded-lg bg-muted/60 border border-border/60 outline-none text-sm" placeholder="Write your announcement…" />
        <div className="mt-4 flex justify-end gap-2">
          <button className="text-sm font-semibold px-4 py-2 rounded-lg bg-muted">Save draft</button>
          <button className="text-sm font-semibold px-4 py-2 rounded-lg gradient-brand text-white">Send announcement</button>
        </div>
      </Card>
    </>
  );
};

/* ============================== Support ============================== */

const TICKETS = [
  { id: "TCK-1042", user: "@tariq", subject: "Order not received", priority: "High", status: "Open" },
  { id: "TCK-1038", user: "@kemiafro", subject: "Payout question", priority: "Medium", status: "Open" },
  { id: "TCK-1031", user: "@nia.styles", subject: "Account recovery", priority: "Low", status: "Resolved" },
];

const SupportPage = () => (
  <>
    <SectionHeader title="Support Center" subtitle="Resolve user reports and seller issues." />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ticket</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Subject</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {TICKETS.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{t.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.user}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3"><Pill tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "yellow" : "gray"}>{t.priority}</Pill></td>
                <td className="px-4 py-3"><Pill tone={t.status === "Open" ? "pink" : "green"}>{t.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-md bg-foreground text-background">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </>
);

/* ============================== Settings ============================== */

const SettingsPage = () => (
  <>
    <SectionHeader title="Admin Settings" subtitle="Platform configuration and feature flags." />
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Platform</h3>
        <Field label="Platform name" value="Vylogue" />
        <Field label="Default theme" value="System" />
        <Field label="Version" value="v0.9.0-jets" />
      </Card>
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Feature flags</h3>
        {[
          ["Reels", true], ["CJ Catalog", true], ["Inspiration posts", true],
          ["Subscriptions", true], ["Maintenance mode", false],
        ].map(([k, v]) => (
          <div key={k as string} className="flex items-center justify-between text-sm">
            <span className="font-medium">{k as string}</span>
            <span className={`h-5 w-9 rounded-full p-0.5 ${v ? "bg-foreground" : "bg-muted"}`}>
              <span className={`block h-4 w-4 rounded-full bg-background transition-transform ${v ? "translate-x-4" : ""}`} />
            </span>
          </div>
        ))}
      </Card>
    </div>
  </>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</label>
    <div className="mt-1 h-10 px-3 rounded-lg bg-muted/60 border border-border/60 flex items-center text-sm">{value}</div>
  </div>
);
