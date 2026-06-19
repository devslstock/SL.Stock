-- ============================================================================
-- 20260615000002_indexes.sql
-- FASE 3: Índices em company_id e em todas as Foreign Keys.
-- ----------------------------------------------------------------------------
-- Postgres NÃO cria índice automático para FK (só para PK/UNIQUE). Sem estes
-- índices, listagens filtradas por company_id e os ON DELETE CASCADE fazem
-- full scan. Totalmente seguro / idempotente.
-- ============================================================================

-- company_id (toda query filtra por ele) -----------------------------------
create index if not exists idx_products_company              on public.products(company_id);
create index if not exists idx_related_codes_company         on public.related_codes(company_id);
create index if not exists idx_operations_company            on public.operations(company_id);
create index if not exists idx_operation_items_company       on public.operation_items(company_id);
create index if not exists idx_operation_alerts_company      on public.operation_alerts(company_id);
create index if not exists idx_delivery_routes_company       on public.delivery_routes(company_id);
create index if not exists idx_delivery_clients_company      on public.delivery_clients(company_id);
create index if not exists idx_delivery_items_company        on public.delivery_items(company_id);
create index if not exists idx_customers_company             on public.customers(company_id);
create index if not exists idx_customer_equipments_company   on public.customer_equipments(company_id);
create index if not exists idx_sales_reps_company            on public.sales_reps(company_id);
create index if not exists idx_regions_company               on public.regions(company_id);
create index if not exists idx_price_tables_company          on public.price_tables(company_id);
create index if not exists idx_payment_conditions_company    on public.payment_conditions(company_id);
create index if not exists idx_sales_orders_company          on public.sales_orders(company_id);
create index if not exists idx_equipments_company            on public.equipments(company_id);
create index if not exists idx_equipment_orders_company      on public.equipment_orders(company_id);
create index if not exists idx_equipment_history_company     on public.equipment_history(company_id);
create index if not exists idx_supplies_company              on public.supplies(company_id);
create index if not exists idx_supply_requests_company       on public.supply_requests(company_id);
create index if not exists idx_planned_inventories_company   on public.planned_inventories(company_id);
create index if not exists idx_adhoc_counts_company          on public.adhoc_counts(company_id);
create index if not exists idx_inventory_counts_company      on public.inventory_counts(company_id);

-- Foreign keys de relacionamento (joins / cascades) -------------------------
create index if not exists idx_related_codes_product         on public.related_codes(product_id);
create index if not exists idx_operation_items_operation     on public.operation_items(operation_id);
create index if not exists idx_operation_items_product       on public.operation_items(product_id);
create index if not exists idx_operation_alerts_operation    on public.operation_alerts(operation_id);
create index if not exists idx_operation_alerts_product      on public.operation_alerts(product_id);
create index if not exists idx_delivery_routes_operation     on public.delivery_routes(operation_id);
create index if not exists idx_delivery_routes_driver        on public.delivery_routes(driver_id);
create index if not exists idx_delivery_clients_route        on public.delivery_clients(delivery_route_id);
create index if not exists idx_delivery_items_client         on public.delivery_items(delivery_client_id);
create index if not exists idx_delivery_items_product        on public.delivery_items(product_id);
create index if not exists idx_customers_region              on public.customers(region_id);
create index if not exists idx_customers_price_table         on public.customers(price_table_id);
create index if not exists idx_customers_sales_rep           on public.customers(sales_rep_id);
create index if not exists idx_customer_equipments_customer  on public.customer_equipments(customer_id);
create index if not exists idx_sales_rep_regions_rep         on public.sales_rep_regions(sales_rep_id);
create index if not exists idx_sales_rep_regions_region      on public.sales_rep_regions(region_id);
create index if not exists idx_price_table_items_table       on public.price_table_items(price_table_id);
create index if not exists idx_price_table_items_product     on public.price_table_items(product_id);
create index if not exists idx_customer_pay_cond_customer    on public.customer_payment_conditions(customer_id);
create index if not exists idx_customer_pay_cond_condition   on public.customer_payment_conditions(payment_condition_id);
create index if not exists idx_sales_orders_customer         on public.sales_orders(customer_id);
create index if not exists idx_sales_order_items_order       on public.sales_order_items(sales_order_id);
create index if not exists idx_sales_order_items_product     on public.sales_order_items(product_id);
create index if not exists idx_equipments_current_customer   on public.equipments(current_customer_id);
create index if not exists idx_equipment_orders_customer     on public.equipment_orders(customer_id);
create index if not exists idx_equipment_orders_equipment    on public.equipment_orders(equipment_id);
create index if not exists idx_equipment_orders_driver       on public.equipment_orders(driver_id);
create index if not exists idx_equipment_history_equipment   on public.equipment_history(equipment_id);
create index if not exists idx_equipment_order_supplies_order   on public.equipment_order_supplies(order_id);
create index if not exists idx_equipment_order_supplies_supply  on public.equipment_order_supplies(supply_id);
create index if not exists idx_supply_requests_supply        on public.supply_requests(supply_id);
create index if not exists idx_supply_requests_mechanic      on public.supply_requests(mechanic_id);
create index if not exists idx_planned_inv_areas_inventory   on public.planned_inventory_areas(inventory_id);
create index if not exists idx_planned_inv_counts_inventory  on public.planned_inventory_counts(inventory_id);
create index if not exists idx_planned_inv_counts_area       on public.planned_inventory_counts(area_id);
create index if not exists idx_adhoc_count_items_count       on public.adhoc_count_items(count_id);
create index if not exists idx_inventory_count_items_inv     on public.inventory_count_items(inventory_id);
create index if not exists idx_company_payments_company      on public.company_payments(company_id);
create index if not exists idx_users_company                 on public.users(company_id);
create index if not exists idx_users_auth_user              on public.users(auth_user_id);
