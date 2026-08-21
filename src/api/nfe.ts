import { supabase } from '@/lib/supabase'
import type { NfeRecord, SalesOrder, Company } from '@/types/database'

export interface NfeFiltros {
  periodo_inicio?: string
  periodo_fim?: string
  numero_pedido?: string
  cliente?: string
  status_nf?: string
  status_pedido?: string
  nfe_series?: string
}

export const nfeApi = {
  // Retorna a listagem cruzando sales_orders (status = 'Faturado') com nfe_records
  async getNfes(companyId: string, filtros?: NfeFiltros) {
    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customer_id(*),
        items:sales_order_items(*, product:product_id(*)),
        nfe:nfe_records(*)
      `)
      .eq('company_id', companyId)
      .in('status', ['Aprovado', 'Faturado']) // Pedidos Aprovados e Faturados estão aptos para listar na fiscal
      .order('created_at', { ascending: false })

    if (filtros?.numero_pedido) {
      query = query.ilike('id', `%${filtros.numero_pedido}%`) // Na prática seria outro número, assumindo o UUID ou short id
    }

    if (filtros?.periodo_inicio) {
      query = query.gte('created_at', filtros.periodo_inicio)
    }

    if (filtros?.periodo_fim) {
      query = query.lte('created_at', filtros.periodo_fim)
    }

    const { data: pedidos, error } = await query
    if (error) throw error

    let result = pedidos || []

    // Filtros de cliente
    if (filtros?.cliente) {
      const term = filtros.cliente.toLowerCase()
      result = result.filter(p => {
        const cust = p.customer as any
        return cust && (
          (cust.name && cust.name.toLowerCase().includes(term)) || 
          (cust.fantasy_name && cust.fantasy_name.toLowerCase().includes(term)) ||
          (cust.document && cust.document.includes(term))
        )
      })
    }

    // Filtro por status de nota
    if (filtros?.status_nf) {
      result = result.filter(p => {
        const nfeList = p.nfe as NfeRecord[]
        const statusNfe = (nfeList && nfeList.length > 0) ? nfeList[0].status : 'Aguardando emissão'
        return statusNfe === filtros.status_nf
      })
    }
    
    // Filtro por série
    if (filtros?.nfe_series) {
      result = result.filter(p => {
        const nfeList = p.nfe as NfeRecord[]
        if (!nfeList || nfeList.length === 0) return false
        return nfeList[0].nfe_series?.toString() === filtros.nfe_series
      })
    }

    return result as (SalesOrder & { nfe: NfeRecord[] })[]
  },

  async emitirNfe(companyId: string, salesOrderId: string) {
    // A validação pesada agora fica na Edge Function emit-nfe

    const { data, error } = await supabase.functions.invoke('emit-nfe', {
      body: { salesOrderId }
    })

    if (error) {
      throw new Error(`Erro na conexão com o servidor fiscal: ${error.message}`)
    }

    if (!data.success) {
      const detailsMsg = data.details ? ` - Detalhes: ${JSON.stringify(data.details)}` : '';
      throw new Error((data.error || 'Erro desconhecido ao tentar emitir NF-e') + detailsMsg);
    }

    // A Edge Function insere um nfe_record inicial com status 'processando'
    // Retornamos um mock minimal ou buscamos o registro gerado
    const { data: nfeData, error: nfeError } = await supabase
      .from('nfe_records')
      .select('*')
      .eq('id', data.nfeId)
      .single()
      
    if (nfeError) throw new Error('Nota enviada, mas erro ao recuperar registro local.')
    
    return nfeData as NfeRecord
  },

  async cancelarNfe(companyId: string, nfeId: string, justificativa: string) {
    if (justificativa.length < 15) {
      throw new Error('A justificativa deve ter pelo menos 15 caracteres.')
    }

    const { data, error } = await supabase.functions.invoke('cancel-doc', {
      body: { docType: 'nfe', recordId: nfeId, justificativa }
    })

    if (error) throw new Error(`Erro de conexão ao cancelar NF-e: ${error.message}`)
    if (!data.success) throw new Error(data.error || 'Erro ao cancelar NF-e na Sefaz')

    const { data: nfeData, error: nfeError } = await supabase
      .from('nfe_records')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError) throw nfeError
    return nfeData as NfeRecord
  },
  
  async consultarNfe(companyId: string, nfeId: string) {
    const { data, error } = await supabase.functions.invoke('consult-doc', {
      body: { docType: 'nfe', recordId: nfeId }
    })

    if (error) throw new Error(`Erro de conexão: ${error.message}`)
    if (!data.success) throw new Error(data.error || 'Erro ao consultar status da NF-e')

    const { data: nfeData, error: nfeError } = await supabase
      .from('nfe_records')
      .select('*')
      .eq('id', nfeId)
      .single()

    if (nfeError) throw nfeError
    return nfeData as NfeRecord
  },

  async emitirCce(companyId: string, nfeId: string, correcao: string) {
    if (correcao.length < 15 || correcao.length > 1000) {
      throw new Error('A correção deve ter entre 15 e 1000 caracteres.')
    }

    const { data, error } = await supabase.functions.invoke('cce-nfe', {
      body: { recordId: nfeId, correcao }
    })

    if (error) throw new Error(`Erro de conexão ao emitir CCe: ${error.message}`)
    if (!data.success) throw new Error(data.error || 'Erro ao emitir CCe na Sefaz')

    return data.data
  },

  async getPdfUrl(nfeId: string) {
    const { data: nfe } = await supabase.from('nfe_records').select('pdf_url').eq('id', nfeId).single()
    return nfe?.pdf_url || null
  },

  async downloadNfe(nfeId: string, type: 'pdf' | 'xml') {
    const { data, error } = await supabase.functions.invoke('download-nfe', {
      body: { docId: nfeId, type }
    });

    if (error) {
      throw new Error(`Erro ao buscar documento: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido ao baixar documento');
    }

    // Convert base64 to Blob
    const byteCharacters = atob(data.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: data.contentType });
    
    // For XML viewing we might need the text
    let text = '';
    if (type === 'xml') {
      text = await blob.text();
    }
    
    return {
      url: URL.createObjectURL(blob),
      text,
      blob
    };
  }
}
