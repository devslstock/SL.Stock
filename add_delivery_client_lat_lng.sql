-- Add latitude and longitude to delivery_clients
alter table public.delivery_clients add column if not exists latitude numeric;
alter table public.delivery_clients add column if not exists longitude numeric;
