import { motion } from "framer-motion";
import { Search, Film, MessageCircle, Menu as MenuIcon, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNotifications } from "@/hooks/useNotifications";

interface TopNavProps {
  hidden?: boolean;
}

export const TopNav = ({ hidden = false }: TopNavProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { unread } = useNotifications();
  const clicks = useRef<number[]>([]);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < 2000);
    clicks.current.push(now);
    if (clicks.current.length >= 3) {
      clicks.current = [];
      if (isAdmin) {
        e.preventDefault();
        navigate("/admin");
      }
    }
  };

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? -90 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40"
    >
      <div className="flex items-center justify-between px-4 py-2.5 max-w-md mx-auto gap-2">
        <Link
          to="/"
          aria-label="Vylogue home"
          onClick={handleLogoClick}
          className="inline-flex shrink-0 select-none"
        >
          <span className="rounded-full gradient-brand px-4 py-1.5 text-base font-extrabold text-white tracking-tight shadow-brand">
            Vylogue
          </span>
        </Link>

        <div className="flex items-center gap-0.5 shrink-0">
          <Link to="/search" aria-label="Search" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Search className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/shorts" aria-label="Reels" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Film className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/alerts" aria-label="Alerts" className="relative h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Heart className="h-5 w-5 text-foreground" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full gradient-brand text-[9px] font-extrabold text-white flex items-center justify-center shadow-brand">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link to="/chats" aria-label="Chats" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/menu" aria-label="Menu" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <MenuIcon className="h-5 w-5 text-foreground" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
