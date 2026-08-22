-- Integração de cobrança via Asaas (primeira de N integrações de cobrança)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS asaas_api_key text,
  ADD COLUMN IF NOT EXISTS asaas_env text DEFAULT 'sandbox' CHECK (asaas_env IN ('sandbox', 'producao')),
  ADD COLUMN IF NOT EXISTS asaas_webhook_token text;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS asaas_customer_id text;

ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS gateway_provider text,
  ADD COLUMN IF NOT EXISTS receipt_method_id uuid REFERENCES public.receipt_methods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS asaas_last_webhook_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_asaas_payment_id
  ON public.accounts_receivable (asaas_payment_id);

CREATE TABLE IF NOT EXISTS public.asaas_webhooks_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  accounts_receivable_id UUID REFERENCES public.accounts_receivable(id) ON DELETE SET NULL,
  asaas_payment_id TEXT,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_webhooks_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view asaas_webhooks_logs from their company"
  ON public.asaas_webhooks_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE auth_user_id = auth.uid()));
