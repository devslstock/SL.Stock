import { supabase } from '@/lib/supabase'

export interface SicoobEmitResult {
  accountId: string
  success: boolean
  bankSlipUrl?: string
  error?: string
}

export const sicoobApi = {
  async emitirBoletos(accountIds: string[]): Promise<SicoobEmitResult[]> {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/sicoob-emit-boleto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ accountIds }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Erro desconhecido ao emitir boletos')
    return data.results as SicoobEmitResult[]
  }
}
