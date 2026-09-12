export type FeedPosition = { postId: string; offset: number; loadedCount: number };

export function findFeedRestoreTarget(
  saved: FeedPosition,
  loadedItems: Array<{ id: string }>,
  postRefs: Map<string, HTMLElement>,
  root: HTMLDivElement,
): number {
  const exact = postRefs.get(saved.postId);
  if (exact) {
    return Math.max(0, exact.offsetTop + saved.offset);
  }

  const fallbackIndex = Math.min(Math.max(saved.loadedCount - 1, 0), Math.max(loadedItems.length - 1, 0));
  const fallbackItem = loadedItems[fallbackIndex];
  const fallbackNode = fallbackItem ? postRefs.get(fallbackItem.id) : undefined;

  if (!fallbackNode) {
    const nearest = [...postRefs.values()].sort((a, b) => a.offsetTop - b.offsetTop)[0];
    if (!nearest) return 0;
    return Math.max(0, nearest.offsetTop + Math.min(saved.offset, 160));
  }

  return Math.max(0, fallbackNode.offsetTop + Math.min(saved.offset, 160));
}
