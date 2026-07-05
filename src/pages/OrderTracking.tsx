import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  Home,
  Globe,
  MapPin,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { FEED } from "@/data/feed";

type Status = "pending" | "processing" | "shipped" | "delivered";

// Mirror the demo orders dataset (simplified)
const ORDERS: Record<string, { productId: string; status: Status; delivery: "international" | "country" | "local" }> = {
  "o-1024": { productId: "p6", status: "shipped", delivery: "country" },
  "o-1023": { productId: "p2", status: "shipped", delivery: "local" },
  "o-1022": { productId: "p5", status: "processing", delivery: "international" },
  "o-1021": { productId: "p1", status: "pending", delivery: "country" },
  "o-1019": { productId: "p4", status: "delivered", delivery: "local" },
  "o-1018": { productId: "p3", status: "delivered", delivery: "country" },
};

const STEPS: { key: Status; icon: typeof Package; title: string; desc: string }[] = [
  { key: "pending", icon: Package, title: "Order placed", desc: "We received your order." },
  { key: "processing", icon: CheckCircle2, title: "Confirmed", desc: "Seller is preparing your drop." },
  { key: "shipped", icon: Truck, title: "Shipped", desc: "Your parcel is on the way." },
  { key: "delivered", icon: Home, title: "Delivered", desc: "Enjoy your drop ✨" },
];

const DELIVERY_META = {
  international: { icon: Globe, label: "International" },
  country: { icon: Truck, label: "Country-wide" },
  local: { icon: MapPin, label: "Local" },
} as const;

const OrderTracking = () => {
  const { id } = useParams();
  const order = useMemo(() => ORDERS[id ?? ""] ?? Object.values(ORDERS)[0], [id]);
  const product = FEED.find((p) => p.id === order.productId) ?? FEED[0];
  const D = DELIVERY_META[order.delivery];
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);

  useEffect(() => {
    document.title = `Tracking ${id ?? ""} — Shopitt`;
  }, [id]);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/orders" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Tracking</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Product summary */}
        <section className="flex items-center gap-3 rounded-3xl bg-card border border-border/60 p-3">
          <Link to={`/p/${product.id}`} className="h-16 w-16 rounded-2xl overflow-hidden bg-muted shrink-0">
            <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{product.title}</p>
            <p className="text-[11px] text-muted-foreground">Order #{id}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold">
              <D.icon className="h-3 w-3 text-brand-pink" />
              {D.label} delivery
            </div>
          </div>
          <span className="text-sm font-extrabold tabular-nums">
            {product.currency}{product.price}
          </span>
        </section>

        {/* Timeline */}
        <section className="rounded-3xl bg-card border border-border/60 p-5">
          <h2 className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground mb-4">
            Delivery timeline
          </h2>
          <ol className="relative">
            {STEPS.map((step, i) => {
              const reached = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const Icon = step.icon;
              return (
                <li key={step.key} className="relative pl-10 pb-5 last:pb-0">
                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <span
                      className={`absolute left-[15px] top-7 bottom-0 w-[2px] ${
                        i < currentIdx ? "gradient-brand" : "bg-border"
                      }`}
                    />
                  )}
                  <motion.span
                    initial={false}
                    animate={{ scale: isCurrent ? [1, 1.08, 1] : 1 }}
                    transition={{ duration: 1.6, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                    className={`absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      reached ? "gradient-brand shadow-brand text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {reached ? <Icon className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                  </motion.span>
                  <p className={`text-sm font-bold ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Courier placeholder */}
        <section className="rounded-3xl glass p-4">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl gradient-brand shadow-brand flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Shopitt Courier</p>
              <p className="text-[11px] text-muted-foreground">Live tracking syncs with carrier API.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="h-10 rounded-full bg-card border border-border/60 text-xs font-bold flex items-center justify-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5" /> Call courier
            </button>
            <Link
              to={`/chats/${product.brandHandle}`}
              className="h-10 rounded-full gradient-brand text-white text-xs font-bold shadow-brand flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Message seller
            </Link>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
};

export default OrderTracking;
