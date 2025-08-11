import { useEffect, useMemo } from "react";
import AppBar from "@/components/AppBar";
import TopNav from "@/components/TopNav";
import { useShop } from "@/context/ShopProvider";
import { mockPosts } from "@/data/mockPosts";

const Wishlist = () => {
  const { wishlist } = useShop();
  const items = useMemo(
    () => mockPosts.filter((p) => wishlist[p.product.id]).map((p) => p.product),
    [wishlist]
  );

  useEffect(() => {
    document.title = "Wishlist – Shopit";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Your wishlist on Shopit.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppBar />
      <main className="container max-w-md pb-24 pt-14">
        <h1 className="mb-4 text-xl font-bold">Wishlist</h1>
        {items.length === 0 ? (
          <div className="grid place-items-center rounded-lg border p-8 text-center">
            <p className="text-sm text-muted-foreground">No items saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((prod) => (
              <div key={prod.id} className="space-y-2">
                <img src={prod.media[0]} alt={prod.title} className="aspect-square w-full rounded-md object-cover" />
                <div>
                  <p className="truncate text-sm font-medium">{prod.title}</p>
                  <p className="text-xs text-muted-foreground">{prod.currency}{prod.price.toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <TopNav />
    </div>
  );
};

export default Wishlist;
