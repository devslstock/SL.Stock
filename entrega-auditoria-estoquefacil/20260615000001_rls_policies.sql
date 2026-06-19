-- ============================================================================
-- 20260615000001_rls_policies.sql
-- FASE 1 (parte 2/4): RLS REAL por company_id em TODAS as tabelas
-- ----------------------------------------------------------------------------
-- Substitui as policies permissivas ("USING (true)") e o "DISABLE RLS" por
-- isolamento real: cada usuário só enxerga/edita linhas da própria empresa.
-- Super admin (claim is_super_admin) enxerga tudo.
--
-- PRÉ-REQUISITOS (NÃO PULAR):
--   - 20260615000000_auth_integration.sql já aplicado
--   - usuários migrados via scripts/migrate-users-to-auth.mjs
--   - Custom Access Token Hook ATIVADO no painel
-- Se rodar antes disso, o app (que ainda usa anon key) perde acesso.
--
-- NÃO-DESTRUTIVO quanto a dados: só mexe em policies e em defaults de coluna.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Remover TODAS as policies antigas das tabelas que vamos reconfigurar
--    (idempotente — não falha se não existirem).
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
  alvo text[] := array[
    -- tenant diretas (têm company_id)
    'products','related_codes','operations','operation_items','operation_alerts',
    'delivery_routes','delivery_clients','delivery_items',
    'customers','customer_equipments','sales_reps','regions','price_tables',
    'payment_conditions','sales_orders','equipments','equipment_orders',
    'equipment_history','supplies','supply_requests','planned_inventories',
    'adhoc_counts','inventory_counts',
    -- tenant filhas (via FK ao pai)
    'sales_rep_regions','price_table_items','customer_payment_conditions',
    'sales_order_items','equipment_order_supplies','planned_inventory_areas',
    'planned_inventory_counts','planned_inventory_sectors',
    'adhoc_count_items','inventory_count_items',
    -- globais
    'companies','users','system_notes','company_payments','system_leads','saas_plans'
  ];
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename = any(alvo)
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Policy padrão de tenant para tabelas que têm company_id direto.
--    Também define default company_id = current_company_id() para que os
--    INSERTs do front não precisem mais enviar company_id (resolve os ~30
--    pontos onde o filtro/insert estava faltando).
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  diretas text[] := array[
    'products','related_codes','operations','operation_items','operation_alerts',
    'delivery_routes','delivery_clients','delivery_items',
    'customers','customer_equipments','sales_reps','regions','price_tables',
    'payment_conditions','sales_orders','equipments','equipment_orders',
    'equipment_history','supplies','supply_requests','planned_inventories',
    'adhoc_counts','inventory_counts'
  ];
begin
  foreach t in array diretas loop
    execute format('alter table public.%I enable row level security', t);
    -- default de company_id (só aplica se a coluna existir; todas têm)
    begin
      execute format(
        'alter table public.%I alter column company_id set default public.current_company_id()', t);
    exception when undefined_column then null;
    end;
    execute format($f$
      create policy "tenant_isolation" on public.%I
        for all to authenticated
        using (company_id = public.current_company_id() or public.is_super_admin())
        with check (company_id = public.current_company_id() or public.is_super_admin())
    $f$, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 3. Policies para tabelas FILHAS (sem company_id) — via EXISTS no pai.
-- ----------------------------------------------------------------------------

-- sales_rep_regions -> sales_reps
alter table public.sales_rep_regions enable row level security;
create policy "tenant_isolation" on public.sales_rep_regions
  for all to authenticated
  using (exists (select 1 from public.sales_reps sr
                 where sr.id = sales_rep_regions.sales_rep_id
                   and (sr.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.sales_reps sr
                 where sr.id = sales_rep_regions.sales_rep_id
                   and (sr.company_id = public.current_company_id() or public.is_super_admin())));

-- price_table_items -> price_tables
alter table public.price_table_items enable row level security;
create policy "tenant_isolation" on public.price_table_items
  for all to authenticated
  using (exists (select 1 from public.price_tables pt
                 where pt.id = price_table_items.price_table_id
                   and (pt.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.price_tables pt
                 where pt.id = price_table_items.price_table_id
                   and (pt.company_id = public.current_company_id() or public.is_super_admin())));

-- customer_payment_conditions -> customers
alter table public.customer_payment_conditions enable row level security;
create policy "tenant_isolation" on public.customer_payment_conditions
  for all to authenticated
  using (exists (select 1 from public.customers c
                 where c.id = customer_payment_conditions.customer_id
                   and (c.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.customers c
                 where c.id = customer_payment_conditions.customer_id
                   and (c.company_id = public.current_company_id() or public.is_super_admin())));

-- sales_order_items -> sales_orders
alter table public.sales_order_items enable row level security;
create policy "tenant_isolation" on public.sales_order_items
  for all to authenticated
  using (exists (select 1 from public.sales_orders so
                 where so.id = sales_order_items.sales_order_id
                   and (so.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.sales_orders so
                 where so.id = sales_order_items.sales_order_id
                   and (so.company_id = public.current_company_id() or public.is_super_admin())));

-- equipment_order_supplies -> equipment_orders
alter table public.equipment_order_supplies enable row level security;
create policy "tenant_isolation" on public.equipment_order_supplies
  for all to authenticated
  using (exists (select 1 from public.equipment_orders eo
                 where eo.id = equipment_order_supplies.order_id
                   and (eo.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.equipment_orders eo
                 where eo.id = equipment_order_supplies.order_id
                   and (eo.company_id = public.current_company_id() or public.is_super_admin())));

-- planned_inventory_areas -> planned_inventories
alter table public.planned_inventory_areas enable row level security;
create policy "tenant_isolation" on public.planned_inventory_areas
  for all to authenticated
  using (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_areas.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_areas.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())));

-- planned_inventory_counts -> planned_inventories
alter table public.planned_inventory_counts enable row level security;
create policy "tenant_isolation" on public.planned_inventory_counts
  for all to authenticated
  using (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_counts.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_counts.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())));

-- planned_inventory_sectors -> planned_inventories
alter table public.planned_inventory_sectors enable row level security;
create policy "tenant_isolation" on public.planned_inventory_sectors
  for all to authenticated
  using (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_sectors.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.planned_inventories pi
                 where pi.id = planned_inventory_sectors.inventory_id
                   and (pi.company_id = public.current_company_id() or public.is_super_admin())));

-- adhoc_count_items -> adhoc_counts
alter table public.adhoc_count_items enable row level security;
create policy "tenant_isolation" on public.adhoc_count_items
  for all to authenticated
  using (exists (select 1 from public.adhoc_counts ac
                 where ac.id = adhoc_count_items.count_id
                   and (ac.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.adhoc_counts ac
                 where ac.id = adhoc_count_items.count_id
                   and (ac.company_id = public.current_company_id() or public.is_super_admin())));

-- inventory_count_items -> inventory_counts
alter table public.inventory_count_items enable row level security;
create policy "tenant_isolation" on public.inventory_count_items
  for all to authenticated
  using (exists (select 1 from public.inventory_counts ic
                 where ic.id = inventory_count_items.inventory_id
                   and (ic.company_id = public.current_company_id() or public.is_super_admin())))
  with check (exists (select 1 from public.inventory_counts ic
                 where ic.id = inventory_count_items.inventory_id
                   and (ic.company_id = public.current_company_id() or public.is_super_admin())));

-- ----------------------------------------------------------------------------
-- 4. Tabelas GLOBAIS
-- ----------------------------------------------------------------------------

-- companies: cada usuário vê a própria empresa; super admin vê todas.
--            escrita só super admin.
alter table public.companies enable row level security;
create policy "companies_select" on public.companies
  for select to authenticated
  using (id = public.current_company_id() or public.is_super_admin());
create policy "companies_write" on public.companies
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- users (tabela de perfil): cada um lê o próprio; admin/gestor leem os da
--   própria empresa; super admin lê/gerencia todos. Criação/edição de
--   credenciais sensíveis deve passar por Edge Function (service_role).
alter table public.users enable row level security;
create policy "users_select" on public.users
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or company_id = public.current_company_id()
    or public.is_super_admin()
  );
create policy "users_write" on public.users
  for all to authenticated
  using (
    public.is_super_admin()
    or (company_id = public.current_company_id()
        and public.current_user_role() in ('admin','gestor'))
  )
  with check (
    public.is_super_admin()
    or (company_id = public.current_company_id()
        and public.current_user_role() in ('admin','gestor'))
  );

-- system_notes / company_payments: painel master — só super admin.
alter table public.system_notes enable row level security;
create policy "system_notes_super_admin" on public.system_notes
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.company_payments enable row level security;
create policy "company_payments_super_admin" on public.company_payments
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- system_leads: INSERT público (landing page) + leitura/gestão só super admin.
alter table public.system_leads enable row level security;
create policy "system_leads_public_insert" on public.system_leads
  for insert to anon, authenticated with check (true);
create policy "system_leads_super_admin_read" on public.system_leads
  for select to authenticated using (public.is_super_admin());
create policy "system_leads_super_admin_modify" on public.system_leads
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "system_leads_super_admin_delete" on public.system_leads
  for delete to authenticated using (public.is_super_admin());

-- saas_plans: leitura para qualquer logado; escrita só super admin.
alter table public.saas_plans enable row level security;
create policy "saas_plans_read" on public.saas_plans
  for select to authenticated using (true);
create policy "saas_plans_write" on public.saas_plans
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- 5. Verificação rápida (rodar manualmente após aplicar):
--   select tablename, rowsecurity from pg_tables
--   where schemaname='public' and rowsecurity = false;
--   -- não deve sobrar nenhuma tabela de dados de negócio nessa lista.
-- ----------------------------------------------------------------------------
