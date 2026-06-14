-- Add latitude and longitude to customers
alter table public.customers add column if not exists latitude numeric;
alter table public.customers add column if not exists longitude numeric;
