import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Compass,
  Camera,
  Users,
  Sparkles,
} from "lucide-react";
import { BottomNav } from "@/components/feed/BottomNav";
import { setPageMetadata } from "@/lib/seo";
import { useEffect } from "react";

const About = () => {
  useEffect(() => {
    setPageMetadata({
      title: "About Shopitt — Fashion, Culture & Discovery",
      description:
        "Shopitt is a social fashion universe for discovering style, culture, creativity, identity and inspiration through people, looks and fashion moments.",
      path: "/about",
    });
  }, []);

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-background pb-28 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/menu"
            aria-label="Back to menu"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted/60 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-pink">
              Shopitt
            </p>
            <h1 className="text-sm font-bold">About Shopitt</h1>
          </div>

          <span className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* HERO */}
        <section className="relative flex min-h-[72vh] items-center py-20 sm:min-h-[78vh] sm:py-28">
          {/* Ambient brand light */}
          <div className="pointer-events-none absolute -right-40 -top-16 h-96 w-96 rounded-full bg-brand-purple/20 blur-[110px]" />
          <div className="pointer-events-none absolute -left-40 top-48 h-80 w-80 rounded-full bg-brand-pink/10 blur-[100px]" />

          <div className="relative max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-pink">
              The social fashion universe
            </p>

            <h2 className="mt-5 max-w-4xl font-display text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
              Fashion is
              <br />
              <span className="bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">
                more than clothing.
              </span>
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/75 sm:text-xl">
              It is identity. It is creativity. It is culture. It is the
              feeling of discovering something that makes you stop, look
              twice, and see style differently.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm font-medium backdrop-blur-md">
                Fashion
              </div>
              <div className="rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm font-medium backdrop-blur-md">
                Culture
              </div>
              <div className="rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm font-medium backdrop-blur-md">
                Discovery
              </div>
              <div className="rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm font-medium backdrop-blur-md">
                Creativity
              </div>
            </div>
          </div>
        </section>

        {/* MANIFESTO */}
        <section className="border-y border-border/40 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
                Why Shopitt exists
              </p>

              <h3 className="mt-4 max-w-md font-display text-3xl font-black leading-tight sm:text-5xl">
                Give fashion culture a place to live.
              </h3>
            </div>

            <div className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Shopitt is built around the idea that fashion should feel
                alive.
              </p>

              <p>
                A great outfit can become a conversation. A photograph can
                become inspiration. A creator can introduce an entirely new
                way of seeing style. A small idea can become a movement.
              </p>

              <p>
                Shopitt brings those moments together in one social space
                where people can discover, create, express themselves and
                participate in fashion culture.
              </p>

              <p className="font-semibold text-foreground">
                The goal is not simply to show people what to wear.
                <br />
                It is to help them discover who they want to be through
                fashion.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT SHOPITT IS */}
        <section className="py-16 sm:py-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
            Inside Shopitt
          </p>

          <h3 className="mt-4 max-w-2xl font-display text-3xl font-black leading-tight sm:text-5xl">
            A place to see it, feel it, create it and share it.
          </h3>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CultureCard
              icon={<Compass className="h-5 w-5" />}
              title="Discover"
              text="Explore styles, looks, creators, aesthetics and moments you did not know you were looking for."
            />

            <CultureCard
              icon={<Heart className="h-5 w-5" />}
              title="Feel"
              text="Fashion is emotional. Find the looks, people and stories that make something click."
            />

            <CultureCard
              icon={<Camera className="h-5 w-5" />}
              title="Create"
              text="Bring your own perspective into the culture through outfits, photography, ideas and fashion stories."
            />

            <CultureCard
              icon={<Users className="h-5 w-5" />}
              title="Belong"
              text="Follow people you connect with, join conversations and become part of a living fashion community."
            />
          </div>
        </section>

        {/* CULTURE */}
        <section className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/40 p-7 sm:p-12">
          <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-brand-pink/10 blur-[100px]" />

          <div className="relative max-w-3xl">
            <Sparkles className="h-6 w-6 text-brand-pink" />

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
              Shopitt culture
            </p>

            <h3 className="mt-4 font-display text-3xl font-black leading-tight sm:text-5xl">
              Fashion should feel like something is happening.
            </h3>

            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                A creator starts a look. Someone discovers it. Someone saves
                it. Someone recreates it. Someone adds their own twist.
              </p>

              <p>
                That is how culture moves.
              </p>

              <p>
                Shopitt is designed for that movement — the looks, the
                conversations, the inspiration, the unexpected discoveries
                and the creative energy that grows when people participate.
              </p>
            </div>
          </div>
        </section>

        {/* AFRICAN-FIRST */}
        <section className="grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
              Where we come from
            </p>

            <h3 className="mt-4 font-display text-3xl font-black leading-tight sm:text-5xl">
              African-first.
              <br />
              Globally ambitious.
            </h3>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              Shopitt is being built with Africa in mind — its creativity,
              energy, perspectives and people.
            </p>

            <p>
              African fashion should not feel like a side category of global
              culture. It belongs naturally in the conversation.
            </p>

            <p>
              From local streets to global stages, Shopitt is built to give
              fashion culture room to move.
            </p>
          </div>
        </section>

        {/* COMMERCE PHILOSOPHY */}
        <section className="border-t border-border/40 py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
              Our philosophy
            </p>

            <blockquote className="mt-6 font-display text-3xl font-black leading-tight sm:text-5xl">
              “The outfit is the story.
              <br />
              The product is the discovery.
              <br />
              The Shop Tag is the bridge.”
            </blockquote>

            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Commerce belongs inside the fashion experience, never above it.
              When something is shoppable, it should feel like a natural
              extension of discovery — not an interruption to it.
            </p>
          </div>
        </section>

        {/* IDENTITY */}
        <section className="border-y border-border/40 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-brand-pink">
              The feeling
            </p>

            <h3 className="mt-5 font-display text-4xl font-black leading-[1.02] sm:text-6xl">
              We want people to open Shopitt and wonder:
            </h3>

            <p className="mt-8 font-display text-3xl font-bold leading-tight sm:text-5xl">
              “What is happening in fashion?”
            </p>

            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Then stay because something made them feel something.
            </p>
          </div>
        </section>

        {/* CLOSING */}
        <section className="relative py-20 text-center sm:py-28">
          <div className="pointer-events-none absolute inset-x-1/2 bottom-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-purple/15 blur-[100px]" />

          <div className="relative mx-auto max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-pink">
              Shopitt
            </p>

            <h3 className="mt-5 font-display text-4xl font-black leading-[1.02] sm:text-6xl">
              Make fashion
              <br />
              feel alive.
            </h3>

            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover something. Create something. Share something.
              Become part of the culture.
            </p>

            <Link
              to="/"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-pink to-brand-purple px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Shopitt
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <p className="mt-8 text-xs text-muted-foreground">
              Shopitt by H&amp;D CREATION
            </p>
          </div>
        </section>
      </article>

      <BottomNav />
    </main>
  );
};

const CultureCard = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => {
  return (
    <div className="group rounded-3xl border border-border/50 bg-card/40 p-5 transition-colors hover:bg-card/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/70 text-brand-pink">
        {icon}
      </div>

      <h4 className="mt-5 text-base font-extrabold">{title}</h4>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
};

export default About;