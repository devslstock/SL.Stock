-- Meio de pagamento e banco escolhidos pelo gestor no faturamento
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS meio_pagamento text,
  ADD COLUMN IF NOT EXISTS receipt_method_id uuid REFERENCES public.receipt_methods(id) ON DELETE SET NULL;
