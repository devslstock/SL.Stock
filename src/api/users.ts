import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'


export const usersApi = {
  // login() foi movido para AuthContext via Supabase Auth
  async login() {
    throw new Error('Use AuthContext.login para autenticação')
  },

  async getUsers() {
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      
      .order('name')
    if (error) throw error
    return data as User[]
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>, forceCompanyId?: string) {
    const response = await fetch('/api/create-company-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, forceCompanyId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao criar usuário. Tente novamente.');
    }
    
    const data = await response.json();
    
    return data as User
  },

  async updateUser(id: string, updates: Partial<User>) {
    const response = await fetch('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao atualizar usuário. Tente novamente.');
    }
    
    const data = await response.json();
    return data as User;
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
