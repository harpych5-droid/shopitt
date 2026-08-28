-- Secure one-to-one conversation creation. The client never chooses its own
-- participant id: it is always derived from auth.uid() inside this function.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can view conversations" ON public.conversations;
CREATE POLICY "Conversation participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() IN (user_1_id, user_2_id));

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_1_id, c.user_2_id)
    )
  );

DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_1_id, c.user_2_id)
    )
  );

CREATE OR REPLACE FUNCTION public.create_or_get_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  first_user_id uuid;
  second_user_id uuid;
  conversation_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF other_user_id IS NULL OR other_user_id = caller_id THEN
    RAISE EXCEPTION 'A different recipient is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = other_user_id) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  first_user_id := LEAST(caller_id, other_user_id);
  second_user_id := GREATEST(caller_id, other_user_id);

  -- Serialise concurrent first-message attempts for this pair without imposing
  -- a new uniqueness constraint on potentially pre-existing production rows.
  PERFORM pg_advisory_xact_lock(hashtext(first_user_id::text || ':' || second_user_id::text));

  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (user_1_id = first_user_id AND user_2_id = second_user_id)
     OR (user_1_id = second_user_id AND user_2_id = first_user_id)
  LIMIT 1;

  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (user_1_id, user_2_id)
    VALUES (first_user_id, second_user_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_or_get_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(uuid) TO authenticated;
