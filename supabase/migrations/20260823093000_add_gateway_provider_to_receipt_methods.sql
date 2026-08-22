ALTER TABLE public.receipt_methods
  ADD COLUMN IF NOT EXISTS gateway_provider text;
