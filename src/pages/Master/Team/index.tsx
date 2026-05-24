import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function SaaSTeam() {
  const { isMaster } = useAuth();
  
  if (!isMaster) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Acessos Globais
        </h1>
        <p className="text-muted-foreground">Controle de acessos da sua equipe interna (Super Admins).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Usuários Master em desenvolvimento</CardTitle>
          <CardDescription>Esta aba permitirá criar contas para seus funcionários gerenciarem clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Funcionalidade de equipe global será implementada na próxima etapa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
