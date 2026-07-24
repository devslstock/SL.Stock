import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'


export const usersApi = {
  // login() foi movido para AuthContext via Supabase Auth
  async login() {
    throw new Error('Use AuthContext.login para autenticação')
  },

  async getUsers(company_id?: string) {
    let query = supabase.from('users').select('*').order('name');
    if (company_id) {
      query = query.eq('company_id', company_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as User[];
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>, forceCompanyId?: string) {
    const { data: { session } } = await supabase.auth.getSession()
    
    const { data, error } = await supabase.functions.invoke('create-company-user', {
      body: { user, forceCompanyId },
      headers: {
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : ''
      }
    })
    
    if (error) {
      if (error.message?.includes('Bearer token')) {
        throw new Error('A Edge Function não tem acesso à MY_SERVICE_ROLE_KEY. Configure este secret no Supabase Dashboard.')
      }
      throw new Error(error.message || 'Erro ao criar usuário. Tente novamente.')
    }
    
    if (data?.error) {
      if (data.error.includes('Bearer token')) {
        throw new Error('A Edge Function (create-company-user) está sem a Service Role Key válida. Adicione no dashboard como MY_SERVICE_ROLE_KEY.')
      }
      throw new Error(data.error || 'Erro ao criar usuário. Tente novamente.')
    }
    
    return data as User
  },

  async updateUser(id: string, updates: Partial<User> & { force_password_reset?: boolean }) {
    if (updates.force_password_reset) {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data, error } = await supabase.functions.invoke('update-company-user', {
        body: { id, updates },
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })

      if (error) {
        if (error.message?.includes('Bearer token')) {
          throw new Error('A Edge Function não tem acesso à MY_SERVICE_ROLE_KEY. Configure este secret no Supabase Dashboard.')
        }
        throw new Error(error.message || 'Erro ao atualizar usuário.')
      }
      if (data?.error) {
        if (data.error.includes('Bearer token')) {
          throw new Error('A Edge Function (update-company-user) está sem a Service Role Key válida. Adicione no dashboard como MY_SERVICE_ROLE_KEY.')
        }
        throw new Error(data.error || 'Erro ao atualizar usuário.')
      }
      
      return data as User;
    }

    // Normal update via Supabase Client (RLS covers it)
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Erro ao atualizar usuário.');
    return data as User;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      
    if (error) {
      // 23503 is the PostgreSQL code for foreign_key_violation
      if (error.code === '23503') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ active: false })
          .eq('id', id);
          
        if (updateError) throw updateError;
        throw new Error('Este usuário possui histórico no sistema (entregas, rotas, etc.) e não pode ser excluído permanentemente. Por segurança, ele foi inativado.');
      }
      throw error;
    }
    return true
  }
}
