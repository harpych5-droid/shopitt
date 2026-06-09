import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, Truck, Phone } from "lucide-react";
import type { FeedItem } from "@/data/feed";

interface PlaceOrderSheetProps {
  open: boolean;
  product: FeedItem | null;
  onClose: () => void;
}

type Stage = "form" | "confirmed";

export const PlaceOrderSheet = ({ open, product, onClose }: PlaceOrderSheetProps) => {
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStage("form");
      setSubmitting(false);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const canSubmit = name.trim() && phone.trim() && address.trim() && !submitting;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Demo: simulate request
    setTimeout(() => {
      setStage("confirmed");
      setSubmitting(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="po-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="po-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed bottom-0 inset-x-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-background border-t border-border/60 safe-bottom"
          >
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-border/60">
              <h2 className="text-base font-extrabold">
                {stage === "form" ? "Place Order" : "Order placed"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {stage === "form" ? (
              <form onSubmit={onSubmit} className="px-4 py-4 space-y-4 max-w-md mx-auto">
                {/* Product summary */}
                <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{product.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">@{product.brandHandle}</p>
                  </div>
                  <span className="text-base font-extrabold tabular-nums">
                    {product.currency}{product.price}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Full name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Phone *</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+260 ..."
                    type="tel"
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Delivery address *</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Area, street, landmark"
                    rows={2}
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Notes (optional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Size, color, preferred time…"
                    className="mt-1.5 w-full rounded-2xl bg-card border border-border/60 px-4 py-3 text-sm focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div className="rounded-2xl bg-muted/40 border border-border/60 px-3 py-2.5 flex items-start gap-2 text-[12px] text-muted-foreground leading-snug">
                  <Truck className="h-4 w-4 text-brand-pink mt-0.5 shrink-0" />
                  No payment is taken now. The seller contacts you to arrange payment & delivery.
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 rounded-full gradient-brand shadow-brand text-sm font-extrabold text-white flex items-center justify-center disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {submitting ? "Placing order…" : "Place Order"}
                </button>
              </form>
            ) : (
              <div className="px-6 py-10 max-w-md mx-auto text-center">
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 360, damping: 22 }}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full gradient-brand shadow-brand"
                >
                  <CheckCircle2 className="h-9 w-9 text-white" />
                </motion.span>
                <h3 className="mt-4 text-xl font-extrabold tracking-tight">
                  Order received 🎉
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-snug">
                  <span className="font-semibold text-foreground">{product.brand}</span> will contact you to arrange payment and delivery — usually within an hour.
                </p>
                <div className="mt-5 rounded-2xl bg-card border border-border/60 p-4 text-left">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Order summary</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Item</span>
                    <span className="font-semibold truncate ml-2">{product.title}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-extrabold tabular-nums">{product.currency}{product.price}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-brand-pink">Received</span>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <a
                    href={`tel:`}
                    className="flex-1 h-11 rounded-full bg-card border border-border/60 text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="h-4 w-4" />
                    Call seller
                  </a>
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 rounded-full gradient-brand shadow-brand text-sm font-extrabold text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
