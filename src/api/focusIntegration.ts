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
  }
}
