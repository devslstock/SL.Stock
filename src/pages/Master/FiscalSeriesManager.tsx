import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fiscalSeriesApi } from '@/api/fiscalSeries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { Trash2, Plus, RefreshCw, Save, FileText } from 'lucide-react'
import type { FiscalSeries } from '@/types/database'

interface Props {
  companyId: string
  companyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FiscalSeriesManager({ companyId, companyName, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  
  const { data: seriesList = [], isLoading } = useQuery({
    queryKey: ['fiscal_series', companyId],
    queryFn: () => fiscalSeriesApi.getCompanySeries(companyId),
    enabled: open && !!companyId
  })

  const [isAdding, setIsAdding] = useState(false)
  const [newSeriesNum, setNewSeriesNum] = useState<number>(1)
  const [newNextNum, setNewNextNum] = useState<number>(1)
  const [newDocType, setNewDocType] = useState<string>('NFE')

  const createMutation = useMutation({
    mutationFn: (newSeries: any) => fiscalSeriesApi.createSeries({ ...newSeries, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série adicionada com sucesso!')
      setIsAdding(false)
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<FiscalSeries> }) => fiscalSeriesApi.updateSeries(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série atualizada!')
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fiscalSeriesApi.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série removida!')
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`)
  })

  const handleAdd = () => {
    createMutation.mutate({
      series_number: newSeriesNum,
      next_number: newNextNum,
      document_type: newDocType,
      active: true
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Séries Fiscais - {companyName}
          </DialogTitle>
          <DialogDescription>
            Gerencie as séries e a numeração sequencial para NF-e, NFC-e, CT-e, MDF-e, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Séries Cadastradas</h3>
            <Button size="sm" onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'default'} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Série
            </Button>
          </div>

          {isAdding && (
            <div className="bg-muted/50 p-4 rounded-lg border border-border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Série</Label>
                <Input type="number" min={1} value={newSeriesNum} onChange={e => setNewSeriesNum(Number(e.target.value) || 1)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Próximo Núm.</Label>
                <Input type="number" min={1} value={newNextNum} onChange={e => setNewNextNum(Number(e.target.value) || 1)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Tipo Doc.</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value)}
                >
                  <option value="NFE">NF-e</option>
                  <option value="MDFE">MDF-e</option>
                  <option value="NFCE">NFC-e</option>
                  <option value="CTE">CT-e</option>
                  <option value="NENHUM">Nenhum</option>
                </select>
              </div>
              <div>
                <Button onClick={handleAdd} disabled={createMutation.isPending} className="w-full gap-2">
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" /> Carregando...</div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 border border-dashed rounded-lg text-muted-foreground">
              Nenhuma série configurada para esta empresa.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Série</th>
                    <th className="px-4 py-3 text-left font-semibold">Próximo Número</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo Documento</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {seriesList.map((series) => (
                    <tr key={series.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <Input 
                          type="number" 
                          className="h-8 w-24"
                          defaultValue={series.series_number} 
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val && val !== series.series_number) {
                              updateMutation.mutate({ id: series.id, updates: { series_number: val } })
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Input 
                          type="number" 
                          className="h-8 w-32"
                          defaultValue={series.next_number} 
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val && val !== series.next_number) {
                              updateMutation.mutate({ id: series.id, updates: { next_number: val } })
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <select 
                          className="flex h-8 w-32 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background"
                          value={series.document_type}
                          onChange={(e) => updateMutation.mutate({ id: series.id, updates: { document_type: e.target.value } })}
                        >
                          <option value="NFE">NF-e</option>
                          <option value="MDFE">MDF-e</option>
                          <option value="NFCE">NFC-e</option>
                          <option value="CTE">CT-e</option>
                          <option value="NENHUM">Nenhum</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir esta série?')) {
                              deleteMutation.mutate(series.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
