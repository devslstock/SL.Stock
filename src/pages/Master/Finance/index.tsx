import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/companies';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export default function SaaSFinance() {
  const { isMaster } = useAuth();
  
  if (!isMaster) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Banknote className="h-7 w-7 text-primary" /> Financeiro
        </h1>
        <p className="text-muted-foreground">Controle de pagamentos de mensalidade das empresas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel Financeiro em desenvolvimento</CardTitle>
          <CardDescription>Esta aba listará os pagamentos mensais (pendentes e pagos) das empresas ativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A tabela financeira será implementada na próxima etapa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
