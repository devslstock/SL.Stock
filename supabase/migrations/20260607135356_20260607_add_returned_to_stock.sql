ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS returned_to_stock boolean DEFAULT false;
