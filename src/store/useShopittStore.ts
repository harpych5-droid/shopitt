import { useSyncExternalStore } from "react";
import type { FeedItem } from "@/data/feed";

export type Collection = { id: string; name: string };

type State = {
  liked: Set<string>;
  /** Derived: union of postIds across all collections. Kept for back-compat. */
  saved: Set<string>;
  collections: Collection[];
  /** postId -> Set of collectionIds it belongs to. */
  postCollections: Map<string, Set<string>>;
  bag: { item: FeedItem; qty: number }[];
  authed: boolean;
  pendingAction: null | { type: "like" | "save" | "buy" | "comment"; itemId?: string };
};

const DEFAULT_COLLECTION: Collection = { id: "default", name: "All Saves" };

let state: State = {
  liked: new Set(),
  saved: new Set(),
  collections: [DEFAULT_COLLECTION],
  postCollections: new Map(),
  bag: [],
  authed: false,
  pendingAction: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const set = (updater: (s: State) => State) => {
  state = updater(state);
  emit();
};

const recomputeSaved = (postCollections: Map<string, Set<string>>): Set<string> => {
  const out = new Set<string>();
  postCollections.forEach((cols, postId) => {
    if (cols.size > 0) out.add(postId);
  });
  return out;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const shopitt = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get() {
    return state;
  },
  toggleLike(id: string) {
    set((s) => {
      const liked = new Set(s.liked);
      liked.has(id) ? liked.delete(id) : liked.add(id);
      return { ...s, liked };
    });
  },
  // ---- Collections ----
  createCollection(name: string): string {
    const id = uid();
    set((s) => ({ ...s, collections: [...s.collections, { id, name }] }));
    return id;
  },
  renameCollection(id: string, name: string) {
    set((s) => ({
      ...s,
      collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  },
  deleteCollection(id: string) {
    if (id === "default") return;
    set((s) => {
      const postCollections = new Map(s.postCollections);
      postCollections.forEach((cols, postId) => {
        if (cols.has(id)) {
          const next = new Set(cols);
          next.delete(id);
          postCollections.set(postId, next);
        }
      });
      return {
        ...s,
        collections: s.collections.filter((c) => c.id !== id),
        postCollections,
        saved: recomputeSaved(postCollections),
      };
    });
  },
  togglePostInCollection(postId: string, collectionId: string) {
    set((s) => {
      const postCollections = new Map(s.postCollections);
      const current = new Set(postCollections.get(postId) ?? []);
      current.has(collectionId) ? current.delete(collectionId) : current.add(collectionId);
      postCollections.set(postId, current);
      return { ...s, postCollections, saved: recomputeSaved(postCollections) };
    });
  },
  collectionsForPost(postId: string): Set<string> {
    return state.postCollections.get(postId) ?? new Set();
  },
  /** Quick toggle: if saved anywhere, remove from all; else add to default. */
  quickToggleSave(postId: string) {
    set((s) => {
      const postCollections = new Map(s.postCollections);
      const existing = postCollections.get(postId);
      if (existing && existing.size > 0) {
        postCollections.set(postId, new Set());
      } else {
        postCollections.set(postId, new Set(["default"]));
      }
      return { ...s, postCollections, saved: recomputeSaved(postCollections) };
    });
  },
  // ---- Bag ----
  addToBag(item: FeedItem) {
    set((s) => {
      const existing = s.bag.find((b) => b.item.id === item.id);
      const bag = existing
        ? s.bag.map((b) => (b.item.id === item.id ? { ...b, qty: b.qty + 1 } : b))
        : [...s.bag, { item, qty: 1 }];
      return { ...s, bag };
    });
  },
  removeFromBag(id: string) {
    set((s) => ({ ...s, bag: s.bag.filter((b) => b.item.id !== id) }));
  },
  updateQty(id: string, qty: number) {
    set((s) => ({
      ...s,
      bag: qty <= 0 ? s.bag.filter((b) => b.item.id !== id) : s.bag.map((b) => (b.item.id === id ? { ...b, qty } : b)),
    }));
  },
  setAuthed(v: boolean) {
    set((s) => ({ ...s, authed: v }));
  },
  setPending(p: State["pendingAction"]) {
    set((s) => ({ ...s, pendingAction: p }));
  },
  // legacy alias
  toggleSave(id: string) {
    shopitt.quickToggleSave(id);
  },
};

export function useShopitt<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    shopitt.subscribe,
    () => selector(shopitt.get()),
    () => selector(shopitt.get()),
  );
}
