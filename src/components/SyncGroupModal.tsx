import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { RefreshCw, AlertTriangle, Check, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { salesApi } from '@/api/sales'
import { operationsApi } from '@/api/operations'
import { deliveriesApi } from '@/api/deliveries'
import type { OperationItem, DeliveryClient } from '@/types/database'

interface Difference {
  product_code: string
  description: string
  old_expected: number
  new_expected: number
  scanned: number
  type: 'added' | 'removed' | 'increased' | 'decreased'
  warning?: string
}

interface ClientDifference {
  customer_id: string
  name: string
  old_orders: string
  new_orders: string
  type: 'added' | 'removed' | 'updated'
}

interface SyncGroupModalProps {
  isOpen: boolean
  onClose: () => void
  operationId: string
  currentClientName: string // Group name is saved in client_name of operation
  companyId: string
  currentItems: OperationItem[]
  currentClients: any[]
  route: any
  allProducts: any[]
  onSyncComplete: () => void
}

export function SyncGroupModal({
  isOpen,
  onClose,
  operationId,
  currentClientName,
  companyId,
  currentItems,
  currentClients,
  route,
  allProducts,
  onSyncComplete
}: SyncGroupModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [diffs, setDiffs] = useState<Difference[]>([])
  const [clientDiffs, setClientDiffs] = useState<ClientDifference[]>([])

  const queryClient = useQueryClient()

  // Fetch groups
  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups', companyId],
    queryFn: () => salesApi.getOrderGroups(companyId),
    enabled: !!companyId && isOpen,
  })

  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
    enabled: isOpen,
  })

  // Attempt to pre-select matching group name
  useEffect(() => {
    if (isOpen && orderGroups.length > 0 && currentClientName) {
      const match = orderGroups.find(g => g.name.toLowerCase() === currentClientName.toLowerCase())
      if (match) {
        setSelectedGroupId(match.id)
      } else {
        setSelectedGroupId('')
      }
      setHasAnalyzed(false)
      setDiffs([])
      setClientDiffs([])
    }
  }, [isOpen, orderGroups, currentClientName])

  const normalizeCode = (s: any) => s ? String(s).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : ''

  const handleAnalyze = async () => {
    if (!selectedGroupId) return
    setIsAnalyzing(true)
    setDiffs([])
    setClientDiffs([])
    try {
      // 1. Get all faturado orders for the selected group
      const groupOrders = orders.filter(o => o.order_group_id === selectedGroupId && o.status === 'Faturado')
      
      if (groupOrders.length === 0) {
        toast.error('Nenhum pedido faturado encontrado para este grupo')
        setIsAnalyzing(false)
        return
      }

      // 2. Fetch detailed items for all these orders
      let allItems: any[] = []
      for (const order of groupOrders) {
        const orderDetails = await salesApi.getSalesOrder(order.id)
        if (orderDetails.items) {
          allItems = allItems.concat(orderDetails.items)
        }
      }

      // 3. Aggregate expected items by product_code
      const itemsMap = new Map<string, any>()
      allItems.forEach(item => {
        const code = item.product?.code || item.product_code || item.product_id
        if (!itemsMap.has(code)) {
          itemsMap.set(code, {
            product_id: item.product_id,
            product_code: code,
            description: item.product?.description || 'Desconhecido',
            quantity_expected: 0,
            system_stock_at_load: item.product?.stock || 0
          })
        }
        itemsMap.get(code).quantity_expected += item.quantity
      })

      const newAggregatedItems = Array.from(itemsMap.values())

      // 4. Compare with current operation items
      const currentMap = new Map(currentItems.map(i => [i.product_code, i]))
      const nextMap = new Map(newAggregatedItems.map(i => [i.product_code, i]))

      const analyzedDiffs: Difference[] = []

      // Check for added or modified items
      newAggregatedItems.forEach(next => {
        const current = currentMap.get(next.product_code)
        if (current) {
          const oldExp = current.quantity_expected
          const newExp = next.quantity_expected
          const scanned = current.quantity_scanned || 0

          if (newExp !== oldExp) {
            let warning = ''
            const type = newExp > oldExp ? 'increased' : 'decreased'
            if (type === 'increased' && scanned > 0) {
              warning = `Já conferido: ${scanned} un. Faltará conferir mais ${newExp - oldExp} un.`
            } else if (type === 'decreased' && scanned > newExp) {
              warning = `Já conferido: ${scanned} un. (acima do novo esperado ${newExp}). Remova ${scanned - newExp} un. do caminhão.`
            }
            analyzedDiffs.push({
              product_code: next.product_code,
              description: next.description,
              old_expected: oldExp,
              new_expected: newExp,
              scanned,
              type,
              warning
            })
          }
        } else {
          analyzedDiffs.push({
            product_code: next.product_code,
            description: next.description,
            old_expected: 0,
            new_expected: next.quantity_expected,
            scanned: 0,
            type: 'added'
          })
        }
      })

      // Check for removed items
      currentItems.forEach(current => {
        // Ignore returns
        if (current.description.startsWith('🔄')) return

        if (!nextMap.has(current.product_code)) {
          let warning = ''
          if (current.quantity_scanned > 0) {
            warning = `Item removido do pedido, mas já foi conferido (${current.quantity_scanned} un.)! Remova as unidades do caminhão.`
          }
          analyzedDiffs.push({
            product_code: current.product_code,
            description: current.description,
            old_expected: current.quantity_expected,
            new_expected: 0,
            scanned: current.quantity_scanned || 0,
            type: 'removed',
            warning
          })
        }
      })

      setDiffs(analyzedDiffs)

      // 5. Compare clients (customers) on route
      const ordersByCustomer = groupOrders.reduce((acc: any, order: any) => {
        const custId = order.customer_id
        if (!custId) return acc
        if (!acc[custId]) {
          acc[custId] = { customer: order.customer, orders: [], items: [] }
        }
        acc[custId].orders.push(order)
        const orderItems = allItems?.filter(i => i.sales_order_id === order.id) || []
        acc[custId].items.push(...orderItems)
        return acc
      }, {})

      const nextCustomerIds = new Set(Object.keys(ordersByCustomer))
      const currentClientMap = new Map(currentClients.map(c => [c.customer_id, c]))

      const analyzedClientDiffs: ClientDifference[] = []

      // Added or updated clients
      Object.keys(ordersByCustomer).forEach(custId => {
        const data = ordersByCustomer[custId]
        const current = currentClientMap.get(custId)
        const name = data.customer?.fantasy_name || data.customer?.legal_name || 'Desconhecido'
        const orderNumbers = data.orders.map((o: any) => o.order_number).join(', ')

        if (current) {
          if (current.order_number !== orderNumbers) {
            analyzedClientDiffs.push({
              customer_id: custId,
              name,
              old_orders: current.order_number || '',
              new_orders: orderNumbers,
              type: 'updated'
            })
          }
        } else {
          analyzedClientDiffs.push({
            customer_id: custId,
            name,
            old_orders: '',
            new_orders: orderNumbers,
            type: 'added'
          })
        }
      })

      // Removed clients
      currentClients.forEach(client => {
        if (client.customer_id && !nextCustomerIds.has(client.customer_id)) {
          analyzedClientDiffs.push({
            customer_id: client.customer_id,
            name: client.name,
            old_orders: client.order_number || '',
            new_orders: '',
            type: 'removed'
          })
        }
      })

      setClientDiffs(analyzedClientDiffs)
      setHasAnalyzed(true)
    } catch (err: any) {
      toast.error(`Erro ao analisar alterações: ${err.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const groupOrders = orders.filter(o => o.order_group_id === selectedGroupId && o.status === 'Faturado')
      
      let allItems: any[] = []
      let loadNotes = ''
      for (const order of groupOrders) {
        const orderDetails = await salesApi.getSalesOrder(order.id)
        if (orderDetails.items) {
          allItems = allItems.concat(orderDetails.items)
        }
        const customerName = orderDetails.customer?.fantasy_name || orderDetails.customer?.legal_name || 'Desconhecido'
        loadNotes += `Pedido: ${order.order_number || order.id.slice(0,5)} - ${customerName}\n`
      }

      // Update Operation Notes
      await supabase.from('operations').update({ notes: loadNotes.trim() }).eq('id', operationId)

      // 1. Process Operation Items Diffs
      for (const diff of diffs) {
        if (diff.type === 'added') {
          const matchedProduct = allProducts.find(p => normalizeCode(p.code) === normalizeCode(diff.product_code))
          await operationsApi.addOperationItem(operationId, {
            product_id: matchedProduct?.id || '',
            product_code: diff.product_code,
            description: diff.description,
            quantity_expected: diff.new_expected,
            quantity_scanned: 0,
            status: 'pending',
            system_stock_at_load: matchedProduct?.stock || 0
          })
        } else if (diff.type === 'removed') {
          const existing = currentItems.find(i => i.product_code === diff.product_code)
          if (existing) {
            if (existing.quantity_scanned === 0) {
              await operationsApi.deleteOperationItem(existing.id)
            } else {
              await operationsApi.updateItemExpectedQty(existing.id, 0)
              await operationsApi.updateItemQuantity(existing.id, existing.quantity_scanned, 'ok')
            }
          }
        } else if (diff.type === 'increased' || diff.type === 'decreased') {
          const existing = currentItems.find(i => i.product_code === diff.product_code)
          if (existing) {
            await operationsApi.updateItemExpectedQty(existing.id, diff.new_expected)
            const ns = existing.quantity_scanned >= diff.new_expected ? 'ok' : 'pending'
            await operationsApi.updateItemQuantity(existing.id, existing.quantity_scanned, ns)
          }
        }
      }

      // 2. Process Route Client & Item updates
      if (route?.id) {
        const ordersByCustomer = groupOrders.reduce((acc: any, order: any) => {
          const custId = order.customer_id
          if (!custId) return acc
          if (!acc[custId]) {
            acc[custId] = { customer: order.customer, orders: [], items: [] }
          }
          acc[custId].orders.push(order)
          const orderItems = allItems?.filter(i => i.sales_order_id === order.id) || []
          acc[custId].items.push(...orderItems)
          return acc
        }, {})

        // A. Remove clients
        for (const clientDiff of clientDiffs) {
          if (clientDiff.type === 'removed') {
            const existingClient = currentClients.find(c => c.customer_id === clientDiff.customer_id)
            if (existingClient) {
              const clientItems = await deliveriesApi.getDeliveryItems(existingClient.id)
              let hasScanned = false
              for (const item of clientItems) {
                if (item.quantity_scanned > 0) {
                  hasScanned = true
                  await deliveriesApi.updateDeliveryItem(item.id, { quantity_expected: 0 })
                } else {
                  await deliveriesApi.deleteDeliveryItem(item.id)
                }
              }
              if (!hasScanned) {
                await deliveriesApi.deleteDeliveryClient(existingClient.id)
              }
            }
          }
        }

        // B. Add new clients
        for (const clientDiff of clientDiffs) {
          if (clientDiff.type === 'added') {
            const custId = clientDiff.customer_id
            const { customer, orders: custOrders, items } = ordersByCustomer[custId]
            const orderNumbers = custOrders.map((o: any) => o.order_number).join(', ')

            const client = await deliveriesApi.createDeliveryClient({
              company_id: companyId,
              delivery_route_id: route.id,
              customer_id: custId,
              name: customer.fantasy_name || customer.legal_name || 'Desconhecido',
              order_number: orderNumbers,
              address: `${customer.address || ''}, ${customer.number || ''} - ${customer.city || ''}/${customer.state || ''}`,
              phone: customer.phone1,
              latitude: customer.latitude,
              longitude: customer.longitude,
              status: 'pending'
            })

            const clientItemsMap = items.reduce((acc: any, item: any) => {
              const code = item.product?.code || item.product_code || item.product_id
              if (!acc[code]) {
                acc[code] = { ...item }
              } else {
                acc[code].quantity += item.quantity
              }
              return acc
            }, {})

            for (const code of Object.keys(clientItemsMap)) {
              const item = clientItemsMap[code]
              await deliveriesApi.createDeliveryItem({
                company_id: companyId,
                delivery_client_id: client.id,
                product_id: item.product_id,
                product_code: code,
                description: item.product?.description || 'Produto',
                quantity_expected: item.quantity,
                quantity_scanned: 0,
                status: 'pending'
              })
            }
          }
        }

        // C. Update existing clients
        for (const clientDiff of clientDiffs) {
          if (clientDiff.type === 'updated') {
            const existingClient = currentClients.find(c => c.customer_id === clientDiff.customer_id)
            if (existingClient) {
              await deliveriesApi.updateDeliveryClient(existingClient.id, { order_number: clientDiff.new_orders })

              const clientItems = await deliveriesApi.getDeliveryItems(existingClient.id)
              const existingItemsMap = new Map<string, any>(clientItems.map((i: any) => [i.product_code, i]))

              const custId = clientDiff.customer_id
              const { items } = ordersByCustomer[custId]
              const clientItemsMap = items.reduce((acc: any, item: any) => {
                const code = item.product?.code || item.product_code || item.product_id
                if (!acc[code]) {
                  acc[code] = { ...item }
                } else {
                  acc[code].quantity += item.quantity
                }
                return acc
              }, {})

              for (const code of Object.keys(clientItemsMap)) {
                const item = clientItemsMap[code]
                const existingItem = existingItemsMap.get(code)
                if (existingItem) {
                  if (existingItem.quantity_expected !== item.quantity) {
                    await deliveriesApi.updateDeliveryItem(existingItem.id, { quantity_expected: item.quantity })
                  }
                } else {
                  await deliveriesApi.createDeliveryItem({
                    company_id: companyId,
                    delivery_client_id: existingClient.id,
                    product_id: item.product_id,
                    product_code: code,
                    description: item.product?.description || 'Produto',
                    quantity_expected: item.quantity,
                    quantity_scanned: 0,
                    status: 'pending'
                  })
                }
              }

              for (const existingItem of clientItems) {
                if (!clientItemsMap[existingItem.product_code]) {
                  if (existingItem.quantity_scanned === 0) {
                    await deliveriesApi.deleteDeliveryItem(existingItem.id)
                  } else {
                    await deliveriesApi.updateDeliveryItem(existingItem.id, { quantity_expected: 0 })
                  }
                }
              }
            }
          }
        }
      }

      toast.success('Carregamento sincronizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['operation', operationId] })
      queryClient.invalidateQueries({ queryKey: ['operation_items', operationId] })
      if (route?.id) {
        queryClient.invalidateQueries({ queryKey: ['delivery_clients', route.id] })
      }
      onSyncComplete()
      onClose()
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const hasWarnings = useMemo(() => {
    return diffs.some(d => d.warning)
  }, [diffs])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-500" /> Sincronizar com Grupo
          </DialogTitle>
          <DialogDescription>
            Busca novas alterações no grupo de pedidos (pedidos faturados adicionados, removidos ou quantidades editadas).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 flex-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Grupo de Pedidos</label>
            <div className="flex gap-2">
              <select
                className="flex-1 h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={selectedGroupId}
                onChange={e => {
                  setSelectedGroupId(e.target.value)
                  setHasAnalyzed(false)
                  setDiffs([])
                  setClientDiffs([])
                }}
                disabled={isAnalyzing || isSyncing}
              >
                <option value="">-- Escolha um Grupo --</option>
                {orderGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <Button 
                onClick={handleAnalyze} 
                disabled={!selectedGroupId || isAnalyzing || isSyncing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Analisar Alterações'
                )}
              </Button>
            </div>
          </div>

          {hasAnalyzed && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              {diffs.length === 0 && clientDiffs.length === 0 ? (
                <div className="p-4 bg-muted/30 border rounded-lg text-center text-sm text-muted-foreground">
                  Nenhuma alteração encontrada. A carga e a rota já estão totalmente sincronizadas com os pedidos deste grupo.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Warnings Banner if any scanned items are affected */}
                  {hasWarnings && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Atenção ao Carregamento Físico:</span>
                        Alguns itens alterados já foram bipados/conferidos. Por favor, leia as instruções de aviso abaixo para ajustar a quantidade física no caminhão.
                      </div>
                    </div>
                  )}

                  {/* Products Diffs */}
                  {diffs.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-sm font-bold text-foreground">Alterações de Itens ({diffs.length})</h4>
                      <div className="border rounded-lg overflow-hidden divide-y bg-background/50">
                        {diffs.map((diff, index) => {
                          const badgeStyles = {
                            added: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            removed: 'bg-red-500/10 text-red-600 border-red-500/20',
                            increased: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                            decreased: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }
                          const labels = {
                            added: 'Adicionado',
                            removed: 'Removido',
                            increased: 'Quantidade Aumentada',
                            decreased: 'Quantidade Reduzida'
                          }

                          return (
                            <div key={index} className="p-3 flex flex-col gap-1.5 hover:bg-muted/20">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-xs font-mono font-bold text-muted-foreground block">{diff.product_code}</span>
                                  <span className="text-sm font-semibold text-foreground leading-tight">{diff.description}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${badgeStyles[diff.type]}`}>
                                  {labels[diff.type]}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Esperado: <strong className="text-foreground">{diff.old_expected} → {diff.new_expected}</strong></span>
                                <span>Conferido: <strong className="text-foreground">{diff.scanned}</strong></span>
                              </div>
                              {diff.warning && (
                                <div className="p-2 bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400 text-xs rounded flex items-center gap-1.5">
                                  <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span>{diff.warning}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Route Client Diffs */}
                  {clientDiffs.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-sm font-bold text-foreground">Alterações de Clientes/Pedidos na Rota ({clientDiffs.length})</h4>
                      <div className="border rounded-lg overflow-hidden divide-y bg-background/50">
                        {clientDiffs.map((client, index) => {
                          const badgeStyles = {
                            added: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                            removed: 'bg-red-500/10 text-red-600 border-red-500/20',
                            updated: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }
                          const labels = {
                            added: 'Novo Cliente',
                            removed: 'Cliente Removido',
                            updated: 'Pedidos Atualizados'
                          }

                          return (
                            <div key={index} className="p-3 flex flex-col gap-1 hover:bg-muted/20">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-semibold text-foreground leading-tight">{client.name}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${badgeStyles[client.type]}`}>
                                  {labels[client.type]}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {client.type === 'added' && <span>Pedidos: <strong className="text-foreground">{client.new_orders}</strong></span>}
                                {client.type === 'removed' && <span>Pedidos anteriores: <strong className="text-foreground">{client.old_orders}</strong></span>}
                                {client.type === 'updated' && <span>Pedidos: <strong className="text-foreground">{client.old_orders} → {client.new_orders}</strong></span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSyncing}>
            Cancelar
          </Button>
          {hasAnalyzed && (diffs.length > 0 || clientDiffs.length > 0) && (
            <Button onClick={handleSync} disabled={isSyncing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar e Sincronizar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
