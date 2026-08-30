import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Compass, Film, Bell, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useScrollDirection } from "@/hooks/useScrollDirection";

// SBB 18 — Primary bottom navigation: Home, Discovery, Shorts, Alerts, Profile.
// No Create FAB here; Create lives in the Creator space.
const baseItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discovery", icon: Compass, end: false },
  { to: "/shorts", label: "Shorts", icon: Film, end: false },
  { to: "/alerts", label: "Alerts", icon: Bell, end: false, badgeKey: "unread" as const },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

interface BottomNavProps {
  hidden?: boolean;
}

export const BottomNav = ({ hidden = false }: BottomNavProps) => {
  const { pathname } = useLocation();
  const { unread } = useNotifications();
  const [newPosts, setNewPosts] = useState(0);
  const windowScrollHidden = useScrollDirection();

  useEffect(() => {
    const onNewPost = () => setNewPosts((count) => count + 1);
    const onFeedSeen = () => setNewPosts(0);
    window.addEventListener("shopitt:feed-new-post", onNewPost);
    window.addEventListener("shopitt:feed-seen", onFeedSeen);
    return () => {
      window.removeEventListener("shopitt:feed-new-post", onNewPost);
      window.removeEventListener("shopitt:feed-seen", onFeedSeen);
    };
  }, []);
  const items = baseItems.map((it) => ({
    ...it,
    badge: it.label === "Home" ? newPosts : ("badgeKey" in it && it.badgeKey === "unread" ? unread : 0),
  }));
  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden || windowScrollHidden ? "100%" : "0%", opacity: hidden || windowScrollHidden ? 0 : 1 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl safe-bottom transform-gpu will-change-transform lg:hidden ${hidden || windowScrollHidden ? "pointer-events-none" : ""}`}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto px-2 pt-2 pb-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <li key={item.to} className="flex">
              <NavLink
                to={item.to}
                end={item.end}
                onClick={(event) => {
                  if (item.label !== "Home") return;

                  if (pathname === "/") {
                    // Already home: do not push another history entry. The feed
                    // owns this event and scrolls to its beginning before refresh.
                    event.preventDefault();
                    window.dispatchEvent(new CustomEvent("shopitt:feed-home-tap"));
                    return;
                  }

                  // An explicit Home selection is different from browser Back:
                  // Index consumes this one-shot intent after it mounts.
                  sessionStorage.setItem("shopitt:feed-home-intent", "true");
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-1 relative"
              >
                <div className="relative">
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors ${
                      active ? "text-brand-pink" : "text-muted-foreground"
                    }`}
                    strokeWidth={active ? 2.4 : 2}
                    fill={active && item.label === "Home" ? "currentColor" : "none"}
                  />
                  {item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-pink text-[10px] font-bold text-white flex items-center justify-center border border-background">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight ${
                    active ? "text-brand-pink" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute -top-1.5 h-[3px] w-8 rounded-full gradient-brand"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
};
