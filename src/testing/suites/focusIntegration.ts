import { focusIntegrationApi } from '@/api/focusIntegration'
import type { TestBattery } from '../types'

export const focusIntegrationSuite: TestBattery[] = [
  {
    id: 'FCS-INT-001',
    name: 'Integração Global Focus NFe',
    module: 'Fiscal',
    type: 'Integração',
    description: 'Valida o ecossistema de integração de empresas SL.Stock ↔ Focus NFe',
    tags: ['focus', 'integration', 'companies'],
    tests: [
      {
        name: 'Configurações Globais (Settings)',
        run: async (ctx) => {
          const settings = await focusIntegrationApi.getSettings()
          if (!settings) {
            ctx.log('Nenhuma configuração encontrada, criando inicial...')
            await focusIntegrationApi.createSettings({
              is_active: true,
              environment: 'homologacao',
              auto_register: true,
              auto_sync: true,
              enable_nfe: true,
              enable_nfce: true,
              enable_nfse: false,
              enable_receive_nfe: true,
              enable_receive_cte: false
            })
            ctx.log('Configurações padrão criadas com sucesso.')
          } else {
            ctx.assert(settings.environment !== undefined, 'Ambiente está definido')
            ctx.log('Configurações lidas com sucesso', settings)
          }
        }
      },
      {
        name: 'Autenticação e Conexão Base (Proxy)',
        run: async (ctx) => {
          const res = await focusIntegrationApi.testConnection()
          ctx.assert(res.success === true, 'A API Focus proxy deve retornar sucesso na conexão')
          ctx.log('Conexão estabelecida com proxy Vercel e Focus API', res)
        }
      },
      {
        name: 'Logs de Integração (Read)',
        run: async (ctx) => {
          const logs = await focusIntegrationApi.getLogs(5)
          ctx.assert(Array.isArray(logs), 'O formato de logs retornado deve ser um array')
          ctx.log(`Lidos ${logs.length} logs recentes do banco local`)
        }
      }
    ],
    cleanup: async (ctx) => {
      // Nenhum cleanup intrusivo necessário
    }
  }
]
