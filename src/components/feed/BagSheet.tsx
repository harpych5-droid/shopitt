import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, Truck } from "lucide-react";
import { useShopitt, shopitt } from "@/store/useShopittStore";

interface BagSheetProps {
  open: boolean;
  onClose: () => void;
}

export const BagSheet = ({ open, onClose }: BagSheetProps) => {
  const bag = useShopitt((s) => s.bag);
  const total = bag.reduce((sum, b) => sum + b.item.price * b.qty, 0);
  const currency = bag[0]?.item.currency ?? "K ";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] flex flex-col rounded-t-3xl glass-dark overflow-hidden"
          >
            {/* Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <span className="h-1.5 w-12 rounded-full bg-white/25" />
            </div>

            <header className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="text-xl font-black tracking-tight">Your Bag</h3>
                <p className="text-xs text-white/60 mt-0.5">
                  {bag.length === 0 ? "Empty for now" : `${bag.length} item${bag.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center"
                aria-label="Close bag"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
              {bag.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
                  <div className="h-16 w-16 rounded-2xl gradient-brand opacity-90 flex items-center justify-center text-2xl mb-4 shadow-brand">
                    🛍️
                  </div>
                  <p className="font-semibold text-white">Your bag is empty</p>
                  <p className="text-sm text-white/60 mt-1">
                    Tap <span className="text-gradient-brand font-semibold">Buy Now</span> on a drop to add it.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {bag.map((b) => (
                    <motion.li
                      key={b.item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]"
                    >
                      <img
                        src={b.item.image}
                        alt={b.item.title}
                        className="h-20 w-16 rounded-xl object-cover"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wide">
                          {b.item.brand}
                        </p>
                        <p className="text-sm font-semibold text-white truncate mt-0.5">
                          {b.item.title}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-base font-black text-white">
                            {b.item.currency}
                            {b.item.price * b.qty}
                          </span>
                          <div className="flex items-center gap-1.5 rounded-full bg-white/10 p-0.5">
                            <button
                              onClick={() => shopitt.updateQty(b.item.id, b.qty - 1)}
                              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                              aria-label="Decrease"
                            >
                              {b.qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-bold">{b.qty}</span>
                            <button
                              onClick={() => shopitt.updateQty(b.item.id, b.qty + 1)}
                              className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center"
                              aria-label="Increase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sticky checkout */}
            <div className="px-5 pt-3 pb-5 border-t border-white/10 safe-bottom">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">Total</p>
                  <p className="text-2xl font-black tracking-tight">
                    {currency}
                    {total}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <Truck className="h-4 w-4" />
                  <span className="text-xs font-medium">Free delivery</span>
                </div>
              </div>
              <button
                disabled={bag.length === 0}
                className="w-full h-13 py-4 rounded-full gradient-brand font-bold text-white shadow-brand disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform animate-glow-pulse"
              >
                {bag.length === 0 ? "Add something to checkout" : `Checkout · ${currency}${total}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
