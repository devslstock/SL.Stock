import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toaster'
import { Loader2, XCircle, AlertCircle } from 'lucide-react'

interface CancelNfeModalProps {
  isOpen: boolean
  onClose: () => void
  nfeId: string
  onSuccess: () => void
}

export function CancelNfeModal({ isOpen, onClose, nfeId, onSuccess }: CancelNfeModalProps) {
  const [justificativa, setJustificativa] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (justificativa.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres.')
      return
    }
    if (justificativa.length > 255) {
      toast.error('A justificativa deve ter no máximo 255 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-doc', {
        body: { docType: 'nfe', recordId: nfeId, justificativa }
      })

      if (error) throw error
      if (data?.success === false) {
        let errorMsg = data.error || 'Erro desconhecido'
        if (data.details) {
          if (data.details.mensagem) errorMsg += `: ${data.details.mensagem}`
          else if (Array.isArray(data.details)) {
            errorMsg += `: ${data.details.map((d: any) => d.mensagem || JSON.stringify(d)).join(', ')}`
          } else if (data.details.erros && Array.isArray(data.details.erros)) {
            errorMsg += `: ${data.details.erros.map((d: any) => d.mensagem || JSON.stringify(d)).join(', ')}`
          } else {
            errorMsg += `: ${JSON.stringify(data.details)}`
          }
        }
        throw new Error(errorMsg)
      }

      toast.success('NF-e cancelada com sucesso!')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro ao cancelar NF-e:', err)
      toast.error(err.message || 'Erro ao cancelar a NF-e. Verifique a comunicação com a SEFAZ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancelar NF-e
          </DialogTitle>
          <DialogDescription>
            Atenção: O cancelamento só pode ser realizado caso não tenha ocorrido a circulação da mercadoria e o prazo legal de cancelamento (geralmente 24h) não tenha expirado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Justificativa do Cancelamento</label>
            <Textarea
              placeholder="Descreva o motivo do cancelamento (mínimo 15 caracteres)..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{justificativa.length} / 255 caracteres</span>
              {justificativa.length > 0 && justificativa.length < 15 && (
                <span className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Faltam {15 - justificativa.length} caracteres</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Voltar
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white" 
            onClick={handleSubmit} 
            disabled={isSubmitting || justificativa.length < 15 || justificativa.length > 255}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
