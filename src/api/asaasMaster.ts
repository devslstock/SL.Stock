import { supabase } from '../lib/supabase'

interface ProvisionarSubcontaInput {
  companyId: string
  mobilePhone: string
  incomeValue: number
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
}
