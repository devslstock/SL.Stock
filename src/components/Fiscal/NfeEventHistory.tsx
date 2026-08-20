import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, AlertCircle, Clock, Info, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NfeEventHistoryProps {
  nfeId: string | undefined
}

export function NfeEventHistory({ nfeId }: NfeEventHistoryProps) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['nfe_events', nfeId],
    queryFn: async () => {
      if (!nfeId) return []
      const { data, error } = await supabase
        .from('nfe_events')
        .select('*')
        .eq('nfe_id', nfeId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!nfeId
  })

  const getIcon = (status: string, eventType: string) => {
    const s = status.toLowerCase()
    if (s === 'autorizado' || s === 'sucesso') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    if (s === 'rejeitada' || s === 'erro_autorizacao' || s === 'cancelada') return <XCircle className="h-5 w-5 text-red-500" />
    if (s === 'erro' || s === 'erro_sistema') return <AlertCircle className="h-5 w-5 text-red-500" />
    if (s === 'processando' || s === 'enviando') return <Clock className="h-5 w-5 text-amber-500" />
    return <Info className="h-5 w-5 text-blue-500" />
  }

  const getBadgeVariant = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'autorizado' || s === 'sucesso') return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
    if (s === 'rejeitada' || s === 'erro_autorizacao' || s === 'cancelada') return 'bg-red-100 text-red-700 hover:bg-red-100'
    if (s === 'erro' || s === 'erro_sistema') return 'bg-red-100 text-red-700 hover:bg-red-100'
    if (s === 'processando' || s === 'enviando') return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
    return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  if (!nfeId) return <div className="p-8 text-center text-gray-500">Nenhuma NF-e vinculada.</div>
  
  if (isLoading) return (
    <div className="flex justify-center items-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  if (events.length === 0) return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center flex flex-col items-center">
      <FileText className="h-10 w-10 text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-900">Nenhum evento registrado</h3>
      <p className="text-gray-500 mt-1">O histórico de operações desta nota fiscal aparecerá aqui.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 overflow-hidden">
      <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-400" />
        Linha do Tempo da NF-e
      </h3>
      
      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-50 absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm transition-transform duration-300 group-hover:scale-110">
              {getIcon(event.status, event.event_type)}
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {event.event_type}
                </div>
                <time className="text-xs font-mono font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                  {formatDate(event.created_at)}
                </time>
              </div>
              
              <div className="mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeVariant(event.status)}`}>
                  {event.status.toUpperCase()}
                </span>
              </div>
              
              {event.message && (
                <div className="text-sm text-gray-600 mt-2 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                  {event.message}
                </div>
              )}
              
              {event.focus_code && (
                <div className="mt-2 text-xs font-mono text-gray-400">
                  Código de Retorno: {event.focus_code}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
