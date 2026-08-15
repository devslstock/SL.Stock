-- Migration for Focus Webhooks Logs and Records tables

-- Create NFe Records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nfe_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  focus_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'processando',
  access_key TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create MDFe Records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mdfe_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  delivery_route_id UUID NOT NULL REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
  focus_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'processando',
  access_key TEXT,
  xml_url TEXT,
  pdf_url TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create Webhooks Logs table
CREATE TABLE IF NOT EXISTS public.focus_webhooks_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  focus_reference TEXT,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.nfe_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mdfe_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_webhooks_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nfe_records from their company"
  ON public.nfe_records FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can view mdfe_records from their company"
  ON public.mdfe_records FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can view focus_webhooks_logs from their company"
  ON public.focus_webhooks_logs FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()
  ));
