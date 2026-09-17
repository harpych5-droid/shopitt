-- Seller WhatsApp connection preferences and optional delivery audit.
-- Kept additive and separate from the real orders table so the order remains the source of truth.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_last_tested_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'seller_order_notification',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_message_log TO authenticated;
GRANT ALL ON public.whatsapp_message_log TO service_role;

CREATE POLICY "Users can read their own WhatsApp logs"
  ON public.whatsapp_message_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can insert logs for their own seller notifications"
  ON public.whatsapp_message_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id));

CREATE POLICY "Admins can manage WhatsApp logs"
  ON public.whatsapp_message_log
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order
  ON public.whatsapp_message_log (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_seller_status
  ON public.whatsapp_message_log (seller_id, status, created_at DESC);
