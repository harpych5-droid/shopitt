import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import { AuthBootstrap } from "./components/auth/AuthBootstrap";
import { SocialHydrator } from "./components/auth/SocialHydrator";
import { IdentityProvider } from "./hooks/useIdentity";
import { IdentityGate } from "./components/auth/IdentityGate";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { ThemeProvider } from "./hooks/useTheme";
import { SplashScreen } from "./components/SplashScreen";
import { DesktopSidebar } from "./components/DesktopSidebar";

// Lazy-loaded routes for faster initial paint
const Shorts = lazy(() => import("./pages/Shorts.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.tsx"));
const Alerts = lazy(() => import("./pages/Alerts.tsx"));
const Create = lazy(() => import("./pages/Create.tsx"));
const Menu = lazy(() => import("./pages/Menu.tsx"));
const Chats = lazy(() => import("./pages/Chats.tsx"));
const ChatThread = lazy(() => import("./pages/ChatThread.tsx"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard.tsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Discover = lazy(() => import("./pages/Discover.tsx"));
const Wallet = lazy(() => import("./pages/Wallet.tsx"));
const Orders = lazy(() => import("./pages/Orders.tsx"));
const OrderTracking = lazy(() => import("./pages/OrderTracking.tsx"));
const Search = lazy(() => import("./pages/Search.tsx"));
const Saved = lazy(() => import("./pages/Saved.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.tsx"));
const Country = lazy(() => import("./pages/Country.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Safety = lazy(() => import("./pages/Safety.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));


const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[100dvh] bg-background flex items-center justify-center">
    <div className="flex gap-1.5">
      <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse" />
      <span className="h-2 w-2 rounded-full bg-brand-purple animate-pulse [animation-delay:120ms]" />
      <span className="h-2 w-2 rounded-full bg-brand-pink animate-pulse [animation-delay:240ms]" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SplashScreen />
        <InstallPrompt />
        <BrowserRouter>
          <IdentityProvider>
            <AuthBootstrap />
            <SocialHydrator />
            <IdentityGate>
              <DesktopSidebar />
              <div className="lg:pl-60">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/shorts" element={<Shorts />} />
                  <Route path="/reels" element={<Shorts />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/create" element={<Create />} />

                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderTracking />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/seller" element={<SellerDashboard />} />
                  <Route path="/p/:id" element={<ProductDetail />} />

                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/u/:handle" element={<UserProfile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/country" element={<Country />} />
                  <Route path="/account" element={<Profile />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/chats/:handle" element={<ChatThread />} />
                  <Route path="/alerts" element={<Alerts />} />

                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/safety" element={<Safety />} />
                  <Route path="/contact" element={<Contact />} />

                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />

                </Routes>
              </Suspense>
              </div>
            </IdentityGate>
          </IdentityProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
