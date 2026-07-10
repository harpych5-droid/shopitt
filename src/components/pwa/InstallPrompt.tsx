import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles, Zap, Bell, Rocket, Wifi } from "lucide-react";
import { INSTALL_EVENT, isIOSDevice, isStandaloneApp, useInstallPrompt } from "@/hooks/useInstallPrompt";

const DISMISS_KEY = "shopitt:install-dismissed-at";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 days
const AUTO_DELAY_MS = 20_000; // don't spam on first paint

function isIframe() {
  try { return window.self !== window.top; } catch { return true; }
}
function isPreviewHost() {
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com") || h.includes("lovable.app");
}

export const InstallPrompt = () => {
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    if (installed || isIframe() || isPreviewHost() || isStandaloneApp()) return;

    // Manual trigger from Menu → always opens
    const onForced = () => {
      setForced(true);
      setOpen(true);
    };
    window.addEventListener(INSTALL_EVENT, onForced);

    // Auto trigger after cooldown
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt >= COOLDOWN_MS && (canInstall || isIOSDevice())) {
      const t = setTimeout(() => setOpen(true), AUTO_DELAY_MS);
      return () => {
        clearTimeout(t);
        window.removeEventListener(INSTALL_EVENT, onForced);
      };
    }
    return () => window.removeEventListener(INSTALL_EVENT, onForced);
  }, [canInstall, installed]);

  if (installed) return null;

  const dismiss = () => {
    if (!forced) localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setForced(false);
    setOpen(false);
  };

  const install = async () => {
    const result = await promptInstall();
    if (result === "accepted") {
      setOpen(false);
      setForced(false);
    } else if (result === "dismissed") {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 backdrop-blur-md p-4 safe-bottom"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-card p-6 shadow-brand"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-brand-pink/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-brand-purple/40 blur-3xl" />

            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex flex-col items-center text-center">
              <motion.div
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <img
                  src="/icon-192.png"
                  alt="Shopitt"
                  width={88}
                  height={88}
                  className="h-22 w-22 rounded-2xl shadow-brand"
                  style={{ width: 88, height: 88 }}
                />
              </motion.div>

              <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                Install <span className="text-gradient-brand">Shopitt</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A faster, full-screen shopping experience that lives on your home screen.
              </p>

              <ul className="mt-4 grid w-full gap-2 text-left">
                <Feature icon={<Rocket className="h-4 w-4" />} text="Instant launch — no browser bars" />
                <Feature icon={<Zap className="h-4 w-4" />} text="Faster loading & smoother scrolling" />
                <Feature icon={<Bell className="h-4 w-4" />} text="Notifications for drops & orders" />
                <Feature icon={<Wifi className="h-4 w-4" />} text="Works even on flaky connections" />
                <Feature icon={<Sparkles className="h-4 w-4" />} text="Native app feel across the culture" />
              </ul>

              {isIOS && !canInstall ? (
                <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Install on iPhone</p>
                  Tap <span className="font-bold text-foreground">Share</span> ▵ in Safari, then{" "}
                  <span className="font-bold text-foreground">Add to Home Screen</span>.
                </div>
              ) : (
                <button
                  onClick={install}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-brand transition active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  Install Now
                </button>
              )}

              <button
                onClick={dismiss}
                className="mt-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Feature = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <li className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground">
    <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-brand text-white">
      {icon}
    </span>
    {text}
  </li>
);

export default InstallPrompt;
