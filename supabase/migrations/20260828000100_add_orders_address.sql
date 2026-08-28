-- The existing order fallback stores the buyer-entered delivery address in
-- public.orders.address. Keep this nullable so all existing orders remain valid.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address text;
