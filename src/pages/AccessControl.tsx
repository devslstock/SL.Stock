import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { User, UserRole } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { ShieldCheck, Plus, Pencil, Trash2, UserCircle } from 'lucide-react'

const roleLabels: Record<UserRole, string> = { admin: 'Administrador', operator: 'Operador', driver: 'Motorista' }
const roleVariants: Record<UserRole, 'default' | 'success' | 'warning'> = { admin: 'default', operator: 'success', driver: 'warning' }

export default function AccessControl() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  })

  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário criado')
      setIsOpen(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(`Erro ao criar: ${e.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<User> }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário atualizado')
      setIsOpen(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.info('Usuário removido')
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = { 
      name: fd.get('name') as string, 
      email: fd.get('email') as string, 
      role: fd.get('role') as UserRole 
    }
    
    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate({ ...data, active: true })
    }
  }

  const toggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, data: { active: !currentActive } })
  }

  const deleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Controle de Acesso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} usuários</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsOpen(true) }}><Plus className="h-4 w-4 mr-1.5" />Novo Usuário</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {users.map((user, i) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center gap-4 slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${user.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-semibold text-sm ${user.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{user.name}</span>
                  <Badge variant={roleVariants[user.role]}>{roleLabels[user.role]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { setEditing(user); setIsOpen(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(user.id, user.active)}>
                  <div className={`h-3 w-3 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)} disabled={deleteMutation.isPending}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground glass-card">
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={o => { setIsOpen(o); if (!o) setEditing(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input name="name" defaultValue={editing?.name} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" defaultValue={editing?.email} required /></div>
            <div className="space-y-2">
              <Label>Perfil *</Label>
              <select name="role" defaultValue={editing?.role || 'operator'} className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground">
                <option value="admin">Administrador</option>
                <option value="operator">Operador</option>
                <option value="driver">Motorista</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
