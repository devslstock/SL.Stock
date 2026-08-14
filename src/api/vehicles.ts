import { supabase } from '@/lib/supabase'
import type { Vehicle } from '@/types/database'

export const vehiclesApi = {
  async getVehicles(companyId: string) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId)
      .order('plate', { ascending: true })
    if (error) throw error
    return data as Vehicle[]
  },

  async createVehicle(vehicle: Partial<Vehicle>) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single()
    if (error) throw error
    return data as Vehicle
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Vehicle
  },

  async deleteVehicle(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
