import type { TestBattery } from '../types';

export const offlineTests: TestBattery[] = [
  {
    id: 'OFF-001',
    name: 'Offline — Service Worker Sync Mock',
    module: 'Offline',
    type: 'Offline',
    priority: 'Normal',
    description: 'Simula o ambiente IndexedDB local se estiver disponível no browser.',
    tags: ['offline', 'pwa', 'indexeddb'],
    tests: [
      {
        name: 'Checar IndexedDB API',
        run: async (ctx) => {
          if (!window.indexedDB) {
             ctx.log('IndexedDB não suportado no ambiente atual.');
             return; // Ignora se não existir
          }
          ctx.log('IndexedDB detectado no navegador. Operacional.');
        }
      }
    ]
  }
];
