-- Create payment_conditions table
CREATE TABLE IF NOT EXISTS public.payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    installments INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for payment_conditions
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_conditions
CREATE POLICY "Users can view payment_conditions of their company" ON public.payment_conditions
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins and Gestors can insert payment_conditions" ON public.payment_conditions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

CREATE POLICY "Admins and Gestors can update payment_conditions" ON public.payment_conditions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

CREATE POLICY "Admins and Gestors can delete payment_conditions" ON public.payment_conditions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

-- Create customer_payment_conditions table
CREATE TABLE IF NOT EXISTS public.customer_payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    payment_condition_id UUID NOT NULL REFERENCES public.payment_conditions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(customer_id, payment_condition_id)
);

-- Enable RLS for customer_payment_conditions
ALTER TABLE public.customer_payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for customer_payment_conditions
CREATE POLICY "Users can view customer_payment_conditions of their company" ON public.customer_payment_conditions
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Admins and Gestors can manage customer_payment_conditions" ON public.customer_payment_conditions
    FOR ALL USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    );

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_rep_id UUID REFERENCES public.sales_reps(id),
    price_table_id UUID REFERENCES public.price_tables(id),
    payment_condition_id UUID REFERENCES public.payment_conditions(id),
    status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviado', 'Faturado', 'Cancelado')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_discount NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_orders
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

-- Policies for sales_orders
CREATE POLICY "Users can view sales_orders of their company" ON public.sales_orders
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert sales_orders of their company" ON public.sales_orders
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update sales_orders of their company" ON public.sales_orders
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete sales_orders of their company" ON public.sales_orders
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    net_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_order_items
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for sales_order_items
CREATE POLICY "Users can view sales_order_items of their company" ON public.sales_order_items
    FOR SELECT USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sales_order_items of their company" ON public.sales_order_items
    FOR INSERT WITH CHECK (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update sales_order_items of their company" ON public.sales_order_items
    FOR UPDATE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sales_order_items of their company" ON public.sales_order_items
    FOR DELETE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_payment_conditions
    BEFORE UPDATE ON public.payment_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sales_orders
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
