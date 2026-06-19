import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi } from '@/api/users'
import { supabase } from '@/lib/supabase'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUserLocally } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  
  // Password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Preview da nova foto (se escolhida e convertida para base64)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limite de 500kb para base64 no banco
    if (file.size > 500 * 1024) {
      toast.error('A imagem deve ter no máximo 500KB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreviewImage(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      // 1. Atualizar Senha no Supabase Auth
      if (newPassword) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword })
        if (authError) throw authError
      }

      // 2. Atualizar Dados no Banco (tabela users)
      const updates: any = {
        name,
        phone
      }

      if (previewImage) {
        updates.avatar_url = previewImage
      }

      await usersApi.updateUser(user.id, updates)

      // Atualizar o contexto
      updateUserLocally(updates)

      toast.success('Perfil atualizado com sucesso!')
      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Erro ao atualizar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                {(previewImage || avatarUrl) ? (
                  <img 
                    src={previewImage || avatarUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">Clique para alterar (Máx 500KB)</p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Seu nome"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Telefone / Celular</Label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="border-t pt-4 mt-2 space-y-4">
              <Label className="text-muted-foreground">Alterar Senha (Opcional)</Label>
              
              <div className="space-y-2">
                <Input 
                  type="password"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="Nova senha"
                />
              </div>

              <div className="space-y-2">
                <Input 
                  type="password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirmar nova senha"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
