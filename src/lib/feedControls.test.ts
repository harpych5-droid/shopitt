import { describe, expect, it } from "vitest";
import { getStoredIds, mergeStoredIds, isCreatorMuted, markPreference, shouldPauseFeedLoading } from "./feedControls";

describe("feedControls", () => {
  it("adds a new hidden post without duplicating entries", () => {
    const next = mergeStoredIds(["a", "b"], "b");
    expect(next).toEqual(["a", "b"]);
    expect(mergeStoredIds(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("stores a creator mute and reads it back", () => {
    const key = "shopitt:test:muted-creators";
    const ids = ["creator-1", "creator-2"];
    const result = markPreference(key, ids, "creator-1");
    expect(result).toEqual(["creator-1", "creator-2"]);
    expect(isCreatorMuted(["creator-1"], "creator-1")).toBe(true);
    expect(isCreatorMuted(["creator-1"], "creator-2")).toBe(false);
  });

  it("pauses infinite loading when every loaded post is filtered out", () => {
    expect(shouldPauseFeedLoading({ hasMore: true, itemsCount: 3, visibleItemsCount: 0, hiddenIdsCount: 2 })).toBe(true);
    expect(shouldPauseFeedLoading({ hasMore: true, itemsCount: 3, visibleItemsCount: 2, hiddenIdsCount: 1 })).toBe(false);
  });

  it("handles malformed localStorage values safely", () => {
    expect(getStoredIds("not-json")).toEqual([]);
    expect(getStoredIds(null)).toEqual([]);
  });
});
