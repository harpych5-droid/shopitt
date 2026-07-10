import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  User,
  Pencil,
  Globe,
  Wallet,
  Package,
  Bookmark,
  HelpCircle,
  Phone,
  Mail,
  Shield,
  FileText,
  ShieldAlert,
  Sparkles,
  Plus,
  ChevronRight,
  Download,
  Settings as SettingsIcon,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { useIdentity } from "@/hooks/useIdentity";
import { IdentityAvatar } from "@/components/identity/IdentityAvatar";
import { useInstallPrompt, requestInstallPrompt } from "@/hooks/useInstallPrompt";

type SectionKey = "account" | "shopitt" | "legal";

interface Item {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  to?: string;
  href?: string;
}

const SECTIONS: { key: SectionKey; title: string; tag: string; items: Item[]; cta: { copy: string; to: string } }[] = [
  {
    key: "account",
    title: "Account",
    tag: "Personal",
    items: [
      { icon: User, label: "Profile", hint: "View your social profile", to: "/profile" },
      { icon: Pencil, label: "Edit profile", hint: "Name, bio, avatar", to: "/edit-profile" },
      { icon: SettingsIcon, label: "Settings", hint: "Theme, account, sign out", to: "/settings" },
      { icon: Globe, label: "Country & Region", hint: "All countries supported", to: "/country" },
    ],
    cta: { copy: "Complete your profile to unlock seller verification.", to: "/edit-profile" },
  },
  {
    key: "shopitt",
    title: "Shopitt",
    tag: "Commerce",
    items: [
      { icon: Wallet, label: "Wallet", hint: "Balance, payouts, withdraw", to: "/wallet" },
      { icon: Package, label: "Orders", hint: "Track & manage", to: "/orders" },
      { icon: Bookmark, label: "Saved items", hint: "Your wishlist", to: "/saved" },
    ],
    cta: { copy: "Add a payout method to start receiving orders.", to: "/wallet" },
  },
  {
    key: "legal",
    title: "Legal & Support",
    tag: "Help",
    items: [
      { icon: HelpCircle, label: "Help Center", hint: "FAQs & guides", to: "/contact" },
      { icon: Phone, label: "Call VYLOGUE ENTERPRISES", hint: "0573105096", href: "tel:0573105096" },
      { icon: Mail, label: "Email support", hint: "shopitt54@gmail.com", href: "mailto:shopitt54@gmail.com" },
      { icon: FileText, label: "Terms of Service", to: "/terms" },
      { icon: Shield, label: "Privacy Policy", to: "/privacy" },
      { icon: ShieldAlert, label: "Safety Center", to: "/safety" },
    ],
    cta: { copy: "Need help fast? Tap call to reach Shopitt support.", to: "/contact" },
  },
];

const Menu = () => {
  const { profile, isAuthed } = useIdentity();
  const { canInstall, installed } = useInstallPrompt();
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    account: true,
    shopitt: false,
    legal: false,
  });

  useEffect(() => {
    document.title = "Menu — Shopitt";
  }, []);

  const toggle = (k: SectionKey) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main className="relative min-h-[100dvh] bg-background overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-pink/30 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-brand-purple/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand-pink/20 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Menu</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="relative max-w-md mx-auto px-4 pt-4 pb-32 space-y-4">
        {/* Profile glance card */}
        <Link
          to="/profile"
          className="block glass rounded-3xl p-4 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <IdentityAvatar profile={profile} size={56} className="text-base" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground truncate">
                {isAuthed && profile?.username ? `@${profile.username}` : "Sign in to Shopitt"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAuthed ? "Tap to view your profile" : "Continue with Google to unlock"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>

        {SECTIONS.map((section) => {
          const isOpen = open[section.key];
          return (
            <div
              key={section.key}
              className="glass rounded-3xl overflow-hidden border border-white/10"
            >
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-pink">
                    {section.tag}
                  </span>
                  <span className="text-base font-extrabold text-foreground">{section.title}</span>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <ChevronDown className="h-4 w-4 text-foreground" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="px-3 pb-3 space-y-1.5">
                      {section.items.map((item) => {
                        const content = (
                          <div className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 active:bg-white/10 transition-colors">
                            <span className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              <item.icon className="h-[18px] w-[18px] text-foreground" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold text-foreground">
                                {item.label}
                              </span>
                              {item.hint && (
                                <span className="block text-[11px] text-muted-foreground truncate">
                                  {item.hint}
                                </span>
                              )}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        );
                        return (
                          <li key={item.label}>
                            {item.href ? (
                              <a href={item.href}>{content}</a>
                            ) : (
                              <Link to={item.to ?? "#"}>{content}</Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="px-5 pb-5">
                      <div className="rounded-2xl border border-dashed border-white/15 p-3 flex items-center gap-3">
                        <span className="h-9 w-9 rounded-xl gradient-brand shadow-brand flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </span>
                        <p className="flex-1 text-[12px] text-foreground/85 leading-snug">
                          {section.cta.copy}
                        </p>
                        <Link
                          to={section.cta.to}
                          className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold"
                        >
                          Go
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Footer */}
        <div className="pt-4 text-center text-[11px] text-muted-foreground">
          <p>Shopitt by <span className="font-bold text-foreground">VYLOGUE ENTERPRISES</span></p>
          <p>v1.0 · Made for the culture</p>
        </div>

        <Link
          to="/create"
          className="flex items-center justify-center gap-2 rounded-full gradient-brand py-3 text-sm font-bold text-white shadow-brand active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
          Create a new drop
        </Link>
      </div>

      <BottomNav />
    </main>
  );
};

export default Menu;
