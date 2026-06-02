-- Adiciona a coluna min_stock_alert à tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER DEFAULT 0 NOT NULL;
