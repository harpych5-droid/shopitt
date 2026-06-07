import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Shorts from "./pages/Shorts.tsx";
import Profile from "./pages/Profile.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Alerts from "./pages/Alerts.tsx";
import Create from "./pages/Create.tsx";
import Menu from "./pages/Menu.tsx";
import Chats from "./pages/Chats.tsx";
import ChatThread from "./pages/ChatThread.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Discover from "./pages/Discover.tsx";
import Wallet from "./pages/Wallet.tsx";
import Orders from "./pages/Orders.tsx";
import OrderTracking from "./pages/OrderTracking.tsx";
import Search from "./pages/Search.tsx";
import Saved from "./pages/Saved.tsx";
import EditProfile from "./pages/EditProfile.tsx";
import Country from "./pages/Country.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Safety from "./pages/Safety.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthBootstrap } from "./components/auth/AuthBootstrap";
import { IdentityProvider } from "./hooks/useIdentity";
import { IdentityGate } from "./components/auth/IdentityGate";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { ThemeProvider } from "./hooks/useTheme";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPrompt />
      <BrowserRouter>
        <IdentityProvider>
          <AuthBootstrap />
          <IdentityGate>
            <Routes>
              {/* Core feed */}
              <Route path="/" element={<Index />} />
              <Route path="/shorts" element={<Shorts />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/search" element={<Search />} />
              <Route path="/create" element={<Create />} />

              {/* Dashboard (overview) — separate from Wallet */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Commerce */}
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/p/:id" element={<ProductDetail />} />

              {/* Social */}
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/u/:handle" element={<UserProfile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/country" element={<Country />} />
              <Route path="/account" element={<Profile />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/chats/:handle" element={<ChatThread />} />
              <Route path="/alerts" element={<Alerts />} />

              {/* Legal */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/contact" element={<Contact />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </IdentityGate>
        </IdentityProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
