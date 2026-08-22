import { supabase } from '@/lib/supabase'

export interface BbEmitResult {
  accountId: string
  success: boolean
  bankSlipUrl?: string
  error?: string
}

export const bbApi = {
  async emitirBoletos(accountIds: string[]): Promise<BbEmitResult[]> {
    const { data, error } = await supabase.functions.invoke('bb-emit-boleto', {
      body: { accountIds }
    })
    if (error) throw new Error(`Erro na conexão com o servidor de cobrança: ${error.message}`)
    if (!data.success) throw new Error(data.error || 'Erro desconhecido ao emitir boletos')
    return data.results as BbEmitResult[]
  }
}
