-- Add more fields to companies table
alter table public.companies add column if not exists fantasy_name text;
alter table public.companies add column if not exists phone text;
alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists additional_info text;
alter table public.companies add column if not exists garage_lat numeric;
alter table public.companies add column if not exists garage_lng numeric;
