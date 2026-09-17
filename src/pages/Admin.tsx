import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Activity, ArrowUpRight, BarChart3, Boxes, FileImage, Heart, LogOut,
  Menu, MessageCircle, Package, Search, ShieldAlert, Sparkles, Users, X,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/lib/supabase";
import * as adminSvc from "@/services/adminService";
import type { AdminPost, AdminUser, AdminOrder, AdminReport, FounderDashboard } from "@/services/adminService";

 type View = "overview" | "users" | "content" | "commerce" | "moderation";
 const NAV: { key: View; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Command Center", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "content", label: "Content", icon: FileImage },
  { key: "commerce", label: "Commerce", icon: Package },
  { key: "moderation", label: "Moderation", icon: ShieldAlert },
 ];

const Admin = () => {
  const { isAdmin, loading } = useIsAdmin();
  const { user } = useIdentity();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");
  const [drawer, setDrawer] = useState(false);

  if (loading) return <div className="min-h-[100dvh] grid place-items-center bg-[#0E0E0E] text-white/70">Verifying access…</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return <div className="min-h-[100dvh] bg-[#0E0E0E] text-white">
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0E0E0E] transition-transform lg:translate-x-0 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><div><p className="font-display text-lg font-black">SHOPITT</p><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Command Center</p></div><button onClick={() => setDrawer(false)} className="lg:hidden"><X className="h-5 w-5" /></button></div>
      <nav className="space-y-1 p-3">{NAV.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => { setView(key); setDrawer(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${view === key ? "bg-white text-[#0E0E0E]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-3"><button onClick={() => navigate("/")} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white">Exit admin <ArrowUpRight className="h-4 w-4" /></button><button onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-white/55 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    {drawer && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setDrawer(false)} />}
    <div className="lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#0E0E0E]/90 px-4 backdrop-blur-xl"><button onClick={() => setDrawer(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button><div className="flex-1" /><span className="text-xs text-white/45">Platform overview</span><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#FF4DA6] to-[#7B5CFF] text-xs font-black">{(user.email?.[0] ?? "A").toUpperCase()}</span></header><main className="mx-auto max-w-[1440px] p-4 md:p-8">{view === "overview" && <Overview setView={setView} />}{view === "users" && <UsersView />}{view === "content" && <ContentView />}{view === "commerce" && <CommerceView />}{view === "moderation" && <ModerationView />}</main></div>
  </div>;
};

const Overview = ({ setView }: { setView: (view: View) => void }) => {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [dashboard, setDashboard] = useState<FounderDashboard | null>(null);
  const [reports, setReports] = useState({ open: 0, reviewed: 0, resolved: 0 });
  useEffect(() => { void adminSvc.fetchFounderDashboard(range).then(setDashboard); void adminSvc.fetchAdminReportCounts().then(setReports); }, [range]);
  if (!dashboard) return <Loading />;
  const fmt = (value: number | null) => value === null ? "—" : value.toLocaleString();
  const max = Math.max(1, ...dashboard.growth.map((point) => point.users));
  return <div className="space-y-8"><Hero title="SHOPITT" subtitle="COMMAND CENTER" /><section><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF4DA6]">Platform pulse</p><h1 className="mt-1 font-display text-3xl font-black tracking-tight">What is happening right now?</h1></div><span className="text-xs text-white/45">Updated moments ago</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Total users" value={dashboard.totalUsers.toLocaleString()} icon={Users} /><Metric label="Active now" value={fmt(dashboard.activeNow)} icon={Activity} /><Metric label="DAU" value={dashboard.dailyActiveUsers.toLocaleString()} icon={Activity} /><Metric label="New today" value={dashboard.newUsersToday.toLocaleString()} icon={Users} /></div></section><section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]"><Panel><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-black">User growth</h2><p className="text-xs text-white/45">New registrations by day</p></div><div className="flex gap-1">{([7, 30, 90] as const).map((value) => <button key={value} onClick={() => setRange(value)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${range === value ? "bg-white text-[#0E0E0E]" : "bg-white/10 text-white/55"}`}>{value}D</button>)}</div></div><div className="mt-7 flex h-44 items-end gap-1">{dashboard.growth.map((point) => <div key={point.date} title={`${point.date}: ${point.users}`} className="min-w-0 flex-1 rounded-t-sm bg-gradient-to-t from-[#FF4DA6] to-[#7B5CFF] opacity-80" style={{ height: `${Math.max(5, point.users / max * 100)}%` }} />)}</div></Panel><Panel><h2 className="font-display text-xl font-black">Platform activity</h2><div className="mt-5 grid grid-cols-2 gap-3"><Mini label="WAU" value="—" /><Mini label="MAU" value={dashboard.monthlyActiveUsers.toLocaleString()} /><Mini label="Looks today" value={dashboard.looksToday.toLocaleString()} /><Mini label="Verified" value={dashboard.verifiedAccounts.toLocaleString()} /></div><p className="mt-5 text-xs leading-relaxed text-white/45">Active-user totals use recorded platform activity events. Live presence is not configured.</p></Panel></section><section><SectionTitle title="Fashion activity" /><div className="grid grid-cols-2 gap-3 md:grid-cols-5"><Metric label="Total Looks" value={dashboard.totalLooks.toLocaleString()} icon={FileImage} /><Metric label="Reactions" value={fmt(dashboard.reactions)} icon={Heart} /><Metric label="Conversations" value={fmt(dashboard.messages)} icon={MessageCircle} /><Metric label="Inspiration" value={fmt(dashboard.saves)} icon={Sparkles} /><Metric label="Remixes" value="—" icon={Activity} /></div></section><section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]"><Panel><SectionTitle title="Live activity" /><div className="mt-4 space-y-3">{dashboard.activity.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm"><div><p className="font-semibold">{item.text}</p><p className="text-xs text-white/45">{item.who}</p></div><span className="shrink-0 text-xs text-white/40">{adminSvc.timeAgo(item.at)}</span></div>)}{dashboard.activity.length === 0 && <p className="text-sm text-white/45">No recent activity.</p>}</div></Panel><Panel><SectionTitle title="Needs attention" /><div className="mt-4 space-y-3"><Attention label="Open reports" value={reports.open} /><Attention label="Under review" value={reports.reviewed} /><Attention label="Resolved" value={reports.resolved} /></div><button onClick={() => setView("moderation")} className="mt-5 text-xs font-bold text-[#FF4DA6]">Open moderation →</button></Panel></section><section><SectionTitle title="Commerce" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Orders" value="—" icon={Package} /><Metric label="Orders today" value="—" icon={Package} /><Metric label="GMV" value="—" icon={Boxes} /><Metric label="Shopitt revenue" value="—" icon={BarChart3} /></div><p className="mt-3 text-xs text-white/40">Commerce totals are omitted here until a reliable aggregate and commission rule are configured.</p></section></div>;
};

const UsersView = () => {
  const { user } = useIdentity();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [badges, setBadges] = useState<adminSvc.ShopittBadge[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const load = () => void adminSvc.fetchAdminUsers(query).then(setRows);
  useEffect(load, [query]);
  useEffect(() => { void adminSvc.fetchBadges().then(setBadges); }, []);
  const toggleAdmin = async (row: AdminUser) => {
    setSaving(row.id);
    const error = await adminSvc.setUserRole(row.id, row.role === "admin" ? "user" : "admin");
    setSaving(null);
    if (!error) load();
  };
  const toggleVerified = async (row: AdminUser) => {
    setSaving(row.id);
    await adminSvc.setUserVerified(row.id, !Boolean((row as AdminUser & { is_verified?: boolean }).is_verified), user?.id ?? "");
    setSaving(null);
    load();
  };
  const assignBadge = async (row: AdminUser) => {
    if (!user || !badges.length) return;
    const choice = window.prompt(`Badge for @${row.username ?? "user"}:\n${badges.map((badge, index) => `${index + 1}. ${badge.name}`).join("\n")}`);
    const index = Number(choice) - 1;
    if (!Number.isInteger(index) || !badges[index]) return;
    const error = await adminSvc.grantUserBadge(row.id, badges[index].id, user.id);
    if (error) window.alert(error);
  };
  return <div><Hero title="USERS" subtitle="MANAGEMENT + RECOGNITION" /><SearchBox value={query} onChange={setQuery} placeholder="Search users by username" /><Panel className="mt-4 overflow-hidden"><TableHead labels={["User", "Country", "Joined", "Status"]} />{rows.map((row) => <div key={row.id} className="grid grid-cols-[2fr_1fr_1fr_1.8fr] items-center gap-3 border-t border-white/10 px-4 py-3 text-sm"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#FF4DA6] to-[#7B5CFF] text-xs font-black">{(row.username?.[0] ?? "S").toUpperCase()}</span><div><p className="font-semibold">@{row.username ?? "user"}</p><p className="text-xs text-white/40">{row.role === "admin" ? "Administrator" : row.is_seller ? "Creator / seller" : "Shopitt account"}</p></div></div><span className="text-white/55">{row.country ?? "—"}</span><span className="text-white/55">{new Date(row.created_at).toLocaleDateString()}</span><div className="flex flex-wrap items-center justify-end gap-1.5"><span className={row.is_suspended ? "text-red-300" : "text-emerald-300"}>{row.is_suspended ? "Suspended" : "Active"}</span><button onClick={() => void toggleVerified(row)} disabled={saving === row.id} className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10">{(row as AdminUser & { is_verified?: boolean }).is_verified ? "Unverify" : "Verify"}</button><button onClick={() => void assignBadge(row)} className="rounded-full border border-[#FF4DA6]/40 px-2 py-1 text-[10px] font-bold text-[#FF4DA6] hover:bg-[#FF4DA6]/10">Badge</button><button onClick={() => void toggleAdmin(row)} disabled={saving === row.id} className="rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10 disabled:opacity-50">{saving === row.id ? "Saving" : row.role === "admin" ? "Remove admin" : "Make admin"}</button></div></div>)}</Panel></div>;
};
const ContentView = () => {
  const [rows, setRows] = useState<AdminPost[]>([]);
  useEffect(() => { void adminSvc.fetchAdminPosts("all", 60).then(setRows); }, []);
  return (
    <div>
      <Hero title="CONTENT" subtitle="LOOKS + REMIXES" />
      <Panel className="overflow-hidden">
        <TableHead labels={["Look", "Creator", "Type", "Published", "Actions"]} />
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-3 border-t border-white/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10">
                {row.media_url && <img src={row.media_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <span className="truncate font-semibold">{row.title ?? row.drop_title ?? "Untitled Look"}</span>
            </div>
            <span className="text-white/55">@{row.username ?? "creator"}</span>
            <span className="text-white/55">{row.media_type ?? "image"}</span>
            <span className="text-white/55">{new Date(row.created_at).toLocaleDateString()}</span>
            <div className="flex gap-2">
              <button onClick={async () => { const error = await adminSvc.setPostFeatured(row.id, !row.is_featured); if (!error) setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_featured: !row.is_featured } : item)); }} className="text-[10px] font-bold text-[#FF4DA6]">{row.is_featured ? "Unfeature" : "Feature"}</button>
              <button onClick={async () => { if (!window.confirm("Remove this Look from Shopitt?")) return; const error = await adminSvc.deletePostAdmin(row.id); if (!error) setRows((current) => current.filter((item) => item.id !== row.id)); }} className="text-[10px] font-bold text-red-300">Remove</button>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
};
const CommerceView = () => { const [rows, setRows] = useState<AdminOrder[]>([]); useEffect(() => { void adminSvc.fetchAdminOrders().then(setRows); }, []); return <div><Hero title="COMMERCE" subtitle="ORDERS + MARKETPLACE FLOW" /><Panel className="overflow-hidden"><TableHead labels={["Order", "Product", "Buyer", "Value"]} />{rows.map((row) => <div key={row.id} className="grid grid-cols-[1fr_2fr_1fr_1fr] items-center gap-3 border-t border-white/10 px-4 py-3 text-sm"><span className="font-mono text-xs">#{row.id.slice(0, 8).toUpperCase()}</span><span className="truncate font-semibold">{row.product_title ?? "Shopitt order"}</span><span className="text-white/55">{row.buyer_name ?? "Buyer"}</span><span className="font-bold">{row.currency ?? "—"} {Number(row.total_price ?? 0).toLocaleString()}</span></div>)}</Panel></div>; };
const ModerationView = () => {
  const { user } = useIdentity();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [counts, setCounts] = useState({ open: 0, reviewed: 0, resolved: 0 });
  const load = async () => { const [nextReports, nextCounts] = await Promise.all([adminSvc.fetchAdminReports(), adminSvc.fetchAdminReportCounts()]); setReports(nextReports); setCounts(nextCounts); };
  useEffect(() => { void load(); }, []);
  const update = async (report: AdminReport, status: AdminReport["status"]) => { if (!user) return; const error = await adminSvc.updateAdminReport(report.id, status, user.id); if (!error) void load(); };
  return <div><Hero title="MODERATION" subtitle="REPORTS + ACTIONS" /><div className="grid grid-cols-3 gap-3"><Metric label="Open" value={counts.open.toString()} icon={ShieldAlert} /><Metric label="Under review" value={counts.reviewed.toString()} icon={Activity} /><Metric label="Resolved" value={counts.resolved.toString()} icon={Sparkles} /></div><Panel className="mt-4 overflow-hidden"><TableHead labels={["Report", "Look", "Reason", "Status"]} />{reports.map((report) => <div key={report.id} className="grid grid-cols-[1.4fr_1.5fr_1fr_1.4fr] items-center gap-3 border-t border-white/10 px-4 py-3 text-sm"><div><p className="font-semibold">{report.reason}</p><p className="text-xs text-white/40">{new Date(report.created_at).toLocaleDateString()}</p></div><span className="truncate text-white/60">{report.post?.title ?? report.post_id.slice(0, 8)}</span><span className="truncate text-white/60">{report.description || "No details"}</span><div className="flex flex-wrap gap-2"><span className="text-xs font-bold capitalize text-amber-200">{report.status}</span>{report.status === "open" && <button onClick={() => void update(report, "reviewed")} className="text-[10px] font-bold text-white/70">Review</button>}{report.status === "reviewed" && <button onClick={() => void update(report, "resolved")} className="text-[10px] font-bold text-emerald-300">Resolve</button>}{report.status !== "resolved" && <button onClick={() => void update(report, "dismissed")} className="text-[10px] font-bold text-white/45">Dismiss</button>}</div></div>)}{reports.length === 0 && <p className="p-6 text-sm text-white/45">No reports found.</p>}</Panel></div>;
};

const Hero = ({ title, subtitle }: { title: string; subtitle: string }) => <div className="mb-8"><p className="font-display text-2xl font-black tracking-tight">{title}</p><p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#FF4DA6]">{subtitle}</p></div>;
const SectionTitle = ({ title }: { title: string }) => <h2 className="font-display text-xl font-black">{title}</h2>;
const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`border border-white/10 bg-[#121212] p-5 ${className}`}>{children}</section>;
const Metric = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) => <div className="border border-white/10 bg-[#121212] p-4"><Icon className="h-4 w-4 text-[#FF4DA6]" /><p className="mt-4 text-xl font-black tabular-nums">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p></div>;
const Mini = ({ label, value }: { label: string; value: string }) => <div className="border border-white/10 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p><p className="mt-2 text-lg font-black">{value}</p></div>;
const Attention = ({ label, value }: { label: string; value: number }) => <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm"><span className="text-white/65">{label}</span><span className={value > 0 ? "font-black text-amber-300" : "font-bold text-emerald-300"}>{value}</span></div>;
const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => <div className="flex max-w-xl items-center gap-2 border border-white/10 bg-[#121212] px-4 py-3"><Search className="h-4 w-4 text-white/40" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" /></div>;
const TableHead = ({ labels }: { labels: string[] }) => <div className={`grid grid-cols-${labels.length} gap-3 px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35`}>{labels.map((label) => <span key={label}>{label}</span>)}</div>;
const Loading = () => <div className="grid min-h-[40vh] place-items-center text-sm text-white/45">Loading platform health…</div>;

export default Admin;
