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
import { ArrowLeft, Save, Package } from 'lucide-react'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuth()
  
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
    box_quantity: 0
  })

  // Preços por tabela: chave é o table_id, valor é um objeto { price, discount }
  const [prices, setPrices] = useState<Record<string, { price: number, discount_percent: number }>>({})

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
      setFormData({
        code: product.code || '',
        external_code: product.external_code || '',
        factory_code: product.factory_code || '',
        description: product.description || '',
        unit_measure: product.unit_measure || 'UN',
        group_name: product.group_name || '',
        batch: product.batch || '',
        stock: product.stock || 0,
        min_stock_alert: product.min_stock_alert || 0,
        ncm: product.ncm || '',
        cest: product.cest || '',
        origin: product.origin || '0',
        net_weight: product.net_weight || 0,
        gross_weight: product.gross_weight || 0,
        unit_weight: product.unit_weight || 0,
        box_quantity: product.box_quantity || 0
      })
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
    onError: (e: any) => {
      const msg = e.message || ''
      if (msg.includes('products_company_code_key') || (msg.includes('unique constraint') && msg.includes('code'))) {
        toast.error('Código já está cadastrado em outro produto.')
      } else {
        toast.error(`Erro ao salvar: ${e.message}`)
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
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 font-semibold uppercase text-xs tracking-wider"
              >
                Tabelas de Preço
              </TabsTrigger>
              <TabsTrigger 
                value="fiscal" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-3 font-semibold uppercase text-xs tracking-wider"
              >
                Fiscal e Pesos
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ncm" className="text-xs font-bold uppercase text-muted-foreground">NCM</Label>
                <Input id="ncm" value={formData.ncm || ''} onChange={e => setFormData({...formData, ncm: e.target.value})} placeholder="Ex: 85171231" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cest" className="text-xs font-bold uppercase text-muted-foreground">CEST</Label>
                <Input id="cest" value={formData.cest || ''} onChange={e => setFormData({...formData, cest: e.target.value})} placeholder="Ex: 2105300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-xs font-bold uppercase text-muted-foreground">Origem (CST/CSOSN)</Label>
                <select id="origin" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={formData.origin || '0'} onChange={e => setFormData({...formData, origin: e.target.value})}>
                  <option value="0">0 - Nacional</option>
                  <option value="1">1 - Estrangeira (Importação direta)</option>
                  <option value="2">2 - Estrangeira (Adquirida no mercado interno)</option>
                  <option value="3">3 - Nacional (Importação &gt; 40%)</option>
                  <option value="4">4 - Nacional (Processo produtivo básico)</option>
                  <option value="5">5 - Nacional (Importação &lt;= 40%)</option>
                  <option value="6">6 - Estrangeira (Importação s/ similar nacional)</option>
                  <option value="7">7 - Estrangeira (Mercado interno s/ similar nacional)</option>
                  <option value="8">8 - Nacional (Importação &gt; 70%)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_weight" className="text-xs font-bold uppercase text-muted-foreground">Peso Líquido (kg)</Label>
                <Input id="net_weight" type="number" step="0.001" value={formData.net_weight || ''} onChange={e => setFormData({...formData, net_weight: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross_weight" className="text-xs font-bold uppercase text-muted-foreground">Peso Bruto (kg)</Label>
                <Input id="gross_weight" type="number" step="0.001" value={formData.gross_weight || ''} onChange={e => setFormData({...formData, gross_weight: Number(e.target.value)})} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
