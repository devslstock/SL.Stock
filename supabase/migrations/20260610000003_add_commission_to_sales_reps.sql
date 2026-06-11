alter table public.sales_reps add column if not exists commission_rate numeric(5,2) default 0.00;
