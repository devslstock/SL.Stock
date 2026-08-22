CREATE TABLE IF NOT EXISTS public.asaas_master_settings (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  api_key text,
  environment text NOT NULL DEFAULT 'sandbox', -- sandbox | producao
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.asaas_master_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage asaas_master_settings" ON public.asaas_master_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.auth_user_id = auth.uid() AND users.is_super_admin = true)
);

INSERT INTO public.asaas_master_settings (environment)
SELECT 'sandbox' WHERE NOT EXISTS (SELECT 1 FROM public.asaas_master_settings);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.asaas_master_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
