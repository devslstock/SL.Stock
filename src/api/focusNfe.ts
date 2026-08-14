import { toast } from '@/components/ui/toaster'
import type { Company } from '@/types/database'
import { companiesApi } from './companies'

interface FocusNfeConfig {
  token: string
  env: 'producao' | 'homologacao'
}

function getBaseUrl(env: 'producao' | 'homologacao') {
  return env === 'producao' 
    ? 'https://api.focusnfe.com.br/v2' 
    : 'https://homologacao.focusnfe.com.br/v2'
}

function getHeaders(token: string) {
  // Basic Auth: token is the username, password is empty
  const auth = btoa(`${token}:`)
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  }
}

export const focusNfeApi = {
  /**
   * Emite uma nova NF-e
   */
  async emitirNfe(ref: string, payload: any, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/nfe?ref=${ref}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(config.token),
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Erro na emissão da NF-e:', data)
        throw new Error(data.mensagem || data.codigo || 'Erro desconhecido na API da Focus NFe')
      }
      
      return data
    } catch (error: any) {
      console.error('Erro de requisição:', error)
      throw new Error(error.message || 'Falha ao conectar com a Focus NFe')
    }
  },

  /**
   * Consulta o status de uma NF-e
   */
  async consultarNfe(ref: string, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/nfe/${ref}?completa=1`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(config.token),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'nao_encontrada' }
        }
        throw new Error(data.mensagem || 'Erro ao consultar NF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao consultar NF-e na Focus NFe')
    }
  },

  /**
   * Cancela uma NF-e autorizada
   */
  async cancelarNfe(ref: string, justificativa: string, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/nfe/${ref}`
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(config.token),
        body: JSON.stringify({ justificativa })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao cancelar NF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao cancelar NF-e')
    }
  },

  /**
   * Emite um novo MDF-e
   */
  async emitirMdfe(ref: string, payload: any, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/mdfe?ref=${ref}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(config.token),
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.mensagem || data.codigo || 'Erro desconhecido na emissão do MDF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao emitir MDF-e')
    }
  },

  /**
   * Consulta o status de um MDF-e
   */
  async consultarMdfe(ref: string, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/mdfe/${ref}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(config.token),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'nao_encontrado' }
        }
        throw new Error(data.mensagem || 'Erro ao consultar MDF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao consultar MDF-e')
    }
  },

  /**
   * Cancela um MDF-e autorizado
   */
  async cancelarMdfe(ref: string, justificativa: string, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/mdfe/${ref}`
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(config.token),
        body: JSON.stringify({ justificativa })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao cancelar MDF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao cancelar MDF-e')
    }
  },

  /**
   * Encerra um MDF-e
   */
  async encerrarMdfe(ref: string, uf: string, codigo_municipio: string, config: FocusNfeConfig) {
    const url = `${getBaseUrl(config.env)}/mdfe/${ref}/encerrar`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(config.token),
        body: JSON.stringify({
          uf,
          codigo_municipio,
          data_encerramento: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao encerrar MDF-e')
      }
      
      return data
    } catch (error: any) {
      throw new Error(error.message || 'Falha ao encerrar MDF-e')
    }
  }
}
