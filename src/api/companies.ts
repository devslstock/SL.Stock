import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

export const companiesApi = {
  async getCompany(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Company
  },

  async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')
    if (error) throw error
    return data as Company[]
  },

  async createCompany(company: Omit<Company, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single()
    if (error) throw error
    return data as Company
  },

  async updateCompany(id: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Company
  }
}
