-- Shopitt Remix relationship: one Remix points to one original Look.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS remixed_from_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_remixed_from
  ON public.posts (remixed_from_post_id, created_at DESC)
  WHERE remixed_from_post_id IS NOT NULL;

GRANT SELECT ON public.posts TO anon, authenticated;

-- Existing post-owner insert/update policies continue to authorize Remix posts.