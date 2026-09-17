export type FeedPreferenceType = "not_interested" | "see_fewer_like_this" | "mute_creator" | "report";

export const FEED_HIDDEN_POSTS_KEY = "shopitt:feed-hidden-posts";
export const FEED_MUTED_CREATORS_KEY = "shopitt:feed-muted-creators";
export const FEED_SEE_FEWER_POSTS_KEY = "shopitt:feed-see-fewer-posts";

export function getStoredIds(key: string | null): string[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function mergeStoredIds(current: string[], next: string): string[] {
  if (current.includes(next)) return current;
  return [...current, next];
}

export function markPreference(key: string, current: string[], next: string): string[] {
  return mergeStoredIds(current, next);
}

export function removeStoredId(key: string, value: string): string[] {
  if (typeof window === "undefined") return [];
  const current = getStoredIds(key);
  const next = current.filter((id) => id !== value);
  window.localStorage.setItem(key, JSON.stringify(next));
  return next;
}

export function isCreatorMuted(mutedCreators: string[], creatorId: string | null | undefined): boolean {
  if (!creatorId) return false;
  return mutedCreators.includes(creatorId);
}

export function createReportPayload(args: {
  postId: string;
  userId: string | null;
  creatorId: string | null;
  reason: string;
  description?: string;
}) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    post_id: args.postId,
    reporter_id: args.userId,
    creator_id: args.creatorId,
    reason: args.reason,
    description: args.description ?? "",
    status: "open",
    created_at: new Date().toISOString(),
  };
}

export function shouldPauseFeedLoading(args: {
  hasMore: boolean;
  itemsCount: number;
  visibleItemsCount: number;
  hiddenIdsCount: number;
}) {
  if (!args.hasMore) return true;
  if (args.itemsCount === 0) return false;
  if (args.visibleItemsCount > 0) return false;
  return args.hiddenIdsCount > 0;
}
