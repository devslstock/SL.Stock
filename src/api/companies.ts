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
  },

  async verifyCompanyFinancialStatus(id: string) {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const limitDateStr = fiveDaysAgo.toISOString().split('T')[0];

    const { data } = await supabase
      .from('company_payments')
      .select('id')
      .eq('company_id', id)
      .neq('status', 'pago')
      .lt('due_date', limitDateStr);

    if (data && data.length > 0) {
      // Tem pendência a mais de 5 dias
      await supabase.from('companies').update({ active: false }).eq('id', id);
      return false; // Inativada
    }
    return true; // OK
  },

  async backupCompanyData(companyId: string) {
    const { data: products } = await supabase.from('products').select('*').eq('company_id', companyId);
    const { data: routes } = await supabase.from('delivery_routes').select('*').eq('company_id', companyId);
    const { data: clients } = await supabase.from('delivery_clients').select('*').eq('company_id', companyId);
    const { data: deliveryItems } = await supabase.from('delivery_items').select('*').eq('company_id', companyId);
    const { data: operations } = await supabase.from('operations').select('*').eq('company_id', companyId);
    const { data: operationItems } = await supabase.from('operation_items').select('*').eq('company_id', companyId);
    const { data: users } = await supabase.from('users').select('id, name, username, role, active, created_at').eq('company_id', companyId);

    return {
      products: products || [],
      delivery_routes: routes || [],
      delivery_clients: clients || [],
      delivery_items: deliveryItems || [],
      operations: operations || [],
      operation_items: operationItems || [],
      users: users || []
    };
  },

  async deleteCompany(id: string) {
    // 1. Delete delivery items
    await supabase.from('delivery_items').delete().eq('company_id', id);

    // 2. Delete delivery clients
    await supabase.from('delivery_clients').delete().eq('company_id', id);

    // 3. Delete delivery routes
    await supabase.from('delivery_routes').delete().eq('company_id', id);

    // 4. Delete operation items
    await supabase.from('operation_items').delete().eq('company_id', id);

    // 5. Delete operations
    await supabase.from('operations').delete().eq('company_id', id);

    // 6. Delete related codes
    await supabase.from('related_codes').delete().eq('company_id', id);

    // 7. Delete products
    await supabase.from('products').delete().eq('company_id', id);

    // 8. Delete company payments
    await supabase.from('company_payments').delete().eq('company_id', id);

    // 9. Delete system notes
    const { data: users } = await supabase.from('users').select('id').eq('company_id', id);
    if (users && users.length > 0) {
      const userIds = users.map(u => u.id);
      await supabase.from('system_notes').delete().in('author_id', userIds);
    }

    // 10. Delete users
    await supabase.from('users').delete().eq('company_id', id);

    // 11. Delete company itself
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
