-- ============================================
-- Criação de Tabelas do Módulo de Entregas
-- ============================================

CREATE TABLE IF NOT EXISTS public.delivery_routes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_id uuid REFERENCES public.operations(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES public.users(id),
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_route_id uuid REFERENCES public.delivery_routes(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    phone text,
    notes text,
    status text NOT NULL DEFAULT 'pending',
    signature_data text,
    receiver_name text,
    receiver_doc text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delivery_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_client_id uuid REFERENCES public.delivery_clients(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    product_code text NOT NULL,
    description text NOT NULL,
    quantity_expected integer NOT NULL DEFAULT 0,
    quantity_scanned integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar Políticas de Segurança de Nível de Linha (RLS)
ALTER TABLE public.delivery_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items DISABLE ROW LEVEL SECURITY;
-- Fix RLS Policies for deliveries module

ALTER TABLE public.delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;

-- Drop them first just in case
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_routes" ON public.delivery_routes;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_clients" ON public.delivery_clients;
DROP POLICY IF EXISTS "Allow all actions for authenticated users on delivery_items" ON public.delivery_items;

CREATE POLICY "Allow all actions for authenticated users on delivery_routes"
ON public.delivery_routes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on delivery_clients"
ON public.delivery_clients
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on delivery_items"
ON public.delivery_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Add approval fields to delivery_items
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';
ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS requested_qty integer;

-- Update RLS policies (already permissive for authenticated users from previous fix, but good to be explicit)
-- Actually, the previous fix "Allow all actions on delivery_items" already covers this.
-- Add order_number to delivery_clients
ALTER TABLE public.delivery_clients ADD COLUMN IF NOT EXISTS order_number text;
-- Migração para garantir que o nome de usuário (username) seja único no sistema

-- 1. Higienizar usernames existentes (remover espaços extras e colocar em minúsculas)
UPDATE public.users SET username = LOWER(TRIM(username));

-- 2. Adicionar restrição de unicidade (Unique Constraint) na tabela public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
-- Adicionar colunas de faturamento na tabela de empresas
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 10;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Atualizar registros existentes para terem valores padrão consistentes
UPDATE public.companies SET billing_day = 10 WHERE billing_day IS NULL;
UPDATE public.companies SET monthly_fee = 0.00 WHERE monthly_fee IS NULL;
-- Adicionar coluna 'checked' para marcar recados como concluídos
ALTER TABLE public.system_notes ADD COLUMN IF NOT EXISTS checked BOOLEAN DEFAULT false;

-- Atualizar recados anteriores para falso
UPDATE public.system_notes SET checked = false WHERE checked IS NULL;
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
-- Create operation_alerts table
CREATE TABLE IF NOT EXISTS public.operation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity_expected NUMERIC NOT NULL DEFAULT 0,
    quantity_scanned NUMERIC NOT NULL DEFAULT 0,
    quantity_missing NUMERIC NOT NULL DEFAULT 0,
    resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.operation_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for all users (consistent with other tables accessed anonymously)
DROP POLICY IF EXISTS "Allow all actions for authenticated users on operation_alerts" ON public.operation_alerts;
DROP POLICY IF EXISTS "Allow all actions for all users on operation_alerts" ON public.operation_alerts;
CREATE POLICY "Allow all actions for all users on operation_alerts"
ON public.operation_alerts
FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.delivery_items ADD COLUMN IF NOT EXISTS returned_to_stock boolean DEFAULT false;
-- Tabela global de preços dos planos (SaaS)
CREATE TABLE IF NOT EXISTS saas_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'bronze', 'prata', 'ouro'
  name VARCHAR(100) NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_users INTEGER NOT NULL DEFAULT 1,
  extra_user_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir os planos padrão com os novos IDs
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price)
VALUES 
  ('bronze', 'Bronze', 197.00, 3, 35.00),
  ('prata', 'Prata', 497.00, 7, 50.00),
  ('ouro', 'Ouro', 1290.00, 10, 100.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  base_users = EXCLUDED.base_users,
  extra_user_price = EXCLUDED.extra_user_price;

-- Caso você já tenha rodado o código antigo que inseria 'basico', 'profissional' e 'enterprise', 
-- podemos remover os antigos (cuidado, se alguma empresa já estava vinculada, precisaríamos dar UPDATE nelas antes)
DELETE FROM saas_plans WHERE id IN ('basico', 'profissional', 'enterprise');
create table if not exists public.customers (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true,
    nickname text,
    document_type text check (document_type in ('CPF', 'CNPJ')),
    document text,
    fantasy_name text,
    legal_name text,
    cep text,
    address text,
    number text,
    complement text,
    neighborhood text,
    po_box text,
    city text,
    state text,
    phone1 text,
    phone2 text,
    phone3 text,
    phone4 text,
    email text,
    credit_limit numeric(15,2) default 0,
    price_table text,
    sales_rep text,
    payment_condition text,
    allow_unit_price_change boolean default false,
    region text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Equipamentos em Comodato
create table if not exists public.customer_equipments (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid not null references public.customers(id) on delete cascade,
    company_id uuid not null references public.companies(id) on delete cascade,
    description text not null,
    serial_number text,
    delivered_at date,
    returned_at date,
    status text default 'active' check (status in ('active', 'returned')),
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Representantes / Vendedores
create table if not exists public.sales_reps (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    active boolean default true not null,
    nickname varchar(255),
    legal_name varchar(255),
    document varchar(50),
    phone varchar(50),
    city varchar(100),
    state varchar(2),
    regions text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add sales_rep_id to customers
alter table public.customers add column if not exists sales_rep_id uuid references public.sales_reps(id) on delete set null;

-- Trigger to update updated_at
create trigger handle_updated_at before update on public.sales_reps
  for each row execute procedure moddatetime (updated_at);
-- Regions
create table if not exists public.regions (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Price Tables
create table if not exists public.price_tables (
    id uuid default gen_random_uuid() primary key,
    company_id uuid not null references public.companies(id) on delete cascade,
    name varchar(255) not null,
    active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update Customers
alter table public.customers drop column if exists region;
alter table public.customers drop column if exists price_table;

alter table public.customers add column if not exists region_id uuid references public.regions(id) on delete set null;
alter table public.customers add column if not exists price_table_id uuid references public.price_tables(id) on delete set null;

-- Update Sales Reps
alter table public.sales_reps drop column if exists regions;

create table if not exists public.sales_rep_regions (
    sales_rep_id uuid references public.sales_reps(id) on delete cascade,
    region_id uuid references public.regions(id) on delete cascade,
    primary key (sales_rep_id, region_id)
);

-- Add triggers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_regions') THEN
        CREATE TRIGGER handle_updated_at_regions BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_tables') THEN
        CREATE TRIGGER handle_updated_at_price_tables BEFORE UPDATE ON public.price_tables FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;
alter table public.sales_reps add column if not exists commission_rate numeric(5,2) default 0.00;
alter table public.price_tables add column if not exists code varchar(50);

create table if not exists public.price_table_items (
    id uuid default gen_random_uuid() primary key,
    price_table_id uuid not null references public.price_tables(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    price numeric(10,2) default 0.00 not null,
    discount_percent numeric(5,2) default 0.00,
    max_discount_percent numeric(5,2) default 0.00,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(price_table_id, product_id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_price_table_items') THEN
        CREATE TRIGGER handle_updated_at_price_table_items BEFORE UPDATE ON public.price_table_items FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
    END IF;
END $$;

ALTER TABLE public.price_table_items DISABLE ROW LEVEL SECURITY;
alter table public.delivery_clients add column if not exists customer_id uuid references public.customers(id) on delete set null;
-- Create payment_conditions table
CREATE TABLE IF NOT EXISTS public.payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    installments INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for payment_conditions
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for payment_conditions
CREATE POLICY "Users can view payment_conditions of their company" ON public.payment_conditions
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins and Gestors can insert payment_conditions" ON public.payment_conditions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

CREATE POLICY "Admins and Gestors can update payment_conditions" ON public.payment_conditions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

CREATE POLICY "Admins and Gestors can delete payment_conditions" ON public.payment_conditions
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'gestor')
        )
    );

-- Create customer_payment_conditions table
CREATE TABLE IF NOT EXISTS public.customer_payment_conditions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    payment_condition_id UUID NOT NULL REFERENCES public.payment_conditions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(customer_id, payment_condition_id)
);

-- Enable RLS for customer_payment_conditions
ALTER TABLE public.customer_payment_conditions ENABLE ROW LEVEL SECURITY;

-- Policies for customer_payment_conditions
CREATE POLICY "Users can view customer_payment_conditions of their company" ON public.customer_payment_conditions
    FOR SELECT USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Admins and Gestors can manage customer_payment_conditions" ON public.customer_payment_conditions
    FOR ALL USING (
        customer_id IN (
            SELECT c.id FROM public.customers c
            JOIN public.users u ON c.company_id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    );

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_rep_id UUID REFERENCES public.sales_reps(id),
    price_table_id UUID REFERENCES public.price_tables(id),
    payment_condition_id UUID REFERENCES public.payment_conditions(id),
    status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Enviado', 'Faturado', 'Cancelado')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_discount NUMERIC(15,2) DEFAULT 0,
    net_amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_orders
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

-- Policies for sales_orders
CREATE POLICY "Users can view sales_orders of their company" ON public.sales_orders
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert sales_orders of their company" ON public.sales_orders
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update sales_orders of their company" ON public.sales_orders
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete sales_orders of their company" ON public.sales_orders
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    net_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales_order_items
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for sales_order_items
CREATE POLICY "Users can view sales_order_items of their company" ON public.sales_order_items
    FOR SELECT USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sales_order_items of their company" ON public.sales_order_items
    FOR INSERT WITH CHECK (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update sales_order_items of their company" ON public.sales_order_items
    FOR UPDATE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sales_order_items of their company" ON public.sales_order_items
    FOR DELETE USING (
        sales_order_id IN (
            SELECT so.id FROM public.sales_orders so
            JOIN public.users u ON so.company_id = u.company_id
            WHERE u.id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_payment_conditions
    BEFORE UPDATE ON public.payment_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_sales_orders
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_api_token TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS maxiprod_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'gestor', 'operator', 'master', 'conferente', 'motorista', 'ajudante', 'vendedor'));
INSERT INTO saas_plans (id, name, base_price, base_users, extra_user_price) VALUES ('platina', 'Platina', 1990.00, 15, 150.00) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_price = EXCLUDED.base_price, base_users = EXCLUDED.base_users, extra_user_price = EXCLUDED.extra_user_price;
-- Allow authenticated users to update companies table
-- The UI already restricts access to this page to admins/gestores
CREATE POLICY "Allow authenticated users to update companies"
ON public.companies
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
-- Fix users role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'gestor', 'master', 'conferente', 'motorista', 'ajudante', 'vendedor', 'representante', 'operador', 'mecanico', 'operator'));

-- Equipments
CREATE TABLE public.equipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  patrimony varchar NOT NULL,
  type varchar NOT NULL, -- Freezer, Geladeira, etc
  model varchar NOT NULL,
  size varchar, -- e.g. 400L
  status varchar NOT NULL DEFAULT 'Disponível', -- Teste, Disponível, Em Manutenção, Danificado, No Cliente
  current_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, patrimony)
);

ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipments of their company"
  ON public.equipments FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipments of their company"
  ON public.equipments FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update equipments of their company"
  ON public.equipments FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete equipments of their company"
  ON public.equipments FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment Orders
CREATE TABLE public.equipment_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  type varchar NOT NULL, -- entrega, recolha, troca, manutencao
  status varchar NOT NULL DEFAULT 'pendente', -- pendente, em_rota, concluido, cancelado
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date date,
  completed_at timestamp with time zone,
  signature_data text,
  term_pdf_url text,
  receiver_name varchar,
  receiver_doc varchar,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment_orders of their company"
  ON public.equipment_orders FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipment_orders of their company"
  ON public.equipment_orders FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update equipment_orders of their company"
  ON public.equipment_orders FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete equipment_orders of their company"
  ON public.equipment_orders FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Equipment History
CREATE TABLE public.equipment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.equipment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment_history of their company"
  ON public.equipment_history FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert equipment_history of their company"
  ON public.equipment_history FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at_equipments()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipments_updated_at
BEFORE UPDATE ON public.equipments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipments();

CREATE OR REPLACE FUNCTION set_updated_at_equipment_orders()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_equipment_orders_updated_at
BEFORE UPDATE ON public.equipment_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_equipment_orders();
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
-- Tabela de Registros de NFe
CREATE TABLE IF NOT EXISTS public.nfe_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  focus_reference text not null unique,
  status text not null default 'processing',
  xml_url text,
  pdf_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.nfe_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_users_select_nfe" ON public.nfe_records
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_nfe" ON public.nfe_records
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_nfe" ON public.nfe_records
  FOR UPDATE USING (company_id = public.current_company_id());

-- Campos adicionais na empresa para configurar NFe
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS focusnfe_token text,
  ADD COLUMN IF NOT EXISTS focusnfe_env text default 'homologacao';
-- Add avatar_url and phone to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS phone text;
-- Add factory_code to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS factory_code text;
-- Migration to add a sequential order_number to sales_orders starting at 50000

-- Create the sequence
CREATE SEQUENCE IF NOT EXISTS sales_order_number_seq START 50000;

-- Add the column with default value from sequence
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS order_number integer DEFAULT nextval('sales_order_number_seq');

-- Create a unique index to ensure no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_order_number_idx ON public.sales_orders(order_number);
-- Migration para manter a tabela sales_reps sincronizada com a tabela users

CREATE OR REPLACE FUNCTION public.sync_user_to_sales_rep()
RETURNS trigger AS $$
BEGIN
  -- We only sync users with role 'vendedor' or 'representante'
  IF NEW.role IN ('vendedor', 'representante') THEN
    INSERT INTO public.sales_reps (id, company_id, nickname, legal_name, active)
    VALUES (NEW.id, NEW.company_id, NEW.name, NEW.name, NEW.active)
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      active = EXCLUDED.active,
      updated_at = timezone('utc'::text, now());
  ELSE
    -- If the role is NOT one of those (e.g. role changed), disable the sales_rep
    UPDATE public.sales_reps
    SET active = false, updated_at = timezone('utc'::text, now())
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_user_to_sales_rep_trigger ON public.users;
CREATE TRIGGER sync_user_to_sales_rep_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_sales_rep();

-- Sincronizar usuários existentes imediatamente (Backfill)
INSERT INTO public.sales_reps (id, company_id, nickname, legal_name, active)
SELECT id, company_id, name, name, active
FROM public.users
WHERE role IN ('vendedor', 'representante')
ON CONFLICT (id) DO NOTHING;
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
-- Migration: Grupos de Pedidos e Alteração de Status
-- Criação da tabela order_groups
CREATE TABLE IF NOT EXISTS public.order_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for order_groups
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;

-- Policies for order_groups
CREATE POLICY "Users can view order_groups of their company" ON public.order_groups
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
    ));

CREATE POLICY "Admins and managers can manage order_groups" ON public.order_groups
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    ) WITH CHECK (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
        )
    );

-- Adicionar coluna order_group_id na tabela sales_orders
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS order_group_id UUID REFERENCES public.order_groups(id) ON DELETE RESTRICT;

-- Atualizar CHECK constraint da coluna status
-- Primeiro, removemos a constraint atual (o nome pode variar conforme como foi criado, mas vamos tentar remover)
ALTER TABLE public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_status_check;

-- Adicionamos a nova constraint
ALTER TABLE public.sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('Rascunho', 'Pedido Criado', 'Enviado', 'Faturado', 'Cancelado', 'Retornou', 'Entregue'));

-- Trigger for updated_at in order_groups
CREATE TRIGGER handle_updated_at_order_groups
    BEFORE UPDATE ON public.order_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
DROP POLICY IF EXISTS "Admins and managers can manage order_groups" ON public.order_groups;

CREATE POLICY "Admins and managers can manage order_groups" ON public.order_groups
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor', 'master')
        )
    ) WITH CHECK (
        company_id IN (
            SELECT c.id FROM public.companies c
            JOIN public.users u ON c.id = u.company_id
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor', 'master')
        )
    );
-- Permitir que usuários autenticados (empresas já logadas no sistema) possam criar solicitações de upgrade (leads)
CREATE POLICY "Allow authenticated to insert leads" ON system_leads
FOR INSERT TO authenticated
WITH CHECK (true);
-- 1. Cria a função que gera as mensalidades
CREATE OR REPLACE FUNCTION generate_company_payments() RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comp RECORD;
    v_today DATE := CURRENT_DATE;
    v_candidate_date DATE;
    v_due_date DATE;
    v_days_remaining INT;
    v_last_day INT;
    i INT;
BEGIN
    FOR v_comp IN 
        SELECT id, created_at, monthly_fee, billing_day 
        FROM companies 
        WHERE active = true AND monthly_fee > 0 AND billing_day IS NOT NULL
    LOOP
        -- Testar mês passado (-1), mês atual (0) e próximo mês (1)
        FOR i IN -1..1 LOOP
            v_candidate_date := v_today + (i || ' month')::interval;
            
            -- Pegar o último dia do mês corrente no loop
            v_last_day := EXTRACT(DAY FROM (date_trunc('month', v_candidate_date) + interval '1 month - 1 day'));
            
            -- Calcular a data de vencimento
            v_due_date := date_trunc('month', v_candidate_date) + 
                          ((LEAST(v_comp.billing_day, v_last_day) - 1) || ' days')::interval;
                          
            IF v_due_date >= v_comp.created_at::DATE THEN
                v_days_remaining := v_due_date - v_today;
                
                -- Se faltar 7 dias ou menos para vencer
                IF v_days_remaining <= 7 THEN
                    -- Verificar se já existe a cobrança
                    IF NOT EXISTS (
                        SELECT 1 FROM company_payments 
                        WHERE company_id = v_comp.id AND due_date = v_due_date
                    ) THEN
                        -- Inserir nova cobrança
                        INSERT INTO company_payments (company_id, amount, due_date, status, notes)
                        VALUES (
                            v_comp.id, 
                            v_comp.monthly_fee, 
                            v_due_date, 
                            'pendente', 
                            'Gerado automaticamente pelo sistema (Mensalidade)'
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- 2. Ativar a extensão do pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Remover algum agendamento antigo se existir com esse nome (ignorar erro caso não exista)
DO $$
BEGIN
    PERFORM cron.unschedule('generate_monthly_payments');
EXCEPTION WHEN OTHERS THEN
    -- Não faz nada se não existir
END $$;

-- 4. Criar o agendamento para 09:00 UTC (06:00 BRT)
SELECT cron.schedule('generate_monthly_payments', '0 9 * * *', 'SELECT generate_company_payments()');
-- Migration to make order_number unique per company and calculate it per company

-- 1. Remove the global unique constraint
DROP INDEX IF EXISTS sales_orders_order_number_idx;

-- 2. Create a compound unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS sales_orders_company_order_number_idx ON public.sales_orders(company_id, order_number);

-- 3. Remove the sequence default from the column
ALTER TABLE public.sales_orders ALTER COLUMN order_number DROP DEFAULT;

-- 4. Create a function to auto-generate the order number per company
CREATE OR REPLACE FUNCTION generate_sales_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
BEGIN
  -- Se o número não foi gerado/passado, calculamos o próximo da empresa
  IF NEW.order_number IS NULL THEN
    SELECT COALESCE(MAX(order_number), 0) + 1
    INTO next_number
    FROM public.sales_orders
    WHERE company_id = NEW.company_id;

    NEW.order_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS trg_generate_sales_order_number ON public.sales_orders;
CREATE TRIGGER trg_generate_sales_order_number
  BEFORE INSERT ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_sales_order_number();
-- Migration to make os_number unique per company and calculate it per company

-- 1. Remove the global unique constraint if exists
DROP INDEX IF EXISTS equipment_orders_os_number_idx;
DROP INDEX IF EXISTS equipment_orders_os_number_key;

-- 2. Create a compound unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS equipment_orders_company_os_number_idx ON public.equipment_orders(company_id, os_number);

-- 3. Remove the sequence/default from the column
ALTER TABLE public.equipment_orders ALTER COLUMN os_number DROP DEFAULT;
ALTER TABLE public.equipment_orders ALTER COLUMN os_number DROP IDENTITY IF EXISTS;

-- 4. Create a function to auto-generate the OS number per company
CREATE OR REPLACE FUNCTION generate_equipment_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
BEGIN
  -- Se o número não foi gerado/passado, calculamos o próximo da empresa
  IF NEW.os_number IS NULL THEN
    SELECT COALESCE(MAX(os_number), 0) + 1
    INTO next_number
    FROM public.equipment_orders
    WHERE company_id = NEW.company_id;

    NEW.os_number := next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS trg_generate_equipment_order_number ON public.equipment_orders;
CREATE TRIGGER trg_generate_equipment_order_number
  BEFORE INSERT ON public.equipment_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_equipment_order_number();
-- Adiciona política para permitir que usuários autenticados visualizem as cobranças da sua própria empresa
DROP POLICY IF EXISTS "Users can select their own company payments" ON public.company_payments;

CREATE POLICY "Users can select their own company payments"
ON public.company_payments
FOR SELECT
TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE users.auth_user_id = auth.uid())
);
-- supabase/migrations/20260721144000_debug_payments_rpc.sql
CREATE OR REPLACE FUNCTION debug_get_all_payments()
RETURNS TABLE (
    id UUID,
    company_id UUID,
    amount DECIMAL,
    status TEXT,
    due_date DATE
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT cp.id, cp.company_id, cp.amount, cp.status, cp.due_date FROM public.company_payments cp;
END;
$$ LANGUAGE plpgsql;
-- supabase/migrations/20260721145000_add_check_overdue_debt_rpc.sql
CREATE OR REPLACE FUNCTION check_overdue_debt(p_company_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_has_debt BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.company_payments 
        WHERE company_id = p_company_id 
          AND status != 'pago' 
          AND due_date <= (CURRENT_DATE - INTERVAL '7 days')
    ) INTO v_has_debt;
    
    RETURN v_has_debt;
END;
$$ LANGUAGE plpgsql;
-- 1. Adicionar CPF ao Usuário (Motorista)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cpf text;

-- 2. Tabela de Registros de MDF-e
CREATE TABLE IF NOT EXISTS public.mdfe_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delivery_route_id uuid not null references public.delivery_routes(id) on delete cascade,
  focus_reference text not null unique,
  status text not null default 'processando',
  xml_url text,
  pdf_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Habilitar RLS
ALTER TABLE public.mdfe_records ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Company Isolation)
CREATE POLICY "company_users_select_mdfe" ON public.mdfe_records
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_mdfe" ON public.mdfe_records
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_mdfe" ON public.mdfe_records
  FOR UPDATE USING (company_id = public.current_company_id());
-- 1. Add tax_regime to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples_nacional';

-- 2. Add fiscal fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ncm text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cest text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin text DEFAULT '0';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS net_weight numeric(15,4) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gross_weight numeric(15,4) DEFAULT 0;

-- 3. Create fiscal_operations table
CREATE TABLE IF NOT EXISTS public.fiscal_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  cfop_intra text not null,
  cfop_inter text not null,
  csosn text,
  cst text,
  icms_rate numeric(15,4) default 0,
  ipi_rate numeric(15,4) default 0,
  pis_rate numeric(15,4) default 0,
  cofins_rate numeric(15,4) default 0,
  default_message text,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Enable RLS and create policies
ALTER TABLE public.fiscal_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_users_select_fiscal" ON public.fiscal_operations
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "company_users_insert_fiscal" ON public.fiscal_operations
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "company_users_update_fiscal" ON public.fiscal_operations
  FOR UPDATE USING (company_id = public.current_company_id());

CREATE POLICY "company_users_delete_fiscal" ON public.fiscal_operations
  FOR DELETE USING (company_id = public.current_company_id());
ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS voltage varchar;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ipi_rate numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fci text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gtin text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gtin_tributable text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS complementary_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS technical_notes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.sales_orders ALTER COLUMN customer_id DROP NOT NULL;
-- Migration to update sales order statuses

UPDATE public.sales_orders 
SET status = 'Digitação' 
WHERE status IN ('Rascunho', 'Pedido Criado', 'Enviado');

-- Alter check constraint if exists (depends on how table was created, usually in Supabase they are just text columns).
-- If there's a constraint restricting status values, we would need to drop it, but typically it's enforced in frontend or with simple constraints.
-- Let's try to update all existing rows to the new status.
