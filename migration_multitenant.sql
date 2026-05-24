-- ==============================================================================
-- MIGRAÇÃO PARA MULTI-TENANT (VÁRIAS EMPRESAS)
-- ==============================================================================

-- 1. Criar a tabela de empresas (companies)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    cnpj TEXT,
    max_users INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Inserir a Empresa Padrão (Delicius BA)
INSERT INTO public.companies (id, slug, name, cnpj, max_users)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'delicius-ba', 
    'Delicius BA', 
    '28.092.101/0001-59', 
    5
) ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar company_id nas tabelas existentes e vincular à Delicius BA

-- Tabela: users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.users SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.users ALTER COLUMN company_id SET NOT NULL;

-- Tabela: products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.products SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
-- Alterar a restrição de código único global para único POR EMPRESA
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_code_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_code_key;
ALTER TABLE public.products ADD CONSTRAINT products_company_code_key UNIQUE (company_id, code);


-- Tabela: operations
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.operations SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.operations ALTER COLUMN company_id SET NOT NULL;

-- Tabela: operation_items
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.operation_items SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.operation_items ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_routes
ALTER TABLE public.delivery_routes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_routes SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_routes ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_clients
ALTER TABLE public.delivery_clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_clients SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_clients ALTER COLUMN company_id SET NOT NULL;

-- Tabela: delivery_items
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
UPDATE public.delivery_items SET company_id = '11111111-1111-1111-1111-111111111111' WHERE company_id IS NULL;
ALTER TABLE public.delivery_items ALTER COLUMN company_id SET NOT NULL;

-- ==============================================================================
-- FIM DA MIGRAÇÃO
-- ==============================================================================
