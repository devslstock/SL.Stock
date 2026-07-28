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

export default function FiscalOperations() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<FiscalOperation>>({
    name: '',
    cfop_intra: '',
    cfop_inter: '',
    csosn: '',
    cst: '',
    icms_rate: 0,
    ipi_rate: 0,
    pis_rate: 0,
    cofins_rate: 0,
    default_message: '',
    active: true
  })

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['fiscal_operations', company?.id],
    queryFn: () => company?.id ? fiscalOperationsApi.getOperations(company.id) : [],
    enabled: !!company?.id
  })

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
    setFormData({
      name: '',
      cfop_intra: '',
      cfop_inter: '',
      csosn: '',
      cst: '',
      icms_rate: 0,
      ipi_rate: 0,
      pis_rate: 0,
      cofins_rate: 0,
      default_message: '',
      active: true
    })
  }

  const handleEdit = (op: FiscalOperation) => {
    setEditingId(op.id)
    setFormData({
      name: op.name,
      cfop_intra: op.cfop_intra,
      cfop_inter: op.cfop_inter,
      csosn: op.csosn || '',
      cst: op.cst || '',
      icms_rate: op.icms_rate || 0,
      ipi_rate: op.ipi_rate || 0,
      pis_rate: op.pis_rate || 0,
      cofins_rate: op.cofins_rate || 0,
      default_message: op.default_message || '',
      active: op.active
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Remover esta operação fiscal?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Natureza de Operação (CFOP)
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie regras fiscais, CFOP e impostos para emissão de NF-e</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Operação
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold text-center">CFOP (Dentro/Fora Estado)</th>
                <th className="px-4 py-3 font-semibold text-center">CST/CSOSN</th>
                <th className="px-4 py-3 font-semibold text-center">ICMS %</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {operations.map(op => (
                <tr key={op.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{op.name}</td>
                  <td className="px-4 py-3 text-center">{op.cfop_intra} / {op.cfop_inter}</td>
                  <td className="px-4 py-3 text-center">{op.cst || op.csosn || '-'}</td>
                  <td className="px-4 py-3 text-center">{op.icms_rate}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${op.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {op.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(op)} className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(op.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {operations.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma operação fiscal cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {editingId ? 'Editar Operação Fiscal' : 'Nova Operação Fiscal'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Descrição da Operação *</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Venda de Mercadoria, Remessa para Conserto..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">CFOP Dentro do Estado *</Label>
                  <Input value={formData.cfop_intra} onChange={e => setFormData({...formData, cfop_intra: e.target.value})} placeholder="Ex: 5102" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">CFOP Fora do Estado *</Label>
                  <Input value={formData.cfop_inter} onChange={e => setFormData({...formData, cfop_inter: e.target.value})} placeholder="Ex: 6102" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">CSOSN (Simples Nacional)</Label>
                  <Input value={formData.csosn || ''} onChange={e => setFormData({...formData, csosn: e.target.value})} placeholder="Ex: 102, 103, 500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">CST (Regime Normal)</Label>
                  <Input value={formData.cst || ''} onChange={e => setFormData({...formData, cst: e.target.value})} placeholder="Ex: 00, 20, 40" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">ICMS (%)</Label>
                  <Input type="number" step="0.01" value={formData.icms_rate} onChange={e => setFormData({...formData, icms_rate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">IPI (%)</Label>
                  <Input type="number" step="0.01" value={formData.ipi_rate} onChange={e => setFormData({...formData, ipi_rate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">PIS (%)</Label>
                  <Input type="number" step="0.01" value={formData.pis_rate} onChange={e => setFormData({...formData, pis_rate: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">COFINS (%)</Label>
                  <Input type="number" step="0.01" value={formData.cofins_rate} onChange={e => setFormData({...formData, cofins_rate: Number(e.target.value)})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Mensagem Padrão NF-e</Label>
                <textarea 
                  className="w-full min-h-[80px] p-2 text-sm border border-input bg-background rounded-md"
                  value={formData.default_message || ''} 
                  onChange={e => setFormData({...formData, default_message: e.target.value})}
                  placeholder="Ex: Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                />
                <Label htmlFor="active" className="cursor-pointer">Operação Ativa</Label>
              </div>
            </div>
            
            <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate(formData as any)} disabled={saveMutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar Operação'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
