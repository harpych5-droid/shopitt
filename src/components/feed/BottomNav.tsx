import { NavLink, useLocation } from "react-router-dom";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

const baseItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discover", icon: Compass, end: false },
  { to: "/create", label: "", icon: Plus, end: false, primary: true },
  { to: "/alerts", label: "Alerts", icon: Bell, end: false, badgeKey: "unread" as const },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

interface BottomNavProps {
  hidden?: boolean;
}

export const BottomNav = ({ hidden = false }: BottomNavProps) => {
  const { pathname } = useLocation();
  const { unread } = useNotifications();
  const items = baseItems.map((it) => ({
    ...it,
    badge: "badgeKey" in it && it.badgeKey === "unread" ? unread : 0,
  }));
  return (
    <motion.nav
      initial={false}
      animate={{ y: hidden ? 110 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 safe-bottom lg:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto px-2 pt-1.5 pb-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
          if (item.primary) {
            return (
              <li key={item.to} className="flex items-center justify-center">
                <NavLink
                  to={item.to}
                  aria-label="Create post"
                  className="-mt-5 h-14 w-14 rounded-full gradient-brand shadow-brand flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus className="h-7 w-7 text-white" strokeWidth={2.4} />
                </NavLink>
              </li>
            );
          }
          return (
            <li key={item.to} className="flex">
              <NavLink
                to={item.to}
                end={item.end}
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
