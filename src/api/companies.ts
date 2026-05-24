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
  }
}
