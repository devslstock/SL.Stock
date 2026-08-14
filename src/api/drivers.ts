import { supabase } from '@/lib/supabase'
import type { Driver } from '@/types/database'

export const driversApi = {
  async getDrivers(companyId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
    if (error) throw error
    return data as Driver[]
  },

  async createDriver(driver: Partial<Driver>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driver])
      .select()
      .single()
    if (error) throw error
    return data as Driver
  },

  async updateDriver(id: string, updates: Partial<Driver>) {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Driver
  },

  async deleteDriver(id: string) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
