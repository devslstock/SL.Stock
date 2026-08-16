-- Script para corrigir as políticas RLS para Usuários Master (SaaS)
-- Este script garante que o usuário Master só visualize os dados da empresa
-- que ele está simulando no momento (impersonated_company_id), ou os dados
-- da sua própria empresa caso seja um usuário comum.

DO $$
DECLARE
    t_name text;
    p_name text;
    target_tables text[] := ARRAY[
        'products', 'operations', 'operation_items', 'delivery_routes', 
        'delivery_clients', 'delivery_items', 'equipment_orders', 'equipments', 
        'fiscal_series', 'fiscal_operations', 'vehicles', 'drivers', 
        'customers', 'sales_reps', 'price_tables', 'operation_alerts'
    ];
BEGIN
    -- 1. Removemos todas as políticas existentes nas tabelas alvo para evitar conflitos
    FOR t_name, p_name IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = ANY(target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_name, t_name);
    END LOOP;

    -- 2. Recriamos as políticas de forma unificada e segura
    FOR i IN 1 .. array_length(target_tables, 1)
    LOOP
        t_name := target_tables[i];
        
        -- Habilita RLS na tabela (caso não esteja)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);

        -- Cria a política unificada
        -- A lógica é: A company_id do registro deve ser igual a:
        -- Se o usuário for master E estiver simulando acesso, usa impersonated_company_id
        -- Caso contrário, usa a company_id do próprio usuário.
        EXECUTE format('
            CREATE POLICY "Unified_RLS_%I" ON public.%I
            FOR ALL 
            USING (
                company_id = (SELECT COALESCE(impersonated_company_id, company_id) FROM users WHERE auth_user_id = auth.uid())
            )
            WITH CHECK (
                company_id = (SELECT COALESCE(impersonated_company_id, company_id) FROM users WHERE auth_user_id = auth.uid())
            );
        ', t_name, t_name);
    END LOOP;
END
$$;

-- Limpeza de cache do Supabase/PostgREST para garantir aplicação imediata
NOTIFY pgrst, 'reload schema';
