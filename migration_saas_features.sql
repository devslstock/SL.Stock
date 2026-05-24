-- Tabela para mural de anotações (Recados do Master)
CREATE TABLE IF NOT EXISTS public.system_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela para controle financeiro (Mensalidades das empresas)
CREATE TABLE IF NOT EXISTS public.company_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar políticas de segurança básicas para as novas tabelas
ALTER TABLE public.system_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payments ENABLE ROW LEVEL SECURITY;

-- No Painel SaaS, as regras de RLS dependem de `is_super_admin` estar logado
-- Permitir acesso total aos Super Admins.
CREATE POLICY "Super admins podem ver notas" ON public.system_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Super admins podem ver finanças" ON public.company_payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE users.id = auth.uid() AND is_super_admin = true
        )
    );

-- Modificar a tabela de permissões no Frontend é suficiente para adicionar as flags de SaaS no JSON `permissions`.
