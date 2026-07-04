import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles, Zap, Bell } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "shopitt:install-dismissed-at";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

function isIframe() {
  try { return window.self !== window.top; } catch { return true; }
}
function isPreviewHost() {
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com") || h.includes("lovable.app");
}
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(/CriOS|FxiOS/i.test(navigator.userAgent));
}

export const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isIframe() || isPreviewHost() || isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < COOLDOWN_MS) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setOpen(true), 1200);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS doesn't fire beforeinstallprompt — show manual instructions
    if (isIOS()) {
      setTimeout(() => {
        setIosHint(true);
        setOpen(true);
      }, 1500);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setOpen(false);
    } else {
      dismiss();
    }
    setDeferred(null);
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
            {/* Glow */}
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-brand-pink/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-brand-purple/40 blur-3xl" />

            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
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
                  alt="Vylogue"
                  width={88}
                  height={88}
                  className="h-22 w-22 rounded-2xl shadow-brand"
                  style={{ width: 88, height: 88 }}
                />
              </motion.div>

              <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                Get the <span className="text-gradient-brand">Vylogue</span> app
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Install Vylogue for the full immersive experience — feels like a real app, lives on your home screen.
              </p>

              <ul className="mt-4 grid w-full gap-2 text-left">
                <Feature icon={<Zap className="h-4 w-4" />} text="Instant launch, no browser bars" />
                <Feature icon={<Bell className="h-4 w-4" />} text="Push alerts for drops & orders" />
                <Feature icon={<Sparkles className="h-4 w-4" />} text="Smooth full-screen scrolling" />
              </ul>

              {iosHint ? (
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
                  Install Vylogue
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
