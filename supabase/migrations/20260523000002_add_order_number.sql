-- Add order_number to delivery_clients
ALTER TABLE public.delivery_clients ADD COLUMN IF NOT EXISTS order_number text;
