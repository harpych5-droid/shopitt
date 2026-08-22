import { NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  Film,
  Plus,
  Bookmark,
  MessageCircle,
  User,
  Bell,
} from "lucide-react";


const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/discover", label: "Discovery", icon: Compass },
  { to: "/shorts", label: "Shorts", icon: Film },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/create", label: "Create", icon: Plus, primary: true },
];


export const DesktopSidebar = () => {
  return (
    <aside
      aria-label="Primary"
      className="hidden lg:flex fixed top-0 left-0 z-40 h-[100dvh] w-60 flex-col border-r border-border/60 bg-background/95 backdrop-blur-xl px-4 py-6"
    >
      <NavLink to="/" className="px-2 mb-8 inline-flex items-center gap-2">
        <span className="h-8 w-8 rounded-xl gradient-brand shadow-brand flex items-center justify-center text-white font-black">
          S
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight">
          Shopitt
        </span>
      </NavLink>

      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="mt-2 mb-2 flex items-center gap-3 rounded-full gradient-brand text-white shadow-brand px-4 py-3 text-sm font-extrabold active:scale-[0.98] transition-transform"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <p className="px-2 text-[11px] text-muted-foreground">
        © Shopitt — built in Africa.
      </p>
    </aside>
  );
};
