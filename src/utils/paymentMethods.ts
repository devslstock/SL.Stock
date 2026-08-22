export const FORMA_PAGAMENTO_OPTIONS = ['A prazo', 'À vista', 'Outros'] as const

export interface MeioPagamentoOption {
  code: string // código tPag da NFe
  label: string
  receiptMethodTypes: string[] // valores compatíveis de receipt_methods.payment_method
}

export const MEIO_PAGAMENTO_BY_FORMA: Record<string, MeioPagamentoOption[]> = {
  'A prazo': [
    { code: '15', label: 'Boleto bancário', receiptMethodTypes: ['Boleto (com registro)', 'Boleto (sem registro)'] },
    { code: '03', label: 'Cartão de crédito', receiptMethodTypes: ['Cartão de crédito', 'Cielo (Super Link)', 'SafraPay (Link)'] },
    { code: '02', label: 'Cheque', receiptMethodTypes: ['Cheque'] },
  ],
  'À vista': [
    { code: '01', label: 'Dinheiro', receiptMethodTypes: ['Dinheiro'] },
    { code: '17', label: 'PIX', receiptMethodTypes: ['PIX'] },
    { code: '18', label: 'TED / Transferência bancária', receiptMethodTypes: ['Depósito', 'Débito em conta'] },
    { code: '02', label: 'Cheque', receiptMethodTypes: ['Cheque'] },
    { code: '04', label: 'Cartão de débito', receiptMethodTypes: ['Débito em conta', 'Cielo (Super Link)', 'SafraPay (Link)'] },
  ],
  'Outros': [
    { code: '90', label: 'Sem pagamento', receiptMethodTypes: [] },
    { code: '99', label: 'Outros', receiptMethodTypes: [] },
  ],
}
