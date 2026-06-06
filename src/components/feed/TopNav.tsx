import { motion } from "framer-motion";
import { Search, MessageCircle, Menu as MenuIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useIdentity } from "@/hooks/useIdentity";
import { IdentityAvatar } from "@/components/identity/IdentityAvatar";

interface TopNavProps {
  hidden?: boolean;
}

export const TopNav = ({ hidden = false }: TopNavProps) => {
  const { profile, isAuthed } = useIdentity();

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? -90 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40"
    >
      <div className="flex items-center justify-between px-4 py-2.5 max-w-md mx-auto gap-2">
        {/* LEFT — Shopitt logo → Home */}
        <Link to="/" aria-label="Shopitt home" className="inline-flex shrink-0">
          <span className="rounded-full gradient-brand px-4 py-1.5 text-base font-extrabold text-white tracking-tight shadow-brand">
            Shopitt
          </span>
        </Link>

        {/* RIGHT — Search, Chat, Menu, Avatar */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to="/search"
            aria-label="Search Shopitt"
            className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center"
          >
            <Search className="h-5 w-5 text-foreground" />
          </Link>
          <Link
            to="/chats"
            aria-label="Messages"
            className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center"
          >
            <MessageCircle className="h-5 w-5 text-foreground" />
          </Link>
          <Link
            to="/menu"
            aria-label="Menu"
            className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center"
          >
            <MenuIcon className="h-5 w-5 text-foreground" />
          </Link>
          {isAuthed && (
            <Link
              to="/profile"
              aria-label={profile?.username ? `@${profile.username}` : "Your profile"}
              className="ml-1 active:scale-95 transition-transform"
            >
              <IdentityAvatar profile={profile} size={32} ring />
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

