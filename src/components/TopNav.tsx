import { Heart, House, Search, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopProvider";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const TopNav = () => {
  const { cartCount, wishlistCount } = useShop();
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex items-center justify-around py-2">
        <Button
          asChild
          variant="soft"
          size="icon"
          aria-label="Home"
          className={cn(isActive("/") && "bg-primary/10 text-primary")}
        >
          <Link to="/">
            <House />
          </Link>
        </Button>

        <Button
          asChild
          variant="soft"
          size="icon"
          aria-label="Search"
          className={cn(isActive("/search") && "bg-primary/10 text-primary")}
        >
          <Link to="/search">
            <Search />
          </Link>
        </Button>

        <div className="relative">
          <Button
            asChild
            variant="soft"
            size="icon"
            aria-label="Cart"
            className={cn(isActive("/cart") && "bg-primary/10 text-primary")}
          >
            <Link to="/cart">
              <ShoppingCart />
            </Link>
          </Button>
          {cartCount > 0 && (
            <span id="nav-cart-badge" className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </div>

        <div className="relative">
          <Button
            asChild
            variant="soft"
            size="icon"
            aria-label="Wishlist"
            className={cn(isActive("/wishlist") && "bg-primary/10 text-primary")}
          >
            <Link to="/wishlist">
              <Heart />
            </Link>
          </Button>
          {wishlistCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
              {wishlistCount}
            </span>
          )}
        </div>

        <Button
          asChild
          variant="soft"
          size="icon"
          aria-label="Profile"
          className={cn(isActive("/profile") && "bg-primary/10 text-primary")}
        >
          <Link to="/profile/me">
            <UserRound />
          </Link>
        </Button>
      </nav>
    </header>
  );
};

export default TopNav;
