import { supabase } from '@/lib/supabase'
import type { AccountingAccount, AccountingAccountCostCenter } from '@/types/database'

export const accountingAccountsApi = {
  async getAccounts(companyId: string) {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('classification', { ascending: true })

    if (error) throw error
    return data as AccountingAccount[]
  },

  async getAccount(id: string) {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as AccountingAccount
  },

  async createAccount(account: Omit<AccountingAccount, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .insert([account])
      .select()
      .single()

    if (error) throw error
    return data as AccountingAccount
  },

  async updateAccount(id: string, account: Partial<AccountingAccount>) {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .update(account)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as AccountingAccount
  },

  async deleteAccount(id: string) {
    // Before deleting, check if it has children
    const { count, error: countError } = await supabase
      .from('accounting_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id)
    
    if (countError) throw countError
    if (count && count > 0) {
      throw new Error('Não é possível excluir uma conta que possui contas filhas.')
    }

    const { error } = await supabase
      .from('accounting_accounts')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Esta conta possui movimentações ou vínculos e não pode ser excluída. Você pode desativá-la para impedir novas utilizações.')
      }
      throw error
    }
  },

  // Vínculos com Centros de Custo
  async getCostCenterLinks(accountId: string) {
    const { data, error } = await supabase
      .from('accounting_account_cost_centers')
      .select(`
        *,
        cost_centers (
          code,
          name
        )
      `)
      .eq('accounting_account_id', accountId)
      
    if (error) throw error
    return data
  },

  async createCostCenterLink(link: Omit<AccountingAccountCostCenter, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('accounting_account_cost_centers')
      .insert([link])
      .select()
      .single()

    if (error) throw error
    return data as AccountingAccountCostCenter
  },

  async updateCostCenterLink(id: string, link: Partial<AccountingAccountCostCenter>) {
    const { data, error } = await supabase
      .from('accounting_account_cost_centers')
      .update(link)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as AccountingAccountCostCenter
  },

  async deleteCostCenterLink(id: string) {
    const { error } = await supabase
      .from('accounting_account_cost_centers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
