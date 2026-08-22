ALTER TABLE public.receipt_methods
  ADD COLUMN IF NOT EXISTS bb_client_id text,
  ADD COLUMN IF NOT EXISTS bb_client_secret text,
  ADD COLUMN IF NOT EXISTS bb_app_key text;
