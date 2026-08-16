import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const comodatosTests: TestBattery[] = [
  {
    id: 'COM-001',
    name: 'Comodatos — Inserção de Equipamento',
    module: 'Comodato',
    type: 'CRUD',
    priority: 'Normal',
    description: 'Cadastra um equipamento no módulo de comodato.',
    tags: ['comodato', 'equipamento', 'patrimonio'],
    tests: [
      {
        name: 'Cadastrar Equipamento',
        run: async (ctx) => {
          const { data, error } = await supabase.from('equipments').insert({
            company_id: ctx.companyId,
            patrimony: `QA-SER-${Date.now()}`,
            model: 'Geladeira Teste QA',
            type: 'Test',
            status: 'Teste'
          }).select('id').single();

          if (error) throw new Error(`Erro ao criar equipamento: ${error.message}`);
          (globalThis as any).__TEST_COM_EQ_ID = data.id;
          ctx.log('Equipamento registrado.');
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_COM_EQ_ID;
      if (id) {
        await supabase.from('equipments').delete().eq('id', id);
        delete (globalThis as any).__TEST_COM_EQ_ID;
      }
    }
  }
];
