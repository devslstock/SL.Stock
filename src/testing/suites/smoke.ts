import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorMessage';

export const smokeTests: TestBattery[] = [
  {
    id: 'SMOKE-001',
    name: 'Dashboard — Verificação de Infraestrutura Base',
    module: 'Dashboard',
    type: 'Integração',
    priority: 'Crítica',
    description: 'Verifica se o banco de dados Supabase e o proxy da Vercel estão online.',
    tags: ['banco', 'supabase', 'conexao', 'offline', 'api', 'vercel', 'serverless'],
    tests: [
      {
        name: 'Conexão com Banco de Dados Supabase',
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
        name: 'Conexão com Proxy Serverless (Vercel API)',
        run: async (ctx) => {
          ctx.log('Testando ping no /api/focus-proxy...');
          
          try {
            const res = await fetch('/api/focus-proxy', { method: 'OPTIONS' });
            ctx.assert(res.ok, `Proxy retornou status ${res.status}`);
            ctx.log('Proxy Vercel está online e aceitando conexões.');
          } catch (err: unknown) {
            throw new Error(`Falha ao contactar a API interna Vercel: ${getErrorMessage(err)}`);
          }
        }
      }
    ]
  }
];
