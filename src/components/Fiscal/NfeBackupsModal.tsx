import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Archive, AlertCircle } from 'lucide-react'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface NfeBackupsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NfeBackupsModal({ isOpen, onClose }: NfeBackupsModalProps) {
  const { company } = useAuth()

  const { data: backups = [], isLoading, error } = useQuery({
    queryKey: ['focus_nfe_backups', company?.id],
    queryFn: () => focusIntegrationApi.getBackups(company!.id),
    enabled: isOpen && !!company?.id,
    refetchOnWindowFocus: false
  })

  // Format YYYYMM to Month/Year
  const formatMonth = (mes: string) => {
    if (!mes || mes.length !== 6) return mes
    const year = mes.substring(0, 4)
    const month = mes.substring(4, 6)
    
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            Backups de Arquivos Fiscais (XMLs)
          </DialogTitle>
          <DialogDescription>
            Faça o download dos arquivos XML e DANFEs emitidos nos últimos meses para enviar à sua contabilidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Atenção Contábil</AlertTitle>
            <AlertDescription className="text-xs mt-1 text-amber-700">
              O backup completo é gerado no primeiro dia de cada mês, contendo as notas do mês anterior. Recomendamos efetuar o download a partir do <b>dia 2</b>. Mantenha esses arquivos guardados por no mínimo 5 anos.
            </AlertDescription>
          </Alert>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Buscando backups disponíveis na Receita Federal...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-destructive/10 text-destructive text-center">
              <p className="font-bold">Erro ao carregar backups</p>
              <p className="text-sm mt-1">{(error as any).message}</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum backup de notas fiscais encontrado para este CNPJ.</p>
              <p className="text-sm mt-1">Os backups são gerados mensalmente para empresas com notas emitidas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backups.map((backup: any, idx: number) => (
                <div key={idx} className="border rounded-md p-4 flex flex-col space-y-3 bg-muted/10 hover:bg-muted/30 transition-colors">
                  <div className="font-bold text-lg text-foreground capitalize">
                    {formatMonth(backup.mes)}
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    {backup.xmls && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-white hover:bg-slate-50"
                        onClick={() => window.open(backup.xmls, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4 text-blue-600" />
                        Baixar XMLs
                      </Button>
                    )}
                    {backup.danfes && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-white hover:bg-slate-50"
                        onClick={() => window.open(backup.danfes, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4 text-emerald-600" />
                        Baixar DANFEs
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
