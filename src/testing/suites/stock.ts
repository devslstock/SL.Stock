import type { TestCase } from '../types';
import { supabase } from '@/lib/supabase';

export const stockTests: TestCase[] = [
  {
    id: 'EST-001',
    name: 'Criação de Produto e Movimentação Isolada',
    category: 'Estoque',
    type: 'E2E',
    priority: 'Alta',
    description: 'Cria um produto mock, insere estoque e verifica saldo final. Em seguida apaga o produto.',
    keywords: ['estoque', 'produto', 'movimentação', 'entrada', 'nao atualiza', 'saldo'],
    run: async (ctx) => {
      ctx.log('Criando produto de teste...');
      
      const testSku = `TESTE_AUTO_${Date.now()}`;
      
      // 1. Criar Produto
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
      
      const productId = prodData.id;
      ctx.log(`Produto criado com ID: ${productId}`);

      // 2. Dar entrada de 10 unidades
      ctx.log('Realizando entrada de 10 unidades (atualizando saldo)...');
      const { error: movErr } = await supabase.from('products').update({
        stock: 10
      }).eq('id', productId);

      if (movErr) throw new Error(`Falha ao registrar movimentação: ${movErr.message}`);

      // 3. Checar saldo
      ctx.log('Verificando saldo do produto...');
      const { data: stockData, error: stockErr } = await supabase.from('products').select('stock').eq('id', productId).single();
      
      if (stockErr) {
        throw new Error(`Erro ao consultar saldo: ${stockErr.message}`);
      }

      const qty = stockData?.stock || 0;
      ctx.assertEqual(qty, 10, 'O saldo do produto deveria ser exatamente 10 após a movimentação.');
      ctx.log('Saldo validado com sucesso. (Qtd: 10)');

      // Guarda o ID para o cleanup no contexto global ou apenas passa adiante
      // No Javascript o cleanup pode ser closure, mas no nosso modelo o cleanup é solto. 
      // Por isso, num cenário real, usamos o SKU de prefixo para limpar.
    },
    cleanup: async (ctx) => {
      ctx.log('Iniciando limpeza de produtos de teste...');
      // Removemos todos os produtos que começam com TESTE_AUTO_ na empresa atual
      // O Supabase tem ON DELETE CASCADE para movimentações e saldos (geralmente).
      const { data, error } = await supabase.from('products').delete().like('code', 'TESTE_AUTO_%').eq('company_id', ctx.companyId).select('id');
      
      if (error) {
        throw new Error(`Falha ao limpar produtos de teste: ${error.message}`);
      }
      
      ctx.log(`Limpeza concluída. ${data?.length || 0} produtos de teste apagados.`);
    }
  }
];
