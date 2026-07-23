-- ==============================================================================
-- MIGRAÇÃO PARA ADICIONAR CAMPOS DE DIVERGÊNCIA FÍSICA E ALERTA DE ESTOQUE
-- ==============================================================================

-- 1. Adicionar novas colunas para controle de divergências físicas
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS system_stock_at_load NUMERIC DEFAULT 0;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_verification TEXT DEFAULT 'pending';
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS physical_divergence_found BOOLEAN DEFAULT false;
ALTER TABLE public.operation_items ADD COLUMN IF NOT EXISTS divergence_resolved BOOLEAN DEFAULT false;

-- 2. Retroalimentar itens existentes com o estoque atual dos produtos correspondentes
UPDATE public.operation_items oi
SET system_stock_at_load = COALESCE((
    SELECT p.stock 
    FROM public.products p 
    WHERE p.id = oi.product_id
), 0)
WHERE system_stock_at_load IS NULL OR system_stock_at_load = 0;
