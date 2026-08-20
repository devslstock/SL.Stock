-- Fase 1 do Plano de Auditoria Fiscal
-- Migração para estruturar histórico de eventos (nfe_events) e snapshot da nota (payload_snapshot)

-- 1. Alteração da tabela nfe_records para adicionar campos críticos
ALTER TABLE public.nfe_records
ADD COLUMN payload_snapshot JSONB,
ADD COLUMN fiscal_series_id UUID REFERENCES public.fiscal_series(id) ON DELETE SET NULL;

-- 2. Criação da tabela nfe_events
CREATE TABLE IF NOT EXISTS public.nfe_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    nfe_id UUID NOT NULL REFERENCES public.nfe_records(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- EMISSAO, REJEICAO, AUTORIZACAO, CANCELAMENTO, ERRO_SISTEMA
    status VARCHAR(50) NOT NULL,
    message TEXT,
    focus_code VARCHAR(50),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS policies para nfe_events
ALTER TABLE public.nfe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for users based on company_id"
ON public.nfe_events FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Enable insert for users based on company_id"
ON public.nfe_events FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()
));
