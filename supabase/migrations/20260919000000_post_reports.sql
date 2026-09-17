-- Minimal reporting table for Shopitt Looks and creator moderation.
-- Additive only: safe for existing feed, reactions, and remix flows.

CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;

CREATE POLICY "Users can create reports"
  ON public.post_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    OR reporter_id IS NULL
  );

CREATE POLICY "Users can read their own reports"
  ON public.post_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
  ON public.post_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
  );

CREATE INDEX IF NOT EXISTS idx_post_reports_post_created
  ON public.post_reports (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_reports_status_created
  ON public.post_reports (status, created_at DESC);
