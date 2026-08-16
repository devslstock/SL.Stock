import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const stockTests: TestBattery[] = [
  {
    id: 'EST-001',
    name: 'Estoque — Entrada e Movimentação Isolada',
    module: 'Estoque',
    type: 'Operacional',
    priority: 'Alta',
    description: 'Cria um produto mock, insere estoque e verifica saldo final. Em seguida apaga o produto.',
    tags: ['estoque', 'produto', 'movimentação', 'entrada', 'saldo'],
    
    // Podemos armazenar variaveis no contexto global do Javascript para compartilhar entre os steps
    // Mas o mais seguro seria o context do TestRunner. Por simplicidade, usaremos escopo do modulo:
    setup: async (ctx) => {
      // O setup apenas sinaliza início
    },

    tests: [
      {
        name: 'Criar Produto Mock com Saldo Zero',
        run: async (ctx) => {
          const testSku = `TESTE_AUTO_EST001_${Date.now()}`;
          // Salva no window ou globalThis para o próximo step achar (simulação de state)
          (globalThis as any).__TEST_SKU_EST001 = testSku;

          const { data: prodData, error: prodErr } = await supabase.from('products').insert({
            company_id: ctx.companyId,
            code: testSku,
            description: 'Produto de Teste Automatizado',
            active: true,
            stock: 0
          }).select('id').single();

          if (prodErr || !prodData) {
            throw new Error(`Falha ao criar produto: ${prodErr?.message}`);
          }
          
          (globalThis as any).__TEST_ID_EST001 = prodData.id;
          ctx.log(`Produto criado com ID: ${prodData.id}`);
        }
      },
      {
        name: 'Realizar Entrada de 10 Unidades',
        run: async (ctx) => {
          const productId = (globalThis as any).__TEST_ID_EST001;
          ctx.assert(!!productId, 'ID do produto mock não encontrado no estado.');

          const { error: movErr } = await supabase.from('products').update({
            stock: 10
          }).eq('id', productId);

          if (movErr) throw new Error(`Falha ao registrar movimentação: ${movErr.message}`);
          ctx.log('Saldo do produto atualizado no banco.');
        }
      },
      {
        name: 'Validar Saldo Atualizado',
        run: async (ctx) => {
          const productId = (globalThis as any).__TEST_ID_EST001;
          const { data: stockData, error: stockErr } = await supabase.from('products').select('stock').eq('id', productId).single();
          
          if (stockErr) throw new Error(`Erro ao consultar saldo: ${stockErr.message}`);

          const qty = stockData?.stock || 0;
          ctx.assertEqual(qty, 10, 'O saldo do produto deveria ser exatamente 10 após a movimentação.');
        }
      }
    ],

    cleanup: async (ctx) => {
      ctx.log('Iniciando limpeza de produtos de teste...');
      const { data, error } = await supabase.from('products').delete()
        .like('code', 'TESTE_AUTO_EST001_%')
        .eq('company_id', ctx.companyId)
        .select('id');
      
      if (error) {
        throw new Error(`Falha ao limpar produtos de teste: ${error.message}`);
      }
      
      ctx.log(`Limpeza concluída. ${data?.length || 0} produtos apagados.`);
      
      // Limpar state
      delete (globalThis as any).__TEST_SKU_EST001;
      delete (globalThis as any).__TEST_ID_EST001;
    }
  }
];
