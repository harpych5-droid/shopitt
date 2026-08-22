import { Link } from "react-router-dom";
import type { FeedItem } from "@/data/feed";

/**
 * SBB 23 — CREATORS.
 * Circular avatars, never stretched. Built from the real feed data (no mock creators).
 */
export const CreatorsRail = ({ items }: { items: FeedItem[] }) => {
  const creators = Array.from(
    new Map(
      items
        .filter((i) => i.brandHandle)
        .map((i) => [i.brandHandle, { handle: i.brandHandle, avatar: i.avatar, name: i.brand }]),
    ).values(),
  ).slice(0, 14);

  if (creators.length === 0) return null;

  return (
    <section aria-label="Creators" className="pt-2 pb-1">
      <div className="px-4 flex items-baseline justify-between">
        <h2 className="font-display text-[11px] font-black tracking-[0.22em] text-muted-foreground">
          CREATORS
        </h2>
        <Link to="/discover" className="text-[11px] font-semibold text-brand-pink">
          Discover
        </Link>
      </div>

      <div className="mt-2.5 flex gap-4 overflow-x-auto no-scrollbar px-4 pb-1">
        {creators.map((c) => (
          <Link
            key={c.handle}
            to={`/u/${c.handle}`}
            className="shrink-0 w-[62px] flex flex-col items-center gap-1.5"
          >
            <span className="relative block h-[62px] w-[62px] rounded-full gradient-brand p-[2px]">
              <span className="block h-full w-full rounded-full bg-background p-[2px]">
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.handle}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="h-full w-full rounded-full object-cover aspect-square"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-black text-foreground">
                    {(c.name?.[0] ?? c.handle[0] ?? "S").toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <span className="w-full truncate text-center text-[10.5px] font-medium text-muted-foreground">
              {c.handle}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
