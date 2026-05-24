-- Desabilitar RLS que está bloqueando as requisições (como o sistema usa auth próprio no frontend, o RLS do Supabase bloqueia tudo)
ALTER TABLE public.system_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins podem ver notas" ON public.system_notes;
DROP POLICY IF EXISTS "Super admins podem ver finanças" ON public.company_payments;
