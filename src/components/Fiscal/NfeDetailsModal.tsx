import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Printer, RefreshCw, XCircle, FileText, AlertTriangle, FileCode, Mail } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NfeEventHistory } from './NfeEventHistory'
import { CceModal } from './CceModal'
import { CancelNfeModal } from './CancelNfeModal'
import { EmailNfeModal } from './EmailNfeModal'
import { XmlViewerModal } from './XmlViewerModal'
import type { SalesOrder, NfeRecord } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'
import { nfeApi } from '@/api/nfe'

interface NfeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: (SalesOrder & { nfe: NfeRecord[] }) | null
  onRefresh: () => void
  onEmit?: () => void
}

export function NfeDetailsModal({ isOpen, onClose, order, onRefresh, onEmit }: NfeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('resumo')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCceModalOpen, setIsCceModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isDownloadingXml, setIsDownloadingXml] = useState(false)
  
  const [xmlViewerData, setXmlViewerData] = useState<{ isOpen: boolean, xmlString: string | null, filename: string }>({
    isOpen: false,
    xmlString: null,
    filename: ''
  })

  if (!order) return null

  const nfe = order.nfe && order.nfe.length > 0 ? order.nfe[0] : null
  const nfStatus = nfe ? nfe.status.toLowerCase() : 'aguardando emissão'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '---'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const isError = nfStatus === 'erro' || nfStatus === 'rejeitada' || nfStatus === 'cancelada' || nfStatus === 'erro_autorizacao'
  
  // Helper to parse Focus NFe error JSON if it's a stringified array/object
  const getReadableErrorMessage = (msg: string | null) => {
    if (!msg) return ''
    try {
      const parsed = JSON.parse(msg)
      if (Array.isArray(parsed)) {
        return parsed.map(err => err.mensagem || err.codigo || JSON.stringify(err)).join('\n')
      }
      if (parsed.mensagem) return parsed.mensagem
    } catch {
      return msg
    }
  }

  const handleRefreshStatus = async () => {
    if (!nfe) {
      onRefresh()
      return
    }
    
    setIsRefreshing(true)
    try {
      const { error } = await supabase.functions.invoke('get-nfe-status', {
        body: { id: nfe.id }
      })
      
      if (error) throw error
      
      toast.success('Status sincronizado com a SEFAZ!')
      onRefresh()
    } catch (err: any) {
      console.error('Erro ao buscar status NFe:', err)
      toast.error(err.message || 'Erro ao sincronizar status')
      onRefresh() // Atualiza a tela mesmo em erro pra puxar DB
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleViewDoc = async (type: 'pdf' | 'xml') => {
    if (!nfe) return;
    
    if (type === 'pdf') setIsDownloadingPdf(true)
    else setIsDownloadingXml(true)
    
    try {
      const { url, text } = await nfeApi.downloadNfe(nfe.id, type);
      
      if (type === 'pdf') {
        window.open(url, '_blank');
      } else {
        setXmlViewerData({
          isOpen: true,
          xmlString: text,
          filename: `NFe_${nfe.numero || nfe.id.slice(0,8)}.xml`
        })
      }
    } catch (err: any) {
      toast.error(err.message || `Erro ao visualizar ${type.toUpperCase()}`);
    } finally {
      if (type === 'pdf') setIsDownloadingPdf(false)
      else setIsDownloadingXml(false)
    }
  }

  const handleDownloadOnly = async (type: 'pdf' | 'xml') => {
    if (!nfe) return;
    try {
      const { url } = await nfeApi.downloadNfe(nfe.id, type);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.toUpperCase()}_NFe_${nfe.numero || nfe.id.slice(0,8)}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || `Erro ao baixar ${type.toUpperCase()}`);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0 overflow-hidden bg-gray-50 border-none rounded-xl">
        <DialogHeader className="p-4 bg-white border-b flex-shrink-0 flex flex-row items-center justify-between shadow-sm z-10 rounded-t-xl">
          <div>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
              Nota Fiscal {nfe?.nfe_number ? `Nº ${nfe.nfe_number}` : ''}
              <Badge variant={nfStatus === 'autorizado' ? 'default' : isError ? 'destructive' : 'secondary'} className={nfStatus === 'autorizado' ? 'bg-emerald-500' : ''}>
                {nfStatus.toUpperCase()}
              </Badge>
            </DialogTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={handleRefreshStatus} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Fechar">
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {isError && nfe?.error_message && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold">Atenção: A SEFAZ rejeitou a nota ou ocorreu um erro de validação</h4>
                <p className="text-sm mt-1 whitespace-pre-wrap">{getReadableErrorMessage(nfe.error_message)}</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-[400px] mb-6 grid grid-cols-2 bg-gray-100/80 p-1">
              <TabsTrigger value="resumo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Resumo da NF-e</TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Histórico de Eventos</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-6 mt-0 border-0 p-0">
              {/* Cabeçalho Superior (Destinatário e Dados NFe) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Destinatário</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nome / Razão Social</label>
                      <p className="font-medium text-gray-900">{order.customer?.legal_name || order.customer?.nickname || order.customer?.fantasy_name}</p>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">CNPJ / CPF</label>
                      <p className="font-medium text-gray-900">{order.customer?.document || 'Não informado'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Endereço Completo</label>
                      <p className="text-gray-800">
                        {order.customer?.address || '---'}, {order.customer?.number || '---'} - {order.customer?.neighborhood || '---'}
                        <br />
                        {order.customer?.city || '---'}/{order.customer?.state || '---'} - CEP: {order.customer?.cep || '---'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Dados da Emissão</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Pedido Relacionado</label>
                      <p className="font-medium text-primary cursor-pointer hover:underline">#{order.order_number || order.id.slice(0,8)}</p>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Chave de Acesso</label>
                      <Input readOnly value={nfe?.access_key || 'Não gerada'} className="h-8 mt-1 text-xs font-mono bg-gray-50 focus-visible:ring-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Série / Número</label>
                        <p className="font-medium text-gray-900">{nfe?.nfe_series || '-'} / {nfe?.nfe_number || '-'}</p>
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Data / Hora</label>
                        <p className="text-gray-900">{formatDate(nfe?.issued_at || nfe?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Produtos Tabela */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Produtos e Serviços</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Código</th>
                        <th className="px-5 py-3 font-semibold">Descrição</th>
                        <th className="px-5 py-3 font-semibold">NCM</th>
                        <th className="px-5 py-3 font-semibold">CFOP</th>
                        <th className="px-5 py-3 font-semibold">Qtde</th>
                        <th className="px-5 py-3 font-semibold">Unid</th>
                        <th className="px-5 py-3 font-semibold text-right">Vl Unit</th>
                        <th className="px-5 py-3 font-semibold text-right">Vl Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items?.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3 text-gray-600">{item.product?.code || item.product_id?.slice(0, 5)}</td>
                          <td className="px-5 py-3 font-medium text-gray-900">{item.product?.description || item.description || 'Produto Sem Nome'}</td>
                          <td className="px-5 py-3 text-gray-600">{item.product?.ncm || item.ncm || '---'}</td>
                          <td className="px-5 py-3 text-gray-600">{item.product?.cfop || item.cfop || '---'}</td>
                          <td className="px-5 py-3 font-medium">{item.quantity}</td>
                          <td className="px-5 py-3 text-gray-600">{item.product?.unit_measure || 'UN'}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais e Impostos */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Resumo Financeiro</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Produtos/Serviços</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.net_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor do Frete</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.frete || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor do Seguro</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.seguro || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Descontos</span>
                      <span className="font-medium text-red-500">-{formatCurrency(order.total_discount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-3 border-t mt-3">
                      <span className="text-gray-800">Valor Total da Nota</span>
                      <span className="text-emerald-600">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Informações Adicionais</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[120px] whitespace-pre-wrap font-mono">
                    {order.obs_contribuinte || order.obs_fisco || 'Nenhuma informação complementar enviada na nota.'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-0 border-0 p-0">
              <NfeEventHistory nfeId={nfe?.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-3 justify-end rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" className="h-10 bg-white" onClick={onClose}>
            Fechar
          </Button>

          {(nfStatus === 'aguardando emissão' || nfStatus === 'rejeitada' || nfStatus === 'erro_autorizacao' || nfStatus === 'erro') && onEmit && (
            <Button className="h-10 bg-orange-500 hover:bg-orange-600 text-white" onClick={onEmit}>
              <FileText className="h-4 w-4 mr-2" /> {nfe ? 'Reenviar NF-e' : 'Emitir NF-e'}
            </Button>
          )}

          <Button variant="outline" className="h-10 bg-white" onClick={() => handleViewDoc('xml')} disabled={!nfe?.xml_url || isDownloadingXml}>
            {isDownloadingXml ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" /> : <FileCode className="h-4 w-4 mr-2 text-gray-500" />}
            Visualizar XML
          </Button>
          <Button variant="outline" className="h-10 bg-white" onClick={() => handleDownloadOnly('xml')} disabled={!nfe?.xml_url}>
            Baixar XML
          </Button>
          <Button variant="outline" className="h-10 bg-white" onClick={() => handleViewDoc('pdf')} disabled={!nfe?.pdf_url || isDownloadingPdf}>
            {isDownloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" /> : <Printer className="h-4 w-4 mr-2 text-gray-500" />}
            Visualizar PDF
          </Button>
          <Button variant="outline" className="h-10 bg-white" onClick={() => handleDownloadOnly('pdf')} disabled={!nfe?.pdf_url}>
            Baixar PDF
          </Button>
          <Button variant="outline" className="h-10 bg-white" disabled={nfStatus !== 'autorizado'} onClick={() => setIsEmailModalOpen(true)}>
            <Mail className="h-4 w-4 mr-2 text-primary" /> Enviar por E-mail
          </Button>
          <Button variant="outline" className="h-10 bg-white text-amber-600 border-amber-200 hover:bg-amber-50" disabled={nfStatus !== 'autorizado'} onClick={() => setIsCceModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" /> Carta de Correção
          </Button>
          <Button variant="outline" className="h-10 bg-white text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" disabled={nfStatus !== 'autorizado'} onClick={() => setIsCancelModalOpen(true)}>
            <XCircle className="h-4 w-4 mr-2" /> Cancelar NF-e
          </Button>
        </div>
      </DialogContent>

      {nfe && (
        <>
          <CceModal 
            isOpen={isCceModalOpen} 
            onClose={() => setIsCceModalOpen(false)} 
            nfeId={nfe.id} 
            onSuccess={onRefresh} 
          />
          <CancelNfeModal 
            isOpen={isCancelModalOpen} 
            onClose={() => setIsCancelModalOpen(false)} 
            nfeId={nfe.id} 
            onSuccess={onRefresh} 
          />
          <EmailNfeModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            nfeId={nfe.id}
            defaultEmail={order.customer?.email || undefined}
          />
          {xmlViewerData.isOpen && (
            <XmlViewerModal
              isOpen={xmlViewerData.isOpen}
              onClose={() => setXmlViewerData(prev => ({ ...prev, isOpen: false }))}
              xmlString={xmlViewerData.xmlString}
              filename={xmlViewerData.filename}
            />
          )}
        </>
      )}
    </Dialog>
  )
}
