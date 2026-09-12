import { describe, expect, it } from 'vitest';
import { mergeFeedItems } from '@/hooks/useFeedPosts';
import { isShoppablePost, isVideoPost } from './postsService';
import { findFeedRestoreTarget } from '@/lib/feedRestore';

describe('mergeFeedItems', () => {
  it('appends new rows without discarding the current feed window', () => {
    const current = [{ id: '1', title: 'A' }, { id: '2', title: 'B' }];
    const next = [{ id: '3', title: 'C' }, { id: '2', title: 'B' }];

    expect(mergeFeedItems(current, next)).toEqual([
      { id: '1', title: 'A' },
      { id: '2', title: 'B' },
      { id: '3', title: 'C' },
    ]);
  });
});

describe('isShoppablePost', () => {
  it('accepts posts marked as shoppable and rejects inspiration posts', () => {
    expect(isShoppablePost({ content_type: 'product', post_type: 'product' })).toBe(true);
    expect(isShoppablePost({ content_type: 'inspiration', post_type: 'inspiration' })).toBe(false);
    expect(isShoppablePost({ content_type: null, post_type: 'product' })).toBe(true);
    expect(isShoppablePost({ content_type: null, post_type: 'inspiration' })).toBe(false);
  });
});

describe('isVideoPost', () => {
  it('recognizes explicit and legacy URL-backed video posts', () => {
    expect(isVideoPost({ media_type: 'video', media_url: 'poster.jpg', media_urls: [], media: [] })).toBe(true);
    expect(isVideoPost({ media_type: 'video/mp4', media_url: 'poster.jpg', media_urls: [], media: [] })).toBe(true);
    expect(isVideoPost({ media_type: null, media_url: 'https://cdn.example.com/video/upload/clip.mp4', media_urls: [], media: [] })).toBe(true);
    expect(isVideoPost({ media_type: 'image', media_url: 'photo.jpg', media_urls: [], media: [] })).toBe(false);
  });
});

describe('findFeedRestoreTarget', () => {
  it('restores to the exact saved post when it is still rendered', () => {
    const postRefs = new Map<string, HTMLElement>([
      ['post-a', { offsetTop: 120 } as HTMLElement],
      ['post-b', { offsetTop: 520 } as HTMLElement],
    ]);

    expect(findFeedRestoreTarget(
      { postId: 'post-b', offset: 24, loadedCount: 2 },
      [{ id: 'post-a' }, { id: 'post-b' }],
      postRefs,
      { scrollTop: 544 } as HTMLDivElement,
    )).toBe(544);
  });

  it('falls back to the nearest loaded post when the original anchor is gone', () => {
    const postRefs = new Map<string, HTMLElement>([
      ['post-a', { offsetTop: 180 } as HTMLElement],
      ['post-b', { offsetTop: 420 } as HTMLElement],
      ['post-c', { offsetTop: 680 } as HTMLElement],
    ]);

    expect(findFeedRestoreTarget(
      { postId: 'missing-post', offset: 38, loadedCount: 2 },
      [{ id: 'post-a' }, { id: 'post-b' }, { id: 'post-c' }],
      postRefs,
      { scrollTop: 0 } as HTMLDivElement,
    )).toBe(458);
  });
});
