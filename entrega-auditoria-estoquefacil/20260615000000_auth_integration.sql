-- ============================================================================
-- 20260615000000_auth_integration.sql
-- FASE 1 (parte 1/4): Integração com Supabase Auth + helpers de RLS
-- ----------------------------------------------------------------------------
-- NÃO-DESTRUTIVO: não apaga nem altera dados existentes.
-- Mantém a tabela public.users como tabela de PERFIL e a vincula ao Supabase
-- Auth via a nova coluna auth_user_id. O login passa a usar Supabase Auth,
-- mas todo o código que lê public.users continua funcionando.
--
-- ORDEM DE EXECUÇÃO DA FASE 1 (rodar nesta sequência):
--   1) 20260615000000_auth_integration.sql      <-- este arquivo
--   2) scripts/migrate-users-to-auth.mjs         (cria os usuários no Auth)
--   3) 20260615000001_rls_policies.sql           (LIGA a RLS de verdade)
--   4) 20260615000002_indexes.sql
--   5) 20260615000003_atomic_rpcs.sql
--   6) refatorar o front (ver docs/refactor-frontend-auth.md)
--
-- ATENÇÃO: o passo 3 (rls_policies) só deve rodar DEPOIS de migrar os usuários
-- e ativar o Custom Access Token Hook (instruções no fim deste arquivo), senão
-- o app perde acesso. Rode tudo em ambiente de teste/staging primeiro.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Enum de papéis (substitui os CHECK divergentes espalhados nas migrations)
-- ----------------------------------------------------------------------------
do $$
begin
  create type public.user_role as enum (
    'admin','gestor','conferente','motorista','ajudante',
    'vendedor','representante','operador','mecanico','master'
  );
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Vínculo de public.users com auth.users (sem mudar o id existente)
--    auth_user_id = id do usuário no Supabase Auth (preenchido pelo script).
-- ----------------------------------------------------------------------------
alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.users
  add column if not exists must_change_password boolean not null default false;

-- email técnico usado para autenticar no Supabase Auth (derivado do username).
alter table public.users
  add column if not exists email text;

-- ----------------------------------------------------------------------------
-- 3. Garantir company_id nas tabelas de contagem legadas (não tinham!)
--    Mantém os dados: faz backfill para a empresa existente mais antiga.
--    >>> REVISAR se houver mais de uma empresa com contagens antigas. <<<
-- ----------------------------------------------------------------------------
alter table public.adhoc_counts     add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.inventory_counts add column if not exists company_id uuid references public.companies(id) on delete cascade;

do $$
declare default_company uuid;
begin
  select id into default_company from public.companies order by created_at asc limit 1;
  if default_company is not null then
    update public.adhoc_counts     set company_id = default_company where company_id is null;
    update public.inventory_counts set company_id = default_company where company_id is null;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Helpers de RLS — leem os claims do JWT emitido pelo Supabase Auth.
--    O Custom Access Token Hook (passo 6) injeta company_id/role/is_super_admin
--    em app_metadata. Estas funções traduzem isso para uso nas policies.
-- ----------------------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language sql stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false);
$$;

create or replace function public.current_user_role()
returns text
language sql stable
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role';
$$;

-- ----------------------------------------------------------------------------
-- 5. Custom Access Token Hook
--    Lê o perfil em public.users (via auth_user_id) e injeta os claims no token.
--    Registrar no painel: Authentication -> Hooks -> Custom Access Token.
-- ----------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable
security definer            -- roda como owner p/ poder ler public.users mesmo com RLS ligada
set search_path = public
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  meta   jsonb := coalesce(claims -> 'app_metadata', '{}'::jsonb);
  prof   record;
begin
  select company_id, role, coalesce(is_super_admin, false) as is_super_admin
    into prof
  from public.users
  where auth_user_id = (event ->> 'user_id')::uuid
    and active = true
  limit 1;

  if found then
    if prof.company_id is not null then
      meta := jsonb_set(meta, '{company_id}', to_jsonb(prof.company_id::text));
    else
      meta := meta - 'company_id';
    end if;
    meta := jsonb_set(meta, '{role}', to_jsonb(coalesce(prof.role, 'conferente')));
    meta := jsonb_set(meta, '{is_super_admin}', to_jsonb(prof.is_super_admin));
  end if;

  claims := jsonb_set(claims, '{app_metadata}', meta);
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Permissões exigidas pelo Supabase para o hook funcionar.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on table public.users to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ============================================================================
-- PASSO MANUAL APÓS RODAR ESTE ARQUIVO:
--   Painel Supabase -> Authentication -> Hooks -> "Custom Access Token"
--   Selecionar a função public.custom_access_token_hook e salvar.
--   (Sem isso, os claims company_id/role/is_super_admin não entram no JWT
--    e a RLS do passo 3 bloqueará tudo.)
-- ============================================================================
