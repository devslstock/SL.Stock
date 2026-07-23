-- 1. Adicionar CPF ao Usuário (Motorista)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cpf text;

-- 2. Tabela de Registros de MDF-e
CREATE TABLE IF NOT EXISTS public.mdfe_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delivery_route_id uuid not null references public.delivery_routes(id) on delete cascade,
  focus_reference text not null unique,
  status text not null default 'processando',
  xml_url text,
  pdf_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Habilitar RLS
ALTER TABLE public.mdfe_records ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Company Isolation)
CREATE POLICY "company_users_select_mdfe" ON public.mdfe_records
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_mdfe" ON public.mdfe_records
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_mdfe" ON public.mdfe_records
  FOR UPDATE USING (company_id = public.current_company_id());
