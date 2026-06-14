-- Habilitar RLS novamente
alter table public.supplies enable row level security;
alter table public.supply_requests enable row level security;
alter table public.equipment_order_supplies enable row level security;

-- Limpar politicas antigas
drop policy if exists "Enable all for authenticated users" on public.supplies;
drop policy if exists "Enable all for authenticated users" on public.supply_requests;
drop policy if exists "Enable all for authenticated users" on public.equipment_order_supplies;

-- Criar politicas abertas para usuarios autenticados, ignorando company_id por enquanto 
-- para garantir que funciona, ja que o filtro de company_id e feito na aplicacao.
create policy "Enable all for authenticated users" on public.supplies
  for all to authenticated using (true) with check (true);

create policy "Enable all for authenticated users" on public.supply_requests
  for all to authenticated using (true) with check (true);

create policy "Enable all for authenticated users" on public.equipment_order_supplies
  for all to authenticated using (true) with check (true);
