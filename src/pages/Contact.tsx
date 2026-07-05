import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";

const Contact = () => {
  useEffect(() => {
    document.title = "Contact VYLOGUE ENTERPRISES — Shopitt";
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">Contact</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* Brand hero */}
        <section className="relative overflow-hidden rounded-3xl gradient-brand shadow-brand p-6">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-3xl" />
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <h2 className="mt-3 text-xl font-black text-white tracking-tight">VYLOGUE ENTERPRISES</h2>
          <p className="mt-1 text-sm text-white/85">
            Makers of Shopitt — built for the culture, shipped to the world.
          </p>
        </section>

        {/* Contact cards */}
        <section className="space-y-2">
          <a
            href="tel:0573105096"
            className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4 active:scale-[0.98] transition-transform"
          >
            <span className="h-10 w-10 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">Phone</p>
              <p className="text-sm font-extrabold mt-0.5">0573105096</p>
            </div>
          </a>

          <a
            href="mailto:shopitt54@gmail.com"
            className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4 active:scale-[0.98] transition-transform"
          >
            <span className="h-10 w-10 rounded-xl bg-brand-purple/15 text-brand-purple flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">Email</p>
              <p className="text-sm font-extrabold mt-0.5 truncate">shopitt54@gmail.com</p>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4">
            <span className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">Headquarters</p>
              <p className="text-sm font-extrabold mt-0.5">Lusaka, Zambia</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/60 p-4">
            <span className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
              <Clock className="h-5 w-5 text-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted-foreground">Support hours</p>
              <p className="text-sm font-extrabold mt-0.5">Mon–Sat · 08:00 – 22:00 CAT</p>
            </div>
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          Most enquiries answered within 1 hour during business hours.
        </p>
      </div>

      <BottomNav />
    </main>
  );
};

export default Contact;
