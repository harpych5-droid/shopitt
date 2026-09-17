-- Shopitt recognition badges. Verification remains separate on profiles.is_verified.
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('official', 'creator', 'style', 'community', 'discovery', 'commerce', 'special')),
  icon TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.badges (name, slug, description, category, icon)
VALUES
  ('Shopitt Creator', 'shopitt-creator', 'Recognized by Shopitt for meaningful fashion creation.', 'creator', 'sparkles'),
  ('Style Icon', 'style-icon', 'Recognized by Shopitt for distinctive fashion creativity.', 'style', 'star'),
  ('Rising Creator', 'rising-creator', 'Recognized for growing creative contribution to Shopitt.', 'creator', 'trending-up'),
  ('Community Icon', 'community-icon', 'Recognized for positive contribution to Shopitt culture.', 'community', 'users'),
  ('Trendsetter', 'trendsetter', 'Recognized for Looks that help move fashion conversation forward.', 'discovery', 'flame'),
  ('Shopitt Seller', 'shopitt-seller', 'Recognized active seller within Shopitt commerce.', 'commerce', 'shopping-bag'),
  ('Shopitt Brand', 'shopitt-brand', 'Recognized brand identity on Shopitt.', 'commerce', 'badge'),
  ('Shopitt Original', 'shopitt-original', 'Limited recognition for exceptional Shopitt contribution.', 'special', 'crown')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon;

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  internal_note TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_active_unique
  ON public.user_badges (user_id, badge_id)
  WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_user_badges_user_active
  ON public.user_badges (user_id, active, granted_at DESC);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;

DROP POLICY IF EXISTS "Active badges are publicly readable" ON public.badges;
CREATE POLICY "Active badges are publicly readable" ON public.badges FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "User badges are publicly readable" ON public.user_badges;
CREATE POLICY "User badges are publicly readable" ON public.user_badges FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "Admins manage badge assignments" ON public.user_badges;
CREATE POLICY "Admins manage badge assignments" ON public.user_badges FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_note TEXT;

CREATE OR REPLACE FUNCTION public.shopitt_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.shopitt_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shopitt_is_admin() TO authenticated;

DROP POLICY IF EXISTS "Admins can manage verification" ON public.profiles;
CREATE POLICY "Admins can manage verification" ON public.profiles FOR UPDATE TO authenticated
USING (public.shopitt_is_admin())
WITH CHECK (public.shopitt_is_admin());
