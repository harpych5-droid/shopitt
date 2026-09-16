import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, Truck, Phone, Loader2, MessageCircle, MessageSquareText } from "lucide-react";
import type { FeedItem } from "@/data/feed";
import { useIdentity } from "@/hooks/useIdentity";
import { buildWhatsAppUrl, createOrder, fetchSellerContactPhone, getOrderStatusLabel } from "@/services/ordersService";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface PlaceOrderSheetProps {
  open: boolean;
  product: FeedItem | null;
  onClose: () => void;
}

type Stage = "form" | "confirmed";

export const PlaceOrderSheet = ({ open, product, onClose }: PlaceOrderSheetProps) => {
  const { user, profile, isAuthed } = useIdentity();
  const [stage, setStage] = useState<Stage>("form");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStage("form");
      setSubmitting(false);
      setQuantity(1);
      setOrderId(null);
      if (product?.userId) {
        void fetchSellerContactPhone(product.userId).then((phone) => setSellerPhone(phone));
      }
    }
  }, [open, product?.userId]);

  if (!product) return null;

  const total = Number(product.price ?? 0) * quantity;
  const maxQuantity = Number.isFinite(Number(product.stockLeft)) && Number(product.stockLeft) > 0 ? Number(product.stockLeft) : 99;
  const canSubmit = quantity > 0 && quantity <= maxQuantity && !submitting && isAuthed && !!user && !!product.userId;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!isAuthed || !user) toast.error("Please sign in to order");
      else if (!product.userId) toast.error("Seller info missing");
      else if (quantity > maxQuantity) toast.error("Sorry, this item is no longer available in that quantity.");
      return;
    }

    setSubmitting(true);
    const { id, error } = await createOrder({
      buyerId: user!.id,
      sellerId: product.userId,
      postId: product.catalogProduct ? null : product.id,
      quantity,
      unitPrice: Number(product.price ?? 0),
      currency: (product.currency ?? "USD").trim(),
      buyerName: profile?.username ?? "Customer",
      buyerPhone: "",
      deliveryAddress: "",
      productSnapshot: { title: product.title, media_url: product.image },
    });
    setSubmitting(false);

    if (error || !id) {
      toast.error(error || "Your order wasn't placed. Please try again.");
      return;
    }

    setOrderId(id);
    setStage("confirmed");
  };

  const whatsappHref = buildWhatsAppUrl(sellerPhone, `Hi, I just placed Shopitt order #${orderId ?? ""} for ${product.title}.`);

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
              <button onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            {stage === "form" ? (
              <form onSubmit={onSubmit} className="px-4 py-4 space-y-4 max-w-md mx-auto">
                <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-3">
                  <img src={product.image} alt={product.title} className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{product.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">@{product.brandHandle}</p>
                  </div>
                  <span className="text-base font-extrabold tabular-nums">
                    {product.currency}{product.price}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Quantity</label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-11 w-11 rounded-full bg-card border border-border/60 text-lg font-bold">−</button>
                    <span className="min-w-[3ch] text-center text-base font-extrabold tabular-nums">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} className="h-11 w-11 rounded-full bg-card border border-border/60 text-lg font-bold">+</button>
                    <span className="ml-auto text-sm font-bold tabular-nums text-brand-pink">
                      {product.currency}{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 border border-border/60 px-3 py-2.5 flex items-start gap-2 text-[12px] text-muted-foreground leading-snug">
                  <Truck className="h-4 w-4 text-brand-pink mt-0.5 shrink-0" />
                  Order received is the first status after purchase. The seller receives the order and can start preparing it.
                </div>

                <button type="submit" disabled={!canSubmit} className="w-full h-12 rounded-full gradient-brand shadow-brand text-sm font-extrabold text-white flex items-center justify-center disabled:opacity-50 active:scale-[0.98] transition-transform">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Placing…</span>
                  ) : (
                    "Buy"
                  )}
                </button>
              </form>
            ) : (
              <div className="px-6 py-10 max-w-md mx-auto text-center">
                <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 360, damping: 22 }} className="inline-flex h-16 w-16 items-center justify-center rounded-full gradient-brand shadow-brand">
                  <CheckCircle2 className="h-9 w-9 text-white" />
                </motion.span>
                <h3 className="mt-4 text-xl font-extrabold tracking-tight">Order received</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-snug">
                  Product: <span className="font-semibold text-foreground">{product.title}</span>
                </p>
                <div className="mt-5 rounded-2xl bg-card border border-border/60 p-4 text-left">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-bold">Order summary</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-semibold">{quantity}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-extrabold tabular-nums">{product.currency}{total.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold text-brand-pink">{getOrderStatusLabel("pending")}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-semibold">#{orderId?.slice(0, 8).toUpperCase() ?? "NEW"}</span>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <a href={sellerPhone ? `tel:${sellerPhone}` : undefined} aria-disabled={!sellerPhone} className={`h-11 rounded-full border text-sm font-bold flex items-center justify-center gap-1.5 ${sellerPhone ? "bg-card border-border/60" : "bg-muted border-muted text-muted-foreground pointer-events-none"}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                  <a href={sellerPhone ? `sms:${sellerPhone}` : undefined} aria-disabled={!sellerPhone} className={`h-11 rounded-full border text-sm font-bold flex items-center justify-center gap-1.5 ${sellerPhone ? "bg-card border-border/60" : "bg-muted border-muted text-muted-foreground pointer-events-none"}`}>
                    <MessageSquareText className="h-4 w-4" />
                    Text
                  </a>
                  <a href={whatsappHref ?? undefined} aria-disabled={!whatsappHref} className={`h-11 rounded-full border text-sm font-bold flex items-center justify-center gap-1.5 ${whatsappHref ? "bg-card border-border/60" : "bg-muted border-muted text-muted-foreground pointer-events-none"}`}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Link to={orderId ? `/orders/${orderId}` : "/orders"} onClick={onClose} className="flex-1 h-11 rounded-full gradient-brand shadow-brand text-sm font-extrabold text-white flex items-center justify-center">
                    View order
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
