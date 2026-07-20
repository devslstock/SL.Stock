-- Adiciona política para permitir que usuários autenticados visualizem as cobranças da sua própria empresa
DROP POLICY IF EXISTS "Users can select their own company payments" ON public.company_payments;

CREATE POLICY "Users can select their own company payments"
ON public.company_payments
FOR SELECT
TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE users.auth_user_id = auth.uid())
);
