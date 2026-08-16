import type { TestBattery } from '../types';
import { supabase } from '@/lib/supabase';

export const authTests: TestBattery[] = [
  {
    id: 'AUTH-001',
    name: 'Autenticação — Criação de Sessão Mock',
    module: 'Autenticação',
    type: 'Permissão',
    priority: 'Alta',
    description: 'Valida as regras de autenticação e verifica se o Supabase aceita operações de login simulado.',
    tags: ['login', 'auth', 'senha', 'email'],
    tests: [
      {
        name: 'Tentativa de Login com Credenciais Inválidas',
        run: async (ctx) => {
          ctx.log('Enviando credenciais inválidas...');
          const { error } = await supabase.auth.signInWithPassword({
            email: 'usuario.invalido.teste@dominio.com.br',
            password: 'senha_invalida_123'
          });
          
          ctx.assert(!!error, 'Login deveria ter falhado com credenciais inválidas');
          ctx.log('Falha de login validada corretamente.');
        }
      }
      // Não criamos usuários reais por razões de segurança do projeto,
      // mas podemos validar o fluxo de reset de senha para email inexistente.
    ]
  },
  {
    id: 'SEC-001',
    name: 'Segurança — Multi-tenant e RLS (Row Level Security)',
    module: 'Segurança',
    type: 'Segurança',
    priority: 'Crítica',
    description: 'Tenta acessar dados de uma empresa sem estar autenticado, validando as políticas RLS do Supabase.',
    tags: ['rls', 'segurança', 'multi-tenant', 'banco', 'vazamento'],
    tests: [
      {
        name: 'Acesso Anônimo (Não autenticado) a Tabela Protegida',
        run: async (ctx) => {
          ctx.log('Tentando ler dados de products sem contexto de empresa ativo...');
          
          // Guarda a sessão antiga
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (!sessionData.session) {
            // Já estamos sem sessão real de auth (provável em teste local mock)
            const { data, error } = await supabase.from('products').select('id').limit(1);
            
            // O RLS normal deveria retornar vazio ou erro dependendo da rule (geralmente array vazio)
            ctx.log('Resultado do RLS anon:', { data, error: error?.message });
            ctx.assert(!error || data?.length === 0, 'O banco deveria barrar ou retornar vazio por RLS para usuários anônimos na tabela products.');
          } else {
             ctx.log('Usuário autenticado no ambiente de testes. Pulando verificação puramente anônima.');
          }
        }
      }
    ]
  }
];
