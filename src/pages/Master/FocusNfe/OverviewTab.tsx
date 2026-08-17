import { useQuery } from '@tanstack/react-query'
import { Server, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ['focus_nfe_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('focus_nfe_status')
      if (error) throw error
      
      const total = data.length
      const synced = data.filter(d => d.focus_nfe_status === 'SINCRONIZADA').length
      const errorCount = data.filter(d => d.focus_nfe_status === 'ERRO').length
      const pending = data.filter(d => d.focus_nfe_status === 'PENDENTE').length
      
      return { total, synced, errorCount, pending }
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Empresas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.total || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sincronizadas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.synced || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Com Erro</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.errorCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Aqui poderia vir um grafico ou ultimas atualizacoes resumidas */}
      <div className="bg-white rounded-lg border shadow-sm p-6 flex flex-col items-center justify-center py-12">
        <Server className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Integração Saudável</h3>
        <p className="text-gray-500 max-w-md text-center mt-2">
          As operações de emissão e sincronização estão funcionando corretamente. Acesse a aba de Empresas para sincronizar novos clientes.
        </p>
      </div>
    </div>
  )
}
