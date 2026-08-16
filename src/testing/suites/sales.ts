import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const salesTests: TestBattery[] = [
  {
    id: 'VEN-001',
    name: 'Vendas — Orçamento B2B Base',
    module: 'Vendas',
    type: 'Fluxo',
    priority: 'Alta',
    description: 'Cria um pedido vazio para validar inserção e cálculos no cabeçalho.',
    tags: ['venda', 'pedido', 'orcamento', 'b2b'],
    tests: [
      {
        name: 'Criar Pedido de Venda Mock',
        run: async (ctx) => {
          const { data, error } = await supabase.from('orders').insert({
            company_id: ctx.companyId,
            status: 'pending',
            total_amount: 0,
            notes: 'TESTE AUTOMATIZADO QA'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar pedido: ${error.message}`);
          
          (globalThis as any).__TEST_VEN_ORDER_ID = data.id;
          ctx.log(`Pedido ${data.id} criado como Pendente.`);
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_VEN_ORDER_ID;
      if (id) {
        await supabase.from('orders').delete().eq('id', id);
        delete (globalThis as any).__TEST_VEN_ORDER_ID;
        ctx.log('Pedido limpo do sistema.');
      }
    }
  }
];
