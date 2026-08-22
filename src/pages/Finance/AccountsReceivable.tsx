import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/api/finance'
import { asaasApi } from '@/api/asaas'
import { formatCurrency } from '@/utils/formatters'
import { DollarSign, Search, Calendar, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import type { AccountReceivable } from '@/types/database'

export default function AccountsReceivable() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Estados para o fluxo de cancelamento
  const [cancelDialogState, setCancelDialogState] = useState<{
    isOpen: boolean;
    step: 1 | 2; // 1: Cancelar, 2: Excluir
    account: AccountReceivable | null;
    relatedAccounts: AccountReceivable[];
    idsToProcess: string[]; // IDs que foram efetivamente cancelados no passo 1
    cancelAll: boolean; // Se o usuário escolheu cancelar todas no passo 1
  }>({
    isOpen: false,
    step: 1,
    account: null,
    relatedAccounts: [],
    idsToProcess: [],
    cancelAll: false
  })

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts_receivable'],
    queryFn: financeApi.getAccountsReceivable
  })

  const baixarMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string, amount: number }) => {
      await financeApi.baixarConta(id, amount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Conta baixada com sucesso!')
    },
    onError: (e: unknown) => toast.error('Erro ao baixar conta: ' + getErrorMessage(e))
  })

  const cancelarMutation = useMutation({
    mutationFn: async ({ ids, cancelAll, salesOrderId }: { ids: string[], cancelAll: boolean, salesOrderId: string }) => {
      // 1. Cancelar as contas no financeiro
      await financeApi.batchCancelarContas(ids)
      
      // 2. Se cancelou TODAS as contas do pedido, volta o pedido para Aprovado
      if (cancelAll) {
         await financeApi.reverterFaturamentoPedido(salesOrderId)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] }) // Invalida pedidos tb
      toast.success('Cobrança(s) cancelada(s)!')
      setSelectedIds(prev => prev.filter(p => !variables.ids.includes(p)))
      
      // Avança para a pergunta de exclusão
      setCancelDialogState(prev => ({ ...prev, step: 2, idsToProcess: variables.ids, cancelAll: variables.cancelAll }))
    },
    onError: (e: unknown) => toast.error('Erro ao cancelar: ' + getErrorMessage(e))
  })

  const excluirMutation = useMutation({
    mutationFn: async (ids: string[]) => {
       await financeApi.excluirContas(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Cobrança(s) excluída(s) permanentemente!')
      setCancelDialogState(prev => ({ ...prev, isOpen: false }))
    },
    onError: (e: unknown) => toast.error('Erro ao excluir: ' + getErrorMessage(e))
  })

  const batchBaixarMutation = useMutation({
    mutationFn: (ids: string[]) => financeApi.batchBaixarContas(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Baixa efetuada em massa com sucesso!')
      setSelectedIds([])
    },
    onError: (e: unknown) => toast.error('Erro na baixa em massa: ' + getErrorMessage(e))
  })

  const batchCancelarMutation = useMutation({
    mutationFn: (ids: string[]) => financeApi.batchCancelarContas(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Cobranças canceladas com sucesso!')
      setSelectedIds([])
    },
    onError: (e: unknown) => toast.error('Erro ao cancelar em massa: ' + getErrorMessage(e))
  })

  const emitirBoletosMutation = useMutation({
    mutationFn: (ids: string[]) => asaasApi.emitirBoletos(ids),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      const ok = results.filter(r => r.success)
      const fail = results.filter(r => !r.success)
      if (ok.length) toast.success(`${ok.length} boleto(s) emitido(s) com sucesso!`)
      if (fail.length) {
        toast.error(`${fail.length} falharam: ${fail.map(f => f.error).join('; ')}`, { duration: 8000 })
        setSelectedIds(fail.map(f => f.accountId))
      } else {
        setSelectedIds([])
      }
    },
    onError: (e: unknown) => toast.error('Erro ao emitir boletos: ' + getErrorMessage(e))
  })

  const handleBaixar = (account: AccountReceivable) => {
    if (confirm(`Confirma a baixa da parcela ${account.installment_number} do pedido ${account.sales_order?.order_number || account.sales_order_id.slice(0,5).toUpperCase()} no valor de ${formatCurrency(account.amount)}?`)) {
      baixarMutation.mutate({ id: account.id, amount: account.amount })
    }
  }

  const handleCancelar = async (account: AccountReceivable) => {
    // Buscar se há mais cobranças para o mesmo pedido
    const related = accounts.filter((a: AccountReceivable) => 
       a.sales_order_id === account.sales_order_id && a.status !== 'cancelado'
    )
    
    setCancelDialogState({
       isOpen: true,
       step: 1,
       account,
       relatedAccounts: related,
       idsToProcess: [],
       cancelAll: false
    })
  }

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAccounts.filter(a => a.status !== 'cancelado').map(a => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const filteredAccounts = accounts.filter((acc: AccountReceivable) => {
    const s = search.toLowerCase()
    const matchesSearch = s === '' || Boolean(
      acc.customer?.legal_name?.toLowerCase().includes(s) ||
      acc.customer?.fantasy_name?.toLowerCase().includes(s) ||
      acc.sales_order?.order_number?.toString().includes(s)
    )

    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && acc.status === filterStatus
  })

  const totalReceivable = filteredAccounts
    .filter(a => a.status !== 'pago' && a.status !== 'cancelado')
    .reduce((sum, a) => sum + a.amount, 0)

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando contas a receber...</div>

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* Modal de Cancelamento/Exclusão */}
      <Dialog open={cancelDialogState.isOpen} onOpenChange={(open) => {
         if (!open && !cancelarMutation.isPending && !excluirMutation.isPending) {
            setCancelDialogState(prev => ({...prev, isOpen: false}))
         }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {cancelDialogState.step === 1 ? 'Cancelar Cobrança' : 'Excluir Cobrança'}
            </DialogTitle>
          </DialogHeader>

          {cancelDialogState.step === 1 ? (
            <div className="py-4 space-y-4">
               {cancelDialogState.relatedAccounts.length > 1 ? (
                  <>
                     <p className="text-sm">
                        O pedido <strong>{cancelDialogState.account?.sales_order?.order_number || cancelDialogState.account?.sales_order_id.slice(0,5).toUpperCase()}</strong> possui <strong>{cancelDialogState.relatedAccounts.length} cobranças</strong> vinculadas.
                     </p>
                     <p className="text-sm font-semibold text-red-600">
                        Deseja cancelar TODAS as cobranças referentes a este pedido?
                     </p>
                     <p className="text-xs text-muted-foreground">
                        Se escolher cancelar todas, o pedido voltará para o status "Aprovado" e ficará disponível para faturamento novamente.
                     </p>
                     <DialogFooter className="mt-6">
                        <Button 
                           variant="outline" 
                           disabled={cancelarMutation.isPending}
                           onClick={() => setCancelDialogState(prev => ({...prev, isOpen: false}))}
                        >
                           Desistir
                        </Button>
                        <Button 
                           variant="secondary"
                           disabled={cancelarMutation.isPending}
                           onClick={() => {
                              cancelarMutation.mutate({ 
                                 ids: [cancelDialogState.account!.id], 
                                 cancelAll: false,
                                 salesOrderId: cancelDialogState.account!.sales_order_id
                              })
                           }}
                        >
                           Cancelar apenas esta ({cancelDialogState.account?.installment_number})
                        </Button>
                        <Button 
                           variant="destructive"
                           disabled={cancelarMutation.isPending}
                           onClick={() => {
                              const allIds = cancelDialogState.relatedAccounts.map(r => r.id)
                              cancelarMutation.mutate({ 
                                 ids: allIds, 
                                 cancelAll: true,
                                 salesOrderId: cancelDialogState.account!.sales_order_id
                              })
                           }}
                        >
                           {cancelarMutation.isPending ? 'Aguarde...' : 'Sim, cancelar todas'}
                        </Button>
                     </DialogFooter>
                  </>
               ) : (
                  <>
                     <p className="text-sm">
                        Confirma o cancelamento da cobrança <strong>{cancelDialogState.account?.installment_number}</strong> do pedido <strong>{cancelDialogState.account?.sales_order?.order_number || cancelDialogState.account?.sales_order_id.slice(0,5).toUpperCase()}</strong>?
                     </p>
                     <p className="text-xs text-muted-foreground mt-2">
                        O pedido voltará para o status "Aprovado" e ficará disponível para faturamento novamente.
                     </p>
                     <DialogFooter className="mt-6">
                        <Button 
                           variant="outline" 
                           disabled={cancelarMutation.isPending}
                           onClick={() => setCancelDialogState(prev => ({...prev, isOpen: false}))}
                        >
                           Desistir
                        </Button>
                        <Button 
                           variant="destructive"
                           disabled={cancelarMutation.isPending}
                           onClick={() => {
                              cancelarMutation.mutate({ 
                                 ids: [cancelDialogState.account!.id], 
                                 cancelAll: true,
                                 salesOrderId: cancelDialogState.account!.sales_order_id
                              })
                           }}
                        >
                           {cancelarMutation.isPending ? 'Aguarde...' : 'Sim, cancelar'}
                        </Button>
                     </DialogFooter>
                  </>
               )}
            </div>
          ) : (
            <div className="py-4 space-y-4">
               <p className="text-sm font-semibold text-orange-600">Cobrança(s) cancelada(s) com sucesso!</p>
               <p className="text-sm">
                  Deseja apagar permanentemente o(s) registro(s) cancelado(s) do sistema?
               </p>
               <DialogFooter className="mt-6">
                  <Button 
                     variant="outline" 
                     disabled={excluirMutation.isPending}
                     onClick={() => setCancelDialogState(prev => ({...prev, isOpen: false}))}
                  >
                     Não, manter como cancelado
                  </Button>
                  <Button 
                     variant="destructive"
                     disabled={excluirMutation.isPending}
                     onClick={() => excluirMutation.mutate(cancelDialogState.idsToProcess)}
                  >
                     {excluirMutation.isPending ? 'Apagando...' : 'Sim, apagar permanentemente'}
                  </Button>
               </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Contas a Receber
          </h1>
          <p className="text-muted-foreground mt-1">Gestão de cobranças e faturamentos</p>
        </div>
        
        <div className="glass-card px-6 py-3 rounded-xl border-primary/20 flex flex-col items-end">
          <span className="text-sm font-medium text-muted-foreground">Total a Receber (Filtro)</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(totalReceivable)}</span>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <span className="font-medium text-sm">
            {selectedIds.length} cobrança{selectedIds.length > 1 ? 's' : ''} selecionada{selectedIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="default"
              onClick={() => emitirBoletosMutation.mutate(selectedIds)}
              disabled={emitirBoletosMutation.isPending}
            >
              <FileText className="h-4 w-4 mr-2" /> {emitirBoletosMutation.isPending ? 'Emitindo...' : 'Imprimir Boletos'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={() => {
                if (confirm(`Confirma a baixa de ${selectedIds.length} cobranças?`)) {
                  batchBaixarMutation.mutate(selectedIds)
                }
              }}
              disabled={batchBaixarMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Dar Baixa
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Confirma o cancelamento de ${selectedIds.length} cobranças?`)) {
                  batchCancelarMutation.mutate(selectedIds)
                }
              }}
              disabled={batchCancelarMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou pedido..." 
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="boleto_emitido">Boleto Emitido</option>
          <option value="pago">Pago</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    onChange={handleToggleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === filteredAccounts.filter(a => a.status !== 'cancelado').length}
                  />
                </th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3 text-center">Parcela</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma conta encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        checked={selectedIds.includes(account.id)}
                        onChange={() => handleToggleSelect(account.id)}
                        disabled={account.status === 'cancelado'}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(account.due_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {account.customer?.legal_name || account.customer?.fantasy_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {account.sales_order?.order_number || account.sales_order_id.slice(0,5).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                        {account.installment_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(account.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {account.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </span>
                      ) : account.status === 'vencido' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-500/10 px-2 py-1 rounded-full text-xs font-medium">
                          <XCircle className="h-3 w-3" /> Vencido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full text-xs font-medium">
                          <AlertCircle className="h-3 w-3" /> {account.status.replace('_', ' ')}
                        </span>
                      )}
                      {account.bank_slip_url && (
                        <a
                          href={account.bank_slip_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-1 text-xs text-blue-600 hover:underline"
                        >
                          Ver Boleto
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {account.status !== 'pago' && account.status !== 'cancelado' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                            onClick={() => handleBaixar(account)}
                            disabled={baixarMutation.isPending}
                          >
                            Dar Baixa
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => handleCancelar(account)}
                            disabled={cancelarMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
