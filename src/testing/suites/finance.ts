import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const financeTests: TestBattery[] = [
  {
    id: 'FIN-001',
    name: 'Financeiro — Conta a Receber Mock',
    module: 'Financeiro',
    type: 'CRUD',
    priority: 'Normal',
    description: 'Verifica o acesso de leitura à tabela do financeiro.',
    tags: ['financeiro', 'receber', 'titulo', 'faturamento'],
    tests: [
      {
        name: 'Ler Títulos',
        run: async (ctx) => {
          const { error } = await supabase.from('accounts_receivable').select('id').limit(1);
          if (error) throw new Error(`Erro ao acessar títulos: ${error.message}`);
          ctx.log('Tabela financeira lida com sucesso.');
        }
      }
    ]
  }
];
