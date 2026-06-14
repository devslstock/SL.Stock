-- Desabilitar temporariamente RLS para as tabelas de insumos para investigar e corrigir o bloqueio
alter table public.supplies disable row level security;
alter table public.supply_requests disable row level security;
alter table public.equipment_order_supplies disable row level security;

-- Limpar as politicas antigas (opcional)
drop policy if exists "Enable all for authenticated users" on public.supplies;
drop policy if exists "Enable all for authenticated users" on public.supply_requests;
drop policy if exists "Enable all for authenticated users" on public.equipment_order_supplies;
