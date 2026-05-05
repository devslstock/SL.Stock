import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'

export const usersApi = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')
    if (error) throw error
    return data as User[]
  },

  async createUser(user: Omit<User, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    if (error) throw error
    return data as User
  },

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as User
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
