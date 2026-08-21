import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fiscalSeriesApi } from '@/api/fiscalSeries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import { Trash2, Plus, RefreshCw, Save, FileText, ShieldAlert } from 'lucide-react'
import type { FiscalSeries } from '@/types/database'
import { InutilizacaoModal } from '@/components/Fiscal/InutilizacaoModal'

export function FiscalSeriesManager() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const companyId = company?.id
  
  const { data: seriesList = [], isLoading } = useQuery({
    queryKey: ['fiscal_series', companyId],
    queryFn: () => companyId ? fiscalSeriesApi.getCompanySeries(companyId) : [],
    enabled: !!companyId
  })

  const [isAdding, setIsAdding] = useState(false)
  const [newSeriesNum, setNewSeriesNum] = useState<number>(1)
  const [newNextNum, setNewNextNum] = useState<number>(1)
  const [newDocType, setNewDocType] = useState<string>('NFE')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const [isInutilizacaoOpen, setIsInutilizacaoOpen] = useState(false)
  const [inutilizacaoSerie, setInutilizacaoSerie] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (newSeries: any) => fiscalSeriesApi.createSeries({ ...newSeries, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série adicionada com sucesso!')
      setIsAdding(false)
    },
    onError: (err: unknown) => toast.error(`Erro: ${getErrorMessage(err)}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<FiscalSeries> }) => fiscalSeriesApi.updateSeries(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série atualizada!')
    },
    onError: (err: unknown) => toast.error(`Erro: ${getErrorMessage(err)}`)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fiscalSeriesApi.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_series', companyId] })
      toast.success('Série removida!')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err))
  })

  const filteredSeries = seriesList.filter(s => 
    String(s.series_number).includes(searchTerm) || 
    (s.document_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage)
  const paginatedSeries = filteredSeries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAdd = () => {
    createMutation.mutate({
      series_number: newSeriesNum,
      next_number: newNextNum,
      document_type: newDocType,
      active: true
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Séries Fiscais
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as séries e a numeração sequencial para NF-e, NFC-e, CT-e, MDF-e, etc.
        </p>
      </div>

      <div className="glass-card p-6 flex flex-col space-y-4">
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
            <div className="border rounded-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <Input
                  placeholder="Buscar por número da série ou tipo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="max-w-md"
                />
              </div>
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
                  {paginatedSeries.map((series) => (
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredSeries.length)} de {filteredSeries.length} séries
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
          )}
      </div>
      <InutilizacaoModal 
        isOpen={isInutilizacaoOpen}
        onClose={() => {
          setIsInutilizacaoOpen(false)
          setInutilizacaoSerie(null)
        }}
        serie={inutilizacaoSerie}
      />
    </div>
  )
}
