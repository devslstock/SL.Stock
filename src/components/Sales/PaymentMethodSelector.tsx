import { useQuery } from '@tanstack/react-query'
import { receiptMethodsApi } from '@/api/receiptMethods'
import { FORMA_PAGAMENTO_OPTIONS, MEIO_PAGAMENTO_BY_FORMA } from '@/utils/paymentMethods'
import type { SalesOrder } from '@/types/database'

type PaymentMethodFields = Pick<SalesOrder, 'forma_pagamento' | 'meio_pagamento' | 'receipt_method_id'>

interface PaymentMethodSelectorProps {
  companyId: string
  formaPagamento: string | null | undefined
  meioPagamento: string | null | undefined
  receiptMethodId: string | null | undefined
  onChange: (updates: Partial<PaymentMethodFields>) => void
}

export function PaymentMethodSelector({ companyId, formaPagamento, meioPagamento, receiptMethodId, onChange }: PaymentMethodSelectorProps) {
  const { data: receiptMethods = [] } = useQuery({
    queryKey: ['receipt_methods', companyId],
    queryFn: () => receiptMethodsApi.getReceiptMethods(companyId),
    enabled: !!companyId,
  })

  const meioOptions = formaPagamento ? MEIO_PAGAMENTO_BY_FORMA[formaPagamento] || [] : []
  const selectedMeio = meioOptions.find(m => m.code === meioPagamento)

  const activeReceiptMethods = receiptMethods.filter(rm => rm.status === 'Ativo' && rm.is_receivable !== false)
  const bankOptions = selectedMeio && selectedMeio.receiptMethodTypes.length > 0
    ? activeReceiptMethods.filter(rm => rm.payment_method && selectedMeio.receiptMethodTypes.includes(rm.payment_method))
    : activeReceiptMethods

  const showBankSelect = !!meioPagamento && meioPagamento !== '90'

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <select
        className="h-7 text-[13px] border rounded px-1 w-32 bg-background"
        value={formaPagamento || ''}
        onChange={e => onChange({ forma_pagamento: e.target.value || null, meio_pagamento: null, receipt_method_id: null })}
      >
        <option value="">Selecione...</option>
        {FORMA_PAGAMENTO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <select
        className="h-7 text-[13px] border rounded px-1 w-48 bg-background"
        value={meioPagamento || ''}
        onChange={e => onChange({ meio_pagamento: e.target.value || null, receipt_method_id: null })}
        disabled={!formaPagamento}
      >
        <option value="">Selecione...</option>
        {meioOptions.map(opt => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
      </select>

      {showBankSelect && (
        <select
          className="h-7 text-[13px] border rounded px-1 w-64 bg-background"
          value={receiptMethodId || ''}
          onChange={e => onChange({ receipt_method_id: e.target.value || null })}
        >
          <option value="">Selecione a conta/banco...</option>
          {bankOptions.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
        </select>
      )}
    </div>
  )
}
