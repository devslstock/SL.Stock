ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS asaas_subaccount_id text,
  ADD COLUMN IF NOT EXISTS asaas_wallet_id text,
  ADD COLUMN IF NOT EXISTS asaas_subaccount_status text,
  ADD COLUMN IF NOT EXISTS asaas_subaccount_last_error text,
  ADD COLUMN IF NOT EXISTS asaas_subaccount_created_at timestamptz;
