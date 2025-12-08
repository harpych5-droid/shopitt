import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { ShopProvider } from "./context/ShopProvider";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import { Layout } from "./components/layout/Layout";

const queryClient = new QueryClient();

const App = () => {
  const handleOpenCart = () => {
    // Navigate to cart page or open cart modal
    window.location.href = '/cart';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShopProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout onOpenCart={handleOpenCart}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile/:handle" element={<Profile />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ShopProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
