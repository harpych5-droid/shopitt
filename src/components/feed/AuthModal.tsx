import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { shopitt } from "@/store/useShopittStore";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  action: "like" | "save" | "buy" | "comment" | null;
}

const COPY: Record<string, string> = {
  like: "Save your favorite drops to your profile.",
  save: "Build your wishlist across the feed.",
  buy: "One tap and it's on the way.",
  comment: "Join the conversation on this drop.",
};

export const AuthModal = ({ open, onClose, action }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    try {
      setLoading(true);
      // Persist pending action so it survives the OAuth redirect roundtrip
      const pending = shopitt.get().pendingAction;
      if (pending) {
        sessionStorage.setItem("shopitt:pendingAction", JSON.stringify(pending));
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      // Browser redirects to Google; nothing else to do.
    } catch (err: any) {
      console.error("Google sign-in failed", err);
      toast.error(err?.message ?? "Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full sm:max-w-md mx-3 mb-3 sm:mb-0 rounded-3xl overflow-hidden glass-dark"
          >
            {/* Glow accent */}
            <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-brand-pink/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-brand-purple/40 blur-3xl pointer-events-none" />

            <div className="relative p-6 pt-7">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5">
                <div className="inline-flex h-12 w-12 rounded-2xl gradient-brand items-center justify-center text-xl font-black mb-4 shadow-brand">
                  S
                </div>
                <h3 className="text-2xl font-black tracking-tight">
                  Unlock <span className="text-gradient-brand">Shopitt</span> 🔥
                </h3>
                <p className="text-sm text-white/70 mt-1.5">
                  {action ? COPY[action] : "Sign in to continue."}
                </p>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>

              <p className="text-[11px] text-white/40 text-center mt-4 leading-relaxed">
                By continuing, you agree to Shopitt's Terms & Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);
