import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { Save, ChevronLeft, Building2, Calendar, DollarSign, FileText, Edit2, Trash2, Plus, Search, Printer, Settings, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearchInline } from '../SalesApp/NewOrder/ProductSearchInline'
import { supabase } from '@/lib/supabase'

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

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { customersApi } = await import('@/api/customers')
      return customersApi.getCustomers()
    }
  })

  const { data: salesReps = [] } = useQuery({
    queryKey: ['sales_reps'],
    queryFn: async () => {
      const { data } = await supabase.from('sales_reps').select('id, nickname, legal_name').eq('active', true).order('nickname')
      return data || []
    }
  })

  const { data: priceTables = [] } = useQuery({
    queryKey: ['price_tables', company?.id],
    queryFn: async () => {
      const { priceTablesApi } = await import('@/api/priceTables')
      return priceTablesApi.getPriceTables()
    },
    enabled: !!company?.id
  })

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)

  const filteredCustomers = customerSearch.length > 1 
    ? customers.filter((c: any) => 
        c.legal_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.fantasy_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.document?.includes(customerSearch)
      ).slice(0, 5)
    : []

  const [localItems, setLocalItems] = useState<any[]>([])
  const [showProductSearch, setShowProductSearch] = useState(false)

  const [formData, setFormData] = useState({
    status: '',
    order_group_id: '',
    payment_condition_id: '',
    delivery_date: '',
    notes: '',
    customer_id: '',
    sales_rep_id: '',
    price_table_id: '',
    // Fake fields to mirror ERP UI
    contato_comercial: '',
    operacao_fiscal: '',
    frete: 0,
    seguro: 0,
    outras_despesas: 0,
    desconto_valor: 0,
    discount_type: 'R$' as 'R$' | '%',
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
        customer_id: order.customer_id || '',
        sales_rep_id: order.sales_rep_id || '',
        price_table_id: order.price_table_id || '',
        desconto_valor: order.total_discount || 0
      }))
      setLocalItems(order.items || [])
    }
  }, [order])

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      // Atualiza o pedido
      await salesApi.updateSalesOrder(id!, updates)
      
      // Sincroniza os itens
      const originalItemIds = order?.items?.map((i: any) => i.id) || []
      const currentItemIds = localItems.map((i: any) => i.id).filter(id => id)
      
      const deletedIds = originalItemIds.filter((oldId: string) => !currentItemIds.includes(oldId))
      
      for (const delId of deletedIds) {
        await salesApi.deleteSalesOrderItem(delId)
      }
      
      const newItemsToInsert = []
      for (const item of localItems) {
        if (!item.id || item.id.startsWith('temp-')) {
          newItemsToInsert.push({
            sales_order_id: id!,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            total_price: item.total_price,
            net_price: item.total_price
          })
        } else {
          await salesApi.updateSalesOrderItem(item.id, {
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            total_price: item.total_price,
            net_price: item.total_price
          })
        }
      }
      
      if (newItemsToInsert.length > 0) {
        await salesApi.addSalesOrderItems(newItemsToInsert)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] })
      toast.success('Pedido e itens atualizados com sucesso!')
      navigate('/vendas/gestao')
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  })

  const removeItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este item? (Não será salvo no banco até você clicar em Salvar Alterações)')) {
      setLocalItems(localItems.filter(i => i.id !== itemId))
    }
  }

  const handleUpdateItem = (itemId: string, field: string, value: number) => {
    setLocalItems(localItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value }
        updated.total_price = (updated.quantity * updated.unit_price) * (1 - (updated.discount_percent || 0) / 100)
        return updated
      }
      return item
    }))
  }

  const updatePricesFromTable = async (tableId: string) => {
    setIsUpdatingPrices(true)
    try {
      const { priceTablesApi } = await import('@/api/priceTables')
      const tableData = await priceTablesApi.getPriceTable(tableId)
      const tableItems = tableData?.price_table_items || []
      
      setLocalItems(prevItems => prevItems.map(item => {
        const tableItem = tableItems.find((pti: any) => pti.product_id === item.product_id)
        if (tableItem) {
          const newPrice = tableItem.price
          const updated = { ...item, unit_price: newPrice }
          updated.total_price = (updated.quantity * newPrice) * (1 - (updated.discount_percent || 0) / 100)
          return updated
        }
        return item
      }))
      toast.success('Preços atualizados de acordo com a tabela selecionada!')
    } catch (e) {
      toast.error('Erro ao atualizar preços da tabela.')
    } finally {
      setIsUpdatingPrices(false)
    }
  }

  const handleCustomerSelect = async (customer: any) => {
    const newPriceTableId = customer.price_table_id || formData.price_table_id

    if (formData.customer_id && formData.customer_id !== customer.id) {
      if (!window.confirm(`Tem certeza que deseja alterar o cliente do pedido para ${customer.legal_name || customer.fantasy_name}? A tabela de preços e o vendedor vinculados também serão atualizados caso o cliente possua.`)) {
        setShowCustomerResults(false)
        return
      }
    }
    
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      sales_rep_id: customer.sales_rep_id || prev.sales_rep_id,
      price_table_id: newPriceTableId
    }))
    setCustomerSearch('')
    setShowCustomerResults(false)

    if (newPriceTableId) {
       await updatePricesFromTable(newPriceTableId)
    }
  }

  const handleUpdatePricesFromTable = async () => {
    if (!formData.price_table_id) {
      toast.warning('Selecione uma tabela de preços primeiro.')
      return
    }
    await updatePricesFromTable(formData.price_table_id)
  }

  const handleSave = (newStatus?: string) => {
    const total_amount = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    
    // Apply discount
    let final_discount = 0
    if (formData.discount_type === 'R$') {
      final_discount = formData.desconto_valor
    } else {
      final_discount = total_amount * (formData.desconto_valor / 100)
    }

    const net_amount = total_amount + formData.frete + formData.seguro + formData.outras_despesas - final_discount

    const updates = {
      status: newStatus || formData.status,
      order_group_id: formData.order_group_id === '' ? null : formData.order_group_id,
      payment_condition_id: formData.payment_condition_id === '' ? null : formData.payment_condition_id,
      delivery_date: formData.delivery_date === '' ? null : new Date(formData.delivery_date).toISOString(),
      notes: formData.notes,
      customer_id: formData.customer_id === '' ? null : formData.customer_id,
      sales_rep_id: formData.sales_rep_id === '' ? null : formData.sales_rep_id,
      price_table_id: formData.price_table_id === '' ? null : formData.price_table_id,
      total_amount,
      total_discount: final_discount,
      net_amount
    }
    updateMutation.mutate(updates)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando detalhes do pedido...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>

  const totalProdutos = localItems.reduce((acc, item) => {
    const itemTotal = (item.quantity * item.unit_price) * (1 - (item.discount_percent || 0) / 100)
    return acc + itemTotal
  }, 0)
  
  let descontoCalculado = 0
  if (formData.discount_type === 'R$') {
    descontoCalculado = formData.desconto_valor
  } else {
    descontoCalculado = totalProdutos * (formData.desconto_valor / 100)
  }

  const totalPedido = totalProdutos + formData.frete + formData.seguro + formData.outras_despesas - descontoCalculado

  const selectedCustomer = customers.find((c: any) => c.id === formData.customer_id)

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-8 text-[13px]">
      
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
             <Input className="h-7 text-[13px] bg-muted/50 font-medium flex-1" readOnly value={formData.status || 'Digitação'} />
          </div>

          {/* Row 2 */}
          <div className="col-span-6 flex items-center gap-2 relative">
            <label className="font-semibold text-right w-16">Cliente*</label>
            <div className="flex-1 flex gap-1 relative">
              {formData.customer_id && !showCustomerResults ? (
                <div className="flex w-full relative">
                  <Input 
                    className="h-7 text-[13px] font-bold flex-1 cursor-pointer pr-8" 
                    value={selectedCustomer?.legal_name || ''} 
                    readOnly 
                    onClick={() => setShowCustomerResults(true)}
                    title="Clique para alterar o cliente"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground absolute right-0 hover:text-blue-500" 
                    onClick={() => setShowCustomerResults(true)}
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative w-full flex items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar cliente..." 
                      className="pl-7 h-7 text-[13px]"
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerResults(true)
                      }}
                      onFocus={() => setShowCustomerResults(true)}
                    />
                    {showCustomerResults && customerSearch.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c: any) => (
                            <div 
                              key={c.id} 
                              className="p-2 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCustomerSelect(c)
                              }}
                            >
                              <div className="font-medium text-[13px]">{c.legal_name || c.fantasy_name}</div>
                              <div className="text-[11px] text-muted-foreground flex justify-between mt-0.5">
                                <span>{c.document}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-[12px] text-muted-foreground text-center">Nenhum cliente encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.customer_id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 ml-1 text-red-500 text-xs" 
                      onClick={() => {
                        setShowCustomerResults(false)
                        setCustomerSearch('')
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-6 flex items-center gap-2 bg-muted/30 p-1 rounded border border-border/50">
             <label className="font-semibold w-16 text-right leading-tight">Grupo</label>
             <select 
                className="h-7 text-[13px] border rounded px-1 flex-1 bg-background" 
                value={formData.order_group_id} 
                onChange={async (e) => {
                  if (e.target.value === 'NEW') {
                    const name = window.prompt('Nome do novo grupo:')
                    if (name && name.trim() && company?.id) {
                      try {
                        const newGroup = await salesApi.createOrderGroup({ company_id: company.id, name: name.trim() })
                        queryClient.invalidateQueries({ queryKey: ['order_groups'] })
                        setFormData({...formData, order_group_id: newGroup.id})
                        toast.success('Grupo criado!')
                      } catch (err: any) {
                        toast.error('Erro ao criar grupo')
                        setFormData({...formData, order_group_id: ''})
                      }
                    } else {
                      setFormData({...formData, order_group_id: ''})
                    }
                  } else {
                    setFormData({...formData, order_group_id: e.target.value})
                  }
                }}
             >
                <option value="">(Nenhum Grupo)</option>
                {orderGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                <option value="NEW" className="font-bold text-blue-600">+ Criar novo grupo...</option>
             </select>
          </div>

          {/* Row 3 - Endereço */}
          <div className="col-span-12 flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
            <label className="font-semibold text-right w-16">Endereço*</label>
            <span className="font-medium">{selectedCustomer?.address || ''} - {selectedCustomer?.city || ''}/{selectedCustomer?.state || ''}</span>
          </div>

          {/* Row 4 - Tributario e Representante */}
          <div className="col-span-6 flex items-center gap-2">
            <label className="font-semibold text-right w-24">Tabela preços</label>
            <div className="flex-1 flex gap-1">
              <select 
                className="h-7 text-[13px] border rounded px-1 flex-1 bg-background" 
                value={formData.price_table_id} 
                onChange={e => setFormData({...formData, price_table_id: e.target.value})}
              >
                <option value="">(Nenhuma)</option>
                {priceTables.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-[12px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                onClick={handleUpdatePricesFromTable}
                disabled={isUpdatingPrices}
                title="Atualizar valores dos itens pela tabela"
              >
                {isUpdatingPrices ? '...' : 'Atualizar'}
              </Button>
            </div>
          </div>
          <div className="col-span-6 flex items-center gap-2">
            <label className="font-semibold text-right w-24">Vendedor</label>
            <select 
              className="h-7 text-[13px] border rounded px-1 flex-1 bg-background" 
              value={formData.sales_rep_id} 
              onChange={e => setFormData({...formData, sales_rep_id: e.target.value})}
            >
              <option value="">(Nenhum)</option>
              {salesReps.map((sr: any) => <option key={sr.id} value={sr.id}>{sr.nickname || sr.legal_name}</option>)}
            </select>
          </div>

          <div className="col-span-12 flex items-center gap-2">
            <label className="font-semibold text-right w-24 leading-tight">Operação fiscal*</label>
            <select className="h-7 text-[13px] border rounded px-1 w-80 bg-background" value={formData.operacao_fiscal} onChange={e => setFormData({...formData, operacao_fiscal: e.target.value})}>
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
                <th className="p-2 text-right">Desc %</th>
                <th className="p-2 text-right bg-amber-50 dark:bg-amber-950/20">Vl tot</th>
                <th className="p-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {localItems.map((item: any, index) => {
                const isEditing = editingItemId === item.id
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-2"><input type="checkbox" /></td>
                    <td className="p-2 flex gap-1">
                      {isEditing ? (
                        <button onClick={() => setEditingItemId(null)} className="text-green-600 hover:text-green-700" title="Confirmar Edição"><Check className="h-4 w-4"/></button>
                      ) : (
                        <>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                          <button onClick={() => setEditingItemId(item.id)} className="text-orange-500 hover:text-orange-700" title="Editar"><Edit2 className="h-4 w-4"/></button>
                        </>
                      )}
                    </td>
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{item.product?.code || ''}</td>
                    <td className="p-2 font-medium">{item.product?.description}</td>
                    
                    {/* Editable Quantidade */}
                    <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold">
                      {isEditing ? (
                        <Input 
                          type="number" 
                          className="h-7 w-20 text-right text-[13px] ml-auto p-1" 
                          value={item.quantity} 
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))} 
                        />
                      ) : (
                        item.quantity.toFixed(4)
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">{item.product?.unit || 'un'}</td>
                    
                    {/* Editable Unit Price */}
                    <td className="p-2 text-right">
                      {isEditing ? (
                        <Input 
                          type="number" 
                          className="h-7 w-24 text-right text-[13px] ml-auto p-1" 
                          value={item.unit_price} 
                          onChange={(e) => handleUpdateItem(item.id, 'unit_price', Number(e.target.value))} 
                        />
                      ) : (
                        formatCurrency(item.unit_price)
                      )}
                    </td>
                    
                    {/* Editable Discount */}
                    <td className="p-2 text-right">
                      {isEditing ? (
                        <Input 
                          type="number" 
                          className="h-7 w-16 text-right text-[13px] ml-auto p-1" 
                          value={item.discount_percent || 0} 
                          onChange={(e) => handleUpdateItem(item.id, 'discount_percent', Number(e.target.value))} 
                        />
                      ) : (
                        `${item.discount_percent || 0}%`
                      )}
                    </td>
                    
                    <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold text-amber-900 dark:text-amber-100">{formatCurrency(item.total_price)}</td>
                    <td className="p-2">A faturar</td>
                  </tr>
                )
              })}
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
                 <td className="w-40"><Input className="h-7 text-right bg-muted/30" readOnly value={formatCurrency(totalProdutos)} /></td>
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
                 <td className="text-left font-semibold flex items-center">
                    <select 
                      className="h-7 border rounded text-[12px] bg-background mr-2"
                      value={formData.discount_type}
                      onChange={e => setFormData({...formData, discount_type: e.target.value as 'R$' | '%'})}
                    >
                      <option value="R$">Desconto em R$</option>
                      <option value="%">Desconto em %</option>
                    </select>
                 </td>
                 <td><Input className="h-7 text-right text-red-600" type="number" value={formData.desconto_valor} onChange={e => setFormData({...formData, desconto_valor: Number(e.target.value)})} /></td>
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
             <select className="h-7 text-[13px] border rounded px-1 w-32 bg-background">
               <option>A prazo</option>
               <option>À vista</option>
             </select>
             <select className="h-7 text-[13px] border rounded px-1 w-48 bg-background">
               <option>Boleto bancário</option>
               <option>PIX</option>
             </select>
           </div>
         </div>
         <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2">
             <label className="text-right w-36">Condição de pagamento</label>
             <select 
               className="h-7 text-[13px] border rounded px-1 w-80 bg-background"
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
             <select className="h-7 text-[13px] border rounded px-1 w-80 bg-background">
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

      {/* ACTION BAR INLINE */}
      <div className="bg-card border border-border shadow-sm p-4 flex flex-wrap items-center justify-start gap-2 rounded-md mt-6">
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
