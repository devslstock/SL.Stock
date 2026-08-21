import { useState } from 'react'
import { Building2, Search, Filter, Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { receiptMethodsApi } from '@/api/receiptMethods'
import { ReceiptMethodFormModal } from './ReceiptMethodFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import type { ReceiptMethod } from '@/types/database'

export default function ReceiptMethods() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Ativo')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ReceiptMethod | null>(null)

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['receipt_methods', company?.id],
    queryFn: () => receiptMethodsApi.getReceiptMethods(company!.id),
    enabled: !!company?.id
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'Ativo' | 'Inativo' }) => 
      receiptMethodsApi.updateReceiptMethod(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt_methods'] })
      toast.success('Status atualizado com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao atualizar status: ${getErrorMessage(error)}`)
    }
  })

  const filteredMethods = methods.filter((method: ReceiptMethod) => {
    const searchVal = searchTerm.toLowerCase()
    const matchesSearch = method.bank?.toLowerCase().includes(searchVal) ||
                          method.payment_method?.toLowerCase().includes(searchVal) ||
                          method.accounting_account?.toLowerCase().includes(searchVal)
    
    const matchesStatus = statusFilter === 'all' || method.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleEdit = (method: ReceiptMethod) => {
    setEditingMethod(method)
    setIsModalOpen(true)
  }

  const handleToggleStatus = (method: ReceiptMethod) => {
    const newStatus = method.status === 'Ativo' ? 'Inativo' : 'Ativo'
    if (newStatus === 'Inativo') {
      if (!confirm(`Tem certeza que deseja inativar a forma de cobrança "${method.payment_method || method.name}"? Ela não poderá mais ser usada.`)) {
        return
      }
    }
    toggleStatusMutation.mutate({ id: method.id, status: newStatus })
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Formas de Cobrança / Contas</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre e gerencie bancos, contas, chaves PIX e outros meios utilizados para receber pagamentos.
            </p>
          </div>
          <Button onClick={() => { setEditingMethod(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Nova forma de cobrança
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por banco, conta ou meio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Banco</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Agência</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Conta</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Meio de pagamento</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Conta contábil</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Carteira</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Carregando...</td>
                  </tr>
                ) : filteredMethods.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Nenhuma conta/forma de cobrança encontrada.</td>
                  </tr>
                ) : (
                  filteredMethods.map((method: ReceiptMethod) => (
                    <tr key={method.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{method.bank || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{method.agency ? `${method.agency}` : '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{method.account_number ? `${method.account_number}${method.account_digit ? '-' + method.account_digit : ''}` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {method.payment_method || method.type || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{method.accounting_account || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{method.portfolio || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${method.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {method.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(method)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title={method.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                          >
                            {method.status === 'Ativo' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(method)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ReceiptMethodFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          methodToEdit={editingMethod}
        />
      )}
    </div>
  )
}
