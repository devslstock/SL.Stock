import { useState, useEffect } from 'react'
import { X, Save, Building2, QrCode, Asterisk } from 'lucide-react'
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

export function ReceiptMethodFormModal({ isOpen, onClose, methodToEdit }: Props) {
  const { company } = useAuth()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Partial<ReceiptMethod>>({
    name: '',
    type: 'banco',
    status: 'Ativo',
    bank: '',
    agency: '',
    account_number: '',
    account_digit: '',
    account_type: 'Corrente',
    pix_key_type: 'CNPJ',
    pix_key: '',
    linked_bank: '',
    holder_name: '',
    holder_document: '',
    notes: ''
  })

  useEffect(() => {
    if (methodToEdit) {
      setFormData(methodToEdit)
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

    if (!formData.name) {
      return toast.error('Nome/identificação é obrigatório.')
    }

    if (formData.type === 'banco') {
      if (!formData.bank) return toast.error('Selecione o banco.')
    } else if (formData.type === 'pix') {
      if (!formData.pix_key_type || !formData.pix_key) return toast.error('Tipo de chave e chave PIX são obrigatórios.')
    }

    if (methodToEdit) {
      updateMutation.mutate(formData as ReceiptMethod)
    } else {
      createMutation.mutate({
        ...formData,
        company_id: company!.id,
      } as Omit<ReceiptMethod, 'id' | 'created_at' | 'updated_at'>)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {methodToEdit ? 'Editar Forma de Recebimento' : 'Nova Forma de Recebimento'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="receipt-method-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de recebimento *</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'banco' })}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${formData.type === 'banco' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Building2 className="h-4 w-4" /> Banco
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'pix' })}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${formData.type === 'pix' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <QrCode className="h-4 w-4" /> PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'outros' })}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${formData.type === 'outros' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Asterisk className="h-4 w-4" /> Outros
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full h-9 border rounded-md px-3 bg-white text-sm"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'Ativo' | 'Inativo' })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome/Identificação interna *</label>
              <Input
                required
                placeholder="Ex: Conta Principal BB, Chave PIX Empresa"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {formData.type === 'banco' && (
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50/50">
                <h3 className="font-medium text-sm text-gray-900">Dados Bancários</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco *</label>
                    <Input
                      required
                      placeholder="Ex: Banco do Brasil"
                      value={formData.bank || ''}
                      onChange={e => setFormData({ ...formData, bank: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                    <Input
                      placeholder="Ex: 1234-5"
                      value={formData.agency || ''}
                      onChange={e => setFormData({ ...formData, agency: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                    <select
                      className="w-full h-9 border rounded-md px-3 bg-white text-sm"
                      value={formData.account_type || 'Corrente'}
                      onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                    >
                      <option value="Corrente">Conta Corrente</option>
                      <option value="Poupança">Conta Poupança</option>
                      <option value="Pagamento">Conta de Pagamento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                    <Input
                      placeholder="Ex: 98765"
                      value={formData.account_number || ''}
                      onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dígito</label>
                    <Input
                      placeholder="Ex: X"
                      value={formData.account_digit || ''}
                      onChange={e => setFormData({ ...formData, account_digit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'pix' && (
              <div className="space-y-4 border p-4 rounded-lg bg-purple-50/30 border-purple-100">
                <h3 className="font-medium text-sm text-purple-900">Chave PIX</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo da Chave *</label>
                    <select
                      className="w-full h-9 border rounded-md px-3 bg-white text-sm"
                      value={formData.pix_key_type || 'CNPJ'}
                      onChange={e => setFormData({ ...formData, pix_key_type: e.target.value })}
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chave *</label>
                    <Input
                      required
                      placeholder="Sua chave PIX"
                      value={formData.pix_key || ''}
                      onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco Vinculado (Opcional)</label>
                    <Input
                      placeholder="Ex: Nubank, Banco Inter"
                      value={formData.linked_bank || ''}
                      onChange={e => setFormData({ ...formData, linked_bank: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-900 border-b pb-2">Informações do Titular</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Titular</label>
                  <Input
                    placeholder="Nome da empresa ou pessoa"
                    value={formData.holder_name || ''}
                    onChange={e => setFormData({ ...formData, holder_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ do Titular</label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={formData.holder_document || ''}
                    onChange={e => setFormData({ ...formData, holder_document: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                  <Input
                    placeholder="Anotações sobre essa conta ou chave"
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="receipt-method-form"
            className="bg-primary hover:bg-primary/90 text-white gap-2"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4" /> 
            {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar Cadastro'}
          </Button>
        </div>
      </div>
    </div>
  )
}
