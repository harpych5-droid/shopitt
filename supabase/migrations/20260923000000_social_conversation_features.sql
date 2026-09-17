-- Additive social conversation fields. Existing text chat and comments remain compatible.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IS NULL OR media_type IN ('image', 'video', 'gif')),
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to
  ON public.messages (reply_to_message_id);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- Production deployments contain comment IDs from both legacy comment
-- surfaces. Keep the existing reaction table and RLS, but do not let the
-- older post_comments-only FK reject valid comments from the active surface.
ALTER TABLE public.comment_likes
  DROP CONSTRAINT IF EXISTS comment_likes_comment_id_fkey;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;

DROP POLICY IF EXISTS "Comment reactions are publicly readable" ON public.comment_likes;
CREATE POLICY "Comment reactions are publicly readable"
  ON public.comment_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can add their own comment reactions" ON public.comment_likes;
CREATE POLICY "Users can add their own comment reactions"
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own comment reactions" ON public.comment_likes;
CREATE POLICY "Users can remove their own comment reactions"
  ON public.comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('heart', 'fire', 'laugh', 'love', 'wow', 'clap')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;

DROP POLICY IF EXISTS "Conversation participants can read message reactions" ON public.message_reactions;
CREATE POLICY "Conversation participants can read message reactions"
  ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id AND auth.uid() IN (c.user_1_id, c.user_2_id)
  ));

DROP POLICY IF EXISTS "Users can manage their own message reactions" ON public.message_reactions;
CREATE POLICY "Users can manage their own message reactions"
  ON public.message_reactions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
