import { supabase } from '@/lib/supabase'
import type { FiscalSeries } from '@/types/database'

export const fiscalSeriesApi = {
  async getCompanySeries(companyId: string) {
    const { data, error } = await supabase
      .from('fiscal_series')
      .select('*')
      .eq('company_id', companyId)
      .order('series_number', { ascending: true })
      
    if (error) throw error
    return data as FiscalSeries[]
  },

  async getActiveSeriesForType(companyId: string, documentType: string) {
    const { data, error } = await supabase
      .from('fiscal_series')
      .select('*')
      .eq('company_id', companyId)
      .eq('document_type', documentType)
      .eq('active', true)
      .order('series_number', { ascending: true })
      .limit(1)
      .single()
      
    // If not found, return null instead of throwing an error to handle gracefully
    if (error && error.code !== 'PGRST116') throw error
    return data as FiscalSeries | null
  },

  async createSeries(series: Omit<FiscalSeries, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('fiscal_series')
      .insert([series])
      .select()
      .single()
      
    if (error) throw error
    return data as FiscalSeries
  },

  async updateSeries(id: string, updates: Partial<FiscalSeries>) {
    const { data, error } = await supabase
      .from('fiscal_series')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as FiscalSeries
  },

  async deleteSeries(id: string) {
    const { error } = await supabase
      .from('fiscal_series')
      .delete()
      .eq('id', id)
      
    if (error) throw error
    return true
  },
  
  async incrementSeriesNextNumber(companyId: string, documentType: string) {
    // Busca a série ativa para aquele tipo (NFE, NFCE, etc)
    const series = await this.getActiveSeriesForType(companyId, documentType)
    if (!series) return null
    
    return await this.updateSeries(series.id, {
      next_number: (series.next_number || 1) + 1
    })
  },
  
  async incrementNextNumber(id: string) {
    const { data, error } = await supabase.rpc('increment_fiscal_series_number', { series_id: id })
    if (error) {
      // Fallback if RPC is not created yet
      const { data: current } = await supabase.from('fiscal_series').select('next_number').eq('id', id).single()
      if (current) {
        return this.updateSeries(id, { next_number: current.next_number + 1 })
      }
    }
    return data
  }
}
