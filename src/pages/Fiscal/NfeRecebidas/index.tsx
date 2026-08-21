import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { focusIntegrationApi } from '@/api/focusIntegration'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { getErrorMessage } from '@/utils/errorMessage'
import { FileText, Search, Filter, RefreshCw, Loader2, CheckCircle, AlertTriangle, FileDown } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { NfeRecebidasImportModal } from '@/components/Fiscal/NfeRecebidasImportModal'

export default function NfeRecebidas() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [chaveParaImportar, setChaveParaImportar] = useState<string | null>(null)
  const itemsPerPage = 10

  // FETCH DB NFEs
  const { data: dbNfes = [], isLoading: isLoadingDb, refetch } = useQuery({
    queryKey: ['nfe-recebidas', company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfe_recebidas')
        .select('*')
        .eq('company_id', company?.id)
        .order('data_emissao', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!company?.id
  })

  // SYNC MUTATION
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!company?.cnpj) throw new Error('Empresa sem CNPJ')
      // get max version
      const { data } = await supabase
        .from('nfe_recebidas')
        .select('versao')
        .eq('company_id', company.id)
        .order('versao', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      const versao = data?.versao || 0
      
      // Call Focus API
      const result = await focusIntegrationApi.syncNfesRecebidas(company.cnpj.replace(/\D/g, ''), versao)
      
      // Insert new records to DB
      if (result.data && Array.isArray(result.data)) {
        const insertData = result.data.map((nfe: any) => ({
          company_id: company.id,
          chave_nfe: nfe.chave_nfe,
          nome_emitente: nfe.nome_emitente,
          documento_emitente: nfe.documento_emitente,
          valor_total: parseFloat(nfe.valor_total) || 0,
          data_emissao: nfe.data_emissao,
          situacao: nfe.situacao,
          manifestacao_destinatario: nfe.manifestacao_destinatario,
          nfe_completa: nfe.nfe_completa,
          versao: nfe.versao
        }))
        
        if (insertData.length > 0) {
          const { error } = await supabase
            .from('nfe_recebidas')
            .upsert(insertData, { onConflict: 'company_id,chave_nfe' })
          
          if (error) throw error
        }
      }
      return result
    },
    onSuccess: (result) => {
      toast.success(`Foram sincronizadas ${result.data?.length || 0} notas fiscais.`)
      refetch()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    }
  })

  // MANIFESTATION MUTATION
  const manifestarMutation = useMutation({
    mutationFn: async ({ chave, tipo }: { chave: string, tipo: 'ciencia' | 'confirma' | 'desconhecimento' }) => {
      const result = await focusIntegrationApi.manifestarNfe(chave, tipo)
      
      // Update DB optimistically or via refetch
      await supabase
        .from('nfe_recebidas')
        .update({ manifestacao_destinatario: tipo })
        .eq('company_id', company?.id)
        .eq('chave_nfe', chave)

      return result
    },
    onSuccess: () => {
      toast.success('Manifestação registrada com sucesso!')
      refetch()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    }
  })

  // FILTER & PAGINATION
  const filteredNfes = useMemo(() => {
    return dbNfes.filter(nfe => 
      nfe.nome_emitente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.documento_emitente?.includes(searchTerm) ||
      nfe.chave_nfe?.includes(searchTerm)
    )
  }, [dbNfes, searchTerm])

  const totalPages = Math.ceil(filteredNfes.length / itemsPerPage)
  const paginatedNfes = filteredNfes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getManifestBadge = (manifest: string) => {
    switch (manifest) {
      case 'ciencia': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ciência Registrada</Badge>
      case 'confirma': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Confirmada</Badge>
      case 'desconhecimento': return <Badge className="bg-red-100 text-red-800 border-red-200">Desconhecida</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Sem Manifestação</Badge>
    }
  }

  const getStatusBadge = (situacao: string) => {
    if (situacao === 'autorizada') return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Autorizada</Badge>
    if (situacao === 'cancelada') return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{situacao}</Badge>
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FileDown className="h-8 w-8 text-primary" />
            NF-e Recebidas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie as notas emitidas contra o seu CNPJ, faça a manifestação e dê entrada no estoque.
          </p>
        </div>
        
        <Button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncMutation.isPending || !company?.cnpj}
          className="w-full sm:w-auto shadow-sm"
        >
          {syncMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Buscar Novas Notas
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por Fornecedor, CNPJ ou Chave..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 border-gray-200 focus-visible:ring-primary shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Emissão</th>
                <th className="px-6 py-4 whitespace-nowrap">Fornecedor</th>
                <th className="px-6 py-4 whitespace-nowrap">Valor</th>
                <th className="px-6 py-4 whitespace-nowrap">Situação SEFAZ</th>
                <th className="px-6 py-4 whitespace-nowrap">Manifestação</th>
                <th className="px-6 py-4 whitespace-nowrap">XML/Entrada</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingDb ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Carregando notas fiscais...
                  </td>
                </tr>
              ) : paginatedNfes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileDown className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900 mb-1">Nenhuma nota encontrada</p>
                    <p className="text-sm">Clique em "Buscar Novas Notas" para sincronizar com a SEFAZ.</p>
                  </td>
                </tr>
              ) : (
                paginatedNfes.map((nfe) => (
                  <tr key={nfe.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="font-medium text-gray-900 truncate" title={nfe.nome_emitente}>
                        {nfe.nome_emitente}
                      </div>
                      <div className="text-xs text-gray-500">
                        {nfe.documento_emitente?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nfe.valor_total || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(nfe.situacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getManifestBadge(nfe.manifestacao_destinatario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {nfe.status_importacao === 'importada' ? (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">Importada</Badge>
                      ) : nfe.status_importacao === 'pendente' && nfe.manifestacao_destinatario === 'confirma' ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pronto p/ Entrada</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {(!nfe.manifestacao_destinatario || nfe.manifestacao_destinatario === 'sem_manifesto') && nfe.situacao === 'autorizada' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => manifestarMutation.mutate({ chave: nfe.chave_nfe, tipo: 'ciencia' })}
                          disabled={manifestarMutation.isPending}
                        >
                          Dar Ciência
                        </Button>
                      )}
                      {nfe.manifestacao_destinatario === 'ciencia' && nfe.situacao === 'autorizada' && (
                        <Button 
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => manifestarMutation.mutate({ chave: nfe.chave_nfe, tipo: 'confirma' })}
                          disabled={manifestarMutation.isPending}
                        >
                          Confirmar
                        </Button>
                      )}
                      {nfe.manifestacao_destinatario === 'confirma' && nfe.status_importacao === 'pendente' && (
                        <Button size="sm" variant="default" onClick={() => {
                          setChaveParaImportar(nfe.chave_nfe)
                          setImportModalOpen(true)
                        }}>
                          Importar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredNfes.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      <NfeRecebidasImportModal 
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false)
          setChaveParaImportar(null)
        }}
        chaveNfe={chaveParaImportar}
      />
    </div>
  )
}
