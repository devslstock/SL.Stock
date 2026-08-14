import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { vehiclesApi } from '@/api/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Truck, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import type { Vehicle } from '@/types/database'

export default function FiscalVehicles() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    uf: '',
    renavam: '',
    tara_kg: 0,
    capacity_kg: 0,
    capacity_m3: 0,
    body_type: '',
    wheel_type: '',
    owner_name: '',
    owner_document: '',
    active: true
  })

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', company?.id],
    queryFn: () => company?.id ? vehiclesApi.getVehicles(company.id) : [],
    enabled: !!company?.id
  })

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Vehicle>) => {
      if (!company?.id) throw new Error('Company ID required')
      if (editingId) {
        return vehiclesApi.updateVehicle(editingId, data)
      }
      return vehiclesApi.createVehicle({ ...data, company_id: company.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success(editingId ? 'Veículo atualizado!' : 'Veículo criado!')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Veículo removido!')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      plate: '',
      uf: '',
      renavam: '',
      tara_kg: 0,
      capacity_kg: 0,
      capacity_m3: 0,
      body_type: '',
      wheel_type: '',
      owner_name: '',
      owner_document: '',
      active: true
    })
  }

  const handleEdit = (v: Vehicle) => {
    setEditingId(v.id)
    setFormData({
      plate: v.plate,
      uf: v.uf,
      renavam: v.renavam || '',
      tara_kg: v.tara_kg || 0,
      capacity_kg: v.capacity_kg || 0,
      capacity_m3: v.capacity_m3 || 0,
      body_type: v.body_type || '',
      wheel_type: v.wheel_type || '',
      owner_name: v.owner_name || '',
      owner_document: v.owner_document || '',
      active: v.active
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Remover este veículo?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            Veículos
          </h1>
          <p className="text-muted-foreground mt-1">Cadastro de veículos e capacidades para cálculo de frete e MDF-e</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Placa</th>
                <th className="px-4 py-3 font-semibold text-center">UF</th>
                <th className="px-4 py-3 font-semibold text-center">Renavam</th>
                <th className="px-4 py-3 font-semibold text-center">Capacidade (KG)</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              ) : vehicles.map(v => (
                <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium uppercase tracking-widest">{v.plate}</td>
                  <td className="px-4 py-3 text-center uppercase">{v.uf}</td>
                  <td className="px-4 py-3 text-center">{v.renavam || '-'}</td>
                  <td className="px-4 py-3 text-center">{v.capacity_kg || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${v.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {v.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(v)} className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-xl border shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placa *</Label>
                  <Input 
                    value={formData.plate} 
                    onChange={e => setFormData({...formData, plate: e.target.value})} 
                    placeholder="ABC1D23"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF (Estado) *</Label>
                  <Input 
                    value={formData.uf} 
                    onChange={e => setFormData({...formData, uf: e.target.value})} 
                    placeholder="SP"
                    className="uppercase"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Renavam</Label>
                <Input 
                  value={formData.renavam} 
                  onChange={e => setFormData({...formData, renavam: e.target.value})} 
                  placeholder="00000000000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tara (KG)</Label>
                  <Input 
                    type="number"
                    value={formData.tara_kg || ''} 
                    onChange={e => setFormData({...formData, tara_kg: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidade (KG)</Label>
                  <Input 
                    type="number"
                    value={formData.capacity_kg || ''} 
                    onChange={e => setFormData({...formData, capacity_kg: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidade (M³)</Label>
                  <Input 
                    type="number"
                    value={formData.capacity_m3 || ''} 
                    onChange={e => setFormData({...formData, capacity_m3: Number(e.target.value)})} 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <input 
                  type="checkbox" 
                  id="activeVehicle" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})} 
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="activeVehicle" className="cursor-pointer">Veículo Ativo</Label>
              </div>
            </div>
            
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.plate || !formData.uf}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
