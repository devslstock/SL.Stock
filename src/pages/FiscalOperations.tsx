import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fiscalOperationsApi } from '@/api/fiscalOperations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { FileText, Plus, Pencil, Trash2, X, Save, ShieldCheck } from 'lucide-react'
import type { FiscalOperation } from '@/types/database'
import cfopList from '@/data/cfop.json'

const TABS = [
  { id: 'geral', label: 'Dados Gerais' },
  { id: 'inicializacao', label: 'Inicialização da Nota' },
  { id: 'estoque_financeiro', label: 'Estoque e Financeiro' },
  { id: 'impostos', label: 'Impostos' }
]

export default function FiscalOperations() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('geral')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  
  const [formData, setFormData] = useState<Partial<FiscalOperation>>({
    name: '',
    code: '',
    description: '',
    nature_of_operation: '',
    observations: '',
    cfop_intra: '',
    cfop_inter: '',
    
    serie: '',
    finality: 'NF-e normal',
    consumer_final: false,
    use_consumption: false,
    buyer_presence: '0 - não se aplica',
    payment_form: 'A prazo',
    freight_condition: '0 - Contratação do frete por conta do remetente',
    iss_incidence_local: 'Prestador',
    nfse_operation_indicator: '',
    freight_info: 'na nota fiscal, rateando o valor entre os itens',
    insurance_info: 'na nota fiscal, rateando o valor entre os itens',
    other_expenses_info: 'na nota fiscal, rateando o valor entre os itens',
    discount_info: 'nos itens, totalizando o valor na nota',
    fiscal_document: '',
    document_situation: '00 - Documento regular',
    efd_icms_ipi: 'Registro C100',
    init_ie_st: false,
    overwrite_reason_social: '',
    inform_simples_nacional_rate: false,
    
    internal_observations: '',
    fisco_info: '',
    contribuinte_info: '',
    include_customer_order: false,
    include_total_taxes: false,
    include_additional_customer_info: false,
    include_ibs_cbs: false,
    
    with_payment: true,
    payment_debit_account: '16',
    payment_finality: 'Receita',
    payment_credit_cost_center: '',
    
    move_stock: true,
    stock_origin: 'Estoque',
    stock_destination: 'CMV (Custo Mercad)',
    
    operation_type: 'Faturamento',
    special_category: '',
    future_delivery_operation: false,
    accounting_value: true,
    generate_b020: false,
    generate_traceability_group: false,
    uf_fiscal_benefit_code: '',
    installments_indicator: '',
    relevant_scale_produced: '',
    
    has_tax_reform_taxes: false,
    mobile_good_supply_indicator: false,
    
    add_customer_order_to_product: true,
    add_batch_data_to_product: false,
    add_qty_unit_data_to_product: false,
    add_original_note_data_to_product: false,
    concat_product_info_nfse: false,
    
    usage: 'Em NFs, pedidos e propostas',
    item_type: 'Produto',
    init_unit_value_stock: 'o preço de venda do item',
    init_unit_value_outsource: 'O preço de venda do item',
    permit_referenced_nf: false,
    permit_unit_value_lower_min: true,
    item_receives_apportion: true,
    
    csosn: '',
    cst: '',
    icms_rate: 0,
    ipi_rate: 0,
    pis_rate: 0,
    cofins_rate: 0,
    active: true
  })

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['fiscal_operations', company?.id],
    queryFn: () => company?.id ? fiscalOperationsApi.getOperations(company.id) : [],
    enabled: !!company?.id
  })

  const filteredOperations = operations.filter(op => 
    (op.code || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (op.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (op.cfop_intra || '').includes(searchTerm)
  )

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage)
  const paginatedOperations = filteredOperations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const saveMutation = useMutation({
    mutationFn: (data: Partial<FiscalOperation>) => {
      if (!company?.id) throw new Error('Company ID required')
      if (editingId) {
        return fiscalOperationsApi.updateOperation(editingId, data)
      }
      return fiscalOperationsApi.createOperation({ ...data, company_id: company.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_operations'] })
      toast.success(editingId ? 'Operação atualizada!' : 'Operação criada!')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fiscalOperationsApi.deleteOperation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_operations'] })
      toast.success('Operação removida!')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const resetForm = () => {
    setEditingId(null)
    setActiveTab('geral')
    setFormData({
      name: '', code: '', description: '', nature_of_operation: '', observations: '',
      cfop_intra: '', cfop_inter: '', serie: '', finality: 'NF-e normal', consumer_final: false,
      use_consumption: false, buyer_presence: '0 - não se aplica', payment_form: 'A prazo',
      freight_condition: '0 - Contratação do frete por conta do remetente', iss_incidence_local: 'Prestador',
      nfse_operation_indicator: '', freight_info: 'na nota fiscal, rateando o valor entre os itens',
      insurance_info: 'na nota fiscal, rateando o valor entre os itens', other_expenses_info: 'na nota fiscal, rateando o valor entre os itens',
      discount_info: 'nos itens, totalizando o valor na nota', fiscal_document: '', document_situation: '00 - Documento regular',
      efd_icms_ipi: 'Registro C100', init_ie_st: false, overwrite_reason_social: '', inform_simples_nacional_rate: false,
      internal_observations: '', fisco_info: '', contribuinte_info: '', include_customer_order: false, include_total_taxes: false,
      include_additional_customer_info: false, include_ibs_cbs: false, with_payment: true, payment_debit_account: '16',
      payment_finality: 'Receita', payment_credit_cost_center: '', move_stock: true, stock_origin: 'Estoque',
      stock_destination: 'CMV (Custo Mercad)', operation_type: 'Faturamento', special_category: '', future_delivery_operation: false,
      accounting_value: true, generate_b020: false, generate_traceability_group: false, uf_fiscal_benefit_code: '',
      installments_indicator: '', relevant_scale_produced: '', has_tax_reform_taxes: false, mobile_good_supply_indicator: false,
      add_customer_order_to_product: true, add_batch_data_to_product: false, add_qty_unit_data_to_product: false,
      add_original_note_data_to_product: false, concat_product_info_nfse: false, usage: 'Em NFs, pedidos e propostas',
      item_type: 'Produto', init_unit_value_stock: 'o preço de venda do item', init_unit_value_outsource: 'O preço de venda do item',
      permit_referenced_nf: false, permit_unit_value_lower_min: true, item_receives_apportion: true,
      csosn: '', cst: '', icms_rate: 0, ipi_rate: 0, pis_rate: 0, cofins_rate: 0, active: true
    })
  }

  const handleEdit = (op: FiscalOperation) => {
    setEditingId(op.id)
    setActiveTab('geral')
    setFormData({ ...op })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta operação?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSave = () => {
    if (!formData.cfop_intra || !formData.name) {
      toast.error('Preencha os campos obrigatórios (Nome e CFOP)')
      return
    }
    saveMutation.mutate(formData)
  }
  
  const handleCheckboxChange = (field: keyof FiscalOperation, checked: boolean) => {
    setFormData({ ...formData, [field]: checked })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Operações Fiscais (CFOP)
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as regras de faturamento, tributação e estoque para as notas fiscais.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Nova Operação
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <Input
            placeholder="Buscar por código, nome ou CFOP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-md"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Código / Descrição</th>
                <th className="px-4 py-3 font-semibold text-center">CFOP (Dentro/Fora)</th>
                <th className="px-4 py-3 font-semibold text-center">Movimenta Estoque</th>
                <th className="px-4 py-3 font-semibold text-center">Financeiro</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedOperations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma operação fiscal encontrada.
                  </td>
                </tr>
              ) : paginatedOperations.map(op => (
                <tr key={op.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{op.code} - {op.name}</div>
                    <div className="text-xs text-muted-foreground">{op.description || op.nature_of_operation}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{op.cfop_intra}</span> / <span className="font-mono bg-muted px-2 py-1 rounded text-xs">{op.cfop_inter || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    {op.move_stock ? <span className="text-emerald-500 font-medium">SIM</span> : <span className="text-muted-foreground">NÃO</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    {op.with_payment ? <span className="text-emerald-500 font-medium">SIM</span> : <span className="text-muted-foreground">NÃO</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${op.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {op.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(op)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(op.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10">
            <span className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredOperations.length)} de {filteredOperations.length} operações
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-border/50">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                {editingId ? 'Editar Operação Fiscal' : 'Nova Operação Fiscal'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Tabs Header */}
            <div className="flex border-b border-border/50 bg-muted/20 px-6">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* ABA: DADOS GERAIS */}
              {activeTab === 'geral' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Código *</Label>
                      <Input value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ex: 5102-1" />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Descrição / Nome Interno *</Label>
                      <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Venda de mercadoria..." />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CFOP Padrão (Dentro do Estado) *</Label>
                      <Input value={formData.cfop_intra || ''} onChange={e => setFormData({...formData, cfop_intra: e.target.value})} placeholder="5102" />
                    </div>
                    <div className="space-y-2">
                      <Label>Natureza da Operação (Nota Fiscal) *</Label>
                      <Input value={formData.nature_of_operation || ''} onChange={e => setFormData({...formData, nature_of_operation: e.target.value})} placeholder="Sairá impresso na NF..." />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Observações Gerais</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.observations || ''} 
                      onChange={e => setFormData({...formData, observations: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {/* ABA: INICIALIZAÇÃO DA NOTA */}
              {activeTab === 'inicializacao' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Série Padrão</Label>
                      <Input value={formData.serie || ''} onChange={e => setFormData({...formData, serie: e.target.value})} placeholder="Ex: 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Finalidade</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.finality} onChange={e => setFormData({...formData, finality: e.target.value})}>
                        <option value="NF-e normal">NF-e normal</option>
                        <option value="NF-e complementar">NF-e complementar</option>
                        <option value="NF-e de ajuste">NF-e de ajuste</option>
                        <option value="Devolução de mercadoria">Devolução de mercadoria</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Condição de Frete</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.freight_condition} onChange={e => setFormData({...formData, freight_condition: e.target.value})}>
                        <option value="0 - Contratação do frete por conta do remetente">0 - Por conta do remetente (CIF)</option>
                        <option value="1 - Contratação do frete por conta do destinatário">1 - Por conta do destinatário (FOB)</option>
                        <option value="2 - Contratação do frete por conta de terceiros">2 - Por conta de terceiros</option>
                        <option value="9 - Sem ocorrência de transporte">9 - Sem frete</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Presença do Comprador</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.buyer_presence} onChange={e => setFormData({...formData, buyer_presence: e.target.value})}>
                        <option value="0 - não se aplica">0 - Não se aplica</option>
                        <option value="1 - Operação presencial">1 - Presencial</option>
                        <option value="2 - Operação não presencial, pela Internet">2 - Internet</option>
                        <option value="3 - Operação não presencial, Teleatendimento">3 - Teleatendimento</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.consumer_final || false} onChange={e => handleCheckboxChange('consumer_final', e.target.checked)} className="rounded text-primary" />
                      Para consumidor final
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.use_consumption || false} onChange={e => handleCheckboxChange('use_consumption', e.target.checked)} className="rounded text-primary" />
                      Para uso e consumo
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Informações Adicionais (Fisco)</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.fisco_info || ''} onChange={e => setFormData({...formData, fisco_info: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Informações Adicionais (Contribuinte)</Label>
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.contribuinte_info || ''} onChange={e => setFormData({...formData, contribuinte_info: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: ESTOQUE E FINANCEIRO */}
              {activeTab === 'estoque_financeiro' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Financeiro */}
                    <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card/50">
                      <h3 className="font-semibold text-lg border-b pb-2">Financeiro</h3>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input type="checkbox" checked={formData.with_payment || false} onChange={e => handleCheckboxChange('with_payment', e.target.checked)} className="rounded text-primary h-4 w-4" />
                        Com Pagamento (Gera Contas a Receber/Pagar)
                      </label>
                      {formData.with_payment && (
                        <div className="grid grid-cols-2 gap-4 pl-6 pt-2">
                          <div className="space-y-2">
                            <Label>Conta Contábil (Débito)</Label>
                            <Input value={formData.payment_debit_account || ''} onChange={e => setFormData({...formData, payment_debit_account: e.target.value})} placeholder="Ex: 16 (Clientes)" />
                          </div>
                          <div className="space-y-2">
                            <Label>Finalidade</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.payment_finality} onChange={e => setFormData({...formData, payment_finality: e.target.value})}>
                              <option value="Receita">Receita</option>
                              <option value="Despesa">Despesa</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Estoque */}
                    <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card/50">
                      <h3 className="font-semibold text-lg border-b pb-2">Estoque</h3>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input type="checkbox" checked={formData.move_stock || false} onChange={e => handleCheckboxChange('move_stock', e.target.checked)} className="rounded text-primary h-4 w-4" />
                        Movimentar Estoque
                      </label>
                      {formData.move_stock && (
                        <div className="grid grid-cols-2 gap-4 pl-6 pt-2">
                          <div className="space-y-2">
                            <Label>Origem</Label>
                            <Input value={formData.stock_origin || ''} onChange={e => setFormData({...formData, stock_origin: e.target.value})} placeholder="Ex: Estoque" />
                          </div>
                          <div className="space-y-2">
                            <Label>Destino</Label>
                            <Input value={formData.stock_destination || ''} onChange={e => setFormData({...formData, stock_destination: e.target.value})} placeholder="Ex: CMV" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">Dados Adicionais do Produto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.add_customer_order_to_product || false} onChange={e => handleCheckboxChange('add_customer_order_to_product', e.target.checked)} className="rounded" />
                        Adicionar pedido do cliente nas informações adicionais
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.add_batch_data_to_product || false} onChange={e => handleCheckboxChange('add_batch_data_to_product', e.target.checked)} className="rounded" />
                        Adicionar dados do lote
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.permit_unit_value_lower_min || false} onChange={e => handleCheckboxChange('permit_unit_value_lower_min', e.target.checked)} className="rounded" />
                        Permite valor unitário menor que o mínimo
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: IMPOSTOS */}
              {activeTab === 'impostos' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-amber-500/10 text-amber-600 rounded-lg text-sm mb-4">
                    A parametrização fina de exceções tributárias (CSTs específicos por NCM) será gerenciada nas configurações avançadas do Motor NFe. Abaixo você define os padrões genéricos para esta operação.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>CSOSN / CST ICMS Padrão</Label>
                      <Input value={formData.csosn || ''} onChange={e => setFormData({...formData, csosn: e.target.value})} placeholder="Ex: 102 ou 400" />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota ICMS (%)</Label>
                      <Input type="number" value={formData.icms_rate || ''} onChange={e => setFormData({...formData, icms_rate: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota PIS (%)</Label>
                      <Input type="number" value={formData.pis_rate || ''} onChange={e => setFormData({...formData, pis_rate: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota COFINS (%)</Label>
                      <Input type="number" value={formData.cofins_rate || ''} onChange={e => setFormData({...formData, cofins_rate: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota IPI (%)</Label>
                      <Input type="number" value={formData.ipi_rate || ''} onChange={e => setFormData({...formData, ipi_rate: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-sm font-medium">Operação Ativa</span>
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Operação
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
