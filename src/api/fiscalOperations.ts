import { supabase } from '@/lib/supabase'
import type { FiscalOperation } from '@/types/database'

export const fiscalOperationsApi = {
  async getOperations(companyId: string) {
    const { data, error } = await supabase
      .from('fiscal_operations')
      .select('*')
      .eq('company_id', companyId)
      .order('name')
    if (error) throw error
    return data as FiscalOperation[]
  },

  async createOperation(operation: Partial<FiscalOperation>) {
    const { data, error } = await supabase
      .from('fiscal_operations')
      .insert([operation])
      .select()
      .single()
    if (error) throw error
    return data as FiscalOperation
  },

  async updateOperation(id: string, updates: Partial<FiscalOperation>) {
    const { data, error } = await supabase
      .from('fiscal_operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as FiscalOperation
  },

  async deleteOperation(id: string) {
    const { error } = await supabase
      .from('fiscal_operations')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
