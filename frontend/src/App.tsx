import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { BagProvider } from "@/hooks/useBag";
import { FloatingBag } from "@/components/FloatingBag";
import { FlyingProduct } from "@/components/FlyingProduct";
import Confetti from "@/components/Confetti";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useAnimations";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  return (
    <>
      <Toaster />
      <Sonner />
      <Confetti trigger={triggerConfetti} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <FlyingProduct />
      <FloatingBag />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile/:handle" element={<ProfilePage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BagProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </BagProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
