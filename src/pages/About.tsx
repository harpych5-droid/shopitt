import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { setPageMetadata } from "@/lib/seo";
import { useEffect } from "react";

const About = () => {
  useEffect(() => {
    setPageMetadata({
      title: "About Shopitt — Fashion, Culture & Discovery",
      description: "Shopitt is a social fashion platform for culture, discovery, creativity, identity and self-expression.",
      path: "/about",
    });
  }, []);

  return <main className="min-h-[100dvh] overflow-hidden bg-background pb-32">
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link to="/menu" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/50"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-base font-bold">About Shopitt</h1><span className="h-9 w-9" />
      </div>
    </header>
    <article className="relative mx-auto max-w-md px-5 pt-10">
      <div className="pointer-events-none absolute -top-16 right-[-7rem] h-64 w-64 rounded-full bg-brand-purple/20 blur-[90px]" />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-brand-pink">The social fashion universe</p>
      <h2 className="relative mt-3 font-display text-4xl font-black leading-[1.03] tracking-tight">Fashion is more<br />than clothing.</h2>
      <p className="relative mt-5 max-w-sm text-base leading-relaxed text-foreground/80">It is identity. It is creativity. It is culture, discovery and expression.</p>
      <section className="relative mt-10 border-l-2 border-brand-pink pl-5">
        <p className="text-xl font-bold leading-snug">Shopitt exists to give that culture a place to live.</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">A place to discover the people, ideas, stories and moments that make style feel alive. Commerce is there when something is shoppable—never in the way of the culture.</p>
      </section>
      <section className="relative mt-12 rounded-3xl border border-border/60 bg-card/70 p-6">
        <Sparkles className="h-5 w-5 text-brand-pink" />
        <h3 className="mt-4 text-lg font-extrabold">Made for self-expression.</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Shopitt is a social fashion platform by H&amp;D CREATION, built around the creative energy of fashion and community.</p>
      </section>
    </article>
    <BottomNav />
  </main>;
};

export default About;
