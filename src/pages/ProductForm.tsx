import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { productsApi } from '@/api/products'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, Package, Save, CheckCircle2, AlertCircle, X, Plus, Trash2, Lock, Loader2, Search } from 'lucide-react'
import { getErrorMessage } from '@/utils/errorMessage'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuth()
  const isPlatina = company?.plan === 'platina'
  
  const isEditing = Boolean(id)

  const [activeTab, setActiveTab] = useState('geral')
  const [isCustomUnit, setIsCustomUnit] = useState(false)

  const commonUnits = ["UN", "KG", "CX", "LT", "PC", "M", "M2", "M3", "PR", "FD", "PCT", "GL", "TON"]

  const [formData, setFormData] = useState({
    code: '',
    external_code: '',
    factory_code: '',
    description: '',
    unit_measure: 'UN',
    group_name: '',
    batch: '',
    stock: 0,
    min_stock_alert: 0,
    ncm: '',
    cest: '',
    origin: '0',
    net_weight: 0,
    gross_weight: 0,
    unit_weight: 0,
    box_quantity: 0,
    ipi_rate: 0,
    icms_rate: 0,
    cfop: '',
    csosn: '',
    cst: '',
    pis_cst: '',
    cofins_cst: '',
    fci: '',
    gtin: '',
    gtin_tributable: '',
    complementary_description: '',
    notes: '',
    technical_notes: '',
    active: true,

    // Novas propriedades (Mega Formulário)
    origin_type: 'Comprado',
    integer_quantity: false,
    photo_url: '',
    abbreviation: '',
    quantity_per_volume: 0,
    sales_unit: '',
    sales_unit_factor: 1,
    purchase_unit: '',
    purchase_unit_factor: 1,
    sales_quantity_calculation_method: 'Qt direta',
    scale_min_weight: 0,
    scale_max_weight: 0,
    scale_tare: 0,
    scale_quantity_method: 'Unitário',
    purchase_price: 0,
    sellable: true,
    sales_price: 0,
    min_sales_price: 0,
    min_sellable_batch: 0,
    multiple_sellable_batch: 0,
    integrate_ecommerce: false,
    service_code: '',
    nbs: '',
    service_type: '',
    income_nature: '',
    anvisa_code: '',
    accounting_type: '',
    fiscal_notes: '',
    max_consumer_price: 0,
    icms_st_base_ret: 0,
    icms_st_value_ret: 0,
    icms_fcp_st_base_ret: 0,
    icms_fcp_st_value_ret: 0,
    icms_substitute_value: 0,
    consumer_supported_rate: 0,
    icms_fcp_st_rate_ret: 0,
    fiscal_gender: '',
    asset_identification: '',
    anp_code: '',
    fci_percentage: 0,
    fci_cost: 0,
    suframa_process: '',
    storage_by: 'Código do item',
    stock_address: '',
    inspection_method: 'Sem inspeção',
    write_off_method: 'Manual',
    reorder_point: 0,
    min_batch: 0,
    multiple_batch: 0,
    is_stock_item: true,
    validity_days: 0,
    acquisition_deadline_days: 0,
    internal_receipt_deadline_days: 0,
    drawing_path: '',
    drawing_revision: '',
    budget_cost: 0,
    markup_percentage: 0
  })

  // Preços por tabela: chave é o table_id, valor é um objeto { price, discount }
  const [prices, setPrices] = useState<Record<string, { price: number, discount_percent: number }>>({})

  const [isSearchingNcm, setIsSearchingNcm] = useState(false)
  const [isSearchingCfop, setIsSearchingCfop] = useState(false)

  const handleSearchNcm = async () => {
    if (!formData.ncm) {
      toast.error('Preencha o código NCM para consultar')
      return
    }
    setIsSearchingNcm(true)
    try {
      const { data, error } = await supabase.functions.invoke('focus-auxiliary', {
        body: { type: 'ncm', searchParams: { codigo: formData.ncm.replace(/\D/g, '') } }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      toast.success(`NCM encontrado: ${data.data.descricao}`)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Erro ao consultar NCM')
    } finally {
      setIsSearchingNcm(false)
    }
  }

  const handleSearchCfop = async () => {
    if (!formData.cfop) {
      toast.error('Preencha o código CFOP para consultar')
      return
    }
    setIsSearchingCfop(true)
    try {
      const { data, error } = await supabase.functions.invoke('focus-auxiliary', {
        body: { type: 'cfop', searchParams: { codigo: formData.cfop.replace(/\D/g, '') } }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      toast.success(`CFOP encontrado: ${data.data.descricao}`)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Erro ao consultar CFOP')
    } finally {
      setIsSearchingCfop(false)
    }
  }

  // Fetch product if editing
  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: isEditing
  })

  // Fetch active price tables
  const { data: priceTables = [], isLoading: isTablesLoading } = useQuery({
    queryKey: ['price_tables'],
    queryFn: async () => {
      if (!company?.id) return []
      const { data, error } = await supabase.from('price_tables').select('*').eq('company_id', company.id).eq('active', true).order('name')
      if (error) throw error
      return data
    },
    enabled: !!company?.id
  })

  // Fetch product prices if editing
  const { data: productPrices = [], isLoading: isPricesLoading } = useQuery({
    queryKey: ['product_prices', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase.from('price_table_items').select('*').eq('product_id', id)
      if (error) throw error
      return data
    },
    enabled: isEditing
  })

  // Populate form when data arrives
  useEffect(() => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        ...product,
        active: product.active ?? true
      }))
    }
  }, [product])

  // Populate prices when data arrives
  useEffect(() => {
    if (productPrices.length > 0) {
      const newPrices: Record<string, { price: number, discount_percent: number }> = {}
      productPrices.forEach((p: any) => {
        newPrices[p.price_table_id] = {
          price: p.price || 0,
          discount_percent: p.discount_percent || 0
        }
      })
      setPrices(newPrices)
    }
  }, [productPrices])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Empresa não encontrada')
      
      const payload = {
        ...(isEditing ? { id } : {}),
        company_id: company.id,
        ...formData,
        stock: Number(formData.stock),
        min_stock_alert: Number(formData.min_stock_alert)
      }

      // Convert prices state to array
      const pricesArray = Object.keys(prices).map(tableId => ({
        tableId,
        price: Number(prices[tableId].price) || 0,
        discount_percent: Number(prices[tableId].discount_percent) || 0
      }))

      return productsApi.saveProductWithPrices(payload, pricesArray)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['product_prices', id] })
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      navigate('/produtos')
    },
    onError: (e: unknown) => {
      const msg = getErrorMessage(e)
      if (msg.includes('products_company_code_key') || (msg.includes('unique constraint') && msg.includes('code'))) {
        toast.error('Código já está cadastrado em outro produto.')
      } else {
        toast.error(`Erro ao salvar: ${msg}`)
      }
    }
  })

  const handlePriceChange = (tableId: string, field: 'price' | 'discount_percent', value: string) => {
    setPrices(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        [field]: value === '' ? 0 : parseFloat(value)
      }
    }))
  }

  const isLoading = isProductLoading || isTablesLoading || isPricesLoading

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados do produto...</div>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Preencha os dados básicos e configure os preços nas tabelas ativas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/produtos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Produto</>}
          </Button>
        </div>
      </div>

      <div className="glass-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border/50 px-4 py-2">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger 
                value="geral" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 font-semibold uppercase text-xs tracking-wider"
              >
                Informações Gerais
              </TabsTrigger>
              <TabsTrigger 
                value="precos" 
                disabled={!isPlatina}
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 font-semibold uppercase text-xs tracking-wider disabled:opacity-50 flex items-center gap-1"
                title={!isPlatina ? "Disponível apenas no plano Platina" : ""}
              >
                Tabelas de Preço
                {!isPlatina && <Lock className="h-3 w-3" />}
              </TabsTrigger>
              <TabsTrigger 
                value="fiscal" 
                disabled={!isPlatina}
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 font-semibold uppercase text-xs tracking-wider disabled:opacity-50 flex items-center gap-1"
                title={!isPlatina ? "Disponível apenas no plano Platina" : ""}
              >
                Fiscal e Pesos
                {!isPlatina && <Lock className="h-3 w-3" />}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="geral" className="p-6 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase text-muted-foreground">Descrição *</Label>
                <Input 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs font-bold uppercase text-muted-foreground">Código Interno *</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="external_code" className="text-xs font-bold uppercase text-muted-foreground">Código Externo (EAN)</Label>
                <Input 
                  id="external_code" 
                  value={formData.external_code} 
                  onChange={e => setFormData({...formData, external_code: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factory_code" className="text-xs font-bold uppercase text-muted-foreground">Código de Fábrica</Label>
                <Input 
                  id="factory_code" 
                  value={formData.factory_code} 
                  onChange={e => setFormData({...formData, factory_code: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_measure" className="text-xs font-bold uppercase text-muted-foreground">Unidade de Medida</Label>
                {!isCustomUnit ? (
                  <select
                    id="unit_measure"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={commonUnits.includes(formData.unit_measure?.toUpperCase()) ? formData.unit_measure?.toUpperCase() : (formData.unit_measure ? 'custom_existing' : '')}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setIsCustomUnit(true)
                        setFormData({...formData, unit_measure: ''})
                      } else if (e.target.value === 'custom_existing') {
                         // do nothing, keep existing value
                      } else {
                        setFormData({...formData, unit_measure: e.target.value})
                      }
                    }}
                  >
                    <option value="">Selecione...</option>
                    {commonUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                    {formData.unit_measure && !commonUnits.includes(formData.unit_measure?.toUpperCase()) && (
                      <option value="custom_existing">{formData.unit_measure.toUpperCase()}</option>
                    )}
                    <option value="custom" className="font-bold text-primary bg-primary/10">+ Adicionar nova medida</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      id="unit_measure" 
                      value={formData.unit_measure} 
                      onChange={e => setFormData({...formData, unit_measure: e.target.value.toUpperCase()})} 
                      placeholder="Ex: PCT"
                      autoFocus
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setIsCustomUnit(false)}
                      className="px-3"
                    >
                      OK
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_name" className="text-xs font-bold uppercase text-muted-foreground">Categoria / Grupo</Label>
                <Input 
                  id="group_name" 
                  value={formData.group_name} 
                  onChange={e => setFormData({...formData, group_name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-xs font-bold uppercase text-muted-foreground">Lote Padrão</Label>
                <Input 
                  id="batch" 
                  value={formData.batch} 
                  onChange={e => setFormData({...formData, batch: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-bold uppercase text-muted-foreground">Estoque Atual</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.stock} 
                  onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_alert" className="text-xs font-bold uppercase text-muted-foreground">Alerta Estoque Mín.</Label>
                <Input 
                  id="min_stock_alert" 
                  type="number" 
                  value={formData.min_stock_alert} 
                  onChange={e => setFormData({...formData, min_stock_alert: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="complementary_description" className="text-xs font-bold uppercase text-muted-foreground">Descrição Complementar</Label>
                <Input 
                  id="complementary_description" 
                  value={formData.complementary_description} 
                  onChange={e => setFormData({...formData, complementary_description: e.target.value})} 
                  placeholder="Informações adicionais para nota fiscal"
                />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="notes" className="text-xs font-bold uppercase text-muted-foreground">Observações (Uso Interno)</Label>
                <Input 
                  id="notes" 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Anotações internas"
                />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="technical_notes" className="text-xs font-bold uppercase text-muted-foreground">Observações Técnicas</Label>
                <Input 
                  id="technical_notes" 
                  value={formData.technical_notes} 
                  onChange={e => setFormData({...formData, technical_notes: e.target.value})} 
                  placeholder="Detalhes técnicos, medidas, voltagem, etc"
                />
              </div>
              <div className="space-y-2 lg:col-span-3 flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="active" 
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <Label htmlFor="active" className="text-sm font-bold cursor-pointer">Produto Ativo</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="precos" className="p-6 focus-visible:outline-none">
            {priceTables.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                Nenhuma tabela de preço ativa encontrada. <br/>
                Vá até o menu de Tabelas de Preço para criar uma.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {priceTables.map((table: any) => {
                  const currentPrice = prices[table.id]?.price || ''
                  return (
                    <div key={table.id} className="space-y-2 bg-muted/20 p-4 rounded-lg border border-border/50">
                      <Label className="text-[11px] font-bold uppercase text-muted-foreground truncate block" title={table.name}>
                        {table.name}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">R$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          className="pl-8 font-medium"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(table.id, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fiscal" className="p-6 focus-visible:outline-none">
            
            {/* Ocultar dados complementares */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4" open>
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">
                Dados complementares
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Procedência</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.origin_type || 'Comprado'} onChange={e => setFormData({...formData, origin_type: e.target.value})}>
                    <option value="Comprado">Comprado</option>
                    <option value="Fabricado">Fabricado</option>
                  </select>
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.integer_quantity || false} onChange={e => setFormData({...formData, integer_quantity: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-sm font-bold">Quantidade inteira</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Sigla</Label>
                  <Input value={formData.abbreviation || ''} onChange={e => setFormData({...formData, abbreviation: e.target.value})} />
                </div>
              </div>
            </details>

            {/* Ocultar pesos, volumes e outras unidades */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4" open>
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">
                Pesos, volumes e outras unidades
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Peso Líquido</Label>
                  <Input type="number" step="0.001" value={formData.net_weight || ''} onChange={e => setFormData({...formData, net_weight: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Peso Bruto</Label>
                  <Input type="number" step="0.001" value={formData.gross_weight || ''} onChange={e => setFormData({...formData, gross_weight: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Quantidade por volume</Label>
                  <Input type="number" value={formData.quantity_per_volume || ''} onChange={e => setFormData({...formData, quantity_per_volume: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Unidade de Venda</Label>
                  <Input value={formData.sales_unit || ''} onChange={e => setFormData({...formData, sales_unit: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Unidade de Compra</Label>
                  <Input value={formData.purchase_unit || ''} onChange={e => setFormData({...formData, purchase_unit: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Cálculo em proposta</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.sales_quantity_calculation_method || 'Qt direta'} onChange={e => setFormData({...formData, sales_quantity_calculation_method: e.target.value})}>
                    <option value="Qt direta">Qt direta</option>
                  </select>
                </div>
              </div>
            </details>

            {/* Ocultar balança */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">
                Balança
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Peso Mínimo</Label>
                  <Input type="number" step="0.001" value={formData.scale_min_weight || ''} onChange={e => setFormData({...formData, scale_min_weight: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Peso Máximo</Label>
                  <Input type="number" step="0.001" value={formData.scale_max_weight || ''} onChange={e => setFormData({...formData, scale_max_weight: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Tara</Label>
                  <Input type="number" step="0.001" value={formData.scale_tare || ''} onChange={e => setFormData({...formData, scale_tare: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Qtd nas Movimentações</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.scale_quantity_method || 'Unitário'} onChange={e => setFormData({...formData, scale_quantity_method: e.target.value})}>
                    <option value="Unitário">Unitário</option>
                  </select>
                </div>
              </div>
            </details>

            {/* Ocultar Compras / Vendas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <details className="bg-muted/10 border border-border rounded-lg p-4" open>
                <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Compras</summary>
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Preço de Compra</Label>
                  <Input type="number" step="0.01" value={formData.purchase_price || ''} onChange={e => setFormData({...formData, purchase_price: Number(e.target.value)})} />
                </div>
              </details>
              
              <details className="bg-muted/10 border border-border rounded-lg p-4" open>
                <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Vendas</summary>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="col-span-2 space-y-2 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.sellable ?? true} onChange={e => setFormData({...formData, sellable: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                      <span className="text-sm font-bold">Item vendável</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Preço Mínimo</Label>
                    <Input type="number" step="0.01" value={formData.min_sales_price || ''} onChange={e => setFormData({...formData, min_sales_price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Lote Mínimo Vendável</Label>
                    <Input type="number" value={formData.min_sellable_batch || ''} onChange={e => setFormData({...formData, min_sellable_batch: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Lote Múltiplo Vendável</Label>
                    <Input type="number" value={formData.multiple_sellable_batch || ''} onChange={e => setFormData({...formData, multiple_sellable_batch: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2 flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.integrate_ecommerce || false} onChange={e => setFormData({...formData, integrate_ecommerce: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                      <span className="text-sm font-bold">Integrar E-commerce</span>
                    </label>
                  </div>
                </div>
              </details>
            </div>

            {/* Ocultar dados fiscais base */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4" open>
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Dados Fiscais Básicos</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="ncm" className="text-xs font-bold uppercase text-muted-foreground">NCM</Label>
                  <div className="flex gap-2">
                    <Input id="ncm" value={formData.ncm || ''} onChange={e => setFormData({...formData, ncm: e.target.value})} placeholder="Ex: 85171231" />
                    <Button type="button" variant="outline" size="icon" onClick={handleSearchNcm} disabled={isSearchingNcm || !formData.ncm} title="Consultar NCM">
                      {isSearchingNcm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cest" className="text-xs font-bold uppercase text-muted-foreground">CEST</Label>
                  <Input id="cest" value={formData.cest || ''} onChange={e => setFormData({...formData, cest: e.target.value})} placeholder="Ex: 2105300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-xs font-bold uppercase text-muted-foreground">Origem Mercadoria</Label>
                  <select id="origin" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.origin || '0'} onChange={e => setFormData({...formData, origin: e.target.value})}>
                    <option value="0">0 - Nacional</option>
                    <option value="1">1 - Estrangeira (Importação direta)</option>
                    <option value="2">2 - Estrangeira (Adquirida no mercado interno)</option>
                    <option value="3">3 - Nacional (Importação &gt; 40%)</option>
                    <option value="4">4 - Nacional (Processo produtivo básico)</option>
                    <option value="5">5 - Nacional (Importação &lt;= 40%)</option>
                    <option value="6">6 - Estrangeira (Importação s/ similar nacional)</option>
                    <option value="7">7 - Estrangeira (Merc. int. s/ similar nac.)</option>
                    <option value="8">8 - Nacional (Importação &gt; 70%)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">CFOP Padrão</Label>
                  <div className="flex gap-2">
                    <Input value={formData.cfop || ''} onChange={e => setFormData({...formData, cfop: e.target.value})} />
                    <Button type="button" variant="outline" size="icon" onClick={handleSearchCfop} disabled={isSearchingCfop || !formData.cfop} title="Consultar CFOP">
                      {isSearchingCfop ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">CST Padrão</Label>
                  <Input value={formData.cst || ''} onChange={e => setFormData({...formData, cst: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">CSOSN Padrão</Label>
                  <Input value={formData.csosn || ''} onChange={e => setFormData({...formData, csosn: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">PIS CST</Label>
                  <Input value={formData.pis_cst || ''} onChange={e => setFormData({...formData, pis_cst: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">COFINS CST</Label>
                  <Input value={formData.cofins_cst || ''} onChange={e => setFormData({...formData, cofins_cst: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Aliq. ICMS (%)</Label>
                  <Input type="number" step="0.01" value={formData.icms_rate || ''} onChange={e => setFormData({...formData, icms_rate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Aliq. IPI (%)</Label>
                  <Input type="number" step="0.01" value={formData.ipi_rate || ''} onChange={e => setFormData({...formData, ipi_rate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">GTIN (EAN Principal)</Label>
                  <Input value={formData.gtin || ''} onChange={e => setFormData({...formData, gtin: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">GTIN Unid. Tributável</Label>
                  <Input value={formData.gtin_tributable || ''} onChange={e => setFormData({...formData, gtin_tributable: e.target.value})} />
                </div>
              </div>
            </details>

            {/* Ocultar Outros dados fiscais */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Outros dados fiscais e Serviço</summary>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Código do serviço</Label>
                  <Input value={formData.service_code || ''} onChange={e => setFormData({...formData, service_code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">NBS</Label>
                  <Input value={formData.nbs || ''} onChange={e => setFormData({...formData, nbs: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Código ANVISA</Label>
                  <Input value={formData.anvisa_code || ''} onChange={e => setFormData({...formData, anvisa_code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Preço Max. Consumidor</Label>
                  <Input type="number" step="0.01" value={formData.max_consumer_price || ''} onChange={e => setFormData({...formData, max_consumer_price: Number(e.target.value)})} />
                </div>
                <div className="col-span-4 space-y-2 mt-4 border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">ICMS ST Anterior (Retido)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Base ICMS ST</Label>
                      <Input type="number" step="0.01" value={formData.icms_st_base_ret || ''} onChange={e => setFormData({...formData, icms_st_base_ret: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Valor ICMS ST</Label>
                      <Input type="number" step="0.01" value={formData.icms_st_value_ret || ''} onChange={e => setFormData({...formData, icms_st_value_ret: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Base ICMS FCP ST</Label>
                      <Input type="number" step="0.01" value={formData.icms_fcp_st_base_ret || ''} onChange={e => setFormData({...formData, icms_fcp_st_base_ret: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Valor ICMS FCP ST</Label>
                      <Input type="number" step="0.01" value={formData.icms_fcp_st_value_ret || ''} onChange={e => setFormData({...formData, icms_fcp_st_value_ret: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
                <div className="col-span-4 space-y-2 mt-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Cód. Produto ANP</Label>
                      <Input value={formData.anp_code || ''} onChange={e => setFormData({...formData, anp_code: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Nº da FCI</Label>
                      <Input value={formData.fci || ''} onChange={e => setFormData({...formData, fci: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Proc. SUFRAMA</Label>
                      <Input value={formData.suframa_process || ''} onChange={e => setFormData({...formData, suframa_process: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* Ocultar estocagem */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Estocagem, inspeção, baixa e planejamento</summary>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Estocagem por</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.storage_by || 'Código do item'} onChange={e => setFormData({...formData, storage_by: e.target.value})}>
                    <option value="Código do item">Código do item</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Endereço de estoque</Label>
                  <Input value={formData.stock_address || ''} onChange={e => setFormData({...formData, stock_address: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Inspeção</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.inspection_method || 'Sem inspeção'} onChange={e => setFormData({...formData, inspection_method: e.target.value})}>
                    <option value="Sem inspeção">Sem inspeção</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Baixa</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.write_off_method || 'Manual'} onChange={e => setFormData({...formData, write_off_method: e.target.value})}>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Prazo Validade (dias)</Label>
                  <Input type="number" value={formData.validity_days || ''} onChange={e => setFormData({...formData, validity_days: Number(e.target.value)})} />
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_stock_item ?? true} onChange={e => setFormData({...formData, is_stock_item: e.target.checked})} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-sm font-bold">Item de Estoque</span>
                  </label>
                </div>
              </div>
            </details>

            {/* Ocultar desenho */}
            <details className="bg-muted/10 border border-border rounded-lg p-4 mb-4">
              <summary className="font-semibold cursor-pointer mb-2 border-b border-border pb-2 select-none">Desenho e Custo de Orçamentação</summary>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Desenho</Label>
                  <Input value={formData.drawing_path || ''} onChange={e => setFormData({...formData, drawing_path: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Revisão</Label>
                  <Input value={formData.drawing_revision || ''} onChange={e => setFormData({...formData, drawing_revision: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Custo (R$)</Label>
                  <Input type="number" step="0.01" value={formData.budget_cost || ''} onChange={e => setFormData({...formData, budget_cost: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">% Markup</Label>
                  <Input type="number" step="0.01" value={formData.markup_percentage || ''} onChange={e => setFormData({...formData, markup_percentage: Number(e.target.value)})} />
                </div>
              </div>
            </details>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
