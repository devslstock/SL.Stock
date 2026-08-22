import type { AuditedTable, AuditLog } from '@/types/database'

// Campos ignorados na comparação (não são "mudanças" relevantes pro usuário final)
const IGNORED_FIELDS = new Set(['updated_at', 'created_at', 'id'])

// Rótulo amigável por tabela+campo, só pros campos que valem a pena destacar na lista
const FIELD_LABELS: Partial<Record<AuditedTable, Record<string, string>>> = {
  products: {
    stock: 'Estoque',
    sales_price: 'Preço',
    description: 'Descrição',
    active: 'Ativo',
    min_stock_alert: 'Estoque mínimo',
  },
  customers: {
    legal_name: 'Razão social',
    fantasy_name: 'Nome fantasia',
    credit_limit: 'Limite de crédito',
    active: 'Ativo',
    phone1: 'Telefone',
    email: 'E-mail',
    address: 'Endereço',
  },
  sales_orders: {
    status: 'Status do pedido',
    total_amount: 'Valor total',
    delivery_date: 'Data de entrega',
    notes: 'Observações',
  },
  sales_order_items: {
    quantity: 'Quantidade',
    unit_price: 'Preço unitário',
    discount_percent: 'Desconto (%)',
  },
  price_tables: {
    name: 'Nome',
    active: 'Ativo',
  },
  price_table_items: {
    price: 'Preço',
    discount_percent: 'Desconto (%)',
  },
  receipt_methods: {
    name: 'Nome',
    bank: 'Banco',
    agency: 'Agência',
    account_number: 'Conta',
    active: 'Ativo',
  },
  accounts_receivable: {
    status: 'Status',
    amount: 'Valor',
    due_date: 'Vencimento',
    paid_amount: 'Valor pago',
  },
  users: {
    name: 'Nome',
    role: 'Cargo',
    active: 'Ativo',
    permissions: 'Permissões',
  },
  companies: {
    name: 'Nome',
    active: 'Ativo',
    plan: 'Plano',
    monthly_fee: 'Mensalidade',
  },
}

// Campo usado como "nome" de exibição do registro, por tabela
const RECORD_LABEL_FIELDS: Partial<Record<AuditedTable, string[]>> = {
  products: ['description'],
  customers: ['legal_name', 'fantasy_name'],
  sales_orders: ['order_number'],
  price_tables: ['name'],
  receipt_methods: ['name'],
  users: ['name'],
  companies: ['name'],
}

function getRecordLabel(table: AuditedTable, data: Record<string, any> | null): string {
  if (!data) return 'Registro'
  const fields = RECORD_LABEL_FIELDS[table]
  if (fields) {
    for (const f of fields) {
      if (data[f]) return String(data[f])
    }
  }
  return data.id ? `#${String(data.id).slice(0, 8)}` : 'Registro'
}

function formatValue(table: AuditedTable, field: string, value: any): string {
  if (value === null || value === undefined || value === '') return 'vazio'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (table === 'products' && field === 'stock') return `${value}un`
  if (typeof value === 'number') return String(value)
  return String(value)
}

/**
 * Resume uma linha de audit_log em texto legível, ex:
 * `Estoque "Produto X": anterior 5un → atual 1un`
 */
export function summarizeAuditChange(log: AuditLog): string {
  const table = log.table_name
  const label = getRecordLabel(table, log.new_data || log.old_data)

  if (log.action === 'INSERT') return `"${label}" criado`
  if (log.action === 'DELETE') return `"${label}" excluído`

  const oldData = log.old_data || {}
  const newData = log.new_data || {}
  const labels = FIELD_LABELS[table] || {}

  const changedFields = Object.keys({ ...oldData, ...newData }).filter(
    (key) => !IGNORED_FIELDS.has(key) && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
  )

  if (changedFields.length === 0) return `"${label}" atualizado`

  if (changedFields.length > 3) {
    return `"${label}": ${changedFields.length} campos alterados`
  }

  const parts = changedFields.map((field) => {
    const fieldLabel = labels[field] || field
    return `${fieldLabel}: anterior ${formatValue(table, field, oldData[field])} → atual ${formatValue(table, field, newData[field])}`
  })

  return `"${label}" — ${parts.join(', ')}`
}
