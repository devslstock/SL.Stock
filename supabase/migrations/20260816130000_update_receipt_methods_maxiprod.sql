-- Update table for Receipt Methods (Formas de Recebimento) to match Maxiprod
alter table public.receipt_methods
    -- Replace 'type' conceptually with 'payment_method'. We will add 'payment_method' and make 'type' optional.
    add column if not exists payment_method text,
    
    -- Checkboxes at the top
    add column if not exists is_receivable boolean default true,
    add column if not exists is_payable boolean default false,
    
    -- Common fields for various methods
    add column if not exists accounting_account text,
    add column if not exists financial_institution text,
    
    -- Boleto specific fields
    add column if not exists portfolio text,
    add column if not exists payment_location text,
    add column if not exists agreement_code text,
    add column if not exists contract_number text,
    
    add column if not exists fine_after_due numeric(10,2),
    add column if not exists fine_type text, -- '%', 'valor', etc
    add column if not exists interest_after_due numeric(10,2),
    add column if not exists interest_type text, -- '% ao mês', '% ao dia', etc
    
    add column if not exists protest_days integer,
    add column if not exists protest_action text, -- 'Protestar', etc
    
    add column if not exists grant_discount boolean default false,
    
    add column if not exists remittance_environment text, -- 'Teste', 'Produção'
    add column if not exists integration_type text, -- 'CNAB 240', etc
    add column if not exists liquidation_date_type text,
    add column if not exists credit_date_type text,
    
    add column if not exists next_slip_number integer,
    add column if not exists next_remittance_number integer,
    
    add column if not exists generate_nfe_record boolean default false,
    add column if not exists confirmed_with_manager boolean default false,
    add column if not exists sum_tariff_on_return boolean default false,
    
    -- Credenciais e validade (Pix, Cielo, SafraPay)
    add column if not exists validation_credential_1 text,
    add column if not exists validation_credential_2 text,
    add column if not exists pix_validity_hours integer,
    add column if not exists link_validity_days integer,
    add column if not exists max_installments integer,
    add column if not exists show_product_description boolean default false;
    
-- Make type nullable if we are shifting to payment_method
alter table public.receipt_methods alter column type drop not null;
