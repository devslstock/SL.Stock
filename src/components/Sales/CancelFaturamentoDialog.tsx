import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/api/finance'
import { salesApi } from '@/api/sales'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { AlertCircle, XCircle, Trash2 } from 'lucide-react'

interface CancelFaturamentoDialogProps {
  orderId: string | null
  onClose: () => void
}

export function CancelFaturamentoDialog({ orderId, onClose }: CancelFaturamentoDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)

  // Fetch accounts when dialog opens
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['order_accounts', orderId],
    queryFn: () => financeApi.getContasPorPedido(orderId!),
    enabled: !!orderId
  })

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (ids: string[]) => financeApi.batchCancelarContas(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      queryClient.invalidateQueries({ queryKey: ['order_accounts', orderId] })
      toast.success('Cobranças canceladas com sucesso.')
      setStep(2)
    },
    onError: (e: any) => toast.error(`Erro ao cancelar cobranças: ${e.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await financeApi.excluirContasDoPedido(orderId!)
      await salesApi.updateSalesOrder(orderId!, { status: 'Aprovado' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Faturamento desfeito e cobranças apagadas. O pedido retornou para Aprovado.')
      onClose()
    },
    onError: (e: any) => toast.error(`Erro ao excluir cobranças: ${e.message}`)
  })

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      await salesApi.updateSalesOrder(orderId!, { status: 'Aprovado' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] })
      toast.success('Pedido retornou para Aprovado, mantendo o histórico de cobranças canceladas.')
      onClose()
    },
    onError: (e: any) => toast.error(`Erro ao atualizar pedido: ${e.message}`)
  })

  // Reset state on open
  useEffect(() => {
    if (orderId) setStep(1)
  }, [orderId])

  if (!orderId) return null

  // Validations
  const hasPaid = accounts?.some(acc => acc.status === 'pago' || Number(acc.paid_amount) > 0)
  const isCanceled = accounts?.every(acc => acc.status === 'cancelado')

  const handleCancelAll = () => {
    if (!accounts) return
    const ids = accounts.map(a => a.id)
    cancelMutation.mutate(ids)
  }

  const handleDeleteAll = () => {
    deleteMutation.mutate()
  }

  const handleKeepCanceled = () => {
    updateStatusMutation.mutate()
  }

  return (
    <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancelar Faturamento
          </DialogTitle>
          <DialogDescription>
            Fluxo de cancelamento de faturamento e exclusão de cobranças.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="p-4 text-center text-muted-foreground animate-pulse">
            Verificando cobranças...
          </div>
        )}

        {error && (
          <div className="p-4 text-red-600 bg-red-50 rounded-lg text-sm">
            Erro ao carregar cobranças: {(error as Error).message}
          </div>
        )}

        {accounts && (
          <div className="py-4 space-y-4">
            {hasPaid ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center text-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h4 className="font-semibold text-red-700">Ação Bloqueada</h4>
                <p className="text-sm text-red-600">
                  Existem cobranças vinculadas a este pedido que já foram <strong>pagas</strong>.
                  <br /><br />
                  Não é possível desfazer o faturamento automaticamente para proteger a integridade financeira.
                </p>
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground font-medium">
                  Existem {accounts.length} cobranças vinculadas a este pedido.
                </p>
                <p className="text-sm text-muted-foreground">
                  Deseja cancelar todas as cobranças deste pedido?
                </p>
                {isCanceled && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                    Todas as cobranças deste pedido já estão com status <strong>Cancelado</strong>. Você pode prosseguir para a exclusão física se desejar.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-sm">
                  As cobranças foram canceladas com sucesso.
                </div>
                <p className="text-sm font-medium">
                  Deseja apagar definitivamente as cobranças canceladas deste pedido do banco de dados?
                </p>
                <p className="text-xs text-muted-foreground">
                  Ao apagar, o pedido retornará limpo para Aprovado. Caso escolha não apagar, ele também voltará para Aprovado mas as cobranças antigas ficarão registradas como Canceladas.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!accounts || hasPaid ? (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          ) : step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={cancelMutation.isPending}>
                Não
              </Button>
              {isCanceled ? (
                <Button variant="destructive" onClick={() => setStep(2)}>
                  Avançar para Exclusão
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleCancelAll} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? 'Cancelando...' : 'Sim, cancelar todas'}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleKeepCanceled} disabled={deleteMutation.isPending || updateStatusMutation.isPending}>
                Não, manter canceladas
              </Button>
              <Button variant="destructive" onClick={handleDeleteAll} disabled={deleteMutation.isPending || updateStatusMutation.isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                Sim, apagar e refazer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
