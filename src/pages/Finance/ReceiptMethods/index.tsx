import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { receiptMethodsApi } from '@/api/receiptMethods'
import { ReceiptMethodFormModal } from './ReceiptMethodFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
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
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
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
      <div className="bg-[#48638b] text-white px-4 py-2 flex items-center gap-2 font-semibold">
        Formas de cobrança e contas bancárias
      </div>

      <div className="bg-white p-2 border-b">
        <fieldset className="border border-gray-300 p-2 rounded-sm relative mt-2 inline-block">
          <legend className="text-xs text-gray-500 absolute -top-2.5 bg-white px-1 ml-2">Filtros (clique para configurar: <Filter className="inline h-3 w-3" />)</legend>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Ativa</label>
              <select
                className="h-6 border rounded px-1 bg-white text-xs outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Ativo">Sim</option>
                <option value="Inativo">Não</option>
                <option value="all">Todas</option>
              </select>
            </div>
            <div className="flex items-center gap-2 relative">
              <label className="text-xs font-medium">Banco</label>
              <Input
                className="h-6 w-32 pl-1 pr-6 text-xs rounded-sm border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="bg-[#e9ecef] p-1 flex items-center gap-2 border-b border-gray-300">
        <Button onClick={() => { setEditingMethod(null); setIsModalOpen(true); }} className="bg-[#8ec21f] hover:bg-[#7ba619] text-white h-7 px-3 text-sm font-semibold rounded-sm">
          Novo
        </Button>
        <Button variant="outline" className="h-7 px-3 text-xs bg-white rounded-sm border-gray-300">
          Ocultar filtros
        </Button>
      </div>

      <div className="bg-white border-b border-gray-300 min-h-[calc(100vh-250px)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#e9ecef] border-b border-gray-300">
              <tr>
                <th className="px-2 py-1.5 font-normal text-gray-700 w-16 border-r border-gray-300"></th>
                <th className="px-2 py-1.5 font-normal text-gray-700 border-r border-gray-300">Banco</th>
                <th className="px-2 py-1.5 font-normal text-gray-700 border-r border-gray-300">Agência</th>
                <th className="px-2 py-1.5 font-normal text-gray-700 border-r border-gray-300">Conta</th>
                <th className="px-2 py-1.5 font-normal text-gray-700 border-r border-gray-300">Meio de pagamento</th>
                <th className="px-2 py-1.5 font-normal text-gray-700 border-r border-gray-300">Conta contábil</th>
                <th className="px-2 py-1.5 font-normal text-gray-700">Carteira</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Carregando...</td>
                </tr>
              ) : filteredMethods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma conta/forma de cobrança encontrada.</td>
                </tr>
              ) : (
                filteredMethods.map((method: ReceiptMethod, index: number) => (
                  <tr key={method.id} className={`border-b border-gray-100 last:border-0 hover:bg-[#f1cd56] cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}`} onClick={() => handleEdit(method)}>
                    <td className="px-2 py-1 flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(method); }}
                        className="text-red-600 hover:text-red-800 font-bold px-1"
                        title={method.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                      >
                        ×
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(method); }}
                        className="text-orange-500 hover:text-orange-700 text-[10px]"
                        title="Editar"
                      >
                        ✎
                      </button>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">{method.bank || '-'}</td>
                    <td className="px-2 py-1">{method.agency ? `${method.agency}` : '-'}</td>
                    <td className="px-2 py-1">{method.account_number ? `${method.account_number}${method.account_digit ? '-' + method.account_digit : ''}` : '-'}</td>
                    <td className="px-2 py-1">{method.payment_method || method.type || '-'}</td>
                    <td className="px-2 py-1 truncate max-w-[200px]">{method.accounting_account || '-'}</td>
                    <td className="px-2 py-1">{method.portfolio || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
