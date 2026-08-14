import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { driversApi } from '@/api/drivers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { Users, Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import type { Driver } from '@/types/database'

export default function FiscalDrivers() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '',
    cpf: '',
    cnh: '',
    active: true
  })

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers', company?.id],
    queryFn: () => company?.id ? driversApi.getDrivers(company.id) : [],
    enabled: !!company?.id
  })

  const filteredDrivers = drivers.filter(d => 
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.cpf || '').includes(searchTerm)
  )

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage)
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Driver>) => {
      if (!company?.id) throw new Error('Company ID required')
      if (editingId) {
        return driversApi.updateDriver(editingId, data)
      }
      return driversApi.createDriver({ ...data, company_id: company.id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success(editingId ? 'Condutor atualizado!' : 'Condutor criado!')
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Condutor removido!')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: '',
      cpf: '',
      cnh: '',
      active: true
    })
  }

  const handleEdit = (drv: Driver) => {
    setEditingId(drv.id)
    setFormData({
      name: drv.name,
      cpf: drv.cpf,
      cnh: drv.cnh || '',
      active: drv.active
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Remover este condutor?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Condutores
          </h1>
          <p className="text-muted-foreground mt-1">Cadastro de motoristas para emissão de MDF-e</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Condutor
        </Button>
      </div>

      <div className="glass-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <Input
            placeholder="Buscar por nome ou CPF..."
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
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold text-center">CPF</th>
                <th className="px-4 py-3 font-semibold text-center">CNH</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum condutor encontrado.
                  </td>
                </tr>
              ) : paginatedDrivers.map(drv => (
                <tr key={drv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{drv.name}</td>
                  <td className="px-4 py-3 text-center">{drv.cpf}</td>
                  <td className="px-4 py-3 text-center">{drv.cnh || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${drv.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {drv.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(drv)} className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(drv.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
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
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} de {filteredDrivers.length} condutores
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl border shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Condutor' : 'Novo Condutor'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <Label>Nome do Motorista *</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input 
                  value={formData.cpf} 
                  onChange={e => setFormData({...formData, cpf: e.target.value})} 
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label>Número da CNH</Label>
                <Input 
                  value={formData.cnh} 
                  onChange={e => setFormData({...formData, cnh: e.target.value})} 
                />
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <input 
                  type="checkbox" 
                  id="activeDriver" 
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})} 
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <Label htmlFor="activeDriver" className="cursor-pointer">Condutor Ativo</Label>
              </div>
            </div>
            
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name || !formData.cpf}
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
