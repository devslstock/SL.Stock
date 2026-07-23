-- Tabela de Registros de NFe
CREATE TABLE IF NOT EXISTS public.nfe_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  focus_reference text not null unique,
  status text not null default 'processing',
  xml_url text,
  pdf_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.nfe_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_users_select_nfe" ON public.nfe_records
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_nfe" ON public.nfe_records
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_nfe" ON public.nfe_records
  FOR UPDATE USING (company_id = public.current_company_id());

-- Campos adicionais na empresa para configurar NFe
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS focusnfe_token text,
  ADD COLUMN IF NOT EXISTS focusnfe_env text default 'homologacao';
