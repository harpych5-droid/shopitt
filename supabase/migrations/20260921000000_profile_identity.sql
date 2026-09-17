-- Add fashion identity metadata without changing existing profile relationships.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS public.creator_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, rater_id),
  CHECK (creator_id <> rater_id)
);

ALTER TABLE public.creator_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator ratings are publicly readable"
  ON public.creator_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can rate creators"
  ON public.creator_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_id AND auth.uid() <> creator_id);

CREATE POLICY "Users can update their own creator rating"
  ON public.creator_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = rater_id)
  WITH CHECK (auth.uid() = rater_id AND auth.uid() <> creator_id);

CREATE POLICY "Users can remove their own creator rating"
  ON public.creator_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = rater_id);

CREATE INDEX IF NOT EXISTS idx_creator_ratings_creator
  ON public.creator_ratings (creator_id, created_at DESC);