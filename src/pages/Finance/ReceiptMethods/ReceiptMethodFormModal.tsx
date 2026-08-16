import { useState, useEffect } from 'react'
import { X, Save, Search } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { receiptMethodsApi } from '@/api/receiptMethods'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
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
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ReceiptMethod>) => receiptMethodsApi.updateReceiptMethod(methodToEdit!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_methods'] })
      toast.success('Cadastro atualizado!')
      onClose()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Automatically set name if empty based on payment_method
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

  // Dinheiro shows almost nothing.
  const showBank = isBoletoComRegistro || isPix || isDeposito || isDebito || isCieloOuSafra || isCheque
  const showInstFinanceira = isBoletoComRegistro || isPix || isDeposito || isDebito
  const showAgenciaConta = isBoletoComRegistro || isDeposito || isDebito || isCieloOuSafra || isCheque || isPix

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f0f0f0] rounded-sm shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-gray-400">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-gray-100 to-gray-200 border-b border-gray-300">
          <h2 className="text-sm text-gray-700">
            {methodToEdit ? 'Editar forma de cobrança e conta bancária' : 'Formas de cobrança e contas bancárias'}
          </h2>
          <div className="flex gap-1">
            <button className="text-gray-500 hover:text-gray-700">?</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-2">×</button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 text-[11px] text-gray-800 bg-white m-1 border border-gray-300">
          <form id="receipt-method-form" onSubmit={handleSubmit} className="space-y-2.5">
            
            {/* Top Checkboxes */}
            <div className="flex items-center gap-6 pb-2">
              <label className="flex items-center gap-1 font-semibold">
                <input 
                  type="checkbox" 
                  checked={formData.is_receivable} 
                  onChange={e => setFormData({ ...formData, is_receivable: e.target.checked })} 
                /> 
                Contas a receber
              </label>
              <label className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  checked={formData.is_payable} 
                  onChange={e => setFormData({ ...formData, is_payable: e.target.checked })} 
                /> 
                Contas a pagar
              </label>
              <label className="flex items-center gap-1 ml-auto font-semibold">
                <input 
                  type="checkbox" 
                  checked={formData.status === 'Ativo'} 
                  onChange={e => setFormData({ ...formData, status: e.target.checked ? 'Ativo' : 'Inativo' })} 
                /> 
                Ativa
              </label>
            </div>

            {/* Meio de Pagamento */}
            <div className="flex items-center">
              <label className="w-32">Meio de pagamento</label>
              <select 
                className="w-48 border border-gray-400 px-1 py-0.5 rounded-sm"
                value={formData.payment_method || ''}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Campos Dinâmicos Básicos */}
            {showBank && (
              <div className="flex items-center">
                <label className="w-32">Banco{isCieloOuSafra && '*'}</label>
                <div className="flex items-center gap-1">
                  <Input 
                    className="w-48 h-6 text-[11px] rounded-sm" 
                    value={formData.bank || ''}
                    onChange={e => setFormData({ ...formData, bank: e.target.value })}
                  />
                  <Search className="h-3.5 w-3.5 text-gray-500 cursor-pointer" />
                </div>
              </div>
            )}

            {showInstFinanceira && (
              <div className="flex items-center">
                <label className="w-32">Instituição financeira</label>
                <div className="flex items-center gap-1">
                  <Input 
                    className="w-32 h-6 text-[11px] rounded-sm" 
                    value={formData.financial_institution || ''}
                    onChange={e => setFormData({ ...formData, financial_institution: e.target.value })}
                  />
                  <Search className="h-3.5 w-3.5 text-gray-500 cursor-pointer" />
                </div>
              </div>
            )}

            {showAgenciaConta && (
              <>
                <div className="flex items-center">
                  <label className="w-32">Agência{isBoletoComRegistro || isDeposito || isDebito ? '*' : ''}</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="w-40 h-6 text-[11px] rounded-sm" 
                      value={formData.agency || ''}
                      onChange={e => setFormData({ ...formData, agency: e.target.value })}
                    />
                    <span>-</span>
                    <Input 
                      className="w-12 h-6 text-[11px] rounded-sm" 
                      value={formData.account_digit || ''}
                      onChange={e => setFormData({ ...formData, account_digit: e.target.value })} // We reuse digit for agency digit here
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="w-32">Conta{isPix ? '*' : ''}</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="w-40 h-6 text-[11px] rounded-sm" 
                      value={formData.account_number || ''}
                      onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    />
                    <span>-</span>
                    <Input 
                      className="w-12 h-6 text-[11px] rounded-sm" 
                      value={formData.account_digit || ''}
                      onChange={e => setFormData({ ...formData, account_digit: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center">
              <label className="w-32">Conta contábil*</label>
              <div className="flex items-center gap-1">
                <Input 
                  className="w-32 h-6 text-[11px] rounded-sm" 
                  value={formData.accounting_account || ''}
                  onChange={e => setFormData({ ...formData, accounting_account: e.target.value })}
                />
                <Search className="h-3.5 w-3.5 text-gray-500 cursor-pointer" />
              </div>
            </div>

            {/* PIX Specifics */}
            {isPix && (
              <>
                <div className="flex items-center mt-2">
                  <label className="w-32">Chave do PIX*</label>
                  <Input 
                    className="w-64 h-6 text-[11px] rounded-sm" 
                    value={formData.pix_key || ''}
                    onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32">Credencial de validação 1*</label>
                  <Input 
                    className="w-64 h-6 text-[11px] rounded-sm" 
                    value={formData.validation_credential_1 || ''}
                    onChange={e => setFormData({ ...formData, validation_credential_1: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32">Credencial de validação 2*</label>
                  <Input 
                    className="w-64 h-6 text-[11px] rounded-sm" 
                    value={formData.validation_credential_2 || ''}
                    onChange={e => setFormData({ ...formData, validation_credential_2: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32 leading-tight">Tempo padrão da validade da cobrança PIX (em horas)*</label>
                  <Input 
                    type="number"
                    className="w-32 h-6 text-[11px] rounded-sm" 
                    value={formData.pix_validity_hours || ''}
                    onChange={e => setFormData({ ...formData, pix_validity_hours: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* CIELO / SAFRAPAY Specifics */}
            {isCieloOuSafra && (
              <>
                <div className="flex items-center mt-2">
                  <label className="w-32">Credencial de validação 1*</label>
                  <Input 
                    className="w-64 h-6 text-[11px] rounded-sm" 
                    value={formData.validation_credential_1 || ''}
                    onChange={e => setFormData({ ...formData, validation_credential_1: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32">Credencial de validação 2*</label>
                  <Input 
                    className="w-64 h-6 text-[11px] rounded-sm" 
                    value={formData.validation_credential_2 || ''}
                    onChange={e => setFormData({ ...formData, validation_credential_2: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32">Máximo de parcelas padrão</label>
                  <Input 
                    type="number"
                    className="w-32 h-6 text-[11px] rounded-sm" 
                    value={formData.max_installments || ''}
                    onChange={e => setFormData({ ...formData, max_installments: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32 leading-tight">Tempo padrão da validade do link (em dias)</label>
                  <Input 
                    type="number"
                    className="w-32 h-6 text-[11px] rounded-sm" 
                    value={formData.link_validity_days || ''}
                    onChange={e => setFormData({ ...formData, link_validity_days: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center mt-4">
                  <label className="w-32"></label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={formData.show_product_description} 
                      onChange={e => setFormData({ ...formData, show_product_description: e.target.checked })} 
                    /> 
                    Ao gerar links para pagamento, mostrar a descrição do produto na tela de pagamento
                  </label>
                </div>
              </>
            )}

            {/* BOLETO Specifics */}
            {isBoletoComRegistro && (
              <div className="mt-2 pt-2 border-t border-gray-200 border-dashed space-y-2">
                <div className="flex items-center">
                  <label className="w-32">Carteira*</label>
                  <Input 
                    className="w-24 h-6 text-[11px] rounded-sm" 
                    value={formData.portfolio || ''}
                    onChange={e => setFormData({ ...formData, portfolio: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32">Local de pagamento*</label>
                  <Input 
                    className="flex-1 max-w-[400px] h-6 text-[11px] rounded-sm" 
                    value={formData.payment_location || ''}
                    onChange={e => setFormData({ ...formData, payment_location: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-32 leading-tight">Cód empresa/número do convênio*</label>
                  <div className="flex items-center gap-4">
                    <Input 
                      className="w-40 h-6 text-[11px] rounded-sm" 
                      value={formData.agreement_code || ''}
                      onChange={e => setFormData({ ...formData, agreement_code: e.target.value })}
                    />
                    <label>Número do contrato</label>
                    <Input 
                      className="w-40 h-6 text-[11px] rounded-sm" 
                      value={formData.contract_number || ''}
                      onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center">
                    <label className="w-32">Multa após vencimento</label>
                    <Input 
                      type="number"
                      className="w-16 h-6 text-[11px] rounded-sm mr-1 text-right" 
                      value={formData.fine_after_due || 0}
                      onChange={e => setFormData({ ...formData, fine_after_due: Number(e.target.value) })}
                    />
                    <select 
                      className="h-6 border border-gray-400 px-1 rounded-sm"
                      value={formData.fine_type || '%'}
                      onChange={e => setFormData({ ...formData, fine_type: e.target.value })}
                    >
                      <option value="%">%</option>
                      <option value="R$">R$</option>
                    </select>
                  </div>
                  <div className="flex items-center ml-4">
                    <label className="mr-2">Juro após vencimento</label>
                    <Input 
                      type="number"
                      className="w-16 h-6 text-[11px] rounded-sm mr-1 text-right" 
                      value={formData.interest_after_due || 0}
                      onChange={e => setFormData({ ...formData, interest_after_due: Number(e.target.value) })}
                    />
                    <select 
                      className="h-6 border border-gray-400 px-1 rounded-sm"
                      value={formData.interest_type || '% ao mês'}
                      onChange={e => setFormData({ ...formData, interest_type: e.target.value })}
                    >
                      <option value="% ao mês">% ao mês</option>
                      <option value="% ao dia">% ao dia</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-32">Após</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      className="w-12 h-6 text-[11px] rounded-sm text-right" 
                      value={formData.protest_days || 0}
                      onChange={e => setFormData({ ...formData, protest_days: Number(e.target.value) })}
                    />
                    <span>dias do vencimento</span>
                    <select 
                      className="h-6 border border-gray-400 px-1 rounded-sm ml-2 w-24"
                      value={formData.protest_action || 'Protestar'}
                      onChange={e => setFormData({ ...formData, protest_action: e.target.value })}
                    >
                      <option value="Protestar">Protestar</option>
                      <option value="Devolver">Devolver</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-32"></label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={formData.grant_discount} 
                      onChange={e => setFormData({ ...formData, grant_discount: e.target.checked })} 
                    /> 
                    Conceder desconto (%) para pagamentos até o vencimento
                  </label>
                </div>

                <div className="flex items-end gap-4 pt-2">
                  <div>
                    <label className="block mb-1 leading-tight w-24">Ambiente para a geração de arquivo de remessa</label>
                    <select 
                      className="w-24 h-6 border border-gray-400 px-1 rounded-sm"
                      value={formData.remittance_environment || 'Teste'}
                      onChange={e => setFormData({ ...formData, remittance_environment: e.target.value })}
                    >
                      <option value="Teste">Teste</option>
                      <option value="Produção">Produção</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 leading-tight w-32">Tipo de integração com o banco*</label>
                    <select 
                      className="w-32 h-6 border border-gray-400 px-1 rounded-sm"
                      value={formData.integration_type || 'CNAB 240'}
                      onChange={e => setFormData({ ...formData, integration_type: e.target.value })}
                    >
                      <option value="CNAB 240">CNAB 240</option>
                      <option value="CNAB 400">CNAB 400</option>
                      <option value="WebService">WebService</option>
                    </select>
                  </div>
                  <div className="flex-1 ml-4">
                    <label className="block mb-1">{formData.liquidation_date_type || 'Data de liquidação de títulos (arquivo retorno/WebService)'}</label>
                    <select className="w-full h-6 border border-gray-400 px-1 rounded-sm">
                      <option value="Data de crédito">Data de crédito</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center">
                    <label className="w-32 leading-tight">Próximo nosso número boleto*</label>
                    <Input 
                      type="number"
                      className="w-32 h-6 text-[11px] rounded-sm text-right" 
                      value={formData.next_slip_number || 1}
                      onChange={e => setFormData({ ...formData, next_slip_number: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 leading-tight">Próximo número arquivo de remessa*</label>
                    <Input 
                      type="number"
                      className="w-24 h-6 text-[11px] rounded-sm text-right" 
                      value={formData.next_remittance_number || 1}
                      onChange={e => setFormData({ ...formData, next_remittance_number: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <label className="w-32">Tipo de cobrança</label>
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={formData.generate_nfe_record} 
                        onChange={e => setFormData({ ...formData, generate_nfe_record: e.target.checked })} 
                      /> 
                      Gerar registro de nota fiscal eletrônica
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-2 mt-2">
                    <label className="w-32"></label>
                    <div className="flex items-start gap-1 flex-1">
                      <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={formData.confirmed_with_manager} 
                        onChange={e => setFormData({ ...formData, confirmed_with_manager: e.target.checked })} 
                      /> 
                      <span className="text-[10px] text-gray-600 leading-tight">
                        O gerente do meu banco confirmou que posso gerar boletos com esta conta bancária com as informações preenchidas nesta tela. Importante: após preencher as informações e clicar em Salvar, sugerimos que você homologue sua configuração de boleto, para garantir que, quando um cliente pagar seu boleto, o valor cairá corretamente na sua conta bancária. Para fazer isso, em Contas a receber, crie algumas receitas com valores baixos, abaixo de R$ 1,00, e imprima um boleto para cada receita. Pague os boletos e verifique se todos os valores caíram corretamente na sua conta bancária. Caso isso não ocorra, contate o gerente do seu banco e informe o ocorrido, confirmando se os dados que ele lhe passou estavam válidos.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mt-2">
                    <label className="w-32"></label>
                    <label className="flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={formData.sum_tariff_on_return} 
                        onChange={e => setFormData({ ...formData, sum_tariff_on_return: e.target.checked })} 
                      /> 
                      Ao importar arquivo de retorno, somar valor da tarifa no valor recebido
                    </label>
                  </div>
                </div>

              </div>
            )}
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-2 border-t border-gray-300 bg-[#f0f0f0] flex items-center gap-2">
          <Button 
            type="submit" 
            form="receipt-method-form"
            className="bg-[#8ec21f] hover:bg-[#7ba619] text-white h-7 px-4 text-xs font-bold rounded-sm shadow-sm"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="h-7 px-4 text-xs bg-gradient-to-b from-white to-gray-100 border-gray-400 rounded-sm shadow-sm hover:bg-gray-100 text-gray-700"
          >
            Cancelar
          </Button>
        </div>

      </div>
    </div>
  )
}
