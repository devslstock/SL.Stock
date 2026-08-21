import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/utils/errorMessage'

interface InutilizacaoModalProps {
  isOpen: boolean
  onClose: () => void
  serie: string | null
}

export function InutilizacaoModal({ isOpen, onClose, serie }: InutilizacaoModalProps) {
  const { company } = useAuth()
  
  const [numeroInicial, setNumeroInicial] = useState('')
  const [numeroFinal, setNumeroFinal] = useState('')
  const [justificativa, setJustificativa] = useState('')

  const inutilizarMutation = useMutation({
    mutationFn: async () => {
      if (!company?.cnpj) throw new Error('CNPJ da empresa não configurado')
      if (!serie) throw new Error('Série não informada')
      if (!numeroInicial || !numeroFinal || !justificativa) throw new Error('Preencha todos os campos')
      if (justificativa.length < 15) throw new Error('A justificativa deve ter no mínimo 15 caracteres')

      return await focusIntegrationApi.inutilizarNumeracao(
        company.cnpj,
        serie,
        numeroInicial,
        numeroFinal,
        justificativa
      )
    },
    onSuccess: () => {
      toast.success('Numeração inutilizada com sucesso!')
      handleClose()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    }
  })

  const handleClose = () => {
    setNumeroInicial('')
    setNumeroFinal('')
    setJustificativa('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-5 w-5" />
            Inutilizar Numeração
          </DialogTitle>
          <DialogDescription>
            Justifique para a SEFAZ a inutilização de uma numeração ou faixa da Série <strong>{serie}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numInicial">Número Inicial</Label>
              <Input
                id="numInicial"
                type="number"
                value={numeroInicial}
                onChange={e => setNumeroInicial(e.target.value)}
                placeholder="Ex: 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numFinal">Número Final</Label>
              <Input
                id="numFinal"
                type="number"
                value={numeroFinal}
                onChange={e => setNumeroFinal(e.target.value)}
                placeholder="Ex: 100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa (mín. 15 caracteres)</Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder="Descreva o motivo da quebra de sequência..."
              rows={3}
            />
            <p className="text-xs text-gray-500 text-right">{justificativa.length}/255 caracteres</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={() => inutilizarMutation.mutate()}
            disabled={inutilizarMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {inutilizarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Inutilização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
