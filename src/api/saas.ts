import { supabase } from '@/lib/supabase'
import type { SystemNote, CompanyPayment, User } from '@/types/database'

export const saasApi = {
  // --- System Users (Staff) ---
  async getSystemUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_super_admin', true)
      .order('name')
      
    if (error) throw error
    return data as User[]
  },

  async createSystemUser(user: Omit<User, 'id' | 'created_at' | 'company_id'>) {
    const normalizedUsername = user.username.trim().toLowerCase();

    // Verificar se o username já existe no sistema
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUser) {
      throw new Error(`O usuário de login '${user.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ ...user, username: normalizedUsername, company_id: null, is_super_admin: true }])
      .select()
      .single()
      
    if (error) {
      if (error.code === '23505') {
        throw new Error(`O usuário de login '${user.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      throw error
    }
    return data as User
  },

  async updateSystemUser(id: string, updates: Partial<User>) {
    if (updates.username) {
      const normalizedUsername = updates.username.trim().toLowerCase();

      // Verificar se outro usuário já usa este username
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('id', id)
        .maybeSingle()

      if (existingUser) {
        throw new Error(`O usuário de login '${updates.username}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      updates.username = normalizedUsername;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) {
      if (error.code === '23505') {
        throw new Error(`O usuário de login '${updates.username || 'informado'}' já está em uso no sistema. Escolha outro nome de usuário.`)
      }
      throw error
    }
    return data as User
  },

  async deleteSystemUser(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  // --- Notes ---
  async getNotes() {
    const { data, error } = await supabase
      .from('system_notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as SystemNote[]
  },

  async createNote(author_id: string, author_name: string, content: string) {
    const { data, error } = await supabase
      .from('system_notes')
      .insert([{ author_id, author_name, content }])
      .select()
      .single()
      
    if (error) throw error
    return data as SystemNote
  },

  async deleteNote(id: string) {
    const { error } = await supabase
      .from('system_notes')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  async updateNote(id: string, updates: Partial<SystemNote>) {
    const { data, error } = await supabase
      .from('system_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as SystemNote
  },

  // --- Payments ---
  async getPayments() {
    const { data, error } = await supabase
      .from('company_payments')
      .select('*')
      .order('due_date', { ascending: false })
      
    if (error) throw error
    return data as CompanyPayment[]
  },

  async getPaymentsByCompany(company_id: string) {
    const { data, error } = await supabase
      .from('company_payments')
      .select('*')
      .eq('company_id', company_id)
      .order('due_date', { ascending: false })
      
    if (error) throw error
    return data as CompanyPayment[]
  },

  async createPayment(payment: Omit<CompanyPayment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('company_payments')
      .insert([payment])
      .select()
      .single()
      
    if (error) throw error
    return data as CompanyPayment
  },

  async updatePayment(id: string, updates: Partial<CompanyPayment>) {
    const { data, error } = await supabase
      .from('company_payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      
    if (error) throw error
    return data as CompanyPayment
  },

  async deletePayment(id: string) {
    const { error } = await supabase
      .from('company_payments')
      .delete()
      .eq('id', id)
      
    if (error) throw error
  },

  // --- Leads ---
  async getLeads() {
    try {
      const { data, error } = await supabase
        .from('system_leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        return data as any[]
      }
    } catch (e) {
      console.warn('Supabase system_leads table not available, falling back to localStorage:', e)
    }
    
    // Fallback
    const localLeads = localStorage.getItem('estoque_facil_leads')
    return localLeads ? JSON.parse(localLeads) : []
  },

  async createLead(lead: { name: string; email: string; phone: string; message: string }) {
    const newLead = {
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...lead
    }

    try {
      const { data, error } = await supabase
        .from('system_leads')
        .insert([newLead])
        .select()
        .single()
      
      if (!error && data) {
        return data as any
      }
    } catch (e) {
      console.warn('Supabase system_leads insert failed, falling back to localStorage:', e)
    }

    // Fallback
    const localLeads = localStorage.getItem('estoque_facil_leads')
    const list = localLeads ? JSON.parse(localLeads) : []
    list.unshift(newLead)
    localStorage.setItem('estoque_facil_leads', JSON.stringify(list))
    return newLead
  },

  async deleteLead(id: string) {
    try {
      const { error } = await supabase
        .from('system_leads')
        .delete()
        .eq('id', id)
      
      if (!error) return
    } catch (e) {
      console.warn('Supabase system_leads delete failed, falling back to localStorage:', e)
    }

    // Fallback
    const localLeads = localStorage.getItem('estoque_facil_leads')
    if (localLeads) {
      const list = JSON.parse(localLeads).filter((item: any) => item.id !== id)
      localStorage.setItem('estoque_facil_leads', JSON.stringify(list))
    }
  }
}
