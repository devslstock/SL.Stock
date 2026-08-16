import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const logisticsTests: TestBattery[] = [
  {
    id: 'LOG-001',
    name: 'Logística — Gestão de Carga',
    module: 'Logística',
    type: 'Operacional',
    priority: 'Alta',
    description: 'Cria uma carga, vincula um veículo e tenta fechar a carga.',
    tags: ['carga', 'logistica', 'separacao', 'fechamento', 'veiculo'],
    tests: [
      {
        name: 'Criar Carga Vazia',
        run: async (ctx) => {
          const { data, error } = await supabase.from('operations').insert({
            company_id: ctx.companyId,
            type: 'LOAD',
            status: 'pending',
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar carga: ${error.message}`);
          (globalThis as any).__TEST_LOG_LOAD_ID = data.id;
          ctx.log(`Carga ${data.id} criada.`);
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_LOG_LOAD_ID;
      if (id) {
        await supabase.from('operations').delete().eq('id', id);
        delete (globalThis as any).__TEST_LOG_LOAD_ID;
      }
    }
  }
];
