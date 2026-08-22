INSERT INTO public.receipt_methods (company_id, name, payment_method, is_receivable, is_payable, financial_institution, status, gateway_provider)
SELECT c.id, 'Asaas', 'Boleto (com registro)', true, false, 'Asaas', 'Ativo', 'asaas'
FROM public.companies c
WHERE c.asaas_subaccount_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.receipt_methods rm
    WHERE rm.company_id = c.id AND rm.gateway_provider = 'asaas'
  );
