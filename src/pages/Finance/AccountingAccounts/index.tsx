import { useState } from 'react'
import { Search, Filter, Plus, Edit2, CheckCircle2, XCircle, Star, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { accountingAccountsApi } from '@/api/accountingAccounts'
import { AccountingAccountFormModal } from './AccountingAccountFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import type { AccountingAccount } from '@/types/database'
import { cn } from '@/lib/utils'

export default function AccountingAccounts() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Ativo')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounting_accounts', company?.id],
    queryFn: () => accountingAccountsApi.getAccounts(company!.id),
    enabled: !!company?.id
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: boolean }) => 
      accountingAccountsApi.updateAccount(id, { is_active: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting_accounts'] })
      toast.success('Status atualizado com sucesso!')
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao atualizar status: ${getErrorMessage(error)}`)
    }
  })

  // Build tree
  const buildTree = (allAccounts: AccountingAccount[], parentId: string | null = null): (AccountingAccount & { children?: any[], level: number })[] => {
    return allAccounts
      .filter(acc => acc.parent_id === parentId)
      .map(acc => ({
        ...acc,
        level: parentId === null ? 0 : 1, // Will be recalculated in a flat map
        children: buildTree(allAccounts, acc.id)
      }))
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodes(newExpanded)
  }

  // Flatten tree for rendering
  const flattenTree = (nodes: any[], level = 0): any[] => {
    let result: any[] = []
    for (const node of nodes) {
      result.push({ ...node, level })
      // If expanded or if searching (auto expand)
      if (expandedNodes.has(node.id) || searchTerm) {
        if (node.children && node.children.length > 0) {
          result = result.concat(flattenTree(node.children, level + 1))
        }
      }
    }
    return result
  }

  const tree = buildTree(accounts)
  let flatAccounts = flattenTree(tree)

  // Filter
  flatAccounts = flatAccounts.filter((acc: AccountingAccount) => {
    const searchVal = searchTerm.toLowerCase()
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchVal) ||
      acc.code.toLowerCase().includes(searchVal) ||
      (acc.classification && acc.classification.toLowerCase().includes(searchVal)) ||
      (acc.nickname && acc.nickname.toLowerCase().includes(searchVal))
    
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'Ativo' ? acc.is_active : !acc.is_active)
    const matchesType = typeFilter === 'all' || acc.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleEdit = (acc: AccountingAccount) => {
    setEditingAccount(acc)
    setIsModalOpen(true)
  }

  const handleToggleStatus = (acc: AccountingAccount) => {
    const newStatus = !acc.is_active
    if (!newStatus) {
      if (!confirm(`Tem certeza que deseja inativar a conta "${acc.name}"? Ela não poderá mais ser usada em novos lançamentos.`)) {
        return
      }
    }
    toggleStatusMutation.mutate({ id: acc.id, status: newStatus })
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contas Contábeis</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre e gerencie o plano de contas da sua empresa.
            </p>
          </div>
          <Button onClick={() => { setEditingAccount(null); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por descrição, código ou classificação..."
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
              <option value="all">Todas as contas</option>
              <option value="Ativo">Ativas</option>
              <option value="Inativo">Inativas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="Sintética">Sintética</option>
              <option value="Analítica">Analítica</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold w-[350px]">Classificação / Descrição</th>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Finalidade</th>
                  <th className="px-4 py-3 font-semibold text-center w-24">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        Carregando contas...
                      </div>
                    </td>
                  </tr>
                ) : flatAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma conta contábil encontrada.
                    </td>
                  </tr>
                ) : (
                  flatAccounts.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center" style={{ paddingLeft: `${acc.level * 20}px` }}>
                          {acc.type === 'Sintética' ? (
                            <button 
                              onClick={() => toggleExpand(acc.id)}
                              className="p-1 hover:bg-gray-200 rounded mr-1"
                            >
                              {expandedNodes.has(acc.id) || searchTerm ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                            </button>
                          ) : (
                            <div className="w-6 mr-1"></div> // placeholder for alignment
                          )}
                          <span className={cn(
                            "font-medium mr-2",
                            acc.type === 'Sintética' ? "text-gray-900" : "text-gray-600"
                          )}>
                            {acc.classification}
                          </span>
                          <span className={cn(
                            acc.type === 'Sintética' ? "font-semibold text-gray-900" : "text-gray-700"
                          )}>
                            {acc.name}
                          </span>
                          {acc.is_favorite && (
                            <Star className="h-4 w-4 ml-2 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{acc.code}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          acc.type === 'Sintética' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        )}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{acc.finality || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                            acc.is_active 
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          )}
                        >
                          {acc.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {acc.is_active ? 'Ativa' : 'Inativa'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(acc)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
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
        <AccountingAccountFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          account={editingAccount}
          allAccounts={accounts}
        />
      )}
    </div>
  )
}
