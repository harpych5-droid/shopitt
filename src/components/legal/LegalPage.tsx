import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

/**
 * Reusable layout for legal/policy pages — keeps Terms / Privacy / Safety / Contact
 * visually consistent and on-brand without rebuilding chrome each time.
 */
export const LegalPage = ({ title, updated, children }: LegalPageProps) => {
  useEffect(() => {
    document.title = `${title} — Vylogue`;
  }, [title]);

  return (
    <main className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/menu" aria-label="Back" className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold truncate">{title}</h1>
          <span className="h-9 w-9" />
        </div>
      </header>

      <article className="max-w-md mx-auto px-5 pt-6 space-y-5">
        <div>
          <span className="inline-block rounded-full gradient-brand text-white text-[10px] uppercase tracking-[0.18em] font-bold px-3 py-1 shadow-brand">
            AETHØNN Inc.
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">Last updated · {updated}</p>
        </div>
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/90 space-y-4">
          {children}
        </div>
      </article>

      <BottomNav />
    </main>
  );
};
