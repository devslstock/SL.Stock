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
      .eq('status', 'Faturado') // Somente pedidos faturados estão aptos
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
    // 1. Validar se o pedido existe e tem itens (Mocking a validação)
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('*, customer:customer_id(*), items:sales_order_items(*)')
      .eq('id', salesOrderId)
      .single()
    
    if (orderError || !order) throw new Error('Pedido não encontrado')
    
    const customer = order.customer as any
    if (!customer?.document) {
      throw new Error(`Cliente ${customer?.name || ''} sem CNPJ/CPF cadastrado.`)
    }

    // 2. Incrementar a numeração da empresa de forma atômica
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('last_nfe_number, nfe_series')
      .eq('id', companyId)
      .single()
    
    if (companyError || !company) throw new Error('Erro ao buscar numeração da empresa')

    const nextNumber = (company.last_nfe_number || 0) + 1
    const series = company.nfe_series || 1

    await supabase
      .from('companies')
      .update({ last_nfe_number: nextNumber })
      .eq('id', companyId)

    // 3. Simular delay da SEFAZ
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 4. Criar ou atualizar NfeRecord
    const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('')
    const protocol = Math.floor(100000000000000 + Math.random() * 900000000000000).toString()

    const { data: existingNfe } = await supabase
      .from('nfe_records')
      .select('id')
      .eq('sales_order_id', salesOrderId)
      .maybeSingle()
    
    let nfeData = null

    if (existingNfe) {
      const { data, error } = await supabase
        .from('nfe_records')
        .update({
          status: 'Emitida',
          nfe_number: nextNumber,
          nfe_series: series,
          access_key: accessKey,
          protocol: protocol,
          issued_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', existingNfe.id)
        .select()
        .single()
      if (error) throw error
      nfeData = data
    } else {
      const { data, error } = await supabase
        .from('nfe_records')
        .insert([{
          company_id: companyId,
          sales_order_id: salesOrderId,
          status: 'Emitida',
          focus_reference: `mock_${salesOrderId}`,
          nfe_number: nextNumber,
          nfe_series: series,
          access_key: accessKey,
          protocol: protocol,
          issued_at: new Date().toISOString()
        }])
        .select()
        .single()
      if (error) throw error
      nfeData = data
    }

    return nfeData as NfeRecord
  },

  async cancelarNfe(companyId: string, nfeId: string, justificativa: string) {
    if (justificativa.length < 15) {
      throw new Error('A justificativa deve ter pelo menos 15 caracteres.')
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data, error } = await supabase
      .from('nfe_records')
      .update({
        status: 'Cancelada',
        error_message: `Cancelada: ${justificativa}`
      })
      .eq('id', nfeId)
      .eq('company_id', companyId)
      .select()
      .single()
    
    if (error) throw error
    return data as NfeRecord
  },
  
  async getPdfUrl(nfeId: string) {
    // Retornaria a URL real. No mock, retornamos um dummy.
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
}
