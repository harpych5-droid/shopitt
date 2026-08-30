import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { setPageMetadata } from "@/lib/seo";
import { useEffect } from "react";

const Subscription = () => {
  useEffect(() => setPageMetadata({ title: "Subscription — Shopitt", description: "Subscription updates from Shopitt.", path: "/subscription" }), []);
  return <main className="min-h-[100dvh] bg-background pb-32">
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-md items-center justify-between px-4 py-3"><Link to="/menu" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/50"><ArrowLeft className="h-5 w-5" /></Link><h1 className="text-base font-bold">Subscription</h1><span className="h-9 w-9" /></div></header>
    <section className="mx-auto flex max-w-md flex-col px-6 pt-20 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-brand"><Sparkles className="h-6 w-6 text-white" /></span><h2 className="mt-5 text-2xl font-extrabold">Subscription is on its way.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">We&apos;re shaping this part of Shopitt carefully. There are no plans, prices, or billing options available yet.</p></section>
    <BottomNav />
  </main>;
};
export default Subscription;
