import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentsApi } from '@/api/equipments'
import { suppliesApi } from '@/api/supplies'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { PackagePlus, Trash2 } from 'lucide-react'
import type { Equipment, Supply } from '@/types/database'

interface InternalMaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  equipment: Equipment | null
}

export function InternalMaintenanceModal({ isOpen, onClose, equipment }: InternalMaintenanceModalProps) {
  const queryClient = useQueryClient()

  const [defectDesc, setDefectDesc] = useState('')
  const [solutionDesc, setSolutionDesc] = useState('')
  const [finalStatus, setFinalStatus] = useState<'Em Manutenção' | 'Disponível' | 'Danificado' | 'Teste' | 'Equipamento de Estoque'>('Disponível')
  
  const [selectedSupply, setSelectedSupply] = useState('')
  const [supplyQty, setSupplyQty] = useState('1')
  const [consumedParts, setConsumedParts] = useState<{supply: Supply, quantity: number}[]>([])

  useEffect(() => {
    if (isOpen && equipment) {
      setDefectDesc('')
      setSolutionDesc('')
      setFinalStatus(equipment.status === 'Disponível' ? 'Disponível' : 'Em Manutenção')
      setConsumedParts([])
    }
  }, [isOpen, equipment])

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: suppliesApi.getSupplies,
    enabled: isOpen
  })

  const maintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!equipment) throw new Error('Equipamento não encontrado')
      
      // Consume parts directly from stock using supabase and a custom log table, or use suppliesApi (note: suppliesApi uses equipment_order_supplies which requires an order_id, so we just abate from stock here or create a special order. Since it's internal maintenance, we just abate from stock directly).
      for (const part of consumedParts) {
        const { data: supplyRow } = await supabase.from('supplies').select('stock_quantity').eq('id', part.supply.id).single()
        if (supplyRow) {
          const currentStock = Number(supplyRow.stock_quantity) || 0;
          await supabase.from('supplies').update({ stock_quantity: currentStock - part.quantity }).eq('id', part.supply.id)
        }
      }

      // Update Equipment
      const hasChanges = defectDesc || solutionDesc || consumedParts.length > 0 || finalStatus !== equipment.status
      if (hasChanges) {
        const partsText = consumedParts.map(p => `${p.quantity}x ${p.supply.name}`).join(', ')
        const notes = `Manutenção Interna - Defeito: ${defectDesc || 'N/A'}. Solução: ${solutionDesc || 'N/A'}. Peças: ${partsText || 'Nenhuma'}.`
        await equipmentsApi.updateEquipment(equipment.id, {
          status: finalStatus
        }, notes)
      } else {
        throw new Error('Nenhuma alteração informada')
      }
    },
    onSuccess: () => {
      toast.success('Manutenção interna registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const addPart = () => {
    if (!selectedSupply || !supplyQty) return
    const supply = supplies.find(s => s.id === selectedSupply)
    if (!supply) return
    const qty = parseFloat(supplyQty)
    if (qty > supply.stock_quantity) {
      toast.error('Quantidade maior que o estoque disponível!')
      return
    }
    setConsumedParts([...consumedParts, { supply, quantity: qty }])
    setSelectedSupply('')
    setSupplyQty('1')
  }

  const removePart = (index: number) => {
    setConsumedParts(consumedParts.filter((_, i) => i !== index))
  }

  if (!equipment) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manutenção Interna - {equipment.patrimony}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between text-sm">
            <div>
              <p className="text-muted-foreground">Modelo</p>
              <p className="font-medium">{equipment.type} - {equipment.model}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Status Atual</p>
              <p className="font-bold text-primary">{equipment.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Defeito Identificado</Label>
              <Textarea 
                placeholder="Ex: Motor queimado, porta não fecha..." 
                value={defectDesc}
                onChange={e => setDefectDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Solução Aplicada</Label>
              <Textarea 
                placeholder="Ex: Trocado motor, regulada a porta..." 
                value={solutionDesc}
                onChange={e => setSolutionDesc(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="font-bold">Peças Utilizadas</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedSupply}
                  onChange={e => setSelectedSupply(e.target.value)}
                >
                  <option value="">Selecione a peça/insumo...</option>
                  {supplies.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Estoque: {s.stock_quantity} {s.unit})
                    </option>
                  ))}
                </select>
              </div>
              <Input 
                type="number" 
                className="w-24" 
                min="0.01" 
                step="0.01"
                value={supplyQty}
                onChange={e => setSupplyQty(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addPart}>
                <PackagePlus className="h-4 w-4" />
              </Button>
            </div>

            {consumedParts.length > 0 && (
              <div className="space-y-2 mt-4">
                {consumedParts.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                    <span>{part.quantity} {part.supply.unit} - {part.supply.name}</span>
                    <Button type="button" variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" onClick={() => removePart(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/20">
            <Label className="font-bold">Novo Status do Equipamento</Label>
            <select 
              value={finalStatus} 
              onChange={e => setFinalStatus(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-primary/50 bg-background px-3 py-2 text-sm font-semibold text-primary"
            >
              <option value="Em Manutenção">Ainda Em Manutenção</option>
              <option value="Disponível">Disponível no Galpão</option>
              <option value="Teste">Em Teste</option>
              <option value="Danificado">Danificado / Sucata</option>
              <option value="Equipamento de Estoque">Equipamento de Estoque</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              Selecione "Disponível no Galpão" ou "Equipamento de Estoque" caso os testes tenham concluído e ele esteja pronto para uso.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => maintenanceMutation.mutate()} disabled={maintenanceMutation.isPending}>
            Salvar Manutenção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
