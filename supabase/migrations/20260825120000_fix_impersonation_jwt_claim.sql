-- custom_access_token_hook lia direto public.users.company_id, ignorando
-- impersonated_company_id. Efeito: current_company_id() (usado em RLS de
-- ~20 tabelas e em vários DEFAULT de coluna company_id) nunca refletia a
-- empresa que um super admin entrou via Master > Empresas - só funcionava
-- por acidente nessas tabelas graças ao bypass is_super_admin() nas
-- policies novas, mas qualquer INSERT que dependesse do DEFAULT (sem
-- informar company_id explicitamente, ex: operationsApi.createOperationAlerts,
-- salesApi.createPaymentCondition, operationsApi.createOperation) falhava
-- com violação de NOT NULL. As tabelas "Unified_RLS_*" (mais antigas) já
-- liam impersonated_company_id direto e nunca tiveram esse problema.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  meta   jsonb := coalesce(claims -> 'app_metadata', '{}'::jsonb);
  prof   record;
begin
  select coalesce(impersonated_company_id, company_id) as company_id, role, coalesce(is_super_admin, false) as is_super_admin
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
