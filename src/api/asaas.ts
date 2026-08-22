import { supabase } from '@/lib/supabase'

export interface AsaasEmitResult {
  accountId: string
  success: boolean
  bankSlipUrl?: string
  error?: string
}

export const asaasApi = {
  async emitirBoletos(accountIds: string[]): Promise<AsaasEmitResult[]> {
    const { data, error } = await supabase.functions.invoke('asaas-emit-boleto', {
      body: { accountIds }
    })
    if (error) throw new Error(`Erro na conexão com o servidor de cobrança: ${error.message}`)
    if (!data.success) throw new Error(data.error || 'Erro desconhecido ao emitir boletos')
    return data.results as AsaasEmitResult[]
  }
}
