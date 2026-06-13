-- Adicionar colunas adicionais para detalhamento técnico da OS
ALTER TABLE public.equipment_orders 
ADD COLUMN IF NOT EXISTS defect_description text,
ADD COLUMN IF NOT EXISTS solution_description text,
ADD COLUMN IF NOT EXISTS action_taken text;

-- Insumos e Peças (Estoque Geral)
CREATE TABLE public.supplies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name varchar NOT NULL,
  unit varchar NOT NULL DEFAULT 'un', -- un, kg, m, etc.
  stock_quantity numeric(15,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supplies DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at_supplies()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplies_updated_at
BEFORE UPDATE ON public.supplies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_supplies();

-- Solicitações de Peças (Feitas pelo Mecânico para o Gestor)
CREATE TABLE public.supply_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  supply_id uuid REFERENCES public.supplies(id) ON DELETE CASCADE NOT NULL,
  quantity_requested numeric(15,2) NOT NULL,
  status varchar NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.supply_requests DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION set_updated_at_supply_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supply_requests_updated_at
BEFORE UPDATE ON public.supply_requests
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_supply_requests();

-- Consumo de Peças em uma OS
CREATE TABLE public.equipment_order_supplies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.equipment_orders(id) ON DELETE CASCADE NOT NULL,
  supply_id uuid REFERENCES public.supplies(id) ON DELETE CASCADE NOT NULL,
  quantity_consumed numeric(15,2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_order_supplies DISABLE ROW LEVEL SECURITY;
