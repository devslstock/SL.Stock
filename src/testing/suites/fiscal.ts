import type { TestBattery } from '../types';

export const fiscalTests: TestBattery[] = [
  {
    id: 'FSC-001',
    name: 'Fiscal — Validador Base Focus NFe',
    module: 'Fiscal',
    type: 'Integração',
    priority: 'Alta',
    description: 'Valida chaves e infra do Focus NFe pelo Proxy Vercel.',
    tags: ['fiscal', 'nfe', 'focusnfe', 'proxy'],
    tests: [
      {
        name: 'Ping Proxy Fiscal',
        run: async (ctx) => {
          const res = await fetch('/api/focus-proxy', { method: 'OPTIONS' });
          ctx.assert(res.ok, `Falha no proxy fiscal, status: ${res.status}`);
          ctx.log('Proxy Fiscal está respondendo corretamente.');
        }
      }
    ]
  }
];
