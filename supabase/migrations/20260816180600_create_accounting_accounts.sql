-- Create Cost Centers Table
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cost_centers of their company" ON public.cost_centers
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create cost_centers for their company" ON public.cost_centers
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update cost_centers of their company" ON public.cost_centers
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete cost_centers of their company" ON public.cost_centers
    FOR DELETE USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Create Accounting Accounts Table
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code text NOT NULL,
    classification text,
    name text NOT NULL,
    nickname text,
    parent_id uuid REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
    type text NOT NULL CHECK (type IN ('Sintética', 'Analítica')),
    finality text,
    is_favorite boolean DEFAULT false,
    is_active boolean DEFAULT true,
    nature text,
    aggregation_code text,
    sped_referential_account text,
    cost_center_required text DEFAULT 'Opcional' CHECK (cost_center_required IN ('Opcional', 'Obrigatório', 'Não utilizar')),
    sales_order_required text DEFAULT 'Opcional' CHECK (sales_order_required IN ('Opcional', 'Obrigatório', 'Não utilizar')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounting_accounts of their company" ON public.accounting_accounts
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create accounting_accounts for their company" ON public.accounting_accounts
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update accounting_accounts of their company" ON public.accounting_accounts
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete accounting_accounts of their company" ON public.accounting_accounts
    FOR DELETE USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Create Junction Table for Accounting Accounts and Cost Centers
CREATE TABLE IF NOT EXISTS public.accounting_account_cost_centers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    accounting_account_id uuid NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE CASCADE,
    cost_center_id uuid NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
    referential_account text,
    aggregation_code text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.accounting_account_cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounting_account_cost_centers of their company" ON public.accounting_account_cost_centers
    FOR SELECT USING (
        accounting_account_id IN (
            SELECT id FROM public.accounting_accounts WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can create accounting_account_cost_centers for their company" ON public.accounting_account_cost_centers
    FOR INSERT WITH CHECK (
        accounting_account_id IN (
            SELECT id FROM public.accounting_accounts WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update accounting_account_cost_centers of their company" ON public.accounting_account_cost_centers
    FOR UPDATE USING (
        accounting_account_id IN (
            SELECT id FROM public.accounting_accounts WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can delete accounting_account_cost_centers of their company" ON public.accounting_account_cost_centers
    FOR DELETE USING (
        accounting_account_id IN (
            SELECT id FROM public.accounting_accounts WHERE company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
        )
    );

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.accounting_account_cost_centers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
