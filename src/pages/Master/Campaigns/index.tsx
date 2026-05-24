import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function SaaSCampanhas() {
  const { isMaster } = useAuth();
  
  if (!isMaster) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" /> Campanhas
        </h1>
        <p className="text-muted-foreground">Disparos e campanhas de anúncios (Em breve).</p>
      </div>

      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center h-64">
          <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Megaphone className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Em Produção</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Esta área será responsável pelo controle de campanhas e marketing. Fique ligado para as novidades.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
