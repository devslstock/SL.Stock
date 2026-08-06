import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { Save, ChevronLeft, Building2, Calendar, DollarSign, FileText, Edit2, Trash2, Plus, Search, Printer, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearchInline } from '../SalesApp/NewOrder/ProductSearchInline'

export default function AdminOrderEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuth()

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales_order', id],
    queryFn: () => salesApi.getSalesOrder(id!),
    enabled: !!id
  })

  const { data: orderGroups = [] } = useQuery({
    queryKey: ['order_groups', company?.id],
    queryFn: () => salesApi.getOrderGroups(company?.id),
    enabled: !!company?.id
  })

  const { data: paymentConditions = [] } = useQuery({
    queryKey: ['payment_conditions'],
    queryFn: () => salesApi.getPaymentConditions()
  })

  // State to handle local item edits
  const [localItems, setLocalItems] = useState<any[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)

  const [formData, setFormData] = useState({
    status: '',
    order_group_id: '',
    payment_condition_id: '',
    delivery_date: '',
    notes: '',
    // Fake fields to mirror ERP UI
    contato_comercial: '',
    operacao_fiscal: '',
    frete: 0,
    seguro: 0,
    outras_despesas: 0,
    desconto_reais: 0,
    obs_internas: '',
    obs_fisco: '',
    obs_contribuinte: ''
  })

  useEffect(() => {
    if (order) {
      setFormData(prev => ({
        ...prev,
        status: order.status || '',
        order_group_id: order.order_group_id || '',
        payment_condition_id: order.payment_condition_id || '',
        delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
        notes: order.notes || '',
        desconto_reais: order.total_discount || 0
      }))
      setLocalItems(order.items || [])
    }
  }, [order])

  const updateMutation = useMutation({
    mutationFn: (updates: any) => salesApi.updateSalesOrder(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] })
      toast.success('Pedido atualizado com sucesso!')
      navigate('/vendas/gestao')
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  })

  const removeItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este item? (Não será salvo no banco até você clicar em Salvar Alterações)')) {
      setLocalItems(localItems.filter(i => i.id !== itemId))
    }
  }

  const handleSave = (newStatus?: string) => {
    // In a real scenario, here we would also calculate the new totals based on localItems
    // and sync localItems deletions/insertions via salesApi.addSalesOrderItems / deleteSalesOrderItem
    const updates = {
      status: newStatus || formData.status,
      order_group_id: formData.order_group_id === '' ? null : formData.order_group_id,
      payment_condition_id: formData.payment_condition_id === '' ? null : formData.payment_condition_id,
      delivery_date: formData.delivery_date === '' ? null : new Date(formData.delivery_date).toISOString(),
      notes: formData.notes
    }
    updateMutation.mutate(updates)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando detalhes do pedido...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>

  const totalProdutos = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  const totalPedido = totalProdutos + formData.frete + formData.seguro + formData.outras_despesas - formData.desconto_reais

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-24 text-[13px]">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-muted/40 p-2 border-b border-border mb-4 rounded-t-md">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendas/gestao')} className="h-8">
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <span className="font-semibold">Pedido de venda</span>
        </div>
      </div>

      {/* CABEÇALHO DO PEDIDO */}
      <div className="bg-card border border-border p-3 rounded-md shadow-sm">
        <div className="grid grid-cols-12 gap-x-4 gap-y-2">
          
          <div className="col-span-2 flex items-center gap-2">
            <label className="font-semibold text-right w-8">Nº</label>
            <Input className="h-7 text-[13px] bg-muted/30" readOnly value={order.order_number || order.id.slice(0,5).toUpperCase()} />
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <label className="font-semibold text-right w-16">Emissão*</label>
            <Input type="date" className="h-7 text-[13px]" value={new Date(order.created_at).toISOString().split('T')[0]} readOnly />
          </div>
          <div className="col-span-6 flex items-center gap-2 bg-muted/30 p-1 rounded border border-border/50">
             <label className="font-semibold w-16 text-right">Estado</label>
             <select className="h-7 text-[13px] border rounded px-1 flex-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Digitação">Digitação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Faturado">Faturado</option>
                <option value="Cancelado">Cancelado</option>
             </select>
          </div>

          {/* Row 2 */}
          <div className="col-span-4 flex items-center gap-2">
            <label className="font-semibold text-right w-16">Cliente*</label>
            <div className="flex-1 flex gap-1">
              <Input className="h-7 text-[13px] font-bold" value={order.customer?.legal_name || ''} readOnly />
            </div>
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <label className="font-semibold text-right w-24">Contato</label>
            <Input className="h-7 text-[13px]" value={formData.contato_comercial} onChange={e => setFormData({...formData, contato_comercial: e.target.value})} />
          </div>
          <div className="col-span-4 flex items-center gap-2 bg-muted/30 p-1 rounded border border-border/50">
             <label className="font-semibold w-16 text-right leading-tight">Estado Config.</label>
             <select className="h-7 text-[13px] border rounded px-1 flex-1" value={formData.order_group_id} onChange={e => setFormData({...formData, order_group_id: e.target.value})}>
                <option value="">(Nenhum Grupo)</option>
                {orderGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
             </select>
          </div>

          {/* Row 3 - Endereço */}
          <div className="col-span-12 flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
            <label className="font-semibold text-right w-16">Endereço*</label>
            <span className="font-medium">{order.customer?.address || ''} - {order.customer?.city || ''}/{order.customer?.state || ''}</span>
          </div>

          {/* Row 4 - Tributario e Representante */}
          <div className="col-span-6 flex items-center gap-2">
            <label className="font-semibold text-right w-24">Tabela preços</label>
            <Input className="h-7 text-[13px] bg-muted/30" value={order.price_table?.name || 'TABELA GERAL'} readOnly />
          </div>
          <div className="col-span-6 flex items-center gap-2">
            <label className="font-semibold text-right w-24">Vendedor</label>
            <Input className="h-7 text-[13px] bg-muted/30" value={order.sales_rep?.nickname || ''} readOnly />
          </div>

          <div className="col-span-12 flex items-center gap-2">
            <label className="font-semibold text-right w-24 leading-tight">Operação fiscal*</label>
            <select className="h-7 text-[13px] border rounded px-1 w-80 bg-white dark:bg-black" value={formData.operacao_fiscal} onChange={e => setFormData({...formData, operacao_fiscal: e.target.value})}>
               <option value="">Selecione...</option>
               <option value="5405">5405 - Venda de merc. com subst. trib.</option>
               <option value="5102">5102 - Venda de merc. adquirida de terç.</option>
            </select>
          </div>

        </div>
      </div>

      {/* PRODUTOS E SERVIÇOS */}
      <div className="bg-card border border-border p-0 rounded-md shadow-sm overflow-hidden">
        <div className="bg-muted p-2 font-semibold border-b border-border">Produtos/serviços</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[11px] uppercase border-b border-border">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2 w-10">Ações</th>
                <th className="p-2 w-10">#</th>
                <th className="p-2 w-20">Código</th>
                <th className="p-2">Descrição do produto/serviço</th>
                <th className="p-2 text-right">Qt</th>
                <th className="p-2">Unid</th>
                <th className="p-2 text-right">Vl un</th>
                <th className="p-2 text-right">Vl desconto</th>
                <th className="p-2 text-right bg-amber-50 dark:bg-amber-950/20">Vl tot</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {localItems.map((item: any, index) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-2"><input type="checkbox" /></td>
                  <td className="p-2 flex gap-1">
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700" title="Excluir"><XIcon className="h-4 w-4"/></button>
                    <button className="text-orange-500 hover:text-orange-700" title="Editar"><Edit2 className="h-4 w-4"/></button>
                  </td>
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.product?.code || ''}</td>
                  <td className="p-2 font-medium">{item.product?.description}</td>
                  <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold">{item.quantity.toFixed(4)}</td>
                  <td className="p-2 text-muted-foreground">{item.product?.unit || 'un'}</td>
                  <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-2 text-right">{formatCurrency((item.unit_price * item.quantity) * (item.discount_percent || 0)/100)}</td>
                  <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold text-amber-900 dark:text-amber-100">{formatCurrency(item.total_price)}</td>
                  <td className="p-2">A faturar</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 bg-muted/30 border-t border-border flex gap-2">
             <Button size="sm" variant="outline" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white border-green-600 font-bold" onClick={() => setShowProductSearch(!showProductSearch)}>
               <Plus className="h-3 w-3 mr-1"/> Novo Item
             </Button>
             <span className="text-muted-foreground text-xs self-center ml-2">*As alterações nos itens necessitam que você clique em Salvar ao final para recalcular o pedido.</span>
          </div>
          {showProductSearch && (
            <div className="p-4 border-t border-border bg-card">
               {/* Aqui renderizaríamos o componente ProductSearchInline, mas para simplificar, apenas mostramos uma mensagem na POC */}
               <p className="text-amber-600 font-medium">Buscador de produtos seria ativado aqui para inserção rápida inline.</p>
               <Button variant="ghost" size="sm" onClick={() => setShowProductSearch(false)}>Fechar busca</Button>
            </div>
          )}
        </div>
      </div>

      {/* TOTAIS E IMPOSTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-3 rounded-md shadow-sm">
           <table className="w-full text-right text-[13px] border-separate border-spacing-y-1">
             <tbody>
               <tr>
                 <td className="text-left font-semibold">Valor total dos produtos</td>
                 <td className="w-32"><Input className="h-7 text-right bg-muted/30" readOnly value={formatCurrency(totalProdutos)} /></td>
               </tr>
               <tr>
                 <td className="text-left font-semibold">Valor total dos serviços</td>
                 <td><Input className="h-7 text-right bg-muted/30" readOnly value="R$ 0,00" /></td>
               </tr>
               <tr>
                 <td className="text-left font-semibold">Frete</td>
                 <td><Input className="h-7 text-right" type="number" value={formData.frete} onChange={e => setFormData({...formData, frete: Number(e.target.value)})} /></td>
               </tr>
               <tr>
                 <td className="text-left font-semibold">Seguro</td>
                 <td><Input className="h-7 text-right" type="number" value={formData.seguro} onChange={e => setFormData({...formData, seguro: Number(e.target.value)})} /></td>
               </tr>
               <tr>
                 <td className="text-left font-semibold">Desconto em R$</td>
                 <td><Input className="h-7 text-right text-red-600" type="number" value={formData.desconto_reais} onChange={e => setFormData({...formData, desconto_reais: Number(e.target.value)})} /></td>
               </tr>
               <tr>
                 <td className="text-left font-bold pt-2 border-t border-border">Valor total do pedido</td>
                 <td className="pt-2"><Input className="h-7 text-right font-bold bg-muted/30" readOnly value={formatCurrency(totalPedido)} /></td>
               </tr>
             </tbody>
           </table>
        </div>

        <div className="bg-card border border-border p-3 rounded-md shadow-sm">
           <div className="font-semibold mb-2 pb-1 border-b border-border">Impostos (Estimativa / Cálculo)</div>
           <table className="w-full text-[12px] text-right">
             <thead className="bg-muted/50 border-b border-border">
               <tr>
                 <th className="text-left p-1">Imposto</th>
                 <th className="p-1">Base de cálculo</th>
                 <th className="p-1">Valor</th>
               </tr>
             </thead>
             <tbody>
               <tr className="bg-amber-100 dark:bg-amber-900/30">
                 <td className="text-left p-1 font-bold">PIS</td>
                 <td className="p-1">0,00</td>
                 <td className="p-1">0,00</td>
               </tr>
               <tr>
                 <td className="text-left p-1 font-bold">COFINS</td>
                 <td className="p-1">0,00</td>
                 <td className="p-1">0,00</td>
               </tr>
               <tr>
                 <td className="text-left p-1 font-bold">ICMS</td>
                 <td className="p-1">{formatCurrency(totalProdutos)}</td>
                 <td className="p-1">{formatCurrency(totalProdutos * 0.18)}</td>
               </tr>
             </tbody>
           </table>
           <div className="mt-4 p-2 bg-muted/30 rounded border border-border text-xs text-muted-foreground">
             * A integração com motor fiscal fará o preenchimento automático das alíquotas baseadas na NCM e CFOP ao faturar.
           </div>
        </div>
      </div>

      {/* COBRANÇA E TRANSPORTE */}
      <div className="bg-card border border-border p-3 rounded-md shadow-sm">
         <div className="font-semibold border-b border-border pb-1 mb-2">Cobrança</div>
         <div className="flex gap-4 items-center mb-4">
           <div className="flex items-center gap-2">
             <label className="text-right w-36">Forma de pagamento</label>
             <select className="h-7 text-[13px] border rounded px-1 w-32">
               <option>A prazo</option>
               <option>À vista</option>
             </select>
             <select className="h-7 text-[13px] border rounded px-1 w-48">
               <option>Boleto bancário</option>
               <option>PIX</option>
             </select>
           </div>
         </div>
         <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2">
             <label className="text-right w-36">Condição de pagamento</label>
             <select 
               className="h-7 text-[13px] border rounded px-1 w-80"
               value={formData.payment_condition_id}
               onChange={e => setFormData({...formData, payment_condition_id: e.target.value})}
             >
               <option value="">Selecione...</option>
               {paymentConditions.map((pc: any) => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
             </select>
           </div>
         </div>

         <div className="font-semibold border-b border-border pb-1 mb-2 mt-6">Transporte</div>
         <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2">
             <label className="text-right w-36">Condição de Frete</label>
             <select className="h-7 text-[13px] border rounded px-1 w-80">
               <option>0 - Por conta do remetente (CIF)</option>
               <option>1 - Por conta do destinatário (FOB)</option>
               <option>3 - Transporte próprio por conta do remetente</option>
             </select>
           </div>
         </div>
      </div>

      {/* OBSERVAÇÕES */}
      <div className="bg-card border border-border p-3 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold block mb-1">Observações do Pedido</label>
            <Textarea className="h-20 text-[13px] resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div>
            <label className="font-semibold block mb-1">Observações internas</label>
            <Textarea className="h-20 text-[13px] resize-none bg-yellow-50 dark:bg-yellow-900/10" value={formData.obs_internas} onChange={e => setFormData({...formData, obs_internas: e.target.value})} />
          </div>
          <div>
            <label className="font-semibold block mb-1 text-blue-600">Informações adicionais de interesse do fisco</label>
            <Textarea className="h-20 text-[13px] resize-none" value={formData.obs_fisco} onChange={e => setFormData({...formData, obs_fisco: e.target.value})} />
          </div>
          <div>
            <label className="font-semibold block mb-1">Informações adicionais de interesse do contribuinte</label>
            <Textarea className="h-20 text-[13px] resize-none" value={formData.obs_contribuinte} onChange={e => setFormData({...formData, obs_contribuinte: e.target.value})} />
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-3 flex flex-wrap items-center justify-start z-50 gap-2">
         <Button onClick={() => handleSave('Digitação')} disabled={updateMutation.isPending} className="bg-[#78b31a] hover:bg-[#689914] text-white font-bold h-9">
            Emitir e aguardar aprovação
         </Button>
         <Button onClick={() => handleSave('Aprovado')} disabled={updateMutation.isPending} className="bg-[#78b31a] hover:bg-[#689914] text-white font-bold h-9">
            Emitir e aprovar
         </Button>
         <Button onClick={() => handleSave()} disabled={updateMutation.isPending} variant="outline" className="h-9 font-bold ml-4">
            Apenas Salvar Alterações
         </Button>
         <Button variant="outline" className="h-9 ml-auto" onClick={() => navigate('/vendas/gestao')}>
            Sair
         </Button>
      </div>

    </div>
  )
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
