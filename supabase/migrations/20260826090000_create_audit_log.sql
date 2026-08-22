CREATE TABLE public.audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  changed_by uuid,
  changed_by_name text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_audit_log_company_created ON public.audit_log(company_id, created_at desc);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Só leitura, só admin/gestor da própria empresa ou super admin. Nenhuma policy de INSERT/UPDATE/DELETE
-- pra authenticated - só a trigger (SECURITY DEFINER) escreve.
CREATE POLICY "audit_log_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (is_super_admin() OR (company_id = current_company_id() AND current_user_role() = ANY (ARRAY['admin','gestor'])));

CREATE OR REPLACE FUNCTION public.fn_audit_log() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_user_name text;
  v_record_id uuid;
BEGIN
  v_record_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid);

  -- sales_order_items e price_table_items não têm company_id direto, só via a tabela pai.
  IF TG_TABLE_NAME = 'sales_order_items' THEN
    SELECT so.company_id INTO v_company_id FROM public.sales_orders so
      WHERE so.id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  ELSIF TG_TABLE_NAME = 'price_table_items' THEN
    SELECT pt.company_id INTO v_company_id FROM public.price_tables pt
      WHERE pt.id = COALESCE(NEW.price_table_id, OLD.price_table_id);
  ELSE
    v_company_id := COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD)->>'company_id')::uuid
           ELSE (to_jsonb(NEW)->>'company_id')::uuid END
    );
  END IF;

  SELECT name INTO v_user_name FROM public.users WHERE auth_user_id = auth.uid();

  INSERT INTO public.audit_log (company_id, table_name, record_id, action, changed_by, changed_by_name, old_data, new_data)
  VALUES (
    v_company_id,
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    auth.uid(),
    v_user_name,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.price_tables FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.price_table_items FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.receipt_methods FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.accounts_receivable FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
-- accounts_payable ainda não existe como tabela real (tela é só mock hoje, sem query nenhuma) - sem trigger por ora.
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

NOTIFY pgrst, 'reload schema';
