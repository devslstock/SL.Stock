import { supabase } from '@/lib/supabase'
import type { CostCenter } from '@/types/database'

export const costCentersApi = {
  async getCostCenters(companyId: string) {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('company_id', companyId)
      .order('code', { ascending: true })

    if (error) throw error
    return data as CostCenter[]
  },

  async getCostCenter(id: string) {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as CostCenter
  },

  async createCostCenter(center: Omit<CostCenter, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('cost_centers')
      .insert([center])
      .select()
      .single()

    if (error) throw error
    return data as CostCenter
  },

  async updateCostCenter(id: string, center: Partial<CostCenter>) {
    const { data, error } = await supabase
      .from('cost_centers')
      .update(center)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as CostCenter
  },

  async deleteCostCenter(id: string) {
    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
