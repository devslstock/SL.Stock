import { supabase } from '@/lib/supabase'
import type { FocusNfeSettings, FocusNfeSyncLog, Company } from '@/types/database'

export const focusIntegrationApi = {
  // =====================================
  // GLOBAL SETTINGS
  // =====================================
  async getSettings() {
    const { data, error } = await supabase
      .from('focus_nfe_settings')
      .select('*')
      .limit(1)
      .single()
      
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data as FocusNfeSettings | null
  },

  async updateSettings(id: string, settings: Partial<FocusNfeSettings>) {
    const { data, error } = await supabase
      .from('focus_nfe_settings')
      .update(settings)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as FocusNfeSettings
  },

  async createSettings(settings: Omit<FocusNfeSettings, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('focus_nfe_settings')
      .insert([settings])
      .select()
      .single()

    if (error) throw error
    return data as FocusNfeSettings
  },

  // =====================================
  // LOGS
  // =====================================
  async getLogs(limit = 100) {
    const { data, error } = await supabase
      .from('focus_nfe_sync_logs')
      .select(`
        *,
        companies ( name, cnpj ),
        users ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // =====================================
  // PROXY CALLS (Vercel)
  // =====================================
  
  async testConnection(token?: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TEST_CONNECTION', token })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao testar conexão')
    return data
  },

  async getBackups(companyId: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GET_BACKUPS', companyId })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao consultar backups fiscais')
    return data.data
  },

  async syncCompany(companyId: string, isDryRun = false, certificateFile?: File, certificatePassword?: string) {
    // If we have a file, we need to send as FormData or base64
    let body: any = { action: 'SYNC_COMPANY', companyId, isDryRun }
    
    if (certificateFile) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(certificateFile)
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // remove data:application/x-pkcs12;base64,
        }
        reader.onerror = error => reject(error)
      })
      body.certificateBase64 = base64
      body.certificatePassword = certificatePassword
    }

    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.mensagem || 'Erro ao sincronizar empresa')
    return data
  },

  // =====================================
  // NFE RECEBIDAS (Entrada de XML)
  // =====================================

  async syncNfesRecebidas(cnpj: string, versao?: number, pendente?: boolean) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GET_NFES_RECEBIDAS', cnpj, versao, pendente })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar notas recebidas')
    return data
  },

  async manifestarNfe(chave: string, manifestacao: 'ciencia' | 'confirma' | 'desconhecimento' | 'nao_realizada', justificativa?: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MANIFESTAR_NFE', chave, manifestacao, justificativa })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar manifestação')
    return data
  },

  async baixarXmlRecebido(chave: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'BAIXAR_XML_NFE', chave })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao baixar o XML')
    return data
  },

  // =====================================
  // INUTILIZAÇÃO DE SÉRIE
  // =====================================
  async inutilizarNumeracao(cnpj: string, serie: string, numeroInicial: string, numeroFinal: string, justificativa: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'INUTILIZAR_NFE',
        cnpj: cnpj.replace(/\D/g, ''),
        serie,
        numero_inicial: numeroInicial,
        numero_final: numeroFinal,
        justificativa
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao inutilizar numeração')
    return data
  },

  // =====================================
  // WEBHOOKS
  // =====================================
  async criarWebhook(cnpj: string) {
    const res = await fetch('/api/focus-nfe-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CRIAR_WEBHOOK',
        cnpj: cnpj.replace(/\D/g, '')
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao configurar webhooks')
    return data
  }
}
