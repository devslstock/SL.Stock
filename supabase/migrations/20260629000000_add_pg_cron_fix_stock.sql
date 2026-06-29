-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Create function to fix reserved stock
CREATE OR REPLACE FUNCTION fix_reserved_stock_all_companies()
RETURNS void AS $$
DECLARE
  prod RECORD;
  expected_stock INT;
BEGIN
  -- Loop through all products
  FOR prod IN SELECT id FROM public.products LOOP
    
    -- Calculate expected reserved stock from active orders (Rascunho and Enviado)
    SELECT COALESCE(SUM(i.quantity), 0) INTO expected_stock
    FROM public.sales_order_items i
    JOIN public.sales_orders o ON o.id = i.sales_order_id
    WHERE i.product_id = prod.id 
      AND o.status IN ('Rascunho', 'Enviado');
      
    -- Update product
    UPDATE public.products 
    SET reserved_stock = expected_stock
    WHERE id = prod.id 
      AND COALESCE(reserved_stock, 0) != expected_stock;
      
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job to run every day at 06:00 AM (database time usually UTC)
-- '0 6 * * *' runs at 06:00 UTC. If Brazil time (UTC-3), we should run at 09:00 UTC.
-- Let's run at '0 9 * * *' to be 06:00 AM in Brazil (BRT).
SELECT cron.schedule(
  'fix-reserved-stock-daily',
  '0 9 * * *',
  'SELECT fix_reserved_stock_all_companies()'
);
