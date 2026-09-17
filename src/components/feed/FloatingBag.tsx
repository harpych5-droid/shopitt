import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShopitt } from "@/store/useShopittStore";

interface FloatingBagProps {
  onClick: () => void;
  /** offset from bottom in px to clear bottom nav / sticky CTAs */
  bottomOffset?: number;
  /** "left" | "right" placement */
  side?: "left" | "right";
}

export const FloatingBag = ({ onClick, bottomOffset = 80, side = "left" }: FloatingBagProps) => {
  const count = useShopitt((s) => s.bag.reduce((a, b) => a + b.qty, 0));
  const [bounce, setBounce] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 500);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  if (count === 0) return null;

  return (
    <motion.button
      onClick={onClick}
      animate={bounce ? { scale: [1, 1.25, 0.95, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        [side]: "16px",
        right: side === "right" ? "16px" : undefined,
        left: side === "left" ? "16px" : undefined,
      } as React.CSSProperties}
      className="fixed z-30 h-14 w-14 rounded-full gradient-brand shadow-brand flex items-center justify-center animate-breathe lg:h-16 lg:w-16"
      aria-label="Open bag"
    >
      <ShoppingBag className="h-6 w-6 text-white lg:h-7 lg:w-7" strokeWidth={2.2} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-black text-[11px] font-black flex items-center justify-center border-2 border-background"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
