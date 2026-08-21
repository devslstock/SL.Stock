import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { fiscalOperationsApi } from '@/api/fiscalOperations'
import { Receipt, Loader2 } from 'lucide-react'
import { nfeApi } from '@/api/nfe'
import type { SalesOrder } from '@/types/database'
import { getErrorMessage } from '@/utils/errorMessage'

interface NfeEmissionModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

export function NfeEmissionModal({ isOpen, onClose, orderId }: NfeEmissionModalProps) {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [selectedOpId, setSelectedOpId] = useState('')

  const { data: operations = [], isLoading: isLoadingOps } = useQuery({
    queryKey: ['fiscal_operations', company?.id],
    queryFn: () => company?.id ? fiscalOperationsApi.getOperations(company.id) : [],
    enabled: isOpen && !!company?.id
  })

  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['sales_order_details', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const { data, error } = await supabase.from('sales_orders').select('*, customer:customers(*), items:sales_order_items(*, product:products(*))').eq('id', orderId).single()
      if (error) throw error
      return data as SalesOrder
    },
    enabled: isOpen && !!orderId
  })

  const emitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOpId) throw new Error('Selecione a Natureza de Operação')
      
      const res = await nfeApi.emitirNfe(company!.id, orderId!)
      return res
    },
    onSuccess: () => {
      toast.success('NF-e enviada para processamento!')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      onClose()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err))
  })

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            Emitir NF-e
          </DialogTitle>
          <DialogDescription>
            Selecione a operação fiscal para emitir a Nota Fiscal Eletrônica.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isLoadingOrder ? (
            <div className="text-center text-sm text-muted-foreground py-4">Carregando dados do pedido...</div>
          ) : (
            <>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm">
                <p><strong>Cliente:</strong> {order?.customer?.legal_name || order?.customer?.fantasy_name}</p>
                <p><strong>Valor Total:</strong> R$ {order?.net_amount?.toFixed(2)}</p>
                <p><strong>Itens:</strong> {order?.items?.length}</p>
              </div>

              <div className="space-y-2">
                <Label>Natureza de Operação *</Label>
                {isLoadingOps ? (
                  <div className="text-sm text-muted-foreground">Carregando operações...</div>
                ) : (
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedOpId}
                    onChange={e => setSelectedOpId(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {operations.map(op => (
                      <option key={op.id} value={op.id}>{op.name} ({op.cfop_intra}/{op.cfop_inter})</option>
                    ))}
                  </select>
                )}
                {operations.length === 0 && !isLoadingOps && (
                  <p className="text-xs text-red-500 mt-1">Nenhuma operação fiscal cadastrada. Vá ao menu Fiscal para cadastrar.</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white" 
            disabled={!selectedOpId || emitMutation.isPending || isLoadingOrder}
            onClick={() => emitMutation.mutate()}
          >
            {emitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transmitir NF-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
