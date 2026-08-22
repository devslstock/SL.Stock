ALTER TABLE public.receipt_methods
  ADD COLUMN IF NOT EXISTS sicoob_client_id text,
  ADD COLUMN IF NOT EXISTS sicoob_certificate_pfx_base64 text,
  ADD COLUMN IF NOT EXISTS sicoob_certificate_password text;
