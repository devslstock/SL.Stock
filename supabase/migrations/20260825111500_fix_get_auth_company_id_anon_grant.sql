-- get_auth_company_id tinha um GRANT explícito pra anon (separado do GRANT pra PUBLIC já
-- revogado na migration anterior) - REVOKE ALL FROM PUBLIC sozinho não cobre grants nomeados.
REVOKE ALL ON FUNCTION public.get_auth_company_id() FROM anon;

NOTIFY pgrst, 'reload schema';
