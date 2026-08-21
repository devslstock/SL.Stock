import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toaster'
import { Loader2, FileText, AlertCircle } from 'lucide-react'
import { getErrorMessage } from '@/utils/errorMessage'

interface CceModalProps {
  isOpen: boolean
  onClose: () => void
  nfeId: string
  onSuccess: () => void
}

export function CceModal({ isOpen, onClose, nfeId, onSuccess }: CceModalProps) {
  const [correcao, setCorrecao] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (correcao.length < 15) {
      toast.error('A carta de correção deve ter no mínimo 15 caracteres.')
      return
    }
    if (correcao.length > 1000) {
      toast.error('A carta de correção deve ter no máximo 1000 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('cce-nfe', {
        body: { recordId: nfeId, correcao }
      })

      if (error) throw error
      if (data?.success === false) throw new Error(data.error || 'Erro desconhecido')

      toast.success('Carta de Correção emitida com sucesso!')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('Erro ao emitir CC-e:', err)
      toast.error(getErrorMessage(err) || 'Erro ao emitir Carta de Correção. Verifique sua comunicação com a SEFAZ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <FileText className="h-5 w-5" />
            Emitir Carta de Correção (CC-e)
          </DialogTitle>
          <DialogDescription>
            A Carta de Correção é permitida na regularização de erro ocorrido na emissão de documento fiscal, desde que o erro não esteja relacionado com variáveis que determinam o valor do imposto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Correção (Mín. 15 caracteres)</label>
            <Textarea
              placeholder="Descreva a correção aqui..."
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{correcao.length} / 1000 caracteres</span>
              {correcao.length > 0 && correcao.length < 15 && (
                <span className="text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Faltam {15 - correcao.length} caracteres</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white" 
            onClick={handleSubmit} 
            disabled={isSubmitting || correcao.length < 15 || correcao.length > 1000}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Emitir CC-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
