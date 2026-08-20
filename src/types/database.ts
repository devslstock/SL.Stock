// ============================================
// Database Types - Estoque Fácil
// ============================================

export type OperationType = 'LOAD' | 'INVENTORY' | 'BLIND_RECEIPT' | 'RECEIPT' | 'RETURN'
export type OperationStatus = 'pending' | 'in_progress' | 'dispatched' | 'completed' | 'cancelled'
export type ItemStatus = 'pending' | 'ok' | 'divergent'
export type UserRole = 'admin' | 'gestor' | 'conferente' | 'motorista' | 'ajudante' | 'vendedor' | 'representante' | 'operador' | 'mecanico' | 'master'

export interface UserPermissions {
  can_view_dashboard: boolean
  can_manage_loads: boolean
  can_do_conference: boolean
  can_manage_products: boolean
  can_manage_users: boolean
  can_do_delivery: boolean
  
  // Novas permissões
  can_use_sales_app?: boolean
  can_manage_sales?: boolean
  can_manage_order_groups?: boolean
  can_manage_price_tables?: boolean
  can_manage_payment_conditions?: boolean
  can_manage_customers?: boolean
  can_manage_reps?: boolean
  can_manage_regions?: boolean
  can_manage_integrations?: boolean
  can_manage_equipments?: boolean
  can_manage_os?: boolean
  can_manage_supplies?: boolean
  can_request_supplies?: boolean
  can_manage_company?: boolean

  // SaaS Master Permissions
  can_manage_saas_finance?: boolean
  can_manage_saas_clients?: boolean
  can_manage_saas_staff?: boolean
  
  // Finance Permissions
  can_manage_finance?: boolean
  can_override_financial_block?: boolean
}

export interface Company {
  id: string
  slug: string
  name: string
  cnpj?: string
  max_users: number
  active: boolean
  billing_day?: number
  monthly_fee?: number
  plan?: 'bronze' | 'prata' | 'ouro' | 'platina'
  garage_address?: string | null
  garage_cep?: string | null
  garage_street?: string | null
  garage_number?: string | null
  garage_complement?: string | null
  garage_neighborhood?: string | null
  garage_city?: string | null
  garage_state?: string | null
  state_registration?: string | null
  fantasy_name?: string | null
  phone?: string | null
  email?: string | null
  additional_info?: string | null
  logo_url?: string | null
  exibir_logo_nf?: boolean
  garage_lat?: number | null
  garage_lng?: number | null
  maxiprod_api_token?: string | null
  maxiprod_last_sync?: string | null
  maxiprod_moeda_id?: number | null
  maxiprod_operacao_id?: number | null
  maxiprod_unidade_id?: number | null
  focusnfe_token?: string | null
  focusnfe_env?: 'producao' | 'homologacao' | null
  tax_regime?: 'simples_nacional' | 'regime_normal' | null
  focus_nfe_empresa_id?: string | null
  focus_nfe_status?: 'NAO_CONFIGURADA' | 'PENDENTE' | 'SINCRONIZANDO' | 'SINCRONIZADA' | 'ERRO' | 'DESATIVADA'
  focus_nfe_sync_status?: string | null
  focus_nfe_last_sync?: string | null
  focus_nfe_last_error?: string | null
  focus_nfe_created_at?: string | null
  focus_nfe_updated_at?: string | null
  focus_nfe_cert_expires_at?: string | null
  ibge_code?: string | null
  created_at: string
}

export interface FocusNfeSettings {
  id: string
  is_active: boolean
  environment: 'homologacao' | 'producao'
  auto_register: boolean
  auto_sync: boolean
  enable_nfe: boolean
  enable_nfce: boolean
  enable_nfse: boolean
  enable_receive_nfe: boolean
  enable_receive_cte: boolean
  created_at: string
  updated_at: string
}

export interface FocusNfeSyncLog {
  id: string
  company_id: string
  operation: 'CREATE' | 'UPDATE' | 'TEST'
  endpoint?: string | null
  result: 'SUCCESS' | 'ERROR'
  http_status?: number | null
  message?: string | null
  duration_ms?: number | null
  created_by?: string | null
  created_at: string
}

export interface FiscalSeries {
  id: string
  company_id: string
  series_number: number
  next_number: number
  document_type: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface FiscalSettings {
  id: string
  company_id: string
  default_cfop?: string | null
  default_csosn?: string | null
  default_cst?: string | null
  default_ncm?: string | null
  default_pis?: string | null
  default_cofins?: string | null
  default_icms_rate?: number | null
  default_ipi_rate?: number | null
  created_at: string
  updated_at: string
}

export interface NfeRecord {
  id: string
  company_id: string
  sales_order_id: string | null
  focus_reference: string
  status: string
  nfe_number?: number | null
  nfe_series?: number | null
  access_key?: string | null
  protocol?: string | null
  environment?: string | null
  xml_url: string | null
  pdf_url: string | null
  error_message: string | null
  issued_at?: string | null
  created_at: string
  updated_at: string
}

export interface MdfeRecord {
  id: string
  company_id: string
  delivery_route_id: string
  focus_reference: string
  status: string
  xml_url: string | null
  pdf_url: string | null
  error_message: string | null
  payload?: any
  created_at: string
  updated_at: string
}

export interface CostCenter {
  id: string
  company_id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountingAccount {
  id: string
  company_id: string
  code: string
  classification?: string | null
  name: string
  nickname?: string | null
  parent_id?: string | null
  type: 'Sintética' | 'Analítica'
  finality?: string | null
  is_favorite: boolean
  is_active: boolean
  nature?: string | null
  aggregation_code?: string | null
  sped_referential_account?: string | null
  cost_center_required: 'Opcional' | 'Obrigatório' | 'Não utilizar'
  sales_order_required: 'Opcional' | 'Obrigatório' | 'Não utilizar'
  created_at: string
  updated_at: string
}

export interface AccountingAccountCostCenter {
  id: string
  accounting_account_id: string
  cost_center_id: string
  referential_account?: string | null
  aggregation_code?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyPayment {
  id: string
  company_id: string
  amount: number
  status: 'pendente' | 'pago' | 'atrasado'
  due_date: string
  paid_at?: string
  notes?: string
  created_at: string
}

export interface SaaSPlan {
  id: string
  name: string
  base_price: number
  base_users: number
  extra_user_price: number
  created_at: string
}

export interface SystemNote {
  id: string
  author_id: string
  author_name: string
  content: string
  checked?: boolean
  created_at: string
}

export interface User {
  id: string
  auth_user_id?: string
  company_id: string
  is_super_admin?: boolean
  name: string
  username: string
  email?: string
  phone?: string
  cpf?: string
  avatar_url?: string
  role: UserRole
  active: boolean
  reset_requested?: boolean
  must_change_password?: boolean
  permissions: UserPermissions
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  active: boolean
  nickname: string | null
  document_type: 'CPF' | 'CNPJ' | null
  document: string | null
  fantasy_name: string | null
  legal_name: string | null
  cep: string | null
  address: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  po_box: string | null
  city: string | null
  state: string | null
  ibge_code?: string | null
  ie_indicator?: number | null
  latitude?: number | null
  longitude?: number | null
  phone1: string | null
  phone2: string | null
  phone3: string | null
  phone4: string | null
  email: string | null
  credit_limit: number | null
  price_table_id: string | null
  payment_condition: string | null
  allow_unit_price_change: boolean | null
  region_id: string | null
  sales_rep_id: string | null
  maxiprod_id?: number | null
  created_at: string
  updated_at: string
  equipments?: CustomerEquipment[]
  sales_rep_obj?: SalesRep | null
  region?: Region | null
  price_table?: PriceTable | null
}

export interface SalesRep {
  id: string
  company_id: string
  active: boolean
  nickname: string | null
  legal_name: string | null
  document: string | null
  phone: string | null
  city: string | null
  state: string | null
  commission_rate: number | null
  monthly_goal: number | null
  created_at: string
  updated_at: string
  sales_rep_regions?: { region: Region }[]
}

export interface Region {
  id: string
  company_id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PriceTable {
  id: string
  company_id: string
  code: string | null
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PriceTableItem {
  id: string
  price_table_id: string
  product_id: string
  price: number
  discount_percent: number | null
  max_discount_percent: number | null
  created_at: string
  updated_at: string
  product?: Product // Relation
}

export interface PaymentCondition {
  id: string
  company_id: string
  name: string
  active: boolean
  installments: number
  interval_days?: number
  created_at: string
  updated_at: string
}

export interface CustomerPaymentCondition {
  id: string
  customer_id: string
  payment_condition_id: string
  created_at: string
  payment_condition?: PaymentCondition
}

export interface ReceiptMethod {
  id: string
  company_id: string
  name: string
  type?: 'banco' | 'pix' | 'outros' | null // Making optional as we move to payment_method
  payment_method?: string | null
  
  is_receivable?: boolean
  is_payable?: boolean
  accounting_account?: string | null
  financial_institution?: string | null
  
  bank?: string | null
  bank_code?: string | null
  agency?: string | null
  account_number?: string | null
  account_digit?: string | null
  account_type?: string | null
  
  // Boleto fields
  portfolio?: string | null
  payment_location?: string | null
  agreement_code?: string | null
  contract_number?: string | null
  fine_after_due?: number | null
  fine_type?: string | null
  interest_after_due?: number | null
  interest_type?: string | null
  protest_days?: number | null
  protest_action?: string | null
  grant_discount?: boolean
  remittance_environment?: string | null
  integration_type?: string | null
  liquidation_date_type?: string | null
  credit_date_type?: string | null
  next_slip_number?: number | null
  next_remittance_number?: number | null
  generate_nfe_record?: boolean
  confirmed_with_manager?: boolean
  sum_tariff_on_return?: boolean
  
  // PIX/Link fields
  pix_key_type?: string | null
  pix_key?: string | null
  linked_bank?: string | null
  linked_account?: string | null
  validation_credential_1?: string | null
  validation_credential_2?: string | null
  pix_validity_hours?: number | null
  link_validity_days?: number | null
  max_installments?: number | null
  show_product_description?: boolean
  
  holder_name?: string | null
  holder_document?: string | null
  notes?: string | null
  status: 'Ativo' | 'Inativo'
  
  created_at: string
  updated_at: string
}

export interface SalesOrder {
  id: string
  order_number: number
  company_id: string
  customer_id: string | null
  sales_rep_id: string | null
  price_table_id: string | null
  payment_condition_id: string | null
  custom_payment_condition?: string | null
  nfe_series?: number | null
  order_group_id: string | null
  status: 'Digitação' | 'Aprovado' | 'Faturado' | 'Cancelado' | 'Retornou' | 'Entregue'
  total_amount: number
  total_discount: number
  net_amount: number
  notes: string | null
  delivery_date: string | null
  frete?: number
  seguro?: number
  outras_despesas?: number
  carrier_id?: string | null
  volume_qty?: number | null
  volume_species?: string | null
  gross_weight?: number | null
  net_weight?: number | null
  obs_internas?: string | null
  obs_fisco?: string | null
  obs_contribuinte?: string | null
  operacao_fiscal?: string | null
  forma_pagamento?: string | null
  condicao_frete?: string | null
  created_at: string
  updated_at: string
  
  customer?: Customer
  sales_rep?: SalesRep
  payment_condition?: PaymentCondition
  price_table?: PriceTable
  carrier?: Carrier
  items?: SalesOrderItem[]
  order_group?: OrderGroup
}

export interface Carrier {
  id: string
  company_id: string
  document: string
  legal_name: string
  fantasy_name?: string | null
  ie?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  cep?: string | null
  ibge_code?: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface AccountReceivable {
  id: string
  company_id: string
  customer_id: string
  sales_order_id: string
  installment_number: number
  amount: number
  due_date: string
  status: 'pendente' | 'boleto_emitido' | 'aguardando_pagamento' | 'pago' | 'vencido' | 'cancelado'
  payment_method: string
  paid_amount?: number
  paid_at?: string
  bank_transaction_id?: string
  bank_slip_barcode?: string
  bank_slip_digitable_line?: string
  bank_slip_url?: string
  created_at: string
  updated_at: string
  
  customer?: Customer
  sales_order?: SalesOrder
}

export interface BankIntegration {
  id: string
  company_id: string
  provider: string
  is_active: boolean
  webhook_secret?: string
  created_at: string
  updated_at: string
}

export interface OrderGroup {
  id: string
  company_id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface SalesOrderItem {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_percent: number
  net_price: number
  total_price: number
  created_at: string
  cfop?: string | null
  csosn?: string | null
  cst?: string | null
  pis_cst?: string | null
  pis_rate?: number | null
  cofins_cst?: string | null
  cofins_rate?: number | null
  icms_rate?: number | null
  ipi_rate?: number | null
  ncm?: string | null
  cest?: string | null
  origin?: string | null
  
  product?: Product
}

export interface CustomerEquipment {
  id: string
  customer_id: string
  company_id: string
  description: string
  serial_number: string | null
  delivered_at: string | null
  returned_at: string | null
  status: 'active' | 'returned'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  company_id: string
  code: string
  external_code?: string
  factory_code?: string
  description: string
  unit_measure?: string
  group_name?: string
  stock: number
  reserved_stock?: number
  maxiprod_id?: number | null
  min_stock_alert?: number
  batch?: string
  unit_weight?: number
  box_quantity?: number
  ncm?: string | null
  cest?: string | null
  origin?: string | null
  net_weight?: number | null
  gross_weight?: number | null
  ipi_rate?: number | null
  fci?: string | null
  gtin?: string | null
  gtin_tributable?: string | null
  complementary_description?: string | null
  notes?: string | null
  technical_notes?: string | null
  cfop?: string | null
  csosn?: string | null
  cst?: string | null
  pis_cst?: string | null
  cofins_cst?: string | null
  icms_rate?: number | null
  active?: boolean
  is_promotion?: boolean | null
  is_highlight?: boolean | null
  created_at: string
  
  // Novas propriedades (Mega Formulário)
  origin_type?: string | null
  integer_quantity?: boolean | null
  photo_url?: string | null
  abbreviation?: string | null
  quantity_per_volume?: number | null
  sales_unit?: string | null
  sales_unit_factor?: number | null
  purchase_unit?: string | null
  purchase_unit_factor?: number | null
  sales_quantity_calculation_method?: string | null
  scale_min_weight?: number | null
  scale_max_weight?: number | null
  scale_tare?: number | null
  scale_quantity_method?: string | null
  purchase_price?: number | null
  sellable?: boolean | null
  sales_price?: number | null
  min_sales_price?: number | null
  min_sellable_batch?: number | null
  multiple_sellable_batch?: number | null
  integrate_ecommerce?: boolean | null
  service_code?: string | null
  nbs?: string | null
  service_type?: string | null
  income_nature?: string | null
  anvisa_code?: string | null
  accounting_type?: string | null
  fiscal_notes?: string | null
  max_consumer_price?: number | null
  icms_st_base_ret?: number | null
  icms_st_value_ret?: number | null
  icms_fcp_st_base_ret?: number | null
  icms_fcp_st_value_ret?: number | null
  icms_substitute_value?: number | null
  consumer_supported_rate?: number | null
  icms_fcp_st_rate_ret?: number | null
  icms_percentual_reducao_bc?: number | null
  icms_percentual_diferimento?: number | null
  fiscal_gender?: string | null
  asset_identification?: string | null
  anp_code?: string | null
  fci_percentage?: number | null
  fci_cost?: number | null
  suframa_process?: string | null
  storage_by?: string | null
  stock_address?: string | null
  inspection_method?: string | null
  write_off_method?: string | null
  reorder_point?: number | null
  min_batch?: number | null
  multiple_batch?: number | null
  is_stock_item?: boolean | null
  validity_days?: number | null
  acquisition_deadline_days?: number | null
  internal_receipt_deadline_days?: number | null
  drawing_path?: string | null
  drawing_revision?: string | null
  budget_cost?: number | null
  markup_percentage?: number | null
}

export interface FiscalOperation {
  id: string
  company_id: string
  name: string
  code?: string
  description?: string
  nature_of_operation?: string
  observations?: string
  cfop_intra: string
  cfop_inter: string
  
  // Aba 2
  serie?: string
  finality?: string
  consumer_final?: boolean
  use_consumption?: boolean
  buyer_presence?: string
  payment_form?: string
  freight_condition?: string
  iss_incidence_local?: string
  nfse_operation_indicator?: string
  freight_info?: string
  insurance_info?: string
  other_expenses_info?: string
  discount_info?: string
  fiscal_document?: string
  document_situation?: string
  efd_icms_ipi?: string
  init_ie_st?: boolean
  overwrite_reason_social?: string
  inform_simples_nacional_rate?: boolean
  
  // Informações adicionais
  internal_observations?: string
  fisco_info?: string
  contribuinte_info?: string
  include_customer_order?: boolean
  include_total_taxes?: boolean
  include_additional_customer_info?: boolean
  include_ibs_cbs?: boolean
  
  // Aba 3
  with_payment?: boolean
  payment_debit_account?: string
  payment_finality?: string
  payment_credit_cost_center?: string
  
  move_stock?: boolean
  stock_origin?: string
  stock_destination?: string
  
  operation_type?: string
  special_category?: string
  future_delivery_operation?: boolean
  accounting_value?: boolean
  generate_b020?: boolean
  generate_traceability_group?: boolean
  uf_fiscal_benefit_code?: string
  installments_indicator?: string
  relevant_scale_produced?: string
  
  has_tax_reform_taxes?: boolean
  mobile_good_supply_indicator?: boolean
  
  item_exceptions?: any
  
  add_customer_order_to_product?: boolean
  add_batch_data_to_product?: boolean
  add_qty_unit_data_to_product?: boolean
  add_original_note_data_to_product?: boolean
  concat_product_info_nfse?: boolean
  
  accounting_history?: string
  generate_additional_launches_item?: boolean
  generate_additional_launches_stock?: boolean
  
  usage?: string
  item_type?: string
  init_unit_value_stock?: string
  init_unit_value_outsource?: string
  permit_referenced_nf?: boolean
  permit_unit_value_lower_min?: boolean
  item_receives_apportion?: boolean
  
  // Aba 4 (Legacy + JSONB)
  csosn?: string | null
  cst?: string | null
  icms_rate?: number
  ipi_rate?: number
  pis_rate?: number
  cofins_rate?: number
  tax_initialization?: any

  default_message?: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface RelatedCode {
  id: string
  product_id: string
  barcode: string
  multiplier: number // e.g., DUN14 = 12 units
  label: string
}

export interface Operation {
  id: string
  company_id: string
  type: OperationType
  status: OperationStatus
  load_number?: string
  client_name?: string
  clients?: string[]
  driver_name?: string
  vehicle_plate?: string
  notes?: string
  created_at: string
  completed_at?: string
  created_by?: string
}

export interface OperationItem {
  id: string
  company_id: string
  operation_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: ItemStatus
  system_stock_at_load?: number
  physical_verification?: 'pending' | 'really_zero' | 'found'
  physical_divergence_found?: boolean
  divergence_resolved?: boolean
}

export interface OperationAlert {
  id: string
  company_id: string
  operation_id: string
  product_id?: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  quantity_missing: number
  resolved: boolean
  created_at: string
  operation?: {
    load_number?: string
    driver_name?: string
  }
}

export interface ScanLog {
  id: string
  operation_id: string
  item_id: string
  barcode: string
  quantity: number
  operator_id: string
  scanned_at: string
}

export interface WarehouseSector {
  id: string
  name: string
  areas: WarehouseArea[]
}

export interface WarehouseArea {
  id: string
  sector_id: string
  name: string
}

export interface AdhocCount {
  id: string
  count_number: string
  user_name: string
  status: 'in_progress' | 'completed'
  created_at: string
}

export interface AdhocCountItem {
  id: string
  count_id: string
  product_code: string
  description: string
  group_category?: string
  quantity: number
  extra_info?: string | null
  created_at: string
  updated_at: string
}

export interface InventoryCount {
  id: string
  count_number: string
  user_name: string
  status: 'in_progress' | 'completed' | 'adjusted'
  authorized_by?: string
  authorized_at?: string
  created_at: string
}

export interface InventoryCountItem {
  id: string
  inventory_id: string
  product_code: string
  description: string
  group_category?: string
  quantity_counted: number
  quantity_system: number
  status: 'ok' | 'divergent' | 'missing' | 'excess'
  created_at: string
  updated_at: string
}

export interface PlannedInventory {
  id: string
  name: string
  status: 'planning' | 'in_progress' | 'completed'
  company_id: string
  collection_rule: 'any' | 'registered_only' | 'confirm_unknown'
  divergence_rule: 'ignore_uncollected' | 'zero_uncollected'
  created_at: string
  updated_at: string
}

export interface PlannedInventorySector {
  id: string
  inventory_id: string
  name: string
  created_at: string
}

export interface PlannedInventoryArea {
  id: string
  inventory_id: string
  sector_id?: string
  area_number?: number
  name: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface PlannedInventoryCount {
  id: string
  inventory_id: string
  area_id: string
  product_code: string
  quantity: number
  extra_info?: string | null
  user_name: string
  created_at: string
  updated_at: string
}

export interface DeliveryRoute {
  id: string
  company_id: string
  operation_id: string
  driver_id: string
  helper_id?: string
  title?: string
  scheduled_date?: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface DeliveryClient {
  id: string
  company_id: string
  delivery_route_id: string
  customer_id?: string | null
  name: string
  order_number?: string
  address?: string
  phone?: string
  notes?: string
  latitude?: number | null
  longitude?: number | null
  status: 'pending' | 'waiting' | 'delivered' | 'delivered_with_divergence' | 'canceled' | 'returned'
  signature_data?: string
  receiver_name?: string
  receiver_doc?: string
  return_reason?: string
  signed_at?: string
  delivery_sequence?: number
  nfe_access_key?: string
  created_at: string
}

export interface DeliveryItem {
  id: string
  company_id: string
  delivery_client_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: 'pending' | 'ok' | 'divergent'
  approval_status?: 'approved' | 'pending' | 'rejected'
  returned_to_stock?: boolean
  requested_qty?: number
  return_reason?: string
  requested_by_name?: string
  created_at: string
}

export interface Equipment {
  id: string
  company_id: string
  patrimony: string
  type: string
  model: string
  size: string | null
  voltage: string | null
  notes: string | null
  status: 'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente' | 'Equipamento de Estoque'
  current_customer_id: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface EquipmentOrder {
  id: string
  os_number: number
  company_id: string
  customer_id: string | null
  equipment_id: string
  delivery_route_id?: string | null
  delivery_sequence?: number
  type: 'entrega' | 'recolha' | 'troca' | 'manutencao'
  status: 'chamado' | 'pendente' | 'em_rota' | 'concluido' | 'cancelado'
  driver_id: string | null
  scheduled_date: string | null
  completed_at: string | null
  signature_data: string | null
  term_pdf_url: string | null
  receiver_name: string | null
  receiver_doc: string | null
  notes: string | null
  defect_description: string | null
  solution_description: string | null
  action_taken: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  equipment?: Equipment
  driver?: User
}

export interface Supply {
  id: string
  company_id: string
  name: string
  unit: string
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface SupplyRequest {
  id: string
  company_id: string
  mechanic_id: string
  supply_id: string
  quantity_requested: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  notes: string | null
  created_at: string
  updated_at: string
  mechanic?: User
  supply?: Supply
}

export interface EquipmentOrderSupply {
  id: string
  order_id: string
  supply_id: string
  quantity_consumed: number
  created_at: string
  supply?: Supply
}

export interface EquipmentHistory {
  id: string
  company_id: string
  equipment_id: string
  customer_id: string | null
  action: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface InventoryCountItem {
  id: string
  inventory_id: string
  product_code: string
  description: string
  group_category?: string
  quantity_counted: number
  quantity_system: number
  status: 'ok' | 'divergent' | 'missing' | 'excess'
  created_at: string
  updated_at: string
}

export interface PlannedInventory {
  id: string
  name: string
  status: 'planning' | 'in_progress' | 'completed'
  company_id: string
  collection_rule: 'any' | 'registered_only' | 'confirm_unknown'
  divergence_rule: 'ignore_uncollected' | 'zero_uncollected'
  created_at: string
  updated_at: string
}

export interface PlannedInventorySector {
  id: string
  inventory_id: string
  name: string
  created_at: string
}

export interface PlannedInventoryArea {
  id: string
  inventory_id: string
  sector_id?: string
  area_number?: number
  name: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface PlannedInventoryCount {
  id: string
  inventory_id: string
  area_id: string
  product_code: string
  quantity: number
  extra_info?: string | null
  user_name: string
  created_at: string
  updated_at: string
}

export interface DeliveryRoute {
  id: string
  company_id: string
  operation_id: string
  driver_id: string
  helper_id?: string
  title?: string
  scheduled_date?: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface DeliveryClient {
  id: string
  company_id: string
  delivery_route_id: string
  customer_id?: string | null
  name: string
  order_number?: string
  address?: string
  phone?: string
  notes?: string
  latitude?: number | null
  longitude?: number | null
  status: 'pending' | 'waiting' | 'delivered' | 'delivered_with_divergence' | 'canceled' | 'returned'
  signature_data?: string
  receiver_name?: string
  receiver_doc?: string
  return_reason?: string
  signed_at?: string
  delivery_sequence?: number
  created_at: string
}

export interface DeliveryItem {
  id: string
  company_id: string
  delivery_client_id: string
  product_id: string
  product_code: string
  description: string
  quantity_expected: number
  quantity_scanned: number
  status: 'pending' | 'ok' | 'divergent'
  approval_status?: 'approved' | 'pending' | 'rejected'
  returned_to_stock?: boolean
  requested_qty?: number
  return_reason?: string
  requested_by_name?: string
  created_at: string
}

export interface Equipment {
  id: string
  company_id: string
  patrimony: string
  type: string
  model: string
  size: string | null
  voltage: string | null
  notes: string | null
  status: 'Teste' | 'Disponível' | 'Em Manutenção' | 'Danificado' | 'No Cliente' | 'Equipamento de Estoque'
  current_customer_id: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface EquipmentOrder {
  id: string
  os_number: number
  company_id: string
  customer_id: string | null
  equipment_id: string
  delivery_route_id?: string | null
  delivery_sequence?: number
  type: 'entrega' | 'recolha' | 'troca' | 'manutencao'
  status: 'chamado' | 'pendente' | 'em_rota' | 'concluido' | 'cancelado'
  driver_id: string | null
  scheduled_date: string | null
  completed_at: string | null
  signature_data: string | null
  term_pdf_url: string | null
  receiver_name: string | null
  receiver_doc: string | null
  notes: string | null
  defect_description: string | null
  solution_description: string | null
  action_taken: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  equipment?: Equipment
  driver?: User
}

export interface Supply {
  id: string
  company_id: string
  name: string
  unit: string
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface SupplyRequest {
  id: string
  company_id: string
  mechanic_id: string
  supply_id: string
  quantity_requested: number
  status: 'pendente' | 'aprovado' | 'rejeitado'
  notes: string | null
  created_at: string
  updated_at: string
  mechanic?: User
  supply?: Supply
}

export interface EquipmentOrderSupply {
  id: string
  order_id: string
  supply_id: string
  quantity_consumed: number
  created_at: string
  supply?: Supply
}

export interface EquipmentHistory {
  id: string
  company_id: string
  equipment_id: string
  customer_id: string | null
  action: string
  notes: string | null
  created_by: string | null
  created_at: string
  customer?: Customer
  user?: User
  equipment?: Equipment
}

export interface Driver {
  id: string
  company_id: string
  name: string
  cpf: string
  cnh?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface Vehicle {
  id: string
  company_id: string
  plate: string
  uf: string
  renavam?: string
  description: string
  transport_unit_type?: string
  owner_type?: string
  owner_rntrc?: string
  tara_kg?: number
  capacity_kg?: number
  capacity_m3?: number
  body_type?: string
  wheel_type?: string
  owner_name?: string
  owner_document?: string
  active: boolean
  created_at?: string
  updated_at?: string
}


export interface FocusWebhookLog {
  id: string
  company_id: string
  focus_reference: string
  event_type: string
  payload: any
  processed: boolean
  created_at: string
}