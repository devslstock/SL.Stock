import { useQuery } from '@tanstack/react-query'
import { TerminalSquare, RefreshCw } from 'lucide-react'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function LogsTab() {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['focus_nfe_logs'],
    queryFn: () => focusIntegrationApi.getLogs(50)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <TerminalSquare className="w-5 h-5 text-gray-500" />
          Últimos Eventos de Integração
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Empresa (CNPJ)</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Carregando logs...</td></tr>
              ) : logs?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum evento registrado.</td></tr>
              ) : (
                logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {log.companies ? (
                        <>
                          <div className="text-sm">{log.companies.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{log.companies.cnpj}</div>
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-gray-50">
                        {log.operation}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {log.endpoint || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.result === 'SUCCESS' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Sucesso ({log.http_status})</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Erro ({log.http_status})</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-md truncate" title={log.message || ''}>
                      {log.message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
