-- Connect seller order notifications to the canonical order record.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_order
  ON public.notifications (order_id, created_at DESC);
