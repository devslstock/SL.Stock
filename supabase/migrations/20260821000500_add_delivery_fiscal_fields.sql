-- Add fiscal fields to delivery_clients for Canhoto Digital validity
ALTER TABLE public.delivery_clients 
ADD COLUMN IF NOT EXISTS nfe_number text,
ADD COLUMN IF NOT EXISTS nfe_series text,
ADD COLUMN IF NOT EXISTS nfe_value numeric,
ADD COLUMN IF NOT EXISTS signature_lat numeric,
ADD COLUMN IF NOT EXISTS signature_lng numeric;
