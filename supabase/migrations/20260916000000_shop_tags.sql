-- Shopitt shop tags: additive relationship between creator posts and real catalog products.
-- Tag positions are normalized to the media box: 0..1 on both axes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Some production environments have not yet run the original catalog migration.
-- Create only the missing catalog structure; never replace existing products.
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  image_url text NOT NULL,
  price_usd numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  source_id text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
CREATE POLICY "Sellers can manage their own products"
  ON public.products FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE TABLE IF NOT EXISTS public.post_product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  linked_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  position_x numeric(6,5) NOT NULL DEFAULT 0.5 CHECK (position_x >= 0 AND position_x <= 1),
  position_y numeric(6,5) NOT NULL DEFAULT 0.5 CHECK (position_y >= 0 AND position_y <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Evolve the original product-only relation into independent outfit metadata.
-- Existing linked rows are preserved and enriched from their real product rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_product_tags' AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_product_tags' AND column_name = 'linked_product_id'
  ) THEN
    ALTER TABLE public.post_product_tags RENAME COLUMN product_id TO linked_product_id;
  END IF;
END $$;

ALTER TABLE public.post_product_tags
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.post_product_tags tag
SET item_name = COALESCE(
      NULLIF(tag.item_name, ''),
      (SELECT product.title FROM public.products product WHERE product.id = tag.linked_product_id)
    ),
    price = COALESCE(
      tag.price,
      (SELECT product.price_usd FROM public.products product WHERE product.id = tag.linked_product_id)
    ),
    created_by = COALESCE(
      tag.created_by,
      (SELECT post.user_id FROM public.posts post WHERE post.id = tag.post_id)
    )
WHERE tag.linked_product_id IS NOT NULL;

UPDATE public.post_product_tags tag
SET created_by = (
      SELECT post.user_id FROM public.posts post WHERE post.id = tag.post_id
    )
WHERE tag.created_by IS NULL
  AND EXISTS (SELECT 1 FROM public.posts post WHERE post.id = tag.post_id);

ALTER TABLE public.post_product_tags
  DROP CONSTRAINT IF EXISTS post_product_tags_pkey;

ALTER TABLE public.post_product_tags
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN item_name SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN linked_product_id DROP NOT NULL;

ALTER TABLE public.post_product_tags
  ADD CONSTRAINT post_product_tags_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_product_tags_unique_link
  ON public.post_product_tags (post_id, linked_product_id)
  WHERE linked_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_product_tags_post
  ON public.post_product_tags (post_id, created_at);

CREATE INDEX IF NOT EXISTS idx_products_available
  ON public.products (is_available) WHERE is_available;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_product_tags TO authenticated;
GRANT SELECT ON public.post_product_tags TO anon;
GRANT ALL ON public.post_product_tags TO service_role;

ALTER TABLE public.post_product_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read shop tags" ON public.post_product_tags;
CREATE POLICY "Anyone can read shop tags"
  ON public.post_product_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Creators tag their own products" ON public.post_product_tags;
DROP POLICY IF EXISTS "Creators create their own shop tags" ON public.post_product_tags;
CREATE POLICY "Creators create their own shop tags"
  ON public.post_product_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_product_tags.post_id
        AND p.user_id = auth.uid()
        AND lower(COALESCE(p.content_type, p.post_type, '')) IN ('product', 'shoppable')
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Creators move their own tags" ON public.post_product_tags;
CREATE POLICY "Creators move their own tags"
  ON public.post_product_tags FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_product_tags.post_id AND p.user_id = auth.uid()))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_product_tags.post_id
        AND p.user_id = auth.uid()
        AND lower(COALESCE(p.content_type, p.post_type, '')) IN ('product', 'shoppable')
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Creators remove their own tags" ON public.post_product_tags;
CREATE POLICY "Creators remove their own tags"
  ON public.post_product_tags FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_product_tags.post_id AND p.user_id = auth.uid()));