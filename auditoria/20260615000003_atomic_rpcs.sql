-- ============================================================================
-- 20260615000003_atomic_rpcs.sql
-- FASE 3: Operações atômicas de estoque + deleção transacional de empresa.
-- ----------------------------------------------------------------------------
-- Substitui o padrão inseguro "lê estoque -> soma no JS -> grava" (sujeito a
-- race condition / estoque corrompido) por UPDATEs atômicos no banco.
-- Todas respeitam o isolamento por empresa (usam current_company_id()).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Incrementar estoque de um produto por id (delta pode ser negativo).
--    Uso no front: await supabase.rpc('increment_stock',
--                     { p_product_id, p_delta })
-- ----------------------------------------------------------------------------
create or replace function public.increment_stock(p_product_id uuid, p_delta numeric)
returns numeric
language plpgsql
security invoker
as $$
declare novo numeric;
begin
  update public.products
     set stock = stock + p_delta
   where id = p_product_id
     and (company_id = public.current_company_id() or public.is_super_admin())
  returning stock into novo;

  if not found then
    raise exception 'Produto % não encontrado nesta empresa', p_product_id;
  end if;
  return novo;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Incrementar estoque por código (resolve o produto DENTRO da empresa).
--    Substitui products.incrementStockByCode (que podia pegar produto errado).
--    Uso: await supabase.rpc('increment_stock_by_code', { p_code, p_delta })
-- ----------------------------------------------------------------------------
create or replace function public.increment_stock_by_code(p_code text, p_delta numeric)
returns numeric
language plpgsql
security invoker
as $$
declare novo numeric;
begin
  update public.products
     set stock = stock + p_delta
   where (code = p_code or external_code = p_code)
     and (company_id = public.current_company_id() or public.is_super_admin())
  returning stock into novo;

  if not found then
    raise exception 'Produto com código % não encontrado nesta empresa', p_code;
  end if;
  return novo;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Incrementar estoque de um insumo/peça (módulo Comodatos).
--    Uso: await supabase.rpc('increment_supply_stock', { p_supply_id, p_delta })
-- ----------------------------------------------------------------------------
create or replace function public.increment_supply_stock(p_supply_id uuid, p_delta numeric)
returns numeric
language plpgsql
security invoker
as $$
declare novo numeric;
begin
  update public.supplies
     set stock_quantity = stock_quantity + p_delta
   where id = p_supply_id
     and (company_id = public.current_company_id() or public.is_super_admin())
  returning stock_quantity into novo;

  if not found then
    raise exception 'Insumo % não encontrado nesta empresa', p_supply_id;
  end if;
  return novo;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Deleção transacional de empresa (só super admin).
--    Substitui companies.deleteCompany (que fazia ~11 deletes sem transação
--    e ignorava erros). Como as FKs são ON DELETE CASCADE, basta deletar a
--    companies; tudo cai junto numa única transação.
--    Uso: await supabase.rpc('delete_company', { p_company_id })
-- ----------------------------------------------------------------------------
create or replace function public.delete_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Apenas super admin pode excluir empresas';
  end if;
  delete from public.companies where id = p_company_id;
end;
$$;

revoke execute on function public.delete_company(uuid) from anon;
grant execute on function public.delete_company(uuid) to authenticated;
