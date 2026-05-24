import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'
import { currentCompanyId } from '@/contexts/AuthContext'

export const usersApi = {
  async login(username: string, password_hash: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password_hash)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    return data as User | null
  },

  async getUsers() {
    if (!currentCompanyId) return []
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('name')
    if (error) throw error
    return data as User[]
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>) {
    if (!currentCompanyId) throw new Error('No company context')
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, company_id: currentCompanyId }])
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
