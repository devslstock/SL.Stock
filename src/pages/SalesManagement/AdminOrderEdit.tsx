import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { productsApi } from '@/api/products'
import { financeApi } from '@/api/finance'
import { nfeApi } from '@/api/nfe'
import { fiscalOperationsApi } from '@/api/fiscalOperations'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, ArrowRight, Upload, X, Copy, ChevronDown, Check, Save, FileText, FileSignature, LogOut, CheckCircle2, RefreshCw, Printer, FileDown, Scissors, CheckSquare, Pencil, Lock, ChevronLeft, Building2, Calendar, DollarSign, Edit2, Trash2, Plus, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearchInline } from '../SalesApp/NewOrder/ProductSearchInline'
import { supabase } from '@/lib/supabase'
import { parsePaymentCondition } from '@/utils/paymentParser'
import { FiscalEmissionDialog } from '@/components/Fiscal/FiscalEmissionDialog'
import { ItemDetailsModal } from './ItemDetailsModal'

export default function AdminOrderEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const isPlatina = company?.plan === 'platina'

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

  const { data: nfeRecord } = useQuery({
    queryKey: ['nfe_record', id],
    queryFn: async () => {
      const { data } = await supabase.from('nfe_records').select('*').eq('sales_order_id', id).maybeSingle()
      return data
    },
    enabled: !!id
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getProducts,
  })

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [editingDetailItem, setEditingDetailItem] = useState<any | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFaturarMenu, setShowFaturarMenu] = useState(false)
  const [showFiscalDialog, setShowFiscalDialog] = useState(false)
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
    custom_payment_condition: '',
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
    obs_contribuinte: '',
    nfe_series: 3,
    forma_pagamento: '',
    condicao_frete: ''
  })

  const { data: fiscalOperations = [] } = useQuery({
    queryKey: ['fiscal_operations', company?.id],
    queryFn: () => company?.id ? fiscalOperationsApi.getOperations(company.id) : [],
    enabled: !!company?.id
  })

  useEffect(() => {
    if (order) {
      setFormData(prev => ({
        ...prev,
        status: order.status || '',
        order_group_id: order.order_group_id || '',
        payment_condition_id: order.payment_condition_id || '',
        custom_payment_condition: order.custom_payment_condition || order.payment_condition?.name || '',
        delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
        notes: order.notes || '',
        customer_id: order.customer_id || '',
        sales_rep_id: order.sales_rep_id || '',
        price_table_id: order.price_table_id || order.customer?.price_table_id || '',
        desconto_valor: order.total_discount || 0,
        frete: order.frete || 0,
        seguro: order.seguro || 0,
        outras_despesas: order.outras_despesas || 0,
        obs_internas: order.obs_internas || '',
        obs_fisco: order.obs_fisco || '',
        obs_contribuinte: order.obs_contribuinte || '',
        operacao_fiscal: order.operacao_fiscal || '5405',
        nfe_series: order.nfe_series || 3,
        forma_pagamento: order.forma_pagamento || '',
        condicao_frete: order.condicao_frete || ''
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
      const currentItemIds = localItems.map((i: any) => i.id).filter(id => id && !id.startsWith('temp-'))
      
      const deletedIds = originalItemIds.filter((oldId: string) => !currentItemIds.includes(oldId))
      
      for (const delId of deletedIds) {
        await salesApi.deleteSalesOrderItem(delId)
      }
      
      const numOrNull = (val: any) => (val === "" || val === null || val === undefined) ? null : Number(val);

      const newItemsToInsert = []
      for (const item of localItems) {
        if (!item.id || item.id.startsWith('temp-')) {
          newItemsToInsert.push({
            sales_order_id: id!,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            total_price: item.total_price,
            net_price: item.total_price,
            ncm: item.ncm,
            cfop: item.cfop,
            origin: item.origin,
            cst: item.cst,
            csosn: item.csosn,
            icms_rate: numOrNull(item.icms_rate),
            ipi_rate: numOrNull(item.ipi_rate),
            pis_rate: numOrNull(item.pis_rate),
            cofins_rate: numOrNull(item.cofins_rate),
            pis_cst: item.pis_cst,
            cofins_cst: item.cofins_cst
          })
        } else {
          await salesApi.updateSalesOrderItem(item.id, {
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            total_price: item.total_price,
            net_price: item.total_price,
            ncm: item.ncm,
            cfop: item.cfop,
            origin: item.origin,
            cst: item.cst,
            csosn: item.csosn,
            icms_rate: numOrNull(item.icms_rate),
            ipi_rate: numOrNull(item.ipi_rate),
            pis_rate: numOrNull(item.pis_rate),
            cofins_rate: numOrNull(item.cofins_rate),
            pis_cst: item.pis_cst,
            cofins_cst: item.cofins_cst
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
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  })

  const emitirMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Empresa não encontrada')
      await nfeApi.emitirNfe(company.id, id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] })
      toast.success('Nota Fiscal emitida com sucesso!')
    },
    onError: (e: any) => toast.error(`Erro ao emitir NF: ${e.message}`)
  })

  const faturarMutation = useMutation({
    mutationFn: async () => {
      await financeApi.faturarPedido(id!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales_order', id] })
      toast.success('Pedido faturado com sucesso! Cobranças geradas.')
      navigate('/financeiro/contas-receber') // ou para a página atual
    },
    onError: (e: any) => toast.error(`Erro ao faturar: ${e.message}`)
  })

  const handleFaturar = () => {
    // Calcular as parcelas e total localmente para validar
    const tProdutos = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price) * (1 - (item.discount_percent || 0) / 100), 0)
    const tPedido = tProdutos + formData.frete + formData.seguro + formData.outras_despesas
    const oCond = paymentConditions.find((pc: any) => pc.id === formData.payment_condition_id)
    const dInt = oCond?.interval_days || 30
    
    const parsed = parsePaymentCondition(
      formData.custom_payment_condition || '', 
      dInt, 
      order?.created_at ? new Date(order.created_at) : new Date(), 
      tPedido
    )

    if (!parsed.isValid) {
      toast.error('A condição de pagamento atual é inválida. Verifique o formato antes de faturar.')
      return
    }
    if (confirm('Tem certeza que deseja FATURAR este pedido? Isso gerará as cobranças financeiras e não poderá ser desfeito.')) {
      faturarMutation.mutate()
    }
  }

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
      
      const newItems = localItems.map(item => {
        const tableItem = tableItems.find((pti: any) => pti.product_id === item.product_id)
        if (tableItem) {
          const newPrice = tableItem.price
          const updated = { ...item, unit_price: newPrice }
          updated.total_price = (updated.quantity * newPrice) * (1 - (updated.discount_percent || 0) / 100)
          return updated
        }
        return item
      })
      setLocalItems(newItems)
      toast.info('Valores atualizados na tela! Clique em Salvar Alterações para gravar.')
    } catch (e: any) {
      toast.error('Erro ao atualizar preços: ' + e.message)
    } finally {
      setIsUpdatingPrices(false)
    }
  }

  const handleUpdateQuantityFromSearch = (productId: string, quantity: number, price: number) => {
    const existing = localItems.find((i: any) => i.product_id === productId)
    
    if (quantity === 0) {
      if (existing) setLocalItems(prev => prev.filter(i => i.product_id !== productId))
    } else if (existing) {
      setLocalItems(prev => prev.map(i => {
        if (i.product_id === productId) {
          return {
            ...i,
            quantity,
            unit_price: price,
            total_price: quantity * price * (1 - (i.discount_percent || 0)/100)
          }
        }
        return i
      }))
    } else {
      const product = products.find((p: any) => p.id === productId)
      if (product) {
        setLocalItems(prev => [...prev, {
          id: `temp-${Date.now()}-${Math.random()}`,
          sales_order_id: id,
          product_id: productId,
          quantity,
          unit_price: price,
          discount_percent: 0,
          total_price: quantity * price,
          product: {
             code: product.code,
             description: product.description,
             unit: product.unit_measure || 'un'
          }
        }])
      }
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

  const handleApplyGlobalDiscount = async () => {
    if (formData.desconto_valor < 0) return

    const tProdutosSemDesconto = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    if (tProdutosSemDesconto === 0) return

    const isPercentage = formData.discount_type === '%'
    const globalDiscountPercentage = isPercentage ? formData.desconto_valor : (formData.desconto_valor / tProdutosSemDesconto) * 100

    const newItems = localItems.map(item => {
      const updated = { ...item, discount_percent: globalDiscountPercentage }
      updated.total_price = (updated.quantity * updated.unit_price) * (1 - (globalDiscountPercentage / 100))
      updated.net_price = updated.total_price
      return updated
    })

    setLocalItems(newItems)
    
    toast.success('Desconto rateado proporcionalmente nos itens!')

    try {
      const { salesApi } = await import('@/api/sales')
      await Promise.all(newItems.map(item => 
        salesApi.updateSalesOrderItem(item.id, { 
          discount_percent: item.discount_percent,
          total_price: item.total_price,
          net_price: item.net_price
        })
      ))
      // Salva no pedido principal para manter visível o valor original digitado
      await salesApi.updateSalesOrder(id!, { total_discount: formData.desconto_valor })
    } catch (e) {
      console.error('Erro ao salvar rateio do desconto', e)
    }
  }

  const handleUpdatePricesFromTable = async () => {
    if (!formData.price_table_id) {
      toast.warning('Selecione uma tabela de preços primeiro.')
      return
    }
    await updatePricesFromTable(formData.price_table_id)
  }

  const handleSave = async (newStatus?: string) => {
    if (formData.custom_payment_condition) {
       const oCond = paymentConditions.find((pc: any) => pc.id === formData.payment_condition_id)
       const dInt = oCond?.interval_days || 30
       const parsed = parsePaymentCondition(
         formData.custom_payment_condition, 
         dInt, 
         order?.created_at ? new Date(order.created_at) : new Date(), 
         totalPedido
       )
       if (!parsed.isValid) {
         toast.error('A condição de pagamento editável é inválida. Corrija o formato antes de salvar.')
         return
       }
    }

    const total_amount = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    
    // Apply discount
    let final_discount = 0
    if (formData.discount_type === 'R$') {
      final_discount = formData.desconto_valor
    } else {
      final_discount = total_amount * (formData.desconto_valor / 100)
    }

    const net_amount = total_amount + formData.frete + formData.seguro + formData.outras_despesas - final_discount

    if (newStatus === 'Aprovado' && formData.customer_id) {
      const customerInfo = order?.customer || customers.find((c: any) => c.id === formData.customer_id)
      const creditLimit = customerInfo?.credit_limit || 0
      
      if (creditLimit > 0) {
        try {
          const currentDebt = await financeApi.getCustomerDebt(formData.customer_id)
          if ((currentDebt + net_amount) > creditLimit) {
            const confirmed = window.confirm(`ATENÇÃO: Este pedido fará o cliente exceder o limite de crédito!\n\nLimite de Crédito: ${formatCurrency(creditLimit)}\nDívida Atual (vencidas e pendentes): ${formatCurrency(currentDebt)}\nValor deste Pedido: ${formatCurrency(net_amount)}\nTotal após Aprovação: ${formatCurrency(currentDebt + net_amount)}\n\nDeseja aprovar o pedido mesmo assim?`)
            if (!confirmed) {
              return
            }
          }
        } catch (e) {
          console.error("Erro ao verificar limite de crédito", e)
        }
      }
    }

    const updates = {
      status: newStatus || formData.status,
      order_group_id: formData.order_group_id === '' ? null : formData.order_group_id,
      payment_condition_id: formData.payment_condition_id === '' ? null : formData.payment_condition_id,
      custom_payment_condition: formData.custom_payment_condition,
      delivery_date: formData.delivery_date === '' ? null : new Date(formData.delivery_date).toISOString(),
      notes: formData.notes,
      customer_id: formData.customer_id === '' ? null : formData.customer_id,
      sales_rep_id: formData.sales_rep_id === '' ? null : formData.sales_rep_id,
      price_table_id: formData.price_table_id === '' ? null : formData.price_table_id,
      total_amount,
      total_discount: final_discount,
      net_amount,
      frete: formData.frete,
      seguro: formData.seguro,
      outras_despesas: formData.outras_despesas,
      obs_internas: formData.obs_internas,
      obs_fisco: formData.obs_fisco,
      obs_contribuinte: formData.obs_contribuinte,
      operacao_fiscal: formData.operacao_fiscal,
      nfe_series: formData.nfe_series,
      forma_pagamento: formData.forma_pagamento,
      condicao_frete: formData.condicao_frete
    }
    updateMutation.mutate(updates)
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando detalhes do pedido...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>

  const totalProdutos = localItems.reduce((acc, item) => {
    const itemTotal = (item.quantity * item.unit_price) * (1 - (item.discount_percent || 0) / 100)
    return acc + itemTotal
  }, 0)

  const totalImpostos = localItems.reduce((acc, item) => {
    const itemTotal = (item.quantity * item.unit_price) * (1 - (item.discount_percent || 0) / 100)
    
    if (item.pis_rate) {
      acc.pisBase += itemTotal
      acc.pisValor += (itemTotal * item.pis_rate) / 100
    }
    
    if (item.cofins_rate) {
      acc.cofinsBase += itemTotal
      acc.cofinsValor += (itemTotal * item.cofins_rate) / 100
    }
    
    if (item.icms_rate) {
      acc.icmsBase += itemTotal
      acc.icmsValor += (itemTotal * item.icms_rate) / 100
    }
    
    return acc
  }, {
    pisBase: 0, pisValor: 0,
    cofinsBase: 0, cofinsValor: 0,
    icmsBase: 0, icmsValor: 0
  })

  let descontoCalculado = 0
  if (formData.discount_type === 'R$') {
    descontoCalculado = formData.desconto_valor
  } else {
    // Calculamos o desconto baseado no total bruto se necessário
    const tPuro = localItems.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    descontoCalculado = tPuro * (formData.desconto_valor / 100)
  }

  // O totalPedido não subtrai o descontoCalculado novamente, 
  // porque os descontos já foram rateados nos itens (totalProdutos já é o valor com desconto)
  const totalPedido = totalProdutos + formData.frete + formData.seguro + formData.outras_despesas

  const originalCondition = paymentConditions.find((pc: any) => pc.id === formData.payment_condition_id)
  const defaultInterval = originalCondition?.interval_days || 30
  
  const parsedPayment = parsePaymentCondition(
    formData.custom_payment_condition || '', 
    defaultInterval, 
    order?.created_at ? new Date(order.created_at) : new Date(), 
    totalPedido
  )

  const selectedCustomer = customers.find((c: any) => c.id === formData.customer_id)
  const isEditable = !formData.status || formData.status === 'Digitação'
  
  const isNfeEmitida = !!nfeRecord?.id
  const isFaturado = formData.status === 'Faturado'
  const isAprovado = formData.status === 'Aprovado'

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
        <div className="flex gap-2">
          {isAprovado && !isFaturado && (
            <Button 
              size="sm" 
              onClick={handleFaturar} 
              className="h-8 bg-green-600 hover:bg-green-700 text-white"
              disabled={faturarMutation.isPending}
            >
              {faturarMutation.isPending ? 'Faturando...' : 'FATURAR PEDIDO'}
            </Button>
          )}

          {isFaturado && !nfeRecord?.id && (
            <Button 
              size="sm" 
              onClick={() => {
                if (confirm('Deseja emitir a Nota Fiscal para este pedido?')) {
                  emitirMutation.mutate()
                }
              }} 
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={emitirMutation.isPending}
            >
              {emitirMutation.isPending ? 'Emitindo...' : 'Emitir NF'}
            </Button>
          )}

          {isEditable && (
            <Button size="sm" onClick={() => handleSave()} className="h-8">Salvar Alterações</Button>
          )}
        </div>
      </div>

      {/* CABEÇALHO DO PEDIDO */}
      <fieldset disabled={!isEditable} className="border-none p-0 m-0 min-w-0">
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

          <div className="col-span-12 flex gap-4 mt-2 mb-2 p-3 bg-muted/20 border border-border rounded-lg">
            <div className="flex-1 flex items-center gap-2">
              <label className="font-semibold text-right w-24 leading-tight flex items-center justify-end gap-1">
                Operação fiscal*
                {!isPlatina && <span title="Disponível apenas no plano Platina"><Lock className="h-3 w-3 text-muted-foreground" /></span>}
              </label>
              <div className="flex-1">
                <Select
                  options={fiscalOperations.map(op => ({ value: op.code, label: `${op.code} - ${op.name}` }))}
                  value={formData.operacao_fiscal ? { value: formData.operacao_fiscal, label: fiscalOperations.find(op => op.code === formData.operacao_fiscal) ? `${formData.operacao_fiscal} - ${fiscalOperations.find(op => op.code === formData.operacao_fiscal)?.name}` : formData.operacao_fiscal } : null}
                  onChange={(selected: any) => setFormData({...formData, operacao_fiscal: selected ? selected.value : ''})}
                  isDisabled={!isPlatina || !isEditable}
                  placeholder="Selecione a operação..."
                  noOptionsMessage={() => "Nenhuma operação encontrada"}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '28px',
                      height: '28px',
                      fontSize: '13px',
                      borderRadius: '0.25rem',
                      borderColor: 'hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: 'hsl(var(--border))'
                      }
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      padding: '0 8px',
                    }),
                    input: (base) => ({
                      ...base,
                      margin: '0',
                      padding: '0'
                    }),
                    indicatorsContainer: (base) => ({
                      ...base,
                      height: '28px'
                    }),
                    menu: (base) => ({
                      ...base,
                      fontSize: '13px',
                      zIndex: 50,
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? 'hsl(var(--muted))' : 'transparent',
                      color: 'hsl(var(--foreground))',
                      cursor: 'pointer',
                      '&:active': {
                        backgroundColor: 'hsl(var(--muted))'
                      }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'hsl(var(--foreground))'
                    })
                  }}
                />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <label className="font-semibold w-24 text-right text-primary">Série Fiscal</label>
              <select 
                className="h-7 flex-1 border rounded px-2 bg-background font-medium"
                value={formData.nfe_series}
                onChange={e => setFormData({...formData, nfe_series: parseInt(e.target.value)})}
                disabled={!isEditable && !isAprovado || isNfeEmitida}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
              {isNfeEmitida && <span className="text-xs text-muted-foreground ml-2">Bloqueado</span>}
            </div>
          </div>
        </div>
      </div>

      </fieldset>

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
                
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-2">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.id])
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id))
                          }
                        }}
                      />
                    </td>
                    <td className="p-2 flex gap-1">
                      {false ? (
                        <button onClick={() => setEditingDetailItem(null)} className="text-green-600 hover:text-green-700" title="Confirmar Edição"><Check className="h-4 w-4"/></button>
                      ) : (
                        <>
                          {isEditable && (
                            <>
                              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                              <button onClick={() => setEditingDetailItem(item)} className="text-orange-500 hover:text-orange-700" title="Editar"><Edit2 className="h-4 w-4"/></button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{item.product?.code || ''}</td>
                    <td className="p-2 font-medium">{item.product?.description}</td>
                    
                    {/* Editable Quantidade */}
                    <td className="p-2 text-right bg-amber-100 dark:bg-amber-900/40 font-bold">
                      {false ? (
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
                      {false ? (
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
                      {false ? (
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
          {isEditable && (
            <div className="p-2 bg-muted/30 border-t border-border flex gap-2">
               <Button 
                 size="sm" 
                 variant="outline" 
                 className={`h-7 text-xs text-white font-bold ${showProductSearch ? 'bg-red-500 hover:bg-red-600 border-red-600' : 'bg-green-500 hover:bg-green-600 border-green-600'}`} 
                 onClick={() => setShowProductSearch(!showProductSearch)}
               >
                 {showProductSearch ? (
                   <><X className="h-3 w-3 mr-1"/> Fechar Busca</>
                 ) : (
                   <><Plus className="h-3 w-3 mr-1"/> Novo Item</>
                 )}
               </Button>
               <span className="text-muted-foreground text-xs self-center ml-2">*As alterações nos itens necessitam que você clique em Salvar ao final para recalcular o pedido.</span>
            </div>
          )}
          {showProductSearch && (
            <div className="p-4 border-t border-border bg-card">
               <ProductSearchInline 
                 priceTableId={formData.price_table_id} 
                 currentItems={localItems}
                 onUpdateQuantity={handleUpdateQuantityFromSearch}
               />
            </div>
          )}
        </div>
      </div>

      <fieldset disabled={!isEditable} className="border-none p-0 m-0 min-w-0">
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
                 <td>
                   <div className="flex gap-1" title="Digite e clique fora (ou aperte Enter) para ratear nos itens">
                     <Input 
                       className="h-7 text-right text-red-600 flex-1" 
                       type="number" 
                       value={formData.desconto_valor} 
                       onChange={e => setFormData({...formData, desconto_valor: Number(e.target.value)})}
                       onBlur={handleApplyGlobalDiscount}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault()
                           handleApplyGlobalDiscount()
                         }
                       }}
                     />
                     <button
                       type="button"
                       onClick={handleApplyGlobalDiscount}
                       className="h-7 px-2 bg-muted/30 hover:bg-muted border border-border rounded text-xs flex items-center justify-center font-bold text-muted-foreground"
                       title="Ratear agora"
                     >
                       Ratear
                     </button>
                   </div>
                 </td>
               </tr>
               <tr>
                 <td className="text-left font-bold pt-2 border-t border-border">Valor total do pedido</td>
                 <td className="pt-2"><Input className="h-7 text-right font-bold bg-muted/30" readOnly value={formatCurrency(totalPedido)} /></td>
               </tr>
             </tbody>
           </table>
        </div>

        <div className="bg-card border border-border p-3 rounded-md shadow-sm">
           <table className="w-full text-[12px] text-right border-collapse">
             <thead className="bg-muted/50 border-b border-border">
               <tr>
                 <th className="text-left p-1 border-r border-border font-medium">Imposto</th>
                 <th className="p-1 border-r border-border font-medium">Base de cálculo</th>
                 <th className="p-1 font-medium">Valor</th>
               </tr>
             </thead>
             <tbody>
               <tr className="bg-amber-100 dark:bg-amber-900/30 border-b border-border">
                 <td className="text-left p-1 font-bold border-r border-border text-amber-900 dark:text-amber-100">PIS</td>
                 <td className="p-1 border-r border-border font-medium">{formatCurrency(totalImpostos.pisBase)}</td>
                 <td className="p-1 font-bold text-amber-600 dark:text-amber-500">{formatCurrency(totalImpostos.pisValor)}</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="text-left p-1 border-r border-border text-muted-foreground">COFINS</td>
                 <td className="p-1 border-r border-border font-medium text-muted-foreground">{formatCurrency(totalImpostos.cofinsBase)}</td>
                 <td className="p-1 font-medium text-muted-foreground">{formatCurrency(totalImpostos.cofinsValor)}</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="text-left p-1 border-r border-border text-muted-foreground">ICMS</td>
                 <td className="p-1 border-r border-border font-medium text-muted-foreground">{formatCurrency(totalImpostos.icmsBase)}</td>
                 <td className="p-1 font-medium text-muted-foreground">{formatCurrency(totalImpostos.icmsValor)}</td>
               </tr>
               <tr className="border-b border-border text-muted-foreground">
                 <td className="text-left p-1 border-r border-border">ICMS anterior</td>
                 <td className="p-1 border-r border-border">0,00</td>
                 <td className="p-1">0,00</td>
               </tr>
               <tr className="text-muted-foreground">
                 <td className="text-left p-1 border-r border-border">ICMS ST anterior</td>
                 <td className="p-1 border-r border-border">0,00</td>
                 <td className="p-1">0,00</td>
               </tr>
             </tbody>
           </table>

           <div className="mt-4 grid grid-cols-1 gap-3 text-[12px]">
             <div className="border border-border p-2 rounded-sm relative mt-2">
               <div className="absolute -top-2.5 left-2 bg-card px-1 text-muted-foreground font-semibold">IBS UF</div>
               <div className="flex justify-between items-center px-1 mt-1">
                 <span className="text-muted-foreground flex items-center">Base de cálculo <Input className="h-6 w-20 ml-2 text-right text-xs bg-muted/20" readOnly value="0,00" /></span>
                 <span className="text-muted-foreground flex items-center">Valor <Input className="h-6 w-20 ml-2 text-right text-xs bg-muted/20" readOnly value="0,00" /></span>
               </div>
             </div>
             
             <div className="border border-border p-2 rounded-sm relative mt-2">
               <div className="absolute -top-2.5 left-2 bg-card px-1 text-muted-foreground font-semibold">CBS</div>
               <div className="flex justify-between items-center px-1 mt-1">
                 <span className="text-muted-foreground flex items-center">Base de cálculo <Input className="h-6 w-20 ml-2 text-right text-xs bg-muted/20" readOnly value="0,00" /></span>
                 <span className="text-muted-foreground flex items-center">Valor <Input className="h-6 w-20 ml-2 text-right text-xs bg-muted/20" readOnly value="0,00" /></span>
               </div>
             </div>
             
             <div className="border border-border p-2 rounded-sm relative mt-2">
               <div className="absolute -top-2.5 left-2 bg-card px-1 text-muted-foreground font-semibold">Valor aproximado dos tributos</div>
               <div className="flex items-center px-1 mt-1">
                 <span className="text-muted-foreground flex items-center">Alíquota do Simples Nacional <Input className="h-6 w-20 mx-2 text-right text-xs bg-muted/20" readOnly value="0,00" /> %</span>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* COBRANÇA E TRANSPORTE */}
      <div className="bg-card border border-border p-3 rounded-md shadow-sm">
        <div className="font-semibold border-b border-border pb-1 mb-2">Cobrança</div>
        <div className="flex gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <label className="text-right w-36">Forma de pagamento</label>
            <select 
              className="h-7 text-[13px] border rounded px-1 w-32 bg-background"
              value={formData.forma_pagamento || ''}
              onChange={e => setFormData({...formData, forma_pagamento: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option value="A prazo">A prazo</option>
              <option value="À vista">À vista</option>
              <option value="Outros">Outros</option>
            </select>
            <select 
              className="h-7 text-[13px] border rounded px-1 w-48 bg-background"
              value={(formData as any).meio_pagamento || ''}
              onChange={e => setFormData({...formData, meio_pagamento: e.target.value} as any)}
            >
              <option value="">Selecione...</option>
              <option value="01">Dinheiro</option>
              <option value="02">Cheque</option>
              <option value="03">Cartão de crédito</option>
              <option value="04">Cartão de débito</option>
              <option value="05">Crédito loja</option>
              <option value="10">Vale alimentação</option>
              <option value="11">Vale refeição</option>
              <option value="12">Vale presente</option>
              <option value="13">Vale combustível</option>
              <option value="15">Boleto bancário</option>
              <option value="16">Depósito bancário</option>
              <option value="17">Pagamento instantâneo (PIX)</option>
              <option value="18">Transferência bancária, carteira digital</option>
              <option value="19">Programa de fidelidade, cashback, crédito virtual</option>
              <option value="90">Sem pagamento</option>
              <option value="99">Outros</option>
            </select>
            <select 
              className="h-7 text-[13px] border rounded px-1 w-64 bg-background"
              value={(formData as any).conta_bancaria || ''}
              onChange={e => setFormData({...formData, conta_bancaria: e.target.value} as any)}
            >
              <option value="">Selecione a conta/banco...</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Boleto_BNB">Boleto (com registro) Banco do Nordeste</option>
              <option value="Cheque_Sicoob">Cheque Bancoob</option>
              <option value="Boleto_Sicoob">Boleto (com registro) Bancoob</option>
              <option value="Deposito_Sicoob">Depósito Bancoob</option>
            </select>
          </div>
        </div>
         <div className="flex flex-col gap-4">
           <div className="flex gap-4 items-start">
             <div className="flex items-center gap-2">
               <label className="text-right w-36 mt-1.5">Condição original</label>
               <select 
                 className="h-7 text-[13px] border rounded px-1 w-80 bg-background text-muted-foreground bg-muted/20"
                 value={formData.payment_condition_id || ''}
                 onChange={e => setFormData({...formData, payment_condition_id: e.target.value})}
                 disabled
                 title="Condição original selecionada no E-commerce"
               >
                 <option value="">Selecione...</option>
                 {paymentConditions.map((pc: any) => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
               </select>
             </div>
           </div>

           <div className="flex flex-col gap-2 pl-4">
           <div className="col-span-6 flex items-center gap-2">
             <label className="text-right w-32">Condição editável</label>
             <Input 
               className="h-7 text-[13px] flex-1 bg-background font-medium"
               value={formData.custom_payment_condition || ''}
               onChange={e => setFormData({...formData, custom_payment_condition: e.target.value})}
               placeholder="Ex: 0; 7; 14; 28 ou 3x ou 30 Dias"
               disabled={!isEditable && !isAprovado || isNfeEmitida}
             />
             {isNfeEmitida && (
               <span className="text-xs text-muted-foreground ml-2">Bloqueado pela NF</span>
             )}
           </div>
             
             {/* PREVIEW TABLE */}
             {formData.custom_payment_condition && (
               <div className="ml-[136px] w-[500px]">
                 {!parsedPayment.isValid ? (
                    <div className="text-red-500 text-xs font-medium border border-red-200 bg-red-50 p-2 rounded">
                      {parsedPayment.error} <br/>
                      Exemplos válidos: 0; 7; 14; 28 | 30/60/90 | Em 3x | 3 Parcelas | 30 Dias | À vista
                    </div>
                 ) : (
                    <div className="border border-border rounded-md overflow-hidden bg-muted/10">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="p-1.5 px-2">Parcela</th>
                            <th className="p-1.5 px-2">Prazo</th>
                            <th className="p-1.5 px-2">Vencimento</th>
                            <th className="p-1.5 px-2 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                            {parsedPayment.installments.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-2 text-center text-muted-foreground font-medium bg-muted/20">
                                  Parcelas definidas manualmente ou importadas (Fixa).
                                </td>
                              </tr>
                            ) : (
                              parsedPayment.installments.map((inst) => (
                                <tr key={inst.installmentNumber} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                  <td className="p-1.5 px-2 font-medium">{inst.installmentNumber}/{parsedPayment.installments.length}</td>
                                  <td className="p-1.5 px-2">{inst.days} dias</td>
                                  <td className="p-1.5 px-2">{inst.dueDate.toLocaleDateString('pt-BR')}</td>
                                  <td className="p-1.5 px-2 text-right text-emerald-600 font-medium">{formatCurrency(inst.amount)}</td>
                                </tr>
                              ))
                            )}
                        </tbody>
                      </table>
                    </div>
                 )}
               </div>
             )}
           </div>
         </div>

         <div className="font-semibold border-b border-border pb-1 mb-2 mt-6">Transporte</div>
         <div className="flex gap-4 items-center">
           <div className="flex items-center gap-2">
             <label className="text-right w-36">Condição de Frete</label>
             <select 
               className="h-7 text-[13px] border rounded px-1 w-80 bg-background"
               value={formData.condicao_frete || ''}
               onChange={e => setFormData({...formData, condicao_frete: e.target.value})}
             >
               <option value="">Selecione...</option>
               <option value="0">0 - Contratação do frete por conta do remetente (CIF)</option>
               <option value="1">1 - Contratação do frete por conta do destinatário (FOB)</option>
               <option value="2">2 - Contratação do frete por conta de terceiros</option>
               <option value="3">3 - Transporte próprio por conta do remetente</option>
               <option value="4">4 - Transporte próprio por conta do destinatário</option>
               <option value="9">9 - Sem ocorrência de transporte</option>
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
      </fieldset>

      {/* ACTION BAR INLINE */}
      <div className="bg-card border border-border shadow-sm p-4 flex flex-wrap items-center justify-start gap-2 rounded-md mt-6">
         {formData.status === 'Digitação' || !formData.status ? (
           <>
             <Button onClick={() => handleSave('Aprovado')} disabled={updateMutation.isPending} className="bg-[#78b31a] hover:bg-[#689914] text-white font-bold h-9">
                Aprovar pedido
             </Button>
             <Button onClick={() => handleSave()} disabled={updateMutation.isPending} variant="outline" className="h-9 font-bold ml-4">
                Apenas Salvar Alterações
             </Button>
           </>
         ) : formData.status === 'Aprovado' ? (
           <>
             <Button onClick={() => handleSave('Digitação')} disabled={updateMutation.isPending} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 font-bold h-9">
                Revisar (Reabrir)
             </Button>
             <Button onClick={() => window.print()} variant="outline" className="h-9 font-bold">
                <Printer className="h-4 w-4 mr-2" /> Imprimir
             </Button>
             <div className="flex inline-flex ml-4 items-center">
               {nfeRecord?.status === 'autorizado' ? (
                 <Button onClick={() => faturarMutation.mutate()} disabled={updateMutation.isPending || faturarMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-r-none">
                    Gerar Faturamento (Cobranças)
                 </Button>
               ) : (
                 <Button onClick={() => setShowFiscalDialog(true)} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-r-none">
                    {nfeRecord?.status === 'processando' ? 'Acompanhar Emissão (NF-e)' : nfeRecord?.status === 'erro_autorizacao' ? 'Corrigir e Re-emitir NF-e' : 'Emitir Nota Fiscal'}
                 </Button>
               )}
               <div className="relative h-9">
                 <Button 
                   className={`${nfeRecord?.status === 'autorizado' ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400' : 'bg-blue-600 hover:bg-blue-700 border-blue-400'} text-white font-bold h-9 rounded-l-none border-l px-2 flex items-center justify-center`}
                   onClick={() => setShowFaturarMenu(!showFaturarMenu)}
                 >
                   <span className="text-xs">▼</span>
                 </Button>
                 {showFaturarMenu && (
                    <div className="absolute bottom-full right-0 mb-1 bg-card border border-border shadow-md rounded flex flex-col min-w-[240px] z-50 overflow-hidden">
                       <button 
                          className="text-left px-4 py-3 hover:bg-muted text-sm font-medium transition-colors"
                          onClick={() => {
                             setShowFaturarMenu(false)
                             if (selectedItems.length === 0) {
                               toast.warning('Selecione pelo menos um item na lista de produtos para faturar parcialmente.')
                             } else {
                               toast.info(`Lógica para faturar ${selectedItems.length} itens separadamente será implementada na integração do ERP.`)
                             }
                          }}
                       >
                          Faturar os itens selecionados
                       </button>
                    </div>
                 )}
               </div>
             </div>
           </>
         ) : (
           <div className="font-semibold text-muted-foreground">
             Pedido {formData.status}
           </div>
         )}
         <Button variant="outline" className="h-9 ml-auto" onClick={() => navigate('/vendas/gestao')}>
            Sair
         </Button>
      </div>

      {showFiscalDialog && order && (
         <FiscalEmissionDialog 
            isOpen={showFiscalDialog}
            onClose={() => setShowFiscalDialog(false)}
            orderId={order.id}
            onEmitSuccess={() => {
               queryClient.invalidateQueries({ queryKey: ['sales_order', id] })
               // navigate removido para manter o usuário na tela
            }}
         />
      )}

        {editingDetailItem && (() => {
          const currentIndex = localItems.findIndex(i => i.id === editingDetailItem.id);
          const hasNextItem = currentIndex !== -1 && currentIndex < localItems.length - 1;
          
          return (
            <ItemDetailsModal 
              item={editingDetailItem} 
              isOpen={!!editingDetailItem} 
              isEditable={isEditable}
              hasNextItem={hasNextItem}
              onClose={() => setEditingDetailItem(null)} 
              onSave={async (updatedItem) => {
                setLocalItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
                try {
                  const { salesApi } = await import('@/api/sales')
                  await salesApi.updateSalesOrderItem(updatedItem.id, {
                    quantity: updatedItem.quantity,
                    unit_price: updatedItem.unit_price,
                    discount_percent: updatedItem.discount_percent || 0,
                    total_price: updatedItem.total_price,
                    net_price: updatedItem.total_price,
                    cfop: updatedItem.cfop, csosn: updatedItem.csosn, cst: updatedItem.cst, icms_rate: updatedItem.icms_rate, pis_cst: updatedItem.pis_cst, pis_rate: updatedItem.pis_rate, cofins_cst: updatedItem.cofins_cst, cofins_rate: updatedItem.cofins_rate, ipi_rate: updatedItem.ipi_rate, ncm: updatedItem.ncm, cest: updatedItem.cest, origin: updatedItem.origin
                  })
                } catch (e) {
                  console.error('Erro ao salvar item', e)
                }
              }} 
              onSaveAndNext={async (updatedItem) => {
                setLocalItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i))
                try {
                  const { salesApi } = await import('@/api/sales')
                  await salesApi.updateSalesOrderItem(updatedItem.id, {
                    quantity: updatedItem.quantity,
                    unit_price: updatedItem.unit_price,
                    discount_percent: updatedItem.discount_percent || 0,
                    total_price: updatedItem.total_price,
                    net_price: updatedItem.total_price,
                    cfop: updatedItem.cfop, csosn: updatedItem.csosn, cst: updatedItem.cst, icms_rate: updatedItem.icms_rate, pis_cst: updatedItem.pis_cst, pis_rate: updatedItem.pis_rate, cofins_cst: updatedItem.cofins_cst, cofins_rate: updatedItem.cofins_rate, ipi_rate: updatedItem.ipi_rate, ncm: updatedItem.ncm, cest: updatedItem.cest, origin: updatedItem.origin
                  })
                } catch (e) {
                  console.error('Erro ao salvar item', e)
                }
                
                if (hasNextItem) {
                  setEditingDetailItem(localItems[currentIndex + 1]);
                } else {
                  setEditingDetailItem(null);
                }
              }}
            />
          );
        })()}
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
