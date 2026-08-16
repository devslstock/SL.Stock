import { TestCase } from '../types';
import { supabase } from '@/lib/supabase';

export const smokeTests: TestCase[] = [
  {
    id: 'SMOKE-001',
    name: 'Conexão com Supabase',
    category: 'Sistema',
    type: 'DATABASE',
    priority: 'Crítica',
    description: 'Verifica se o banco de dados Supabase está online e respondendo.',
    keywords: ['banco', 'supabase', 'conexao', 'offline'],
    run: async (ctx) => {
      ctx.log('Testando conexão com Supabase invocando select limit 1...');
      
      const { data, error } = await supabase.from('companies').select('id').limit(1);
      
      if (error) {
        throw new Error(`Falha ao conectar no Supabase: ${error.message}`);
      }
      
      ctx.assert(Array.isArray(data), 'Resposta do Supabase não é um array válido');
      ctx.log('Conexão estabelecida com sucesso.', data);
    }
  },
  {
    id: 'SMOKE-002',
    name: 'Verificação de Ambiente Proxy (Vercel)',
    category: 'APIs',
    type: 'API',
    priority: 'Alta',
    description: 'Testa se as Serverless Functions estão respondendo (Proxy NFe)',
    keywords: ['api', 'vercel', 'serverless', 'proxy', 'offline'],
    run: async (ctx) => {
      ctx.log('Testando ping no /api/focus-proxy...');
      
      try {
        // Envia um OPTIONS para o proxy apenas para ver se ele retorna 200 rápido
        const res = await fetch('/api/focus-proxy', { method: 'OPTIONS' });
        ctx.assert(res.ok, `Proxy retornou status ${res.status}`);
        ctx.log('Proxy Vercel está online e aceitando conexões.');
      } catch (err: any) {
        throw new Error(`Falha ao contactar a API interna Vercel: ${err.message}`);
      }
    }
  }
];
