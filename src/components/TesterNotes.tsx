import { useState, useEffect, useRef } from 'react'
import { ClipboardList, X, Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const INITIAL_TASKS = [
  "🔐 Login e Autenticação - Login com usuário válido",
  "Login com senha inválida",
  "Login com usuário inativo",
  "Login com empresa inativa",
  "Logout funcionando",
  "Recuperação de senha",
  "Redirecionamento após login",
  "Sessão expira corretamente",
  "Proteção de rotas sem login",
  "🏢 SaaS Master - Acesso painel master",
  "Bloqueio de acesso para usuário comum",
  "Criar empresa",
  "Editar empresa",
  "Inativar empresa",
  "Reativar empresa",
  "Alterar plano da empresa",
  "Alterar limite de usuários",
  "Impersonar empresa",
  "Voltar para painel master",
  "💳 Financeiro SaaS - Criar cobrança",
  "Editar cobrança",
  "Marcar cobrança como paga",
  "Simular cobrança vencida",
  "Bloqueio automático após atraso",
  "Reativação após pagamento",
  "Histórico financeiro",
  "Filtros financeiros",
  "👥 Usuários - Admin acessa tudo",
  "Gestor acessa operações",
  "Gestor aprova divergências",
  "Conferente acessa bipagem",
  "Conferente NÃO aprova divergência",
  "Motorista acessa apenas entregas",
  "Criar usuário",
  "Editar usuário",
  "Inativar usuário",
  "Excluir usuário",
  "Alterar permissões",
  "Limite máximo de usuários",
  "Usuário sem permissão bloqueado",
  "📦 Produtos - Cadastrar produto",
  "Editar produto",
  "Excluir produto",
  "Código duplicado",
  "Busca por código",
  "Busca por descrição",
  "Produto sem estoque",
  "Estoque mínimo",
  "Produto inativo",
  "Validação de campos obrigatórios",
  "📥 Recebimento - Criar recebimento manual",
  "Importar recebimento por Excel",
  "Bipar produto esperado",
  "Bipar produto não previsto",
  "Bipar quantidade acima",
  "Corrigir quantidade",
  "Finalizar recebimento",
  "Cancelar recebimento",
  "Exportar relatório",
  "Histórico de recebimentos",
  "📊 Contagem Avulsa - Criar nova contagem",
  "Bipagem livre",
  "Soma automática de itens repetidos",
  "Editar quantidade",
  "Excluir item",
  "Salvar rascunho",
  "Retomar rascunho",
  "Finalizar contagem",
  "Exportar Excel",
  "Histórico de contagens",
  "🏭 Inventário - Criar inventário",
  "Bipar produtos",
  "Comparar físico x sistema",
  "Destacar divergências",
  "Salvar parcial",
  "Retomar parcial",
  "Solicitar ajuste",
  "Aprovar ajuste",
  "Rejeitar ajuste",
  "Atualizar estoque",
  "Relatório final",
  "🚚 Cargas e Rotas - Criar carga",
  "Editar carga",
  "Excluir carga",
  "Criar rota",
  "Adicionar clientes",
  "Adicionar produtos",
  "Importar carga Excel",
  "Ordenar entregas",
  "Alterar sequência de rota",
  "Finalizar carga",
  "📦 Conferência de Expedição - Bipar item correto",
  "Bipar item errado",
  "Bipar acima da quantidade",
  "Bloqueio de item inválido",
  "Alerta estoque zerado",
  "Conferência completa",
  "Conferência incompleta",
  "Finalizar sem divergência",
  "Finalizar com divergência",
  "Solicitação de liberação",
  "🔓 Liberação Remota - Gestor recebe alerta",
  "Aprovar divergência",
  "Rejeitar divergência",
  "Histórico de liberações",
  "Conferente liberado após aprovação",
  "Conferente bloqueado após rejeição",
  "🚛 Motorista e Entregas - Login motorista",
  "Ver rota do dia",
  "Abrir cliente",
  "Conferir produtos",
  "Bipar item errado",
  "Finalizar entrega",
  "Registrar recusa",
  "Registrar observação",
  "Histórico de entregas",
  "Status atualizado corretamente",
  "✍️ Assinatura Digital / POD - Assinatura na tela",
  "Limpar assinatura",
  "Salvar assinatura",
  "Finalizar com assinatura",
  "Bloquear finalização sem assinatura",
  "Recusa com motivo",
  "Visualizar comprovante",
  "Histórico POD",
  "📈 Relatórios - Relatório de cargas",
  "Relatório de entregas",
  "Relatório de inventário",
  "Relatório de recebimento",
  "Exportar Excel",
  "Exportar PDF",
  "Filtros por data",
  "Filtros por status",
  "Impressão",
  "🎨 Interface e Layout - Tema moderno",
  "Tema tradicional",
  "Responsividade mobile",
  "Responsividade desktop",
  "Menus funcionando",
  "Tabelas responsivas",
  "Modal funcionando",
  "Loading funcionando",
  "Mensagens de erro amigáveis",
  "📱 Mobile / Coletores - Android",
  "iPhone",
  "Tablet",
  "Leitura câmera",
  "Flash câmera",
  "Vibração ao bipar",
  "Som ao bipar",
  "Teclado automático",
  "Funciona em internet lenta",
  "Não duplica bipagem",
  "Atualização não perde dados",
  "🔒 Segurança - Usuário sem login bloqueado",
  "Usuário comum sem acesso SaaS",
  "Motorista sem acesso administrativo",
  "Conferente sem aprovação",
  "Isolamento entre empresas",
  "Empresa A não vê dados da B",
  "Company_id obrigatório",
  "Sessão protegida",
  "Variáveis .env protegidas",
  "Chaves Supabase não expostas",
  "☁️ Deploy / Produção - Deploy Vercel funcionando",
  "Variáveis ambiente corretas",
  "Build sem erro",
  "Rotas funcionando produção",
  "Banco conectado",
  "Supabase conectado",
  "Upload funcionando",
  "Logs sem erro crítico",
  "✅ Checklist Final - Sistema pronto para testes internos",
  "Sistema pronto para operação piloto",
  "Sistema pronto para cliente real",
  "Backup realizado",
  "Banco staging criado",
  "Banco produção validado",
  "Permissões revisadas",
  "Segurança revisada",
  "Fluxo completo validado"
]

export function TesterNotes() {
  const { isMaster, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [tasks, setTasks] = useState<{ id: string, text: string, done: boolean }[]>([])
  const [newTask, setNewTask] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    if (!isMaster || !user?.id) return

    const loadState = async () => {
      const { data, error } = await supabase.from('users').select('tester_state').eq('id', user.id).maybeSingle()
      
      if (data && data.tester_state) {
        const state = data.tester_state as any
        if (state.notes) setNotes(state.notes)
        if (state.tasks && state.tasks.length > 0) {
          setTasks(state.tasks)
        } else {
          loadDefaultChecklist()
        }
      } else {
        loadDefaultChecklist()
      }
      
      setTimeout(() => { isInitialLoad.current = false }, 1000)
    }

    loadState()
  }, [isMaster, user?.id])

  const loadDefaultChecklist = () => {
    setTasks(INITIAL_TASKS.map((t, i) => ({ id: i.toString(), text: t, done: false })))
  }

  useEffect(() => {
    if (!isMaster || !user?.id || isInitialLoad.current) return
    
    const saveState = async () => {
      setIsSaving(true)
      await supabase.from('users').update({ 
        tester_state: { notes, tasks } 
      }).eq('id', user.id)
      setIsSaving(false)
    }

    const timeoutId = setTimeout(saveState, 800)
    return () => clearTimeout(timeoutId)
  }, [notes, tasks, isMaster, user?.id])

  if (!isMaster) return null

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    setTasks([{ id: Date.now().toString(), text: newTask.trim(), done: false }, ...tasks])
    setNewTask('')
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const clearAll = () => {
    if (confirm('Tem certeza que deseja zerar sua lista de testes? Isso apagará tudo.')) {
      setTasks([])
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer relative" 
        title="Notas de Teste"
      >
        <ClipboardList className="h-5 w-5" />
        <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </button>

      {isOpen && (
        <div className="fixed top-0 right-0 w-[450px] max-w-[100vw] h-screen bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <ClipboardList className="h-5 w-5" />
              <span>Painel de Testes do Sistema</span>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-emerald-500/50 ml-2" />}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">Anotações Gerais / Bugs</label>
              <textarea 
                className="w-full h-[150px] p-3 rounded-xl border border-input bg-background resize-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                placeholder="Escreva bugs encontrados, anotações e ideias aqui..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground uppercase">O que testar?</label>
                <div className="flex gap-2">
                  <button onClick={loadDefaultChecklist} title="Recarregar Checklist Inicial" className="text-muted-foreground hover:text-emerald-600">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={clearAll} title="Limpar Lista" className="text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={addTask} className="flex gap-2 pb-2">
                <Input 
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Adicionar novo item de teste..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" variant="outline" className="shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-1 mt-2">
                {tasks.length === 0 && (
                  <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">Lista de testes vazia.</p>
                    <Button variant="link" onClick={loadDefaultChecklist} className="text-emerald-600 mt-2">
                      Carregar Checklist Padrão
                    </Button>
                  </div>
                )}
                {tasks.map(task => {
                  const isTitle = task.text.includes(' - ') && !task.done;
                  return (
                    <div key={task.id} className={`flex items-start gap-3 p-2 rounded-lg border group ${isTitle ? 'bg-muted border-border/50 font-medium' : 'border-transparent hover:bg-muted/30'}`}>
                      <input 
                        type="checkbox" 
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`flex-1 text-sm leading-tight ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'} ${isTitle ? 'font-bold text-emerald-700' : ''}`}>
                        {task.text}
                      </span>
                      <button 
                        onClick={() => removeTask(task.id)}
                        className="text-red-500/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
