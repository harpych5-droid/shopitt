import { motion } from "framer-motion";
import { Search, Film, Menu as MenuIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";


interface TopNavProps {
  hidden?: boolean;
}

export const TopNav = ({ hidden = false }: TopNavProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
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
      } else {
        // silently ignore for non-admins
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
          className="inline-flex shrink-0 select-none"
        >
          <span className="rounded-full gradient-brand px-4 py-1.5 text-base font-extrabold text-white tracking-tight shadow-brand">
            Shopitt
          </span>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <Link to="/search" aria-label="Search Shopitt" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Search className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/shorts" aria-label="Watch Reels" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <Film className="h-5 w-5 text-foreground" />
          </Link>
          <Link to="/menu" aria-label="Menu" className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center">
            <MenuIcon className="h-5 w-5 text-foreground" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
};



