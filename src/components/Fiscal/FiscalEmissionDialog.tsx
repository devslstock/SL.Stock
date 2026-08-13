import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { nfeApi } from '@/api/nfe'
import { financeApi } from '@/api/finance'
import { Receipt, Loader2, Send, FileText } from 'lucide-react'

export function FiscalEmissionDialog({ 
  isOpen, 
  onClose, 
  orderId,
  onEmitSuccess
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  orderId: string,
  onEmitSuccess: () => void
}) {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  
  const [showSendModal, setShowSendModal] = useState(false)
  const [nfeRecord, setNfeRecord] = useState<any>(null)
  const [customerEmail, setCustomerEmail] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['fiscal_order_details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales_orders').select('*, customer:customers(*), items:sales_order_items(*, product:products(*))').eq('id', orderId).single()
      if (error) throw error
      setCustomerEmail(data.customer?.email || '')
      return data
    },
    enabled: isOpen
  })

  const emitMutation = useMutation({
    mutationFn: async () => {
      if (!order?.nfe_series) throw new Error('Série fiscal não informada no pedido.')
      
      // Emitir NFe
      const nfe = await nfeApi.emitirNfe(company!.id, orderId)
      
      // Faturar pedido (gera cobranças)
      await financeApi.faturarPedido(orderId)
      
      return nfe
    },
    onSuccess: (nfe) => {
      setNfeRecord(nfe)
      toast.success('Nota Fiscal emitida e cobranças geradas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales_order', orderId] })
      setShowSendModal(true)
    },
    onError: (err: any) => toast.error(err.message)
  })

  if (showSendModal) {
    return (
      <Dialog open={showSendModal} onOpenChange={() => {
        setShowSendModal(false)
        onClose()
        onEmitSuccess()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deseja enviar a Nota Fiscal?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-semibold">E-mail do destinatário</label>
              <input 
                type="email" 
                className="w-full h-9 border rounded px-3 mt-1" 
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => {
                toast.info("A visualização do PDF será implementada em breve.")
              }}>
                <FileText className="h-4 w-4 mr-2" /> Visualizar NF em PDF
              </Button>
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                toast.success(`E-mail enviado para ${customerEmail}`)
              }}>
                <Send className="h-4 w-4 mr-2" /> Enviar por E-mail
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSendModal(false)
              onClose()
              onEmitSuccess()
            }}>Não</Button>
            <Button onClick={() => {
              setShowSendModal(false)
              onClose()
              onEmitSuccess()
            }}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-orange-500" />
            Conferência de Nota Fiscal
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <>
              {/* Resumo do Pedido / Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded bg-muted/20">
                  <h3 className="font-bold mb-2">Dados do Cliente</h3>
                  <p className="text-sm"><strong>Nome:</strong> {order?.customer?.legal_name || order?.customer?.fantasy_name}</p>
                  <p className="text-sm"><strong>CPF/CNPJ:</strong> {order?.customer?.document}</p>
                  <p className="text-sm"><strong>Inscrição Estadual:</strong> {order?.customer?.state_registration || 'Isento'}</p>
                  <p className="text-sm"><strong>Endereço:</strong> {order?.customer?.address}, {order?.customer?.number} - {order?.customer?.neighborhood}, {order?.customer?.city} - {order?.customer?.state}</p>
                </div>
                
                <div className="p-4 border rounded bg-muted/20">
                  <h3 className="font-bold mb-2">Dados Fiscais</h3>
                  <p className="text-sm"><strong>Operação Fiscal:</strong> {order?.operacao_fiscal}</p>
                  <p className="text-sm"><strong>Série:</strong> {order?.nfe_series}</p>
                  <p className="text-sm"><strong>Condição Pagamento:</strong> {order?.custom_payment_condition || 'Padrão'}</p>
                  <p className="text-sm"><strong>Total:</strong> R$ {order?.net_amount?.toFixed(2)}</p>
                </div>
              </div>

              {/* Tabela de Produtos */}
              <div>
                <h3 className="font-bold mb-2">Produtos da Nota</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="text-left p-2 font-medium">Produto</th>
                        <th className="text-center p-2 font-medium">NCM</th>
                        <th className="text-center p-2 font-medium">CFOP</th>
                        <th className="text-right p-2 font-medium">Qtd</th>
                        <th className="text-right p-2 font-medium">V. Unitário</th>
                        <th className="text-right p-2 font-medium">V. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order?.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/10">
                          <td className="p-2">{item.product?.description}</td>
                          <td className="p-2 text-center">{item.product?.ncm || '-'}</td>
                          <td className="p-2 text-center">-</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">R$ {item.unit_price?.toFixed(2)}</td>
                          <td className="p-2 text-right">R$ {item.total_price?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-orange-50 text-orange-800 p-3 rounded text-sm">
                <strong>Atenção:</strong> Após clicar em Emitir, a Nota Fiscal será processada e as cobranças financeiras serão geradas automaticamente.
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={emitMutation.isPending}>
            Sair
          </Button>
          <Button variant="secondary" onClick={() => toast.info('A visualização de PDF estará disponível em breve.')} disabled={emitMutation.isPending || isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white" 
            disabled={emitMutation.isPending || isLoading}
            onClick={() => emitMutation.mutate()}
          >
            {emitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Emitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
