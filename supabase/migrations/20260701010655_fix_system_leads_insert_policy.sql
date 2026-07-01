-- Permitir que usuários autenticados (empresas já logadas no sistema) possam criar solicitações de upgrade (leads)
CREATE POLICY "Allow authenticated to insert leads" ON system_leads
FOR INSERT TO authenticated
WITH CHECK (true);
