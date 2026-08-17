import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, RefreshCw, CheckCircle2, AlertCircle, Clock, Building2, UploadCloud, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'

export function CompaniesTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: companies, isLoading } = useQuery({
    queryKey: ['focus_nfe_companies', searchTerm],
    queryFn: async () => {
      let query = supabase.from('companies').select('*').order('name')
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    }
  })

  const syncMutation = useMutation({
    mutationFn: async ({ id, isDryRun }: { id: string, isDryRun: boolean }) => {
      return focusIntegrationApi.syncCompany(id, isDryRun)
    },
    onSuccess: (res, variables) => {
      toast.success(variables.isDryRun ? 'Simulação (Dry Run) bem sucedida!' : 'Empresa sincronizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['focus_nfe_companies'] })
    },
    onError: (e: any) => {
      toast.error(e.message || 'Erro ao sincronizar empresa')
      queryClient.invalidateQueries({ queryKey: ['focus_nfe_companies'] })
    }
  })

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'SINCRONIZADA': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Sincronizada</Badge>
      case 'ERRO': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Erro</Badge>
      case 'PENDENTE': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Pendente</Badge>
      case 'SINCRONIZANDO': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Sincronizando</Badge>
      case 'DESATIVADA': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Desativada</Badge>
      default: return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Não Configurada</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por nome ou CNPJ..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar Todas (Pendentes)
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Status SL.Stock</th>
                <th className="px-4 py-3">Status Focus NFe</th>
                <th className="px-4 py-3">ID Focus</th>
                <th className="px-4 py-3">Última Sinc.</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Carregando empresas...</td></tr>
              ) : companies?.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma empresa encontrada.</td></tr>
              ) : (
                companies?.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {company.name.substring(0, 2).toUpperCase()}
                      </div>
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{company.cnpj || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={company.active ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                        {company.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(company.focus_nfe_status)}
                      {company.focus_nfe_status === 'ERRO' && company.focus_nfe_last_error && (
                        <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={company.focus_nfe_last_error}>
                          {company.focus_nfe_last_error}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{company.focus_nfe_empresa_id || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {company.focus_nfe_last_sync ? new Date(company.focus_nfe_last_sync).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1.5"
                        onClick={() => syncMutation.mutate({ id: company.id, isDryRun: true })}
                        disabled={syncMutation.isPending}
                        title="Simular Sincronização (Dry Run)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Simular
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => syncMutation.mutate({ id: company.id, isDryRun: false })}
                        disabled={syncMutation.isPending}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Sincronizar
                      </Button>
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
