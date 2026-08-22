import { useState, useEffect } from 'react'
import { X, Save, Search, Building2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { receiptMethodsApi } from '@/api/receiptMethods'
import { BRAZILIAN_BANKS } from '@/utils/banks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import type { ReceiptMethod } from '@/types/database'

interface Props {
  isOpen: boolean
  onClose: () => void
  methodToEdit: ReceiptMethod | null
}

const PAYMENT_METHODS = [
  'Dinheiro',
  'Cheque',
  'Depósito',
  'Boleto (sem registro)',
  'Boleto (com registro)',
  'PIX',
  'Débito em conta',
  'Cartão de crédito',
  'Cartão de débito',
  'Carteira',
  'Cielo (Super Link)',
  'SafraPay (Link)',
  'Remessa para pagamento'
]

export function ReceiptMethodFormModal({ isOpen, onClose, methodToEdit }: Props) {
  const { company } = useAuth()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Partial<ReceiptMethod>>({
    name: 'Nova Conta',
    payment_method: 'Boleto (com registro)',
    status: 'Ativo',
    is_receivable: true,
    is_payable: false,
    bank: '',
    agency: '',
    account_number: '',
    account_digit: '',
    accounting_account: '',
    financial_institution: '',
    portfolio: '',
    payment_location: '',
    agreement_code: '',
    contract_number: '',
    fine_after_due: 0,
    fine_type: '%',
    interest_after_due: 0,
    interest_type: '% ao mês',
    protest_days: 0,
    protest_action: 'Protestar',
    grant_discount: false,
    remittance_environment: 'Teste',
    integration_type: 'CNAB 240',
    liquidation_date_type: 'Data de liquidação de títulos (arquivo retorno/WebService)',
    credit_date_type: 'Data de crédito',
    next_slip_number: 1,
    next_remittance_number: 1,
    generate_nfe_record: false,
    confirmed_with_manager: false,
    sum_tariff_on_return: false,
    gateway_provider: '',
    bb_client_id: '',
    bb_client_secret: '',
    bb_app_key: '',
    sicoob_client_id: '',
    sicoob_certificate_pfx_base64: '',
    sicoob_certificate_password: '',
    pix_key: '',
    validation_credential_1: '',
    validation_credential_2: '',
    pix_validity_hours: 0,
    link_validity_days: 0,
    max_installments: 0,
    show_product_description: false
  })

  useEffect(() => {
    if (methodToEdit) {
      setFormData({
        ...methodToEdit,
        payment_method: methodToEdit.payment_method || methodToEdit.type || 'Dinheiro'
      })
    }
  }, [methodToEdit])

  const createMutation = useMutation({
    mutationFn: (data: Omit<ReceiptMethod, 'id' | 'created_at' | 'updated_at'>) => receiptMethodsApi.createReceiptMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_methods'] })
      toast.success('Forma de recebimento cadastrada!')
      onClose()
    },
    onError: (error: unknown) => toast.error(`Erro: ${getErrorMessage(error)}`)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ReceiptMethod>) => receiptMethodsApi.updateReceiptMethod(methodToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_methods'] })
      toast.success('Cadastro atualizado!')
      onClose()
    },
    onError: (error: unknown) => toast.error(`Erro: ${getErrorMessage(error)}`)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = { ...formData }
    if (!dataToSubmit.name) {
       dataToSubmit.name = `${dataToSubmit.payment_method} - ${dataToSubmit.bank || 'Nova Conta'}`
    }

    if (methodToEdit) {
      updateMutation.mutate(dataToSubmit as ReceiptMethod)
    } else {
      createMutation.mutate({
        ...dataToSubmit,
        company_id: company!.id,
      } as Omit<ReceiptMethod, 'id' | 'created_at' | 'updated_at'>)
    }
  }

  if (!isOpen) return null

  const isBoletoComRegistro = formData.payment_method === 'Boleto (com registro)'
  const isPix = formData.payment_method === 'PIX'
  const isDeposito = formData.payment_method === 'Depósito'
  const isDebito = formData.payment_method === 'Débito em conta'
  const isCieloOuSafra = formData.payment_method === 'Cielo (Super Link)' || formData.payment_method === 'SafraPay (Link)'
  const isCheque = formData.payment_method === 'Cheque'

  const showBank = isBoletoComRegistro || isPix || isDeposito || isDebito || isCieloOuSafra || isCheque
  const showInstFinanceira = isBoletoComRegistro || isPix || isDeposito || isDebito
  const showAgenciaConta = isBoletoComRegistro || isDeposito || isDebito || isCieloOuSafra || isCheque || isPix

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/80">
          <h2 className="text-xl font-bold text-gray-900">
            {methodToEdit ? 'Editar forma de cobrança e conta bancária' : 'Nova forma de cobrança e conta bancária'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-700 bg-white">
          <form id="receipt-method-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Settings Card */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-4">
              <div className="flex flex-wrap items-center gap-6 pb-2 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={formData.is_receivable} 
                    onChange={e => setFormData({ ...formData, is_receivable: e.target.checked })} 
                  /> 
                  <span className="font-medium text-gray-900">Contas a receber</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={formData.is_payable} 
                    onChange={e => setFormData({ ...formData, is_payable: e.target.checked })} 
                  /> 
                  <span className="font-medium text-gray-900">Contas a pagar</span>
                </label>
                <label className="flex items-center gap-2 ml-auto cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={formData.status === 'Ativo'} 
                    onChange={e => setFormData({ ...formData, status: e.target.checked ? 'Ativo' : 'Inativo' })} 
                  /> 
                  <span className="font-medium text-gray-900">Ativa</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meio de pagamento</label>
                  <select 
                    className="w-full h-10 border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.payment_method || ''}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conta contábil *</label>
                  <div className="relative">
                    <Input 
                      required
                      className="w-full pr-10" 
                      placeholder="Ex: Banco Corrente"
                      value={formData.accounting_account || ''}
                      onChange={e => setFormData({ ...formData, accounting_account: e.target.value })}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Banking Details Card */}
            {(showBank || showInstFinanceira || showAgenciaConta) && (
              <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Dados Bancários
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showBank && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banco {isCieloOuSafra && '*'}</label>
                      <div className="relative">
                        <Input 
                          required={isCieloOuSafra}
                          className="w-full pr-10" 
                          placeholder="Ex: 001 - Banco do Brasil"
                          value={formData.bank || ''}
                          onChange={e => setFormData({ ...formData, bank: e.target.value })}
                          list="brazilian-banks"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <datalist id="brazilian-banks">
                          {BRAZILIAN_BANKS.map(b => (
                            <option key={b.code} value={`${b.code} - ${b.name}`} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  )}

                  {showInstFinanceira && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instituição financeira</label>
                      <div className="relative">
                        <Input 
                          className="w-full pr-10" 
                          value={formData.financial_institution || ''}
                          onChange={e => setFormData({ ...formData, financial_institution: e.target.value })}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {showAgenciaConta && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência {isBoletoComRegistro || isDeposito || isDebito ? '*' : ''}</label>
                        <div className="flex gap-2">
                          <Input 
                            required={isBoletoComRegistro || isDeposito || isDebito}
                            className="flex-1" 
                            placeholder="Número"
                            value={formData.agency || ''}
                            onChange={e => setFormData({ ...formData, agency: e.target.value })}
                          />
                          <span className="text-gray-400 self-center">-</span>
                          <Input 
                            className="w-16 text-center" 
                            placeholder="Dígito"
                            value={formData.account_digit || ''}
                            onChange={e => setFormData({ ...formData, account_digit: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta {isPix ? '*' : ''}</label>
                        <div className="flex gap-2">
                          <Input 
                            required={isPix}
                            className="flex-1" 
                            placeholder="Número"
                            value={formData.account_number || ''}
                            onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                          />
                          <span className="text-gray-400 self-center">-</span>
                          <Input 
                            className="w-16 text-center" 
                            placeholder="Dígito"
                            value={formData.account_digit || ''}
                            onChange={e => setFormData({ ...formData, account_digit: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PIX Settings */}
            {isPix && (
              <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100 space-y-4">
                <h3 className="font-semibold text-emerald-900 border-b border-emerald-100 pb-3 mb-4">Configurações PIX</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave do PIX *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      placeholder="Sua chave (CPF, CNPJ, Email, etc)"
                      value={formData.pix_key || ''}
                      onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credencial de validação 1 *</label>
                      <Input 
                        required
                        className="w-full bg-white" 
                        value={formData.validation_credential_1 || ''}
                        onChange={e => setFormData({ ...formData, validation_credential_1: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credencial de validação 2 *</label>
                      <Input 
                        required
                        className="w-full bg-white" 
                        value={formData.validation_credential_2 || ''}
                        onChange={e => setFormData({ ...formData, validation_credential_2: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo padrão da validade da cobrança PIX (em horas) *</label>
                    <Input 
                      type="number"
                      required
                      className="w-32 bg-white" 
                      value={formData.pix_validity_hours || ''}
                      onChange={e => setFormData({ ...formData, pix_validity_hours: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cielo / SafraPay Settings */}
            {isCieloOuSafra && (
              <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-semibold text-blue-900 border-b border-blue-100 pb-3 mb-4">Integração Cartão/Link</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credencial de validação 1 *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      value={formData.validation_credential_1 || ''}
                      onChange={e => setFormData({ ...formData, validation_credential_1: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credencial de validação 2 *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      value={formData.validation_credential_2 || ''}
                      onChange={e => setFormData({ ...formData, validation_credential_2: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de parcelas padrão</label>
                    <Input 
                      type="number"
                      className="w-full bg-white" 
                      value={formData.max_installments || ''}
                      onChange={e => setFormData({ ...formData, max_installments: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo padrão da validade do link (em dias)</label>
                    <Input 
                      type="number"
                      className="w-full bg-white" 
                      value={formData.link_validity_days || ''}
                      onChange={e => setFormData({ ...formData, link_validity_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      checked={formData.show_product_description} 
                      onChange={e => setFormData({ ...formData, show_product_description: e.target.checked })} 
                    /> 
                    <span className="text-gray-700">Ao gerar links para pagamento, mostrar a descrição do produto na tela de pagamento</span>
                  </label>
                </div>
              </div>
            )}

            {/* Boleto Settings */}
            {isBoletoComRegistro && (
              <div className="bg-orange-50/30 p-5 rounded-lg border border-orange-100 space-y-5">
                <h3 className="font-semibold text-orange-900 border-b border-orange-100 pb-3">Configurações de Boleto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carteira *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      value={formData.portfolio || ''}
                      onChange={e => setFormData({ ...formData, portfolio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local de pagamento *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      value={formData.payment_location || ''}
                      onChange={e => setFormData({ ...formData, payment_location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cód empresa/número do convênio *</label>
                    <Input 
                      required
                      className="w-full bg-white" 
                      value={formData.agreement_code || ''}
                      onChange={e => setFormData({ ...formData, agreement_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número do contrato</label>
                    <Input 
                      className="w-full bg-white" 
                      value={formData.contract_number || ''}
                      onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded border border-orange-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Multa após vencimento</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        className="w-24 text-right" 
                        value={formData.fine_after_due || 0}
                        onChange={e => setFormData({ ...formData, fine_after_due: Number(e.target.value) })}
                      />
                      <select 
                        className="flex-1 border border-gray-300 rounded-md px-3 outline-none focus:border-primary"
                        value={formData.fine_type || '%'}
                        onChange={e => setFormData({ ...formData, fine_type: e.target.value })}
                      >
                        <option value="%">%</option>
                        <option value="R$">R$</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Juro após vencimento</label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        className="w-24 text-right" 
                        value={formData.interest_after_due || 0}
                        onChange={e => setFormData({ ...formData, interest_after_due: Number(e.target.value) })}
                      />
                      <select 
                        className="flex-1 border border-gray-300 rounded-md px-3 outline-none focus:border-primary"
                        value={formData.interest_type || '% ao mês'}
                        onChange={e => setFormData({ ...formData, interest_type: e.target.value })}
                      >
                        <option value="% ao mês">% ao mês</option>
                        <option value="% ao dia">% ao dia</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ação após vencimento</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Após</span>
                      <Input 
                        type="number"
                        className="w-20 text-center bg-white" 
                        value={formData.protest_days || 0}
                        onChange={e => setFormData({ ...formData, protest_days: Number(e.target.value) })}
                      />
                      <span className="text-gray-600">dias</span>
                      <select 
                        className="flex-1 h-10 border border-gray-300 rounded-md px-3 bg-white outline-none focus:border-primary"
                        value={formData.protest_action || 'Protestar'}
                        onChange={e => setFormData({ ...formData, protest_action: e.target.value })}
                      >
                        <option value="Protestar">Protestar</option>
                        <option value="Devolver">Devolver</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3 border-t border-orange-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      checked={formData.grant_discount} 
                      onChange={e => setFormData({ ...formData, grant_discount: e.target.checked })} 
                    /> 
                    <span className="text-gray-700">Conceder desconto (%) para pagamentos até o vencimento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      checked={formData.generate_nfe_record} 
                      onChange={e => setFormData({ ...formData, generate_nfe_record: e.target.checked })} 
                    /> 
                    <span className="text-gray-700">Gerar registro de nota fiscal eletrônica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      checked={formData.sum_tariff_on_return} 
                      onChange={e => setFormData({ ...formData, sum_tariff_on_return: e.target.checked })} 
                    /> 
                    <span className="text-gray-700">Ao importar arquivo de retorno, somar valor da tarifa no valor recebido</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded border border-orange-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente de remessa</label>
                    <select 
                      className="w-full h-10 border border-gray-300 rounded-md px-3 outline-none focus:border-primary"
                      value={formData.remittance_environment || 'Teste'}
                      onChange={e => setFormData({ ...formData, remittance_environment: e.target.value })}
                    >
                      <option value="Teste">Teste</option>
                      <option value="Produção">Produção</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de integração *</label>
                    <select 
                      className="w-full h-10 border border-gray-300 rounded-md px-3 outline-none focus:border-primary"
                      value={formData.integration_type || 'CNAB 240'}
                      onChange={e => setFormData({ ...formData, integration_type: e.target.value })}
                    >
                      <option value="CNAB 240">CNAB 240</option>
                      <option value="CNAB 400">CNAB 400</option>
                      <option value="WebService">WebService</option>
                    </select>
                  </div>
                  {formData.integration_type === 'WebService' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provedor da integração *</label>
                      <select
                        required
                        className="w-full h-10 border border-gray-300 rounded-md px-3 bg-white outline-none focus:border-primary"
                        value={formData.gateway_provider || ''}
                        onChange={e => setFormData({ ...formData, gateway_provider: e.target.value || null })}
                      >
                        <option value="">Selecione...</option>
                        <option value="banco_do_brasil">Banco do Brasil</option>
                        <option value="sicoob">Sicoob</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-truncate" title="Data de liquidação de títulos (arquivo retorno/WebService)">
                      Data Liquidação (Retorno)
                    </label>
                    <select className="w-full h-10 border border-gray-300 bg-gray-50 rounded-md px-3 outline-none" disabled>
                      <option value="Data de crédito">Data de crédito</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próx. nosso número *</label>
                    <Input 
                      type="number"
                      required
                      className="w-full text-right" 
                      value={formData.next_slip_number || 1}
                      onChange={e => setFormData({ ...formData, next_slip_number: Number(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próx. num. remessa *</label>
                    <Input 
                      type="number"
                      required
                      className="w-full text-right" 
                      value={formData.next_remittance_number || 1}
                      onChange={e => setFormData({ ...formData, next_remittance_number: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {formData.integration_type === 'WebService' && formData.gateway_provider === 'banco_do_brasil' && (
                  <div className="bg-yellow-50/50 p-5 rounded-lg border border-yellow-200 space-y-4">
                    <h3 className="font-semibold text-yellow-900 border-b border-yellow-200 pb-3">Credenciais da API de Cobrança do Banco do Brasil</h3>
                    <p className="text-xs text-yellow-800">
                      Gere essas credenciais no Portal Developers BB, dentro da sua aplicação cadastrada para a API de Cobrança. Com isso preenchido e "confirmado com o gerente" marcado abaixo, os boletos dessa conta passam a ser emitidos automaticamente.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
                        <Input
                          required
                          className="w-full bg-white"
                          value={formData.bb_client_id || ''}
                          onChange={e => setFormData({ ...formData, bb_client_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret *</label>
                        <Input
                          required
                          type="password"
                          className="w-full bg-white"
                          value={formData.bb_client_secret || ''}
                          onChange={e => setFormData({ ...formData, bb_client_secret: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave do aplicativo (gw-dev-app-key) *</label>
                        <Input
                          required
                          type="password"
                          className="w-full bg-white"
                          value={formData.bb_app_key || ''}
                          onChange={e => setFormData({ ...formData, bb_app_key: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.integration_type === 'WebService' && formData.gateway_provider === 'sicoob' && (
                  <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-200 space-y-4">
                    <h3 className="font-semibold text-emerald-900 border-b border-emerald-200 pb-3">Credenciais da API de Cobrança do Sicoob</h3>
                    <p className="text-xs text-emerald-800">
                      Gere o Client ID e o certificado digital (.pfx) no Portal Developers Sicoob, dentro do aplicativo cadastrado para a API de Cobrança Bancária. Com isso preenchido e "confirmado com o gerente" marcado abaixo, os boletos dessa conta passam a ser emitidos automaticamente.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
                        <Input
                          required
                          className="w-full bg-white"
                          value={formData.sicoob_client_id || ''}
                          onChange={e => setFormData({ ...formData, sicoob_client_id: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha do certificado</label>
                        <Input
                          type="password"
                          className="w-full bg-white"
                          value={formData.sicoob_certificate_password || ''}
                          onChange={e => setFormData({ ...formData, sicoob_certificate_password: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificado digital (.pfx) {formData.sicoob_certificate_pfx_base64 ? <span className="text-emerald-600 font-normal">— já enviado, escolha outro arquivo só se quiser substituir</span> : '*'}
                        </label>
                        <input
                          type="file"
                          accept=".pfx,.p12"
                          className="w-full text-sm"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => {
                              const result = reader.result as string
                              setFormData(prev => ({ ...prev, sicoob_certificate_pfx_base64: result.split(',')[1] }))
                            }
                            reader.readAsDataURL(file)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 leading-relaxed flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    className="mt-1 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    checked={formData.confirmed_with_manager} 
                    onChange={e => setFormData({ ...formData, confirmed_with_manager: e.target.checked })} 
                  /> 
                  <span>
                    <strong>O gerente do meu banco confirmou</strong> que posso gerar boletos com esta conta bancária com as informações preenchidas nesta tela. 
                    Importante: após preencher as informações e clicar em Salvar, sugerimos que você homologue sua configuração de boleto. Crie receitas de valores baixos (abaixo de R$ 1,00), pague-as e verifique se o valor caiu corretamente.
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-6 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="receipt-method-form"
            className="bg-primary hover:bg-primary/90 text-white px-8 gap-2 shadow-sm"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

      </div>
    </div>
  )
}
