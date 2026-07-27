-- 1. Add tax_regime to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples_nacional';

-- 2. Add fiscal fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cest text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin text DEFAULT '0';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS net_weight numeric(15,4) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gross_weight numeric(15,4) DEFAULT 0;

-- 3. Create fiscal_operations table
CREATE TABLE IF NOT EXISTS public.fiscal_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cfop_intra text not null,
  cfop_inter text not null,
  csosn text,
  cst text,
  icms_rate numeric(15,4) default 0,
  ipi_rate numeric(15,4) default 0,
  pis_rate numeric(15,4) default 0,
  cofins_rate numeric(15,4) default 0,
  default_message text,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Enable RLS and create policies
ALTER TABLE public.fiscal_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_users_select_fiscal" ON public.fiscal_operations
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_fiscal" ON public.fiscal_operations
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_fiscal" ON public.fiscal_operations
  FOR UPDATE USING (company_id = public.current_company_id());

CREATE POLICY "company_users_delete_fiscal" ON public.fiscal_operations
  FOR DELETE USING (company_id = public.current_company_id());
