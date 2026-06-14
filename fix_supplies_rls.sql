-- Habilitar RLS novamente
alter table public.supplies enable row level security;
alter table public.supply_requests enable row level security;
alter table public.equipment_order_supplies enable row level security;

-- Limpar politicas antigas que estão causando o bloqueio
drop policy if exists "Enable all for authenticated users" on public.supplies;
drop policy if exists "Enable all for authenticated users" on public.supply_requests;
drop policy if exists "Enable all for authenticated users" on public.equipment_order_supplies;

drop policy if exists "Enable all for anon users" on public.supplies;
drop policy if exists "Enable all for anon users" on public.supply_requests;
drop policy if exists "Enable all for anon users" on public.equipment_order_supplies;

-- O sistema usa login customizado, então o Postgres vê as chamadas como 'anon' (anônimas).
-- Devemos permitir acesso para a role anon.
create policy "Enable all for anon users" on public.supplies
  for all to anon using (true) with check (true);

create policy "Enable all for anon users" on public.supply_requests
  for all to anon using (true) with check (true);

create policy "Enable all for anon users" on public.equipment_order_supplies
  for all to anon using (true) with check (true);
