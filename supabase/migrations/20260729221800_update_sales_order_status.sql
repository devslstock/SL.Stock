-- Migration to update sales order statuses

UPDATE public.sales_orders 
SET status = 'Digitação' 
WHERE status IN ('Rascunho', 'Pedido Criado', 'Enviado');

-- Alter check constraint if exists (depends on how table was created, usually in Supabase they are just text columns).
-- If there's a constraint restricting status values, we would need to drop it, but typically it's enforced in frontend or with simple constraints.
-- Let's try to update all existing rows to the new status.
