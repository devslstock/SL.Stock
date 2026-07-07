import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { deliveriesApi } from '@/api/deliveries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { GitMerge, Loader2, AlertTriangle, ArrowRight, Truck } from 'lucide-react'

interface MergeRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  routes: any[]
}

export function MergeRoutesModal({ isOpen, onClose, routes }: MergeRoutesModalProps) {
  const queryClient = useQueryClient()
  const [isMerging, setIsMerging] = useState(false)
  const [targetRouteId, setTargetRouteId] = useState('')
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])

  // Filter routes that are active (pending or in_progress)
  const activeRoutes = useMemo(() => {
    return routes.filter(r => r.status === 'pending' || r.status === 'in_progress')
  }, [routes])

  // Get available target routes
  const targetRoutes = activeRoutes

  // Get available source routes (excluding the currently selected target route)
  const sourceRoutes = useMemo(() => {
    return activeRoutes.filter(r => r.id !== targetRouteId)
  }, [activeRoutes, targetRouteId])

  const handleToggleSource = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleMerge = async () => {
    if (!targetRouteId) {
      toast.error('Selecione uma rota de destino')
      return
    }
    if (selectedSourceIds.length === 0) {
      toast.error('Selecione pelo menos uma rota de origem')
      return
    }

    const targetRoute = routes.find(r => r.id === targetRouteId)
    const sourceRoutesSelected = routes.filter(r => selectedSourceIds.includes(r.id))

    const targetName = targetRoute?.title || targetRoute?.operation?.load_number || 'Rota Destino'
    const sourceNames = sourceRoutesSelected.map(r => r.title || r.operation?.load_number || 'Rota Origem').join(', ')

    const confirmText = `Deseja realmente mesclar as rotas (${sourceNames}) na rota de destino "${targetName}"?\n\nEsta ação irá mover todos os clientes e itens para a rota destino, e as rotas de origem serão apagadas permanentemente.`
    
    if (!window.confirm(confirmText)) {
      return
    }

    setIsMerging(true)
    try {
      // 1. Fetch routes details to get operations IDs
      const { data: routesDetails, error: errRoutes } = await supabase
        .from('delivery_routes')
        .select('id, operation_id, title')
        .in('id', [targetRouteId, ...selectedSourceIds])

      if (errRoutes) throw errRoutes

      const targetRouteDetail = routesDetails?.find(r => r.id === targetRouteId)
      if (!targetRouteDetail) throw new Error('Rota de destino não encontrada')

      const targetOpId = targetRouteDetail.operation_id
      const sourceOps = routesDetails?.filter(r => r.id !== targetRouteId).map(r => r.operation_id).filter(Boolean) as string[]

      // 2. Move delivery_clients to target route
      const { error: errMoveClients } = await supabase
        .from('delivery_clients')
        .update({ delivery_route_id: targetRouteId })
        .in('delivery_route_id', selectedSourceIds)

      if (errMoveClients) throw errMoveClients

      // 3. Move equipment_orders to target route
      const { error: errMoveEquip } = await supabase
        .from('equipment_orders')
        .update({ delivery_route_id: targetRouteId })
        .in('delivery_route_id', selectedSourceIds)

      if (errMoveEquip) throw errMoveEquip

      // 4. Merge operation_items
      if (targetOpId && sourceOps.length > 0) {
        const { data: targetItems, error: errTargetItems } = await supabase
          .from('operation_items')
          .select('*')
          .eq('operation_id', targetOpId)

        if (errTargetItems) throw errTargetItems

        const { data: sourceItems, error: errSourceItems } = await supabase
          .from('operation_items')
          .select('*')
          .in('operation_id', sourceOps)

        if (errSourceItems) throw errSourceItems

        const targetItemsMap = new Map<string, any>(targetItems?.map(i => [i.product_code || i.product_id, i]))

        for (const sourceItem of (sourceItems || [])) {
          const key = sourceItem.product_code || sourceItem.product_id
          const targetItem = targetItemsMap.get(key)

          if (targetItem) {
            const newExpected = targetItem.quantity_expected + sourceItem.quantity_expected
            const newScanned = (targetItem.quantity_scanned || 0) + (sourceItem.quantity_scanned || 0)
            const newStatus = newScanned >= newExpected ? 'ok' : 'pending'

            const { error: errUpdateTarget } = await supabase
              .from('operation_items')
              .update({
                quantity_expected: newExpected,
                quantity_scanned: newScanned,
                status: newStatus
              })
              .eq('id', targetItem.id)

            if (errUpdateTarget) throw errUpdateTarget

            const { error: errDeleteSource } = await supabase
              .from('operation_items')
              .delete()
              .eq('id', sourceItem.id)

            if (errDeleteSource) throw errDeleteSource
          } else {
            const { error: errAssignSource } = await supabase
              .from('operation_items')
              .update({ operation_id: targetOpId })
              .eq('id', sourceItem.id)

            if (errAssignSource) throw errAssignSource
          }
        }
      }

      // 5. Concatenate notes on operations
      if (targetOpId && sourceOps.length > 0) {
        const { data: opsData } = await supabase
          .from('operations')
          .select('id, load_number, notes')
          .in('id', [targetOpId, ...sourceOps])

        if (opsData) {
          const targetOp = opsData.find(o => o.id === targetOpId)
          const sourceOpsData = opsData.filter(o => o.id !== targetOpId)
          const mergedNames = sourceOpsData.map(o => o.load_number).join(', ')

          const nextNotes = `${targetOp?.notes || ''}\n[Mesclado com Rota/Carga: ${mergedNames}]`.trim()
          await supabase
            .from('operations')
            .update({ notes: nextNotes })
            .eq('id', targetOpId)
        }
      }

      // 6. Delete source routes
      const { error: errDeleteRoutes } = await supabase
        .from('delivery_routes')
        .delete()
        .in('id', selectedSourceIds)

      if (errDeleteRoutes) throw errDeleteRoutes

      // 7. Delete source operations
      if (sourceOps.length > 0) {
        const { error: errDeleteOps } = await supabase
          .from('operations')
          .delete()
          .in('id', sourceOps)

        if (errDeleteOps) throw errDeleteOps
      }

      // 8. Recalculate target route status
      await deliveriesApi.recalculateRouteStatus(targetRouteId)

      toast.success('Rotas mescladas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_routes'] })
      onClose()
      setTargetRouteId('')
      setSelectedSourceIds([])
    } catch (err: any) {
      console.error(err)
      toast.error(`Erro ao mesclar rotas: ${err.message || err}`)
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isMerging && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl overflow-hidden p-0 border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <GitMerge className="h-5 w-5 text-indigo-500 animate-pulse" /> Mesclar Rotas de Entrega
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Consolide múltiplas rotas de origem em uma única rota de destino.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Rota de Destino */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4 text-emerald-500" /> Rota Destino (Receberá os clientes)
            </Label>
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              value={targetRouteId}
              onChange={e => {
                setTargetRouteId(e.target.value)
                setSelectedSourceIds([]) // reset sources when target changes
              }}
              disabled={isMerging}
            >
              <option value="">Selecione a rota destino...</option>
              {targetRoutes.map((route: any) => (
                <option key={route.id} value={route.id}>
                  {route.title || route.operation?.load_number || 'Rota Sem Nome'} ({route.driver?.name || 'Sem motorista'})
                </option>
              ))}
            </select>
          </div>

          {/* Rotas de Origem */}
          {targetRouteId && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-indigo-500" /> Selecione as Rotas Origem (Serão mescladas)
              </Label>
              {sourceRoutes.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg text-center border border-dashed">
                  Nenhuma outra rota ativa encontrada para mesclar.
                </p>
              ) : (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/10 max-h-48 overflow-y-auto">
                  {sourceRoutes.map((route: any) => {
                    const isChecked = selectedSourceIds.includes(route.id)
                    return (
                      <div
                        key={route.id}
                        onClick={() => !isMerging && handleToggleSource(route.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer border transition-all ${
                          isChecked
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-medium'
                            : 'hover:bg-muted/50 border-transparent text-muted-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div onClick
                          disabled={isMerging}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate font-medium">
                            {route.title || route.operation?.load_number || 'Rota Sem Nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Motorista: {route.driver?.name || 'Sem motorista'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Alertas */}
          {targetRouteId && selectedSourceIds.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                As rotas de origem selecionadas serão <strong>excluídas permanentemente</strong>. Todos os clientes, entregas e mercadorias correspondentes serão unificados na rota destino.
              </span>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isMerging}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleMerge}
            disabled={isMerging || !targetRouteId || selectedSourceIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold px-5"
          >
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mesclando...
              </>
            ) : (
              <>
                <GitMerge className="h-4 w-4" /> Confirmar Mesclagem
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
