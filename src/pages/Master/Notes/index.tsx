import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi } from '@/api/saas';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

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
            <Card key={note.id} className="relative group bg-[#FFF9C4] dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 hover:shadow-md transition-all">
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                
                <div className="flex items-end justify-between mt-4 text-xs text-muted-foreground pt-3 border-t border-amber-200/50 dark:border-amber-700/50">
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
