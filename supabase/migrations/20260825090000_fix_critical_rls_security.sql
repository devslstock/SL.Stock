-- 1. companies: remove policy solta (sem escopo de empresa), substitui por uma que só libera
-- dono da empresa (admin/gestor) ou super admin
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON public.companies;

CREATE POLICY "companies_update_own_company" ON public.companies
  FOR UPDATE TO authenticated
  USING (is_super_admin() OR (id = current_company_id() AND current_user_role() = ANY (ARRAY['admin','gestor'])))
  WITH CHECK (is_super_admin() OR (id = current_company_id() AND current_user_role() = ANY (ARRAY['admin','gestor'])));

-- 2. vehicle_checklists: não tem company_id direto, isola via delivery_routes
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON public.vehicle_checklists;

CREATE POLICY "vehicle_checklists_tenant_isolation" ON public.vehicle_checklists
  FOR ALL TO authenticated
  USING (is_super_admin() OR EXISTS (
    SELECT 1 FROM public.delivery_routes dr
    WHERE dr.id = vehicle_checklists.route_id AND dr.company_id = current_company_id()
  ))
  WITH CHECK (is_super_admin() OR EXISTS (
    SELECT 1 FROM public.delivery_routes dr
    WHERE dr.id = vehicle_checklists.route_id AND dr.company_id = current_company_id()
  ));

-- 3. receipt_methods: troca users.id por users.auth_user_id (bug igual ao já corrigido em
-- fiscal_series/vehicles/drivers na migration 20260814041500)
DROP POLICY IF EXISTS "Users can view receipt methods of their company" ON public.receipt_methods;
DROP POLICY IF EXISTS "Users can insert receipt methods of their company" ON public.receipt_methods;
DROP POLICY IF EXISTS "Users can update receipt methods of their company" ON public.receipt_methods;
DROP POLICY IF EXISTS "Users can delete receipt methods of their company" ON public.receipt_methods;

CREATE POLICY "receipt_methods_tenant_isolation" ON public.receipt_methods
  FOR ALL TO authenticated
  USING (company_id = current_company_id() OR is_super_admin())
  WITH CHECK (company_id = current_company_id() OR is_super_admin());

-- 4. focus_nfe_settings: mesmo bug, tabela global só-super-admin
DROP POLICY IF EXISTS "Super admins can manage focus_nfe_settings" ON public.focus_nfe_settings;

CREATE POLICY "focus_nfe_settings_super_admin_only" ON public.focus_nfe_settings
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- 5. focus_nfe_sync_logs: mesmo bug nas 2 policies existentes
DROP POLICY IF EXISTS "Super admins and company admins can read logs" ON public.focus_nfe_sync_logs;
DROP POLICY IF EXISTS "Super admins can insert logs" ON public.focus_nfe_sync_logs;

CREATE POLICY "focus_nfe_sync_logs_read" ON public.focus_nfe_sync_logs
  FOR SELECT TO authenticated
  USING (is_super_admin() OR company_id = current_company_id());

CREATE POLICY "focus_nfe_sync_logs_insert" ON public.focus_nfe_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin());

NOTIFY pgrst, 'reload schema';
