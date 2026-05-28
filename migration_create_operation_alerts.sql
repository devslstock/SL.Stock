-- Create operation_alerts table
CREATE TABLE IF NOT EXISTS public.operation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity_expected NUMERIC NOT NULL DEFAULT 0,
    quantity_scanned NUMERIC NOT NULL DEFAULT 0,
    quantity_missing NUMERIC NOT NULL DEFAULT 0,
    resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for authenticated users (consistent with other tables in this app)
DROP POLICY IF EXISTS "Allow all actions for authenticated users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for authenticated users on operation_alerts"
ON public.operation_alerts
FOR ALL TO authenticated USING (true) WITH CHECK (true);
