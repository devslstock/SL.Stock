import { supabase } from '@/lib/supabase'
import type { AuditedTable, AuditLog } from '@/types/database'

export interface AuditLogFiltros {
  table_name?: AuditedTable
  record_id?: string
  changed_by?: string
  periodo_inicio?: string
  periodo_fim?: string
}

export const auditApi = {
  async getLogs(filtros?: AuditLogFiltros) {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (filtros?.table_name) {
      query = query.eq('table_name', filtros.table_name)
    }
    if (filtros?.record_id) {
      query = query.eq('record_id', filtros.record_id)
    }
    if (filtros?.changed_by) {
      query = query.eq('changed_by', filtros.changed_by)
    }
    if (filtros?.periodo_inicio) {
      query = query.gte('created_at', filtros.periodo_inicio)
    }
    if (filtros?.periodo_fim) {
      query = query.lte('created_at', filtros.periodo_fim)
    }

    const { data, error } = await query
    if (error) throw error
    return data as AuditLog[]
  },
}
