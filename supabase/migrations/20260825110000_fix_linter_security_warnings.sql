-- Corrige os avisos do linter de segurança do Supabase (Database Advisors)

-- 1. function_search_path_mutable: fixa search_path pra evitar hijack via search_path mutável
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.set_updated_at_equipments() SET search_path = public;
ALTER FUNCTION public.set_updated_at_equipment_orders() SET search_path = public;
ALTER FUNCTION public.set_updated_at_supplies() SET search_path = public;
ALTER FUNCTION public.set_updated_at_supply_requests() SET search_path = public;
ALTER FUNCTION public.current_company_id() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.current_user_role() SET search_path = public;
ALTER FUNCTION public.increment_stock(p_product_id uuid, p_delta numeric) SET search_path = public;
ALTER FUNCTION public.increment_stock_by_code(p_code text, p_delta numeric) SET search_path = public;
ALTER FUNCTION public.increment_supply_stock(p_supply_id uuid, p_delta numeric) SET search_path = public;
ALTER FUNCTION public.sync_user_to_sales_rep() SET search_path = public;
ALTER FUNCTION public.get_auth_company_id() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. extension_in_public: move moddatetime para fora do schema public
ALTER EXTENSION moddatetime SET SCHEMA extensions;

-- 3. anon/authenticated_security_definer_function_executable: essas 3 funções SECURITY DEFINER
-- estavam com a permissão padrão de EXECUTE pra PUBLIC (inclui anon) nunca revogada. Nenhuma é
-- chamada pelo app (verificado em src/ e api/) - revoga tudo e devolve só o necessário.

-- delete_company: já se protege internamente (is_super_admin()), mas não precisa ser chamável por anon
REVOKE ALL ON FUNCTION public.delete_company(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;

-- get_auth_company_id: só retorna o próprio company_id do chamador, mas idem, sem motivo pra anon chamar
REVOKE ALL ON FUNCTION public.get_auth_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_company_id() TO authenticated;

-- sync_user_to_sales_rep: função de trigger (usa NEW), não é feita pra ser chamada direto via RPC.
-- Revogar EXECUTE não afeta o disparo automático do trigger.
REVOKE ALL ON FUNCTION public.sync_user_to_sales_rep() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
