import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, User, ShoppingBag, Bell, MessageCircle, Store, PlusCircle, Shield, HelpCircle } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";

const SECTIONS = [
  {
    label: "Account",
    items: [
      { icon: User, label: "My Profile", to: "#" },
      { icon: ShoppingBag, label: "My Orders", to: "#" },
      { icon: Bell, label: "Notifications", to: "/alerts" },
      { icon: MessageCircle, label: "Messages", to: "#" },
    ],
  },
  {
    label: "Seller",
    items: [
      { icon: Store, label: "Seller Dashboard", to: "#" },
      { icon: PlusCircle, label: "Create Post", to: "/create" },
      { icon: Shield, label: "Admin Dashboard", to: "#" },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: HelpCircle, label: "Help & FAQs", to: "#" },
    ],
  },
];

const Profile = () => {
  useEffect(() => {
    document.title = "Profile — Shopitt";
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <span className="rounded-full gradient-brand px-4 py-1.5 text-sm font-extrabold text-white shadow-brand">
            Shopitt
          </span>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pb-32 pt-4 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.label}>
            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground mb-2 uppercase">
              {section.label}
            </h2>
            <ul className="space-y-2">
              {section.items.map(({ icon: Icon, label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center">
                      <Icon className="h-[18px] w-[18px] text-foreground" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <BottomNav />
    </main>
  );
};

export default Profile;
