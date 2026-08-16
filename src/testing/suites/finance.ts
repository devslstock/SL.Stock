import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const financeTests: TestBattery[] = [
  {
    id: 'FIN-001',
    name: 'Financeiro — Conta a Receber Mock',
    module: 'Financeiro',
    type: 'CRUD',
    priority: 'Normal',
    description: 'Verifica a inserção manual de um título a receber no banco.',
    tags: ['financeiro', 'receber', 'titulo', 'faturamento'],
    tests: [
      {
        name: 'Criar Título',
        run: async (ctx) => {
          const { data, error } = await supabase.from('accounts_receivable').insert({
            company_id: ctx.companyId,
            amount: 150.00,
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0],
            description: 'Título QA'
          }).select('id').single();

          if (error) throw new Error(`Erro ao criar título: ${error.message}`);
          (globalThis as any).__TEST_FIN_ID = data.id;
          ctx.log('Título gerado com sucesso.');
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_FIN_ID;
      if (id) {
        await supabase.from('accounts_receivable').delete().eq('id', id);
        delete (globalThis as any).__TEST_FIN_ID;
      }
    }
  }
];
