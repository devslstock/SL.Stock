-- Script COMPLETO para corrigir as Políticas de Segurança (RLS)
-- Substituindo "id = auth.uid()" por "auth_user_id = auth.uid()" e corrigindo o vazamento de dados.

DO $$
DECLARE
    -- Lista de TODAS as tabelas principais que possuem company_id
    tables_with_company_id text[] := ARRAY[
        'customers',
        'customer_equipments',
        'products',
        'operations',
        'operation_items',
        'sales_reps',
        'sales_orders',
        'payment_conditions',
        'equipments',
        'equipment_orders',
        'equipment_history',
        'supplies',
        'supply_requests',
        'price_tables',
        'delivery_routes',
        'delivery_clients',
        'delivery_items',
        'regions',
        'related_codes'
    ];
    t_name text;
    policy_name text;
BEGIN
    -- 1. Remover políticas antigas de todas as tabelas afetadas
    FOR t_name IN SELECT unnest(tables_with_company_id)
    LOOP
        FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = t_name AND schemaname = 'public')
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t_name);
        END LOOP;
        
        -- Habilitar RLS (Fundamental, pois algumas tabelas estavam com RLS desativado!)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

        -- Criar política de SELECT
        EXECUTE format('
            CREATE POLICY "view_%1$s" ON public.%1$I
            FOR SELECT USING (
                company_id IN (
                    SELECT COALESCE(impersonated_company_id, company_id) 
                    FROM public.users 
                    WHERE auth_user_id = auth.uid() AND active = true
                )
            );', t_name);

        -- Criar política de INSERT
        EXECUTE format('
            CREATE POLICY "insert_%1$s" ON public.%1$I
            FOR INSERT WITH CHECK (
                company_id IN (
                    SELECT COALESCE(impersonated_company_id, company_id) 
                    FROM public.users 
                    WHERE auth_user_id = auth.uid() AND active = true
                )
            );', t_name);

        -- Criar política de UPDATE
        EXECUTE format('
            CREATE POLICY "update_%1$s" ON public.%1$I
            FOR UPDATE USING (
                company_id IN (
                    SELECT COALESCE(impersonated_company_id, company_id) 
                    FROM public.users 
                    WHERE auth_user_id = auth.uid() AND active = true
                )
            );', t_name);

        -- Criar política de DELETE
        EXECUTE format('
            CREATE POLICY "delete_%1$s" ON public.%1$I
            FOR DELETE USING (
                company_id IN (
                    SELECT COALESCE(impersonated_company_id, company_id) 
                    FROM public.users 
                    WHERE auth_user_id = auth.uid() AND active = true
                )
            );', t_name);
            
    END LOOP;

    -- 2. Corrigir tabelas que dependem de outras (tabelas filhas que não têm company_id direto)
    
    -- sales_order_items (depende de sales_orders)
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales_order_items' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales_order_items', policy_name);
    END LOOP;
    ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "all_sales_order_items" ON public.sales_order_items
    FOR ALL USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = COALESCE(u.impersonated_company_id, u.company_id)
            WHERE u.auth_user_id = auth.uid() AND u.active = true
        )
    );

    -- price_table_items (depende de price_tables)
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'price_table_items' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.price_table_items', policy_name);
    END LOOP;
    ALTER TABLE public.price_table_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "all_price_table_items" ON public.price_table_items
    FOR ALL USING (
        price_table_id IN (
            SELECT pt.id FROM public.price_tables pt
            JOIN public.users u ON pt.company_id = COALESCE(u.impersonated_company_id, u.company_id)
            WHERE u.auth_user_id = auth.uid() AND u.active = true
        )
    );

    -- customer_payment_conditions (depende de customers)
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'customer_payment_conditions' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_payment_conditions', policy_name);
    END LOOP;
    ALTER TABLE public.customer_payment_conditions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "all_customer_payment_conditions" ON public.customer_payment_conditions
    FOR ALL USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = COALESCE(u.impersonated_company_id, u.company_id)
            WHERE u.auth_user_id = auth.uid() AND u.active = true
        )
    );

    -- sales_rep_regions (depende de sales_reps)
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales_rep_regions' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales_rep_regions', policy_name);
    END LOOP;
    ALTER TABLE public.sales_rep_regions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "all_sales_rep_regions" ON public.sales_rep_regions
    FOR ALL USING (
        sales_rep_id IN (
            SELECT sr.id FROM public.sales_reps sr
            JOIN public.users u ON sr.company_id = COALESCE(u.impersonated_company_id, u.company_id)
            WHERE u.auth_user_id = auth.uid() AND u.active = true
        )
    );

    -- equipment_order_supplies (depende de equipment_orders)
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'equipment_order_supplies' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment_order_supplies', policy_name);
    END LOOP;
    ALTER TABLE public.equipment_order_supplies ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "all_equipment_order_supplies" ON public.equipment_order_supplies
    FOR ALL USING (
        order_id IN (
            SELECT eo.id FROM public.equipment_orders eo
            JOIN public.users u ON eo.company_id = COALESCE(u.impersonated_company_id, u.company_id)
            WHERE u.auth_user_id = auth.uid() AND u.active = true
        )
    );

END $$;
