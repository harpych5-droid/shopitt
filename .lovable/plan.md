# Shopitt JETS Demo Build Plan

Goal: judges open Shopitt Wednesday and feel a real, fast, polished African fashion startup. Scope is large, so I'll ship it in tight phases and verify each one before moving on. Existing architecture (Supabase, CJ ingestion, sellers, social, mobile-first, Phases 1–4, theme toggle) is preserved.

## Phase 0 — Stability & Performance Pass (do first)
- Fix the active runtime error (React #185 "max update depth", likely a Zustand selector returning a new object each render after the recent store changes).
- Audit hot components for re-render leaks: `HomeFeedCard`, `SaveSheet`, `Discover`, `Saved`, `BottomNav`.
- Add `React.lazy` + `Suspense` for `Discover`, `Saved`, `Reels`, `Create`, `Messages`, `Profile`, `Settings`, `Orders` routes.
- Images: `loading="lazy"`, `decoding="async"`, explicit `width`/`height` to kill CLS; preload only the hero/LCP.
- Videos: `preload="metadata"`, `playsInline`, IntersectionObserver-based autoplay/pause.
- Memoize feed list items; virtualize Discover/Saved grids if length > 30.

## Phase 1 — Splash / Loading Experience
- New `SplashScreen` component with Shopitt logo, hot-pink → violet gradient wave, soft pulse, and tagline **"LET THERE BE SHOPITT."** plus a thin loader.
- Show once per session (sessionStorage flag), 1.2s, then fade out.

## Phase 2 — App Bar Redesign
- Remove circular avatar from `TopNav`.
- Layout: `[Shopitt logo] … [Search] [Reels icon]`.
- Theme toggle moves to Settings (per new spec) — keep it accessible.

## Phase 3 — Reels System (functional)
- Route `/reels`: vertical full-screen pager (snap scroll), like / comment / share / save actions on the right rail.
- `/reels/create`: video upload → caption → hashtags → publish.
- Backend: extend `posts` table (or new `reels` table) with `media_type`, `caption`, `hashtags[]`, plus `likes`, `comments`, `saves` tables shared with posts. Storage bucket `reels` (public).
- Comments support threaded replies + comment likes.

## Phase 4 — Post Creation Upgrade
- Add **Drop Title** (required), Caption, Media, Tags, Post Type (`product` | `inspiration`) selector.
- Persist to `posts` + `products` (when product) with Supabase Storage bucket `posts`.

## Phase 5 — Social Features (wire to DB)
- Likes, unlikes, save/unsave (multi-collection), comments + nested replies, comment likes, share sheet.
- New tables: `likes`, `comments`, `comment_likes`, `saves`/`collection_items` (extend existing collections).
- Real-time subscriptions on likes/comments for the active post.

## Phase 6 — Real-Time Chat
- `conversations`, `conversation_members`, `messages` tables with RLS.
- Realtime channel per conversation. Auto-scroll, typing indicator (broadcast), timestamps, mobile-tuned bubbles.

## Phase 7 — Orders (manual commerce, no payment gateway)
- `orders` table: buyer_id, seller_id, product_id, qty, full_name, phone, address, notes, status enum (`received|preparing|ready|delivered`).
- Buyer "Place Order" sheet → confirmation screen: *"Seller will contact you to arrange payment and delivery."*
- Seller dashboard `/seller/orders` lists orders and lets seller update status.

## Phase 8 — Menu, Settings, Theme
- Menu page with Profile, Saved, Settings, Logout.
- Settings → Theme: Light / Dark / **System** (extend `useTheme` to honor `prefers-color-scheme`).

## Phase 9 — Desktop Layout
- ≥`lg` breakpoint: hide bottom nav, show left sidebar (Home, Discover, Reels, Create, Saved, Messages, Profile). Pinterest/Threads-web feel. Center column max-width; right rail optional.
- Mobile unchanged.

## Phase 10 — Discover & Profile Polish
- Discover: masonry layout for Inspiration + Fashion Ideas; keep horizontal rails for Trending Fits & Creator Picks.
- Profile: cover image, avatar, bio, followers / following / posts counts, tabs Posts | Reels | Saved.

## Phase 11 — Mobile QA Sweep
- Test 320/375/390/412 widths. Fix any overflow, clipping, layout shifts. Verify dark + light.

## Technical Notes
- Reuse existing brand tokens (hot pink → violet gradient, pink accent). No neon, no heavy shadows.
- All new public-schema tables get GRANTs + RLS + policies in their migration.
- New storage buckets: `posts`, `reels`, `avatars`, `covers` (public read, authed write).
- Supabase Realtime enabled on `messages`, `comments`, `likes`.
- Use `React.lazy`, `useMemo`, `useCallback`, IntersectionObserver, and image lazy-loading throughout.

## Confirmations needed before I start
1. **Scope for this single turn**: this plan is ~10 phases of work and several DB migrations. Do you want me to ship **all phases in one go** (will be a very large change set, higher risk of regressions), or proceed **phase by phase** with you approving each (safer for the demo)?
2. **Reels storage**: OK to add a public `reels` Supabase Storage bucket (videos up to ~50MB)?
3. **Orders**: confirm orders should be visible to both buyer (their orders) and seller (orders for their products) only — no public visibility.
4. **Existing data**: any existing seed/demo content I should preserve, or can I add demo seed rows (a few reels, posts, a sample order) so the demo looks alive on first load?
