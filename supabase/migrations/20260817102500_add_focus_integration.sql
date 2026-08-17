-- 1. Add focus NFe integration fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS focus_nfe_empresa_id text UNIQUE,
ADD COLUMN IF NOT EXISTS focus_nfe_status text DEFAULT 'NAO_CONFIGURADA', -- 'NAO_CONFIGURADA', 'PENDENTE', 'SINCRONIZANDO', 'SINCRONIZADA', 'ERRO', 'DESATIVADA'
ADD COLUMN IF NOT EXISTS focus_nfe_sync_status text,
ADD COLUMN IF NOT EXISTS focus_nfe_last_sync timestamp with time zone,
ADD COLUMN IF NOT EXISTS focus_nfe_last_error text,
ADD COLUMN IF NOT EXISTS focus_nfe_created_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS focus_nfe_updated_at timestamp with time zone;

-- 2. Create focus_nfe_settings (Global Settings)
DROP TABLE IF EXISTS public.focus_nfe_settings CASCADE;
CREATE TABLE IF NOT EXISTS public.focus_nfe_settings (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  -- Em um sistema multi-tenant, se for por empresa, tem company_id. 
  -- Se for "Painel Global" para TODAS as empresas, pode ser um singleton sem company_id.
  -- No SL.Stock o SaaS gerencia várias empresas, mas o Token Focus pode ser por parceiro SaaS ou por empresa.
  -- A instrução diz "O Painel Global deve ter controle total da integração". 
  -- Vamos colocar company_id nulo para config global, ou especifico se o cliente quiser que cada empresa tenha seu token.
  -- A instrução sugere que "A ideia é que o usuário NÃO precise cadastrar a mesma empresa duas vezes." 
  -- e "Toda a integração deve ser controlada pelo Painel Global do SL.Stock."
  -- "Token Principal Focus NFe" -> Significa que há um token da plataforma para registrar as sub-empresas.
  is_active boolean DEFAULT false,
  environment text DEFAULT 'homologacao', -- homologacao, producao
  auto_register boolean DEFAULT false,
  auto_sync boolean DEFAULT false,
  
  -- Padroes de emissao da empresa
  enable_nfe boolean DEFAULT false,
  enable_nfce boolean DEFAULT false,
  enable_nfse boolean DEFAULT false,
  enable_receive_nfe boolean DEFAULT false,
  enable_receive_cte boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em settings
ALTER TABLE public.focus_nfe_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage focus_nfe_settings" ON public.focus_nfe_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_super_admin = true)
);

-- Inserir um registro singleton
INSERT INTO public.focus_nfe_settings (is_active) VALUES (false) ON CONFLICT DO NOTHING;


-- 3. Create focus_nfe_sync_logs
DROP TABLE IF EXISTS public.focus_nfe_sync_logs CASCADE;
CREATE TABLE public.focus_nfe_sync_logs (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  operation text NOT NULL, -- 'CREATE', 'UPDATE', 'TEST'
  endpoint text,
  result text NOT NULL, -- 'SUCCESS', 'ERROR'
  http_status integer,
  message text,
  duration_ms integer,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.focus_nfe_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins and company admins can read logs" ON public.focus_nfe_sync_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND (users.is_super_admin = true OR users.company_id = focus_nfe_sync_logs.company_id))
);
CREATE POLICY "Super admins can insert logs" ON public.focus_nfe_sync_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_super_admin = true)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.focus_nfe_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
