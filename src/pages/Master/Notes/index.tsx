import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi } from '@/api/saas';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export default function SaaSNotes() {
  const { isMaster, user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['system_notes'],
    queryFn: saasApi.getNotes,
    enabled: isMaster
  });

  const createNoteMutation = useMutation({
    mutationFn: () => saasApi.createNote(user!.id, user!.name, content),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['system_notes'] });
      toast.success('Recado postado com sucesso');
    },
    onError: () => toast.error('Erro ao postar recado')
  });

  const deleteNoteMutation = useMutation({
    mutationFn: saasApi.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_notes'] });
      toast.success('Recado apagado');
    }
  });

  const toggleCheckMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string, checked: boolean }) => saasApi.updateNote(id, { checked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_notes'] });
    },
    onError: () => toast.error('Erro ao atualizar status do recado')
  });

  if (!isMaster) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <StickyNote className="h-7 w-7 text-primary" /> Mural de Recados
        </h1>
        <p className="text-muted-foreground">Anotações e recados importantes para toda a equipe global.</p>
      </div>

      <Card className="border-primary/20 bg-card">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escreva um recado ou anotação importante para a equipe..."
            className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background resize-y text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end">
            <Button 
              onClick={() => createNoteMutation.mutate()} 
              disabled={!content.trim() || createNoteMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Postar Recado
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Carregando mural...</div>
        ) : notes.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            Nenhum recado postado ainda.
          </div>
        ) : (
          notes.map((note) => (
            <Card 
              key={note.id} 
              className={cn(
                "relative group hover:shadow-md transition-all",
                note.checked 
                  ? "bg-[#E8F5E9] dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40" 
                  : "bg-[#FFF9C4] dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50"
              )}
            >
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <div className="relative pr-8">
                  <p className={cn(
                    "text-sm text-foreground whitespace-pre-wrap",
                    note.checked && "text-foreground/50 line-through decoration-emerald-600/30"
                  )}>
                    {note.content}
                  </p>
                  
                  <button 
                    onClick={() => toggleCheckMutation.mutate({ id: note.id, checked: !note.checked })}
                    className={cn(
                      "absolute top-0 right-0 p-1 rounded-full transition-colors cursor-pointer",
                      note.checked 
                        ? "text-emerald-600 hover:bg-emerald-200/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30" 
                        : "text-amber-600/40 hover:text-amber-600 hover:bg-amber-200/40 dark:text-amber-500/30 dark:hover:bg-amber-800/20"
                    )}
                    title={note.checked ? "Marcar como pendente" : "Marcar como feito"}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className={cn(
                  "flex items-end justify-between mt-4 text-xs text-muted-foreground pt-3 border-t",
                  note.checked 
                    ? "border-emerald-200/50 dark:border-emerald-800/40" 
                    : "border-amber-200/50 dark:border-amber-700/50"
                )}>
                  <div>
                    <span className="font-semibold text-foreground/80">{note.author_name}</span>
                    <br />
                    {new Date(note.created_at).toLocaleString('pt-BR')}
                  </div>
                  
                  {(note.author_id === user?.id || user?.role === 'admin') && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Apagar este recado?')) {
                          deleteNoteMutation.mutate(note.id);
                        }
                      }}
                      className="text-red-500/70 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
