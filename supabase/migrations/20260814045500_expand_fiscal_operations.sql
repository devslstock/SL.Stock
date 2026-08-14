-- Expansão da tabela fiscal_operations

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS nature_of_operation TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS observations TEXT;

-- Aba 2: Inicialização da Nota
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS serie TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS finality TEXT DEFAULT 'NF-e normal';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS consumer_final BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS use_consumption BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS buyer_presence TEXT DEFAULT '0 - não se aplica';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS payment_form TEXT DEFAULT 'A prazo';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS freight_condition TEXT DEFAULT '0 - Contratação do frete por conta do remetente';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS iss_incidence_local TEXT DEFAULT 'Prestador';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS nfse_operation_indicator TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS freight_info TEXT DEFAULT 'na nota fiscal, rateando o valor entre os itens';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS insurance_info TEXT DEFAULT 'na nota fiscal, rateando o valor entre os itens';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS other_expenses_info TEXT DEFAULT 'na nota fiscal, rateando o valor entre os itens';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS discount_info TEXT DEFAULT 'nos itens, totalizando o valor na nota';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS fiscal_document TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS document_situation TEXT DEFAULT '00 - Documento regular';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS efd_icms_ipi TEXT DEFAULT 'Registro C100';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS init_ie_st BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS overwrite_reason_social TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS inform_simples_nacional_rate BOOLEAN DEFAULT false;

-- Informações adicionais
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS internal_observations TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS fisco_info TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS contribuinte_info TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS include_customer_order BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS include_total_taxes BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS include_additional_customer_info BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS include_ibs_cbs BOOLEAN DEFAULT false;

-- Aba 3: Pagamento, Estoque, Inicialização
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS with_payment BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS payment_debit_account TEXT DEFAULT '16';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS payment_finality TEXT DEFAULT 'Receita';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS payment_credit_cost_center TEXT;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS move_stock BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS stock_origin TEXT DEFAULT 'Estoque';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS stock_destination TEXT DEFAULT 'CMV (Custo Mercad)';

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'Faturamento';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS special_category TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS future_delivery_operation BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS accounting_value BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS generate_b020 BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS generate_traceability_group BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS uf_fiscal_benefit_code TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS installments_indicator TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS relevant_scale_produced TEXT;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS has_tax_reform_taxes BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS mobile_good_supply_indicator BOOLEAN DEFAULT false;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS item_exceptions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS add_customer_order_to_product BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS add_batch_data_to_product BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS add_qty_unit_data_to_product BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS add_original_note_data_to_product BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS concat_product_info_nfse BOOLEAN DEFAULT false;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS accounting_history TEXT;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS generate_additional_launches_item BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS generate_additional_launches_stock BOOLEAN DEFAULT false;

ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS usage TEXT DEFAULT 'Em NFs, pedidos e propostas';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Produto';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS init_unit_value_stock TEXT DEFAULT 'o preço de venda do item';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS init_unit_value_outsource TEXT DEFAULT 'O preço de venda do item';
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS permit_referenced_nf BOOLEAN DEFAULT false;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS permit_unit_value_lower_min BOOLEAN DEFAULT true;
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS item_receives_apportion BOOLEAN DEFAULT true;

-- Aba 4: Impostos (Já temos cfop_intra, cfop_inter, csosn, cst, icms_rate, etc)
-- Adicionando tax_initialization como JSONB para flexibilidade de overrides (PIS, COFINS, ICMS)
ALTER TABLE fiscal_operations ADD COLUMN IF NOT EXISTS tax_initialization JSONB DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
