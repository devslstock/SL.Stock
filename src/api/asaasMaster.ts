import { supabase } from '../lib/supabase'
import type { AsaasMasterSettings } from '../types/database'

interface ProvisionarSubcontaInput {
  companyId: string
  mobilePhone: string
  incomeValue: number
  companyType: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
  address?: string
  addressNumber?: string
  province?: string
  postalCode?: string
}

interface ProvisionarSubcontaResult {
  success: boolean
  subaccountId?: string
  walletId?: string
  error?: string
}

export const asaasMasterApi = {
  provisionarSubconta: async (input: ProvisionarSubcontaInput): Promise<ProvisionarSubcontaResult> => {
    const { data, error } = await supabase.functions.invoke('asaas-provision-subaccount', {
      body: input,
    })
    if (error) throw error
    return data
  },

  getMasterSettings: async (): Promise<AsaasMasterSettings | null> => {
    const { data, error } = await supabase
      .from('asaas_master_settings')
      .select('*')
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  updateMasterSettings: async (id: string, updates: Partial<Pick<AsaasMasterSettings, 'api_key' | 'environment'>>): Promise<AsaasMasterSettings> => {
    const { data, error } = await supabase
      .from('asaas_master_settings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
