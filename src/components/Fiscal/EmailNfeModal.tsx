import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/toaster'
import { Loader2, Mail } from 'lucide-react'
import { getErrorMessage } from '@/utils/errorMessage'

interface EmailNfeModalProps {
  isOpen: boolean
  onClose: () => void
  nfeId: string
  defaultEmail?: string
}

export function EmailNfeModal({ isOpen, onClose, nfeId, defaultEmail }: EmailNfeModalProps) {
  const [emails, setEmails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmails(defaultEmail || '')
    }
  }, [isOpen, defaultEmail])

  const handleSubmit = async () => {
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e)
    
    if (emailList.length === 0) {
      toast.error('Informe pelo menos um endereço de e-mail.')
      return
    }

    const invalidEmails = emailList.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    if (invalidEmails.length > 0) {
      toast.error(`E-mail inválido: ${invalidEmails.join(', ')}`)
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('email-doc', {
        body: { docType: 'nfe', recordId: nfeId, emails: emailList }
      })

      if (error) throw error
      if (data?.success === false) {
        let errorMsg = data.error || 'Erro desconhecido'
        if (data.details) {
          if (data.details.mensagem) errorMsg += `: ${data.details.mensagem}`
          else errorMsg += `: ${JSON.stringify(data.details)}`
        }
        throw new Error(errorMsg)
      }

      toast.success('E-mail enviado com sucesso!')
      onClose()
    } catch (err: unknown) {
      console.error('Erro ao enviar NF-e por e-mail:', err)
      toast.error(getErrorMessage(err) || 'Erro ao enviar NF-e. Verifique a comunicação com a SEFAZ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Mail className="h-5 w-5" />
            Enviar NF-e por E-mail
          </DialogTitle>
          <DialogDescription>
            Envia o XML e o PDF da nota fiscal autorizada para os e-mails informados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mails (separados por vírgula)</label>
            <Input
              placeholder="cliente@exemplo.com, outro@exemplo.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white" 
            onClick={handleSubmit} 
            disabled={isSubmitting || emails.trim().length === 0}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
