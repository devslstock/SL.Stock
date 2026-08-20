-- Add IBGE Code to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ibge_code text;

-- Add IBGE Code and IE Indicator to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ibge_code text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ie_indicator integer DEFAULT 9; -- 1: Contribuinte, 2: Isento, 9: Não Contribuinte

-- Add Redução e Diferimento to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_percentual_reducao_bc numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_percentual_diferimento numeric;

-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document text NOT NULL, -- CNPJ or CPF
  legal_name text NOT NULL,
  fantasy_name text,
  ie text,
  address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  cep text,
  ibge_code text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, document)
);

-- RLS policies for carriers
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company carriers" 
  ON carriers FOR SELECT 
  USING (company_id IN (
    SELECT company_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert carriers for their company" 
  ON carriers FOR INSERT 
  WITH CHECK (company_id IN (
    SELECT company_id FROM users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their company carriers" 
  ON carriers FOR UPDATE 
  USING (company_id IN (
    SELECT company_id FROM users WHERE auth_user_id = auth.uid()
  ));

-- Add Carrier and Volume fields to Sales Orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES carriers(id) ON DELETE SET NULL;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS volume_qty integer;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS volume_species text;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS gross_weight numeric;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS net_weight numeric;
