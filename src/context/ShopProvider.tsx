import { createContext, useContext, useMemo, useState } from "react";

export type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  media: string[];
  seller: {
    name: string;
    handle: string;
    avatarColor?: string;
  };
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ShopState = {
  cart: CartItem[];
  wishlist: Record<string, boolean>;
  addToCart: (product: Product, qty?: number) => void;
  toggleWishlist: (productId: string) => void;
  cartCount: number;
  wishlistCount: number;
};

const ShopContext = createContext<ShopState | null>(null);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, { product, quantity: qty }];
    });

    // Simple cart bounce animation trigger
    const el = document.getElementById("nav-cart-badge");
    if (el) {
      el.classList.remove("animate-pop");
      void el.offsetWidth; // reflow
      el.classList.add("animate-pop");
      setTimeout(() => el.classList.remove("animate-pop"), 350);
    }
  };

  const toggleWishlist = (productId: string) =>
    setWishlist((w) => ({ ...w, [productId]: !w[productId] }));

  const value = useMemo<ShopState>(() => {
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
    const wishlistCount = Object.values(wishlist).filter(Boolean).length;
    return { cart, wishlist, addToCart, toggleWishlist, cartCount, wishlistCount };
  }, [cart, wishlist]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
