import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { salesApi } from '@/api/sales'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, Plus, Printer, Settings, FileText, Store, Calendar, DollarSign, MessageSquare, FileDigit, Trash2, Boxes, Upload, CheckSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { OrderDetailsModal } from '@/components/Sales/OrderDetailsModal'
import { ImportOrdersModal } from './ImportOrdersModal'
import { Pagination } from '@/components/ui/Pagination'

export default function SalesOrders() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { user, company, isMaster } = useAuth()
  const queryClient = useQueryClient()

  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups', company?.id],
    queryFn: () => salesApi.getOrderGroups(company?.id),
    enabled: !!company?.id,
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const isVendedor = user?.role === 'vendedor' || user?.role === 'representante'

  const filteredOrders = orders.filter(o => {
    // Esconde os pedidos importados via planilha do App Força de Vendas
    if (o.notes?.includes('[Origem: Importação Planilha]')) {
      return false
    }

    if (isVendedor && !isMaster) {
      const repName = o.sales_rep?.nickname || o.sales_rep?.legal_name
      if (repName !== user?.name) {
        return false
      }
    }

    if (selectedGroupId && o.order_group_id !== selectedGroupId) {
      return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return o.id.toLowerCase().includes(term) ||
             o.customer?.fantasy_name?.toLowerCase().includes(term) ||
             o.customer?.legal_name?.toLowerCase().includes(term) ||
             o.order_number?.toString().includes(term)
    }
    return true
  })

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Batch actions
  const batchUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[], status: string }) => salesApi.batchUpdateOrdersStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Status atualizado com sucesso!')
      setSelectedOrders([])
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const batchUpdateGroupMutation = useMutation({
    mutationFn: ({ ids, groupId }: { ids: string[], groupId: string | null }) => salesApi.batchUpdateOrdersGroup(ids, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Grupo atribuído com sucesso!')
      setSelectedOrders([])
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => salesApi.batchDeleteOrders(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Pedidos excluídos com sucesso!')
      setSelectedOrders([])
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const handleToggleSelection = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation()
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id])
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(paginatedOrders.map(o => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  // Group by date logic (mocking "HOJE" for all to match the design)
  const groupedOrders = {
    'HOJE': paginatedOrders
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Digitação':
        return <span className="bg-yellow-200 text-yellow-800 text-[11px] font-bold px-3 py-1 rounded-full">Em Digitação</span>
      case 'Aprovado':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full">Aprovado</span>
      case 'Faturado':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-3 py-1 rounded-full">Faturado</span>
      case 'Retornou':
        return <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-3 py-1 rounded-full">Retornou</span>
      case 'Entregue':
        return <span className="bg-green-100 text-green-800 text-[11px] font-bold px-3 py-1 rounded-full">Entregue</span>
      case 'Cancelado':
        return <span className="bg-red-100 text-red-800 text-[11px] font-bold px-3 py-1 rounded-full">Cancelado</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full">{status}</span>
    }
  }

  return (
    <div className="space-y-6 slide-in max-w-6xl mx-auto pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Meus Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie seus orçamentos e pedidos de venda</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/vendas/novo-pedido">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 h-10 shadow-sm rounded-md">
              <Plus className="h-4 w-4 mr-2" /> Criar pedido / orçamento
            </Button>
          </Link>


          
          <Button variant="outline" className="text-primary border-border bg-background font-semibold px-4 h-10 rounded-md">
            <Printer className="h-4 w-4 mr-2" /> Imprimir pedidos
          </Button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Input 
              placeholder="Pedido, cliente ou representante..." 
              className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <select
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
            >
              <option value="">Todos os Grupos</option>
              {orderGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        className="bg-muted/20 p-2 rounded-lg border border-border/50 mb-4"
      />

      {paginatedOrders.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-2">
          <input 
            type="checkbox" 
            style={{ appearance: 'checkbox', WebkitAppearance: 'checkbox' }}
            className="w-5 h-5 accent-primary cursor-pointer"
            checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
            onChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground font-medium">Selecionar todos os pedidos desta página</span>
        </div>
      )}

        {/* List */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Carregando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Nenhum pedido encontrado.</div>
        ) : (
          Object.entries(groupedOrders).map(([dateLabel, orders]) => (
            <div key={dateLabel} className="mb-12">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider mb-3">{dateLabel}</h3>
              <div className="space-y-3">
                {orders.map(order => {
                  const isEditable = !['Faturado', 'Retornou', 'Entregue', 'Cancelado'].includes(order.status)
                  return (
                  <div key={order.id} onClick={() => {
                    if (isEditable) {
                      navigate(`/vendas/novo-pedido?id=${order.id}`)
                    } else {
                      setSelectedOrderId(order.id)
                      setIsDetailsOpen(true)
                    }
                  }} className={`bg-card border ${selectedOrders.includes(order.id) ? 'border-primary ring-1 ring-primary' : 'border-border'} rounded-md p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors shadow-sm relative group flex justify-between items-start`}>
                    
                    {/* Left Side */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          style={{ appearance: 'checkbox', WebkitAppearance: 'checkbox' }}
                          className="w-5 h-5 accent-primary cursor-pointer"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => handleToggleSelection(e, order.id)}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="text-xs font-medium text-foreground">
                        <span className="text-primary font-bold">#{order.order_number || order.id.slice(0, 5).toUpperCase()}</span> emitido por <span className="uppercase text-muted-foreground">{order.sales_rep?.nickname || 'Vendedor'}</span>
                      </div>
                      
                      {order.customer && (
                        <div className="text-[10px] text-muted-foreground uppercase flex flex-col gap-1.5 ml-0.5">
                          <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-muted-foreground/60" /> {order.customer.legal_name || order.customer.fantasy_name}
                          </div>
                          {order.customer.fantasy_name && order.customer.fantasy_name !== order.customer.legal_name && (
                            <div className="ml-5 text-muted-foreground/80">{order.customer.fantasy_name}</div>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" /> {order.payment_condition?.name || 'A VISTA'}
                          </div>
                          {order.order_group_id && (
                            <div className="flex items-center gap-2 mt-0.5 text-blue-600/80">
                              <Boxes className="h-3.5 w-3.5" /> 
                              {orderGroups.find((g: any) => g.id === order.order_group_id)?.name || 'Grupo'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-2 font-bold text-sm text-foreground">
                        {order.status === 'Digitação' ? (
                          <span className="text-foreground text-xs">{formatCurrency(order.net_amount || 0)}</span>
                        ) : (
                          <>
                            <div className="bg-emerald-500 rounded-full flex items-center justify-center h-4 w-4">
                               <DollarSign className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-foreground">{formatCurrency(order.net_amount || 0)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col justify-between items-end h-full min-h-[80px]">
                      {getStatusBadge(order.status)}
                      {!isEditable && (
                        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block"></span> Somente Leitura
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        className="bg-muted/20 p-2 rounded-lg border border-border/50 mt-4"
      />
      
      <OrderDetailsModal 
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        orderId={selectedOrderId}
      />

      <ImportOrdersModal 
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />

      {selectedOrders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex flex-col sm:flex-row items-center justify-between z-50 gap-4 slide-in-from-bottom-4 animate-in duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold text-sm">
              {selectedOrders.length} selecionado{selectedOrders.length > 1 ? 's' : ''}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])} className="text-muted-foreground hover:text-foreground">
              Limpar seleção
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
              value=""
              onChange={(e) => {
                if(e.target.value) {
                  batchUpdateGroupMutation.mutate({ ids: selectedOrders, groupId: e.target.value === 'null' ? null : e.target.value })
                }
              }}
              disabled={batchUpdateGroupMutation.isPending}
            >
              <option value="" disabled>Atribuir a Grupo...</option>
              <option value="null">Nenhum Grupo</option>
              {orderGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select 
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
              value=""
              onChange={(e) => {
                if(e.target.value && confirm(`Mudar o status de ${selectedOrders.length} pedido(s) para ${e.target.value}?`)) {
                  batchUpdateStatusMutation.mutate({ ids: selectedOrders, status: e.target.value })
                }
              }}
              disabled={batchUpdateStatusMutation.isPending}
            >
              <option value="" disabled>Mudar Status para...</option>
              <option value="Digitação">Em Digitação</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Enviado">Enviado</option>
              <option value="Faturado">Faturado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>

            <Button 
              variant="destructive" 
              size="sm"
              className="h-9"
              disabled={batchDeleteMutation.isPending}
              onClick={() => {
                if(confirm(`Tem certeza que deseja excluir ${selectedOrders.length} pedido(s)? (Somente pedidos em digitação serão afetados)`)) {
                  batchDeleteMutation.mutate(selectedOrders)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

