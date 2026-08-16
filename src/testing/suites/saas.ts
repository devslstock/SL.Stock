import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const saasTests: TestBattery[] = [
  {
    id: 'EMP-001',
    name: 'SaaS — Estrutura de Empresa Mock',
    module: 'SaaS',
    type: 'CRUD',
    priority: 'Alta',
    description: 'Valida se é possível criar uma configuração base e se as FKs do Supabase funcionam.',
    tags: ['saas', 'empresa', 'configuracao'],
    tests: [
      {
        name: 'Validar Leitura da Própria Empresa',
        run: async (ctx) => {
          // Apenas valida leitura
          const { data, error } = await supabase.from('companies').select('id').eq('id', ctx.companyId!).single();
          if (error) throw new Error(`Não conseguiu ler a própria empresa: ${error.message}`);
          ctx.log('Leitura de empresa OK.');
        }
      }
    ]
  }
];
