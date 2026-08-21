import { useState, useEffect } from 'react'
import { X, Save, Trash2, Link as LinkIcon, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { accountingAccountsApi } from '@/api/accountingAccounts'
import { costCentersApi } from '@/api/costCenters'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import type { AccountingAccount, CostCenter, AccountingAccountCostCenter } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  account: AccountingAccount | null
  allAccounts: AccountingAccount[]
}

const TABS = [
  { id: 'geral', label: 'Dados Básicos' },
  { id: 'contabil', label: 'Configurações Contábeis' },
  { id: 'centros_custo', label: 'Centros de Custo' }
]

const FINALIDADES = [
  'Caixa/banco (Ativo)',
  'Clientes',
  'Fornecedores',
  'Receita',
  'Despesa',
  'Estoque',
  'Impostos',
  'Patrimônio',
  'Outras'
]

export function AccountingAccountFormModal({ isOpen, onClose, account, allAccounts }: Props) {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('geral')

  const [formData, setFormData] = useState<Partial<AccountingAccount>>({
    code: '',
    classification: '',
    name: '',
    nickname: '',
    parent_id: null,
    type: 'Sintética',
    finality: '',
    is_favorite: false,
    is_active: true,
    nature: '',
    aggregation_code: '',
    sped_referential_account: '',
    cost_center_required: 'Opcional',
    sales_order_required: 'Opcional'
  })

  useEffect(() => {
    if (account) {
      setFormData(account)
    }
  }, [account])

  // Get cost centers
  const { data: costCenters = [] } = useQuery({
    queryKey: ['cost_centers', company?.id],
    queryFn: () => costCentersApi.getCostCenters(company!.id),
    enabled: !!company?.id
  })

  // Get links
  const { data: links = [], refetch: refetchLinks } = useQuery({
    queryKey: ['accounting_account_cost_centers', account?.id],
    queryFn: () => accountingAccountsApi.getCostCenterLinks(account!.id),
    enabled: !!account?.id
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validations
      if (!formData.name || !formData.code || !formData.type) {
        throw new Error('Preencha os campos obrigatórios (Código, Descrição e Tipo)')
      }
      
      if (formData.parent_id) {
        const parent = allAccounts.find(a => a.id === formData.parent_id)
        if (parent && parent.type === 'Analítica') {
          throw new Error('Não é possível criar uma conta filha dentro de uma conta Analítica.')
        }
        if (account && formData.parent_id === account.id) {
          throw new Error('A conta não pode estar dentro dela mesma.')
        }
      }

      if (account?.id) {
        return accountingAccountsApi.updateAccount(account.id, formData)
      } else {
        return accountingAccountsApi.createAccount({
          ...formData,
          company_id: company!.id
        } as Omit<AccountingAccount, 'id' | 'created_at' | 'updated_at'>)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting_accounts'] })
      toast.success(account ? 'Conta atualizada!' : 'Conta criada!')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => accountingAccountsApi.deleteAccount(account!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting_accounts'] })
      toast.success('Conta excluída com sucesso!')
      onClose()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    }
  })

  // Links management state
  const [newLinkCenter, setNewLinkCenter] = useState('')
  const [newLinkRef, setNewLinkRef] = useState('')

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      if (!account?.id) throw new Error('Salve a conta primeiro')
      if (!newLinkCenter) throw new Error('Selecione um centro de custo')
      
      return accountingAccountsApi.createCostCenterLink({
        accounting_account_id: account.id,
        cost_center_id: newLinkCenter,
        referential_account: newLinkRef,
        is_active: true
      })
    },
    onSuccess: () => {
      refetchLinks()
      setNewLinkCenter('')
      setNewLinkRef('')
      toast.success('Vínculo adicionado')
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e))
  })

  const removeLinkMutation = useMutation({
    mutationFn: (linkId: string) => accountingAccountsApi.deleteCostCenterLink(linkId),
    onSuccess: () => refetchLinks()
  })

  if (!isOpen) return null

  // Helper for parent selection (avoid circular logic)
  const availableParents = allAccounts.filter(a => a.id !== account?.id && a.type === 'Sintética')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{account ? 'Editar Conta' : 'Nova Conta Contábil'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="flex border-b">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'geral' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <Input 
                  value={formData.code || ''} 
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: 508"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <Input 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caixa Geral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dentro de (Conta Pai)</label>
                <select
                  className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.parent_id || ''}
                  onChange={e => setFormData({ ...formData, parent_id: e.target.value || null })}
                >
                  <option value="">Nenhuma (Raiz)</option>
                  {availableParents.map(a => (
                    <option key={a.id} value={a.id}>{a.classification} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Classificação</label>
                <Input 
                  value={formData.classification || ''} 
                  onChange={e => setFormData({ ...formData, classification: e.target.value })}
                  placeholder="Ex: 1.01.01.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select
                  className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.type || 'Sintética'}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Sintética">Sintética (Agrupadora)</option>
                  <option value="Analítica">Analítica (Recebe lançamentos)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Finalidade</label>
                <select
                  className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.finality || ''}
                  onChange={e => setFormData({ ...formData, finality: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {FINALIDADES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Apelido</label>
                <Input 
                  value={formData.nickname || ''} 
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>

              <div className="flex items-end gap-6 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_favorite} 
                    onChange={e => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Favorita</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active} 
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Ativa</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'contabil' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Natureza</label>
                <select
                  className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={formData.nature || ''}
                  onChange={e => setFormData({ ...formData, nature: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Devedora">Devedora</option>
                  <option value="Credora">Credora</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Código de aglutinação (DRE/Balanço)</label>
                <Input 
                  value={formData.aggregation_code || ''} 
                  onChange={e => setFormData({ ...formData, aggregation_code: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Conta referencial do SPED</label>
                <Input 
                  value={formData.sped_referential_account || ''} 
                  onChange={e => setFormData({ ...formData, sped_referential_account: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'centros_custo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Obrigatoriedade: Centro de Custos</label>
                  <select
                    className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    value={formData.cost_center_required || 'Opcional'}
                    onChange={e => setFormData({ ...formData, cost_center_required: e.target.value as any })}
                  >
                    <option value="Opcional">Opcional</option>
                    <option value="Obrigatório">Obrigatório</option>
                    <option value="Não utilizar">Não utilizar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Obrigatoriedade: Pedido de Venda</label>
                  <select
                    className="w-full h-10 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    value={formData.sales_order_required || 'Opcional'}
                    onChange={e => setFormData({ ...formData, sales_order_required: e.target.value as any })}
                  >
                    <option value="Opcional">Opcional</option>
                    <option value="Obrigatório">Obrigatório</option>
                    <option value="Não utilizar">Não utilizar</option>
                  </select>
                </div>
              </div>

              {account?.id ? (
                <div className="border rounded-lg p-4 bg-gray-50/50">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-gray-500" /> Vínculos com centros de custo</h3>
                  
                  <div className="flex items-end gap-2 mb-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-gray-600">Centro de Custo</label>
                      <select
                        className="w-full h-9 border rounded-md px-3 bg-white text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        value={newLinkCenter}
                        onChange={e => setNewLinkCenter(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {costCenters.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-gray-600">Conta Referencial (Opcional)</label>
                      <Input 
                        className="h-9"
                        value={newLinkRef}
                        onChange={e => setNewLinkRef(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="button"
                      size="sm"
                      onClick={() => addLinkMutation.mutate()}
                      disabled={addLinkMutation.isPending || !newLinkCenter}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  <table className="w-full text-sm text-left border bg-white rounded overflow-hidden">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Centro de Custo</th>
                        <th className="px-3 py-2 font-medium">Conta Referencial</th>
                        <th className="px-3 py-2 font-medium text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {links.length === 0 ? (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">Nenhum vínculo.</td></tr>
                      ) : (
                        links.map((link: any) => (
                          <tr key={link.id}>
                            <td className="px-3 py-2">{link.cost_centers?.code} - {link.cost_centers?.name}</td>
                            <td className="px-3 py-2">{link.referential_account || '-'}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => removeLinkMutation.mutate(link.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    Para vincular centros de custo, você precisa salvar a conta contábil primeiro.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {account && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  if(confirm('Tem certeza que deseja excluir esta conta? Se existirem movimentações, você receberá um alerta e a conta não será excluída.')) {
                    deleteMutation.mutate()
                  }
                }}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white gap-2" 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar Conta'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
