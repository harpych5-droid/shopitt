import { useEffect, useState } from "react";
import TopNav from "@/components/common/TopNav";
import Feed from "@/features/feed/components/Feed";
import CheckoutModal from "@/features/products/components/CheckoutModal";
import { Product } from "@/context/ShopProvider";
import AppBar from "@/components/common/AppBar";

const HomePage = () => {
  const [checkingOut, setCheckingOut] = useState<Product | null>(null);

  useEffect(() => {
    document.title = "Shopit – Social Commerce Feed";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover trending products and buy instantly—Shopit makes shopping social and fun.");

    // Structured data for the feed (simplified)
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Shopit Feed',
      about: 'Social commerce feed with products and creators'
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppBar />
      <main className="container max-w-md pb-24 pt-14">
        <h1 className="sr-only">Shopit Social Commerce Feed</h1>
        <Feed onBuy={(p) => setCheckingOut(p)} />
      </main>
      <TopNav />
      <CheckoutModal open={!!checkingOut} onOpenChange={(o) => !o && setCheckingOut(null)} product={checkingOut} />
    </div>
  );
};

export default HomePage;
