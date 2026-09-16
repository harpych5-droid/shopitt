-- Shopitt admin activity metrics.
-- Additive only: preserves existing tables, auth, and RLS policies.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

CREATE TABLE IF NOT EXISTS public.platform_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'content_view',
    'look_created',
    'reaction_created',
    'comment_created',
    'save_created',
    'message_created'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_activity_user_created
  ON public.platform_activity_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_activity_type_created
  ON public.platform_activity_events (event_type, created_at DESC);

GRANT SELECT, INSERT ON public.platform_activity_events TO authenticated;
GRANT ALL ON public.platform_activity_events TO service_role;

ALTER TABLE public.platform_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users record their own activity" ON public.platform_activity_events;
CREATE POLICY "Users record their own activity"
  ON public.platform_activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read platform activity" ON public.platform_activity_events;
CREATE POLICY "Admins read platform activity"
  ON public.platform_activity_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
    )
      OR lower(COALESCE(auth.jwt() ->> 'email', '')) = 'shopitt54@gmail.com'
  );

CREATE OR REPLACE FUNCTION public.record_platform_activity(
  _event_type text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  activity_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.platform_activity_events (user_id, event_type, metadata)
  VALUES (auth.uid(), _event_type, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_platform_activity(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_platform_activity(text, jsonb) TO authenticated;