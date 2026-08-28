import { motion } from "framer-motion";
import { Search, MessageCircle, Menu as MenuIcon, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useTheme } from "@/hooks/useTheme";
import lightLogo from "@/assets/shopitt-app-logo.png";
import darkLogo from "@/assets/shopitt-app-logo1.png";

interface TopNavProps {
  hidden?: boolean;
}

export const TopNav = ({ hidden = false }: TopNavProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const { applied } = useTheme();
  const clicks = useRef<number[]>([]);
  const logo = applied === "dark" ? darkLogo : lightLogo;

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
          aria-label="Shopitt home"
          onClick={handleLogoClick}
          className="inline-flex items-center gap-2 shrink-0 select-none"
        >
          <img src={logo} alt="Shopitt" className="h-10 w-auto object-contain" />
        </Link>

        {/* SBB 20 — AppBar: logo, Search, Chats, Menu. No avatar here. */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Link to="/create" aria-label="Create post" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Plus className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/search" aria-label="Search" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Search className="h-5 w-5 text-foreground" />
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
