import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { nfeApi } from '@/api/nfe'
import { PDFDocument } from 'pdf-lib'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { FileText, Search, Printer, XCircle, Filter, ChevronDown, ChevronUp, CheckCircle, RefreshCw, Layers, Loader2, Archive, AlertCircle } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { NfeEmissionModal } from '@/components/Fiscal/NfeEmissionModal'
import { NfeBackupsModal } from '@/components/Fiscal/NfeBackupsModal'
import { NfeDetailsModal } from '@/components/Fiscal/NfeDetailsModal'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function NfeManagement() {
  const queryClient = useQueryClient()
  const { company } = useAuth()
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterOrderNumber, setFilterOrderNumber] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterNfeSeries, setFilterNfeSeries] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [emitNfeOrderId, setEmitNfeOrderId] = useState<string | null>(null)
  const [isBackupsModalOpen, setIsBackupsModalOpen] = useState(false)
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<any>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const [isBatchProcessing, setIsBatchProcessing] = useState(false)

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['fiscal_orders', company?.id, filterDateFrom, filterDateTo, filterOrderNumber, filterCustomer, filterNfeSeries, filterStatus],
    queryFn: () => company?.id ? nfeApi.getNfes(company.id, {
      periodo_inicio: filterDateFrom,
      periodo_fim: filterDateTo,
      numero_pedido: filterOrderNumber,
      cliente: filterCustomer,
      nfe_series: filterNfeSeries,
      status_nf: filterStatus
    }) : Promise.resolve([]),
    enabled: !!company?.id
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [orders])

  const totalItems = orders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return orders.slice(start, end)
  }, [orders, currentPage])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Aguardando emissão': return 'secondary'
      case 'Em processamento': return 'outline'
      case 'Emitida': return 'default'
      case 'Rejeitada': return 'destructive'
      case 'Cancelada': return 'destructive'
      case 'Denegada': return 'destructive'
      case 'Inutilizada': return 'destructive'
      default: return 'outline'
    }
  }
  
  const getOrderNfeStatus = (order: any) => {
    if (!order.nfe || order.nfe.length === 0) {
      if (order.status === 'Faturado') return 'Aguardando emissão'
      return 'N/A'
    }
    // Retorna o status do registro mais recente
    const sortedNfe = [...order.nfe].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sortedNfe[0].status
  }

  const getOrderNfeRecord = (order: any) => {
    if (!order.nfe || order.nfe.length === 0) return null
    // Retorna o registro mais recente
    const sortedNfe = [...order.nfe].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sortedNfe[0]
  }

  const handleDownloadDanfe = async (nfeId: string) => {
    if (!nfeId) return;
    try {
      toast.info('Baixando PDF...');
      const url = await nfeApi.downloadNfe(nfeId, 'pdf');
      window.open(url, '_blank');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao baixar PDF');
    }
  }

  const handleBatchPrint = async () => {
    if (!company?.id) return
    const elegiveis = orders.filter(o => selectedOrderIds.includes(o.id) && getOrderNfeRecord(o) && getOrderNfeStatus(o) === 'autorizado')
    
    if (elegiveis.length === 0) {
      toast.warning('Nenhum pedido selecionado possui NF-e Autorizada para impressão.')
      return
    }

    setIsBatchProcessing(true)
    toast.info(`Gerando arquivo de impressão unificado com ${elegiveis.length} DANFEs...`)

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const order of elegiveis) {
        const nfe = getOrderNfeRecord(order);
        if (!nfe) continue;
        
        try {
          // O downloadNfe retorna um Object URL apontando para o Blob.
          // Para o pdf-lib precisamos dos bytes originais.
          // Vamos fazer o fetch desse Blob local.
          const objectUrl = await nfeApi.downloadNfe(nfe.id, 'pdf');
          const response = await fetch(objectUrl);
          const pdfBytes = await response.arrayBuffer();
          
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          
          URL.revokeObjectURL(objectUrl); // Libera memória
        } catch (e) {
          console.error(`Erro ao carregar PDF da NFe ${nfe.id}:`, e);
          toast.error(`Falha ao incorporar NF-e do pedido #${order.order_number || order.id.slice(0,5)}`);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      setSelectedOrderIds([]);
      toast.success('Arquivo de impressão gerado com sucesso!');
    } catch (e: any) {
      console.error(e);
      toast.error('Ocorreu um erro ao gerar o arquivo de impressão em lote.');
    } finally {
      setIsBatchProcessing(false);
    }
  }

  const handleBatchEmit = async () => {
    if (!company?.id) return
    const elegiveis = orders.filter(o => selectedOrderIds.includes(o.id) && getOrderNfeStatus(o) === 'Aguardando emissão')
    
    if (elegiveis.length === 0) {
      toast.warning('Nenhum pedido selecionado está apto para emissão.')
      return
    }

    if (!window.confirm(`Você está prestes a emitir ${elegiveis.length} notas fiscais. Deseja continuar?`)) return

    setIsBatchProcessing(true)
    let sucesso = 0
    let erro = 0

    const promises = elegiveis.map(async (order) => {
      try {
        await nfeApi.emitirNfe(company.id, order.id)
        sucesso++
      } catch (e: any) {
        erro++
        console.error(`Erro ao emitir NF para o pedido ${order.id}:`, e)
      }
    })

    await Promise.allSettled(promises)
    
    setIsBatchProcessing(false)
    setSelectedOrderIds([])
    refetch()
    toast.success(`Processamento concluído. Sucesso: ${sucesso}. Erros: ${erro}. Ignorados: ${selectedOrderIds.length - elegiveis.length}`)
  }

  const cancelMutation = useMutation({
    mutationFn: ({ nfeId, justify }: { nfeId: string, justify: string }) => nfeApi.cancelarNfe(company!.id, nfeId, justify),
    onSuccess: () => {
      toast.success('Nota Fiscal cancelada com sucesso')
      refetch()
    },
    onError: (e: any) => toast.error(e.message)
  })

  const cceMutation = useMutation({
    mutationFn: ({ nfeId, correcao }: { nfeId: string, correcao: string }) => nfeApi.emitirCce(company!.id, nfeId, correcao),
    onSuccess: () => {
      toast.success('Carta de Correção emitida com sucesso')
      refetch()
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleBatchCancel = async () => {
    if (!company?.id) return
    const elegiveis = orders.filter(o => selectedOrderIds.includes(o.id) && getOrderNfeStatus(o) === 'autorizado')
    
    if (elegiveis.length === 0) {
      toast.warning('Nenhum pedido selecionado está apto para cancelamento (apenas NFs Autorizadas podem ser canceladas).')
      return
    }

    const justificativa = window.prompt(`Você está prestes a cancelar ${elegiveis.length} notas fiscais.\nDigite a justificativa para o cancelamento (mínimo 15 caracteres):`)
    
    if (!justificativa) return
    if (justificativa.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres.')
      return
    }

    setIsBatchProcessing(true)
    let sucesso = 0
    let erro = 0

    const promises = elegiveis.map(async (order) => {
      try {
        const nfe = getOrderNfeRecord(order)
        if (nfe) {
          await nfeApi.cancelarNfe(company.id, nfe.id, justificativa)
          sucesso++
        }
      } catch (e: any) {
        erro++
      }
    })

    await Promise.allSettled(promises)
    
    setIsBatchProcessing(false)
    setSelectedOrderIds([])
    refetch()
    toast.success(`Cancelamento concluído. Sucesso: ${sucesso}. Erros: ${erro}. Ignorados: ${selectedOrderIds.length - elegiveis.length}`)
  }

  const handleBatchConsult = async () => {
    if (!company?.id) return
    const elegiveis = orders.filter(o => selectedOrderIds.includes(o.id) && getOrderNfeRecord(o))
    
    if (elegiveis.length === 0) {
      toast.warning('Nenhum pedido selecionado possui registro de NF-e para consulta.')
      return
    }

    setIsBatchProcessing(true)
    let sucesso = 0
    let erro = 0

    const promises = elegiveis.map(async (order) => {
      try {
        const nfe = getOrderNfeRecord(order)
        if (nfe) {
          await nfeApi.consultarNfe(company.id, nfe.id)
          sucesso++
        }
      } catch (e: any) {
        erro++
      }
    })

    await Promise.allSettled(promises)
    
    setIsBatchProcessing(false)
    setSelectedOrderIds([])
    refetch()
    toast.success(`Consulta Síncrona concluída. Sucesso: ${sucesso}. Erros: ${erro}.`)
  }

  const today = new Date()
  const isBeginningOfMonth = today.getDate() >= 2 && today.getDate() <= 10

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {isBeginningOfMonth && (
        <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-md flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Lembrete Contábil</h4>
            <p className="text-sm mt-1">
              Já estamos no início do mês! Não se esqueça de baixar o <b>Backup XML</b> das notas emitidas no mês anterior para enviar à sua contabilidade. Clique no botão "Backups e XMLs" ao lado.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Notas Fiscais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tratamento fiscal dos pedidos faturados
          </p>
        </div>
        
        <Button onClick={() => setIsBackupsModalOpen(true)} variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
          <Archive className="mr-2 h-4 w-4" />
          Backups e XMLs
        </Button>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex w-full gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por pedido, cliente ou CNPJ/CPF..." 
                className="pl-9 bg-background/50 h-10 rounded-full"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline"
              className={`gap-2 h-10 rounded-full px-6 ${showAdvancedFilters ? 'bg-primary/5 border-primary text-primary' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros Avançados</span>
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Emissão Pedido (De)</label>
              <Input 
                type="date" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Emissão Pedido (Até)</label>
              <Input 
                type="date" 
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número do Pedido</label>
              <Input 
                placeholder="Ex: 12345" 
                value={filterOrderNumber}
                onChange={e => setFilterOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Série da NF-e</label>
              <Input 
                placeholder="Ex: 1" 
                value={filterNfeSeries}
                onChange={e => setFilterNfeSeries(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status da NF</label>
              <select 
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Aguardando emissão">Aguardando emissão</option>
                <option value="Em processamento">Em processamento</option>
                <option value="Emitida">Emitida</option>
                <option value="Rejeitada">Rejeitada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Denegada">Denegada</option>
                <option value="Inutilizada">Inutilizada</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        className="mb-4 bg-card rounded-xl border border-border shadow-sm"
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium w-12 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        const newSelection = Array.from(new Set([...selectedOrderIds, ...paginatedOrders.map(o => o.id)]))
                        setSelectedOrderIds(newSelection)
                      } else {
                        const paginatedIds = paginatedOrders.map(o => o.id)
                        setSelectedOrderIds(selectedOrderIds.filter(id => !paginatedIds.includes(id)))
                      }
                    }}
                    className="w-4 h-4 accent-primary cursor-pointer align-middle"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Data Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium text-right">Valor Total</th>
                <th className="px-4 py-3 font-medium text-center">Status NF</th>
                <th className="px-4 py-3 font-medium text-center">NF/Série</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ?
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Carregando dados fiscais...</td></tr>
               : paginatedOrders.length === 0 ? 
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido faturado pendente de nota fiscal.</td></tr>
               : (
                paginatedOrders.map(order => {
                  const nfStatus = getOrderNfeStatus(order)
                  const nfeRecord = getOrderNfeRecord(order)
                  
                  return (
                  <tr 
                    key={order.id} 
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedDetailsOrder(order)}
                  >
                    <td className="px-4 py-3 text-center w-12" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, order.id])
                          else setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id))
                        }}
                        className="w-4 h-4 accent-primary cursor-pointer align-middle mt-1"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      #{order.order_number || order.id.slice(0, 5).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold">{order.customer?.legal_name || order.customer?.nickname || order.customer?.fantasy_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {order.customer?.document || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(order.net_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusBadgeVariant(nfStatus)} className={nfStatus === 'autorizado' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
                        {nfStatus}
                      </Badge>
                      {nfStatus === 'Cancelada' && nfeRecord?.error_message && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate mx-auto" title={nfeRecord.error_message}>
                          {nfeRecord.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {nfeRecord?.nfe_number ? `${nfeRecord.nfe_number} / ${nfeRecord.nfe_series}` : '---'}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {nfStatus === 'Aguardando emissão' || nfStatus === 'Rejeitada' || nfStatus === 'erro_autorizacao' || nfStatus === 'erro' ? (
                          <Button size="sm" className="h-8 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setEmitNfeOrderId(order.id)}>
                            <FileText className="h-4 w-4 mr-1" /> Emitir NF-e
                          </Button>
                        ) : null}

                        {nfStatus === 'processando' && (
                          <Button size="sm" variant="outline" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={async () => {
                            if (!company?.id || !nfeRecord?.id) return
                            try {
                              await nfeApi.consultarNfe(company.id, nfeRecord.id)
                              toast.success('Status sincronizado!')
                              refetch()
                            } catch (e: any) {
                              toast.error(e.message)
                            }
                          }}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Sincronizar
                          </Button>
                        )}
                        
                        {nfStatus === 'autorizado' && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={(e) => {
                              e.stopPropagation();
                              if (nfeRecord?.id) handleDownloadDanfe(nfeRecord.id);
                            }}>
                              <Printer className="h-4 w-4 mr-1" /> DANFE
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={(e) => {
                              const correcao = window.prompt("Digite o texto da Carta de Correção (mínimo 15, máximo 1000 caracteres):")
                              if (correcao) {
                                cceMutation.mutate({ nfeId: nfeRecord.id, correcao })
                              }
                            }} disabled={cceMutation.isPending}>
                              <FileText className="h-4 w-4 mr-1" /> Carta de Correção (CCe)
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                              const just = window.prompt("Digite a justificativa de cancelamento (mínimo 15 caracteres):")
                              if (just) {
                                cancelMutation.mutate({ nfeId: nfeRecord.id, justify: just })
                              }
                            }} disabled={cancelMutation.isPending}>
                              <XCircle className="h-4 w-4 mr-1" /> Cancelar NF
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {emitNfeOrderId && (
        <NfeEmissionModal 
          isOpen={true} 
          onClose={() => {
            setEmitNfeOrderId(null)
            refetch()
          }} 
          orderId={emitNfeOrderId}
        />
      )}

      {selectedDetailsOrder && (
        <NfeDetailsModal
          isOpen={!!selectedDetailsOrder}
          onClose={() => setSelectedDetailsOrder(null)}
          order={orders.find(o => o.id === selectedDetailsOrder.id) || selectedDetailsOrder}
          onRefresh={refetch}
          onEmit={() => {
            setSelectedDetailsOrder(null)
            setEmitNfeOrderId(selectedDetailsOrder.id)
          }}
        />
      )}

      <NfeBackupsModal isOpen={isBackupsModalOpen} onClose={() => setIsBackupsModalOpen(false)} />

      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex flex-col sm:flex-row items-center justify-between z-50 gap-4 slide-in-from-bottom-4 animate-in duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full font-bold text-sm">
              {selectedOrderIds.length} selecionado{selectedOrderIds.length > 1 ? 's' : ''}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrderIds([])} className="text-muted-foreground hover:text-foreground">
              Limpar seleção
            </Button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-blue-500 text-blue-600 hover:bg-blue-50 gap-2"
              onClick={handleBatchConsult}
              disabled={isBatchProcessing}
            >
              {isBatchProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sincronizar (Consultar)
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 shadow-sm"
              onClick={handleBatchEmit}
              disabled={isBatchProcessing}
            >
              <Layers className="h-4 w-4 mr-2" /> {isBatchProcessing ? 'Processando...' : 'Emitir Selecionadas'}
            </Button>
            <Button 
              variant="outline" 
              className="h-9"
              disabled={isBatchProcessing}
              onClick={handleBatchPrint}
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
            <Button 
              variant="destructive" 
              className="h-9"
              disabled={isBatchProcessing}
              onClick={handleBatchCancel}
            >
              <XCircle className="h-4 w-4 mr-2" /> Cancelar Lote
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
