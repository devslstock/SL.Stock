import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const masterDataTests: TestBattery[] = [
  {
    id: 'PROD-001',
    name: 'Produtos — Cadastro e Fluxo Básico',
    module: 'Produtos',
    type: 'CRUD',
    priority: 'Normal',
    description: 'Valida a criação, atualização de preço e inativação de produtos no cadastro mestre.',
    tags: ['produto', 'cadastro', 'preço', 'inativar'],
    tests: [
      {
        name: 'Criar Produto com Preço',
        run: async (ctx) => {
          const testSku = `TEST_PROD_${Date.now()}`;
          const { data, error } = await supabase.from('products').insert({
            company_id: ctx.companyId,
            code: testSku,
            description: 'Produto Teste QA',
            price: 50.00,
            active: true
          }).select('id').single();

          if (error) throw new Error(`Erro ao cadastrar: ${error.message}`);
          ctx.assert(!!data.id, 'ID não retornado.');
          
          (globalThis as any).__TEST_MASTER_PROD_ID = data.id;
          ctx.log('Produto salvo com sucesso');
        }
      },
      {
        name: 'Inativar Produto',
        run: async (ctx) => {
          const id = (globalThis as any).__TEST_MASTER_PROD_ID;
          ctx.assert(!!id, 'ID do produto mock não encontrado.');

          const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
          if (error) throw new Error(`Erro ao inativar: ${error.message}`);
          ctx.log('Produto inativado');
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_MASTER_PROD_ID;
      if (id) {
        await supabase.from('products').delete().eq('id', id);
        delete (globalThis as any).__TEST_MASTER_PROD_ID;
      }
    }
  },
  {
    id: 'CLI-001',
    name: 'Clientes — Validação de Endereço e Rota',
    module: 'CRM',
    type: 'CRUD',
    priority: 'Alta',
    description: 'Valida as informações mínimas de roteirização num novo cliente (CRM).',
    tags: ['cliente', 'crm', 'rota', 'endereço'],
    tests: [
      {
        name: 'Cadastrar Cliente de Teste com Localização',
        run: async (ctx) => {
          const cnpj = `00${Date.now()}`.substring(0, 14);
          const { data, error } = await supabase.from('customers').insert({
            company_id: ctx.companyId,
            name: 'Cliente QA Test',
            document: cnpj,
            route: 'ROTA_QA_TESTE',
            city: 'São Paulo',
            state: 'SP'
          }).select('id').single();

          if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
          (globalThis as any).__TEST_MASTER_CLI_ID = data.id;
          ctx.log('Cliente cadastrado na ROTA_QA_TESTE.');
        }
      }
    ],
    cleanup: async (ctx) => {
      const id = (globalThis as any).__TEST_MASTER_CLI_ID;
      if (id) {
        await supabase.from('customers').delete().eq('id', id);
        delete (globalThis as any).__TEST_MASTER_CLI_ID;
      }
    }
  }
];
