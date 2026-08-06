import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { Save, ChevronLeft, Building2, Calendar, DollarSign, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

  const [formData, setFormData] = useState({
    status: '',
    order_group_id: '',
    payment_condition_id: '',
    delivery_date: '',
    notes: ''
  })

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status || '',
        order_group_id: order.order_group_id || '',
        payment_condition_id: order.payment_condition_id || '',
        delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
        notes: order.notes || ''
      })
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

  const handleSave = () => {
    const updates = {
      ...formData,
      order_group_id: formData.order_group_id === '' ? null : formData.order_group_id,
      payment_condition_id: formData.payment_condition_id === '' ? null : formData.payment_condition_id,
      delivery_date: formData.delivery_date === '' ? null : new Date(formData.delivery_date).toISOString()
    }
    updateMutation.mutate(updates)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando detalhes do pedido...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>

  return (
    <div className="space-y-6 slide-up max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendas/gestao')} className="hover:bg-primary/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">Gestão do Pedido #{order.order_number || order.id.slice(0,5).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-1">Atualização de dados burocráticos e administrativos.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-10 w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" /> {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente e Vendedor (Leitura) */}
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Informações Gerais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase">Cliente</label>
                <div className="font-medium bg-muted/30 p-2.5 rounded-md mt-1 border border-border/50 truncate" title={order.customer?.legal_name || ''}>
                  {order.customer?.legal_name || '---'}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase">Vendedor</label>
                <div className="font-medium bg-muted/30 p-2.5 rounded-md mt-1 border border-border/50">
                  {order.sales_rep?.nickname || '---'}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase">Total Líquido</label>
                <div className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-md mt-1 border border-emerald-100 dark:border-emerald-900/50">
                  {formatCurrency(order.net_amount)}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase">Data de Emissão</label>
                <div className="font-medium bg-muted/30 p-2.5 rounded-md mt-1 border border-border/50">
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><FileText className="h-5 w-5 text-primary" /> Itens do Pedido</h2>
            <div className="border rounded-md overflow-x-auto bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold text-right">Qtd</th>
                    <th className="px-4 py-3 font-semibold text-right">Preço Un.</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium min-w-[200px]">
                        {item.product?.description}
                        {item.product?.code && <div className="text-xs text-muted-foreground font-normal">Cód: {item.product.code}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                  {(!order.items || order.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum item encontrado no pedido.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-md mt-4 font-medium border border-blue-100 dark:border-blue-900/50">
              * A alteração de itens e valores deve ser feita exclusivamente pelo módulo Força de Vendas.
            </div>
          </div>
        </div>

        {/* Formulário Burocrático */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-5 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-3"><DollarSign className="h-5 w-5 text-primary" /> Dados Administrativos</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Status do Pedido</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-bold text-primary"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Digitação">Em Digitação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Enviado">Enviado (Maxiprod)</option>
                <option value="Faturado">Faturado</option>
                <option value="Entregue">Entregue</option>
                <option value="Retornou">Retornou</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Grupo de Rota/Pedido</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.order_group_id}
                onChange={e => setFormData({...formData, order_group_id: e.target.value})}
              >
                <option value="">Nenhum Grupo (Avulso)</option>
                {orderGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Condição de Pagamento</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={formData.payment_condition_id}
                onChange={e => setFormData({...formData, payment_condition_id: e.target.value})}
              >
                <option value="">Não informada</option>
                {paymentConditions.map((pc: any) => (
                  <option key={pc.id} value={pc.id}>{pc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Data Prevista de Entrega</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date"
                  className="pl-9"
                  value={formData.delivery_date}
                  onChange={e => setFormData({...formData, delivery_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Observações Gerais</label>
              <Textarea 
                placeholder="Anotações internas, logísticas ou financeiras do pedido..."
                className="resize-none min-h-[120px]"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
