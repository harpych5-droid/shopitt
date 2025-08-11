import { Heart, House, Search, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopProvider";
import { Link } from "react-router-dom";

const TopNav = () => {
  const { cartCount, wishlistCount } = useShop();

  return (
    <header className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-primary shadow-[var(--shadow-elev)]" aria-hidden />
            <span className="font-extrabold tracking-tight">Shopit</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" size="icon" aria-label="Home">
            <House />
          </Button>
          <Button variant="soft" size="icon" aria-label="Search">
            <Search />
          </Button>
          <div className="relative">
            <Button variant="soft" size="icon" aria-label="Cart">
              <ShoppingCart />
            </Button>
            {cartCount > 0 && (
              <span id="nav-cart-badge" className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </div>
          <div className="relative">
            <Button asChild variant="soft" size="icon" aria-label="Wishlist">
              <Link to="/profile/me#wishlist">
                <Heart />
              </Link>
            </Button>
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {wishlistCount}
              </span>
            )}
          </div>
          <Button asChild variant="soft" size="icon" aria-label="Profile">
            <Link to="/profile/me">
              <UserRound />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default TopNav;
