import type { SalesOrder, Company, FiscalOperation, Customer } from '@/types/database'

export class FiscalEngine {
  /**
   * Constrói o Payload Agnóstico / Snapshot Fiscal para envio
   */
  static buildNfePayload(params: {
    order: SalesOrder & { customer: Customer; items: any[] }
    company: Company
    fiscalOp: FiscalOperation
    serieNumber?: number
  }): any {
    const { order, company, fiscalOp, serieNumber } = params

    const isInterState = company.garage_state !== order.customer?.state
    const cfopHeader = isInterState ? fiscalOp.cfop_inter : fiscalOp.cfop_intra
    const isSimplesNacional = company.tax_regime === 'simples_nacional' || !company.tax_regime
    
    // Na Focus NFe, enviaremos a referência para atrelar a NF ao nosso ID
    const referenceId = crypto.randomUUID()

    const payload: any = {
      referencia: referenceId,
      natureza_operacao: fiscalOp.nature_of_operation || fiscalOp.name || "VENDA DE MERCADORIA",
      data_emissao: new Date().toISOString(),
      tipo_documento: 1, // 1 = Saída, 0 = Entrada
      local_destino: isInterState ? 2 : 1, // 1 = Interna, 2 = Interestadual
      finalidade_emissao: 1, // 1 = Normal
      consumidor_final: fiscalOp.consumer_final ? 1 : 0,
      presenca_comprador: 1, // Operação presencial
      modalidade_frete: 9, // Sem frete padrão, pode ser aprimorado
      valor_frete: order.frete || 0,
      valor_seguro: order.seguro || 0,
      valor_total: order.total_amount,
      valor_produtos: order.net_amount,
      valor_desconto: order.total_discount || 0,

      // Se informou a série, passa ela. A API Focus usa `serie`
      ...(serieNumber ? { serie: serieNumber.toString() } : {}),

      // Dados do Emitente
      cnpj_emitente: company.cnpj?.replace(/\D/g, ''),
      nome_emitente: company.name,
      logradouro_emitente: company.garage_address,
      numero_emitente: company.garage_number,
      bairro_emitente: company.garage_neighborhood,
      municipio_emitente: company.garage_city,
      uf_emitente: company.garage_state,
      cep_emitente: company.garage_cep?.replace(/\D/g, ''),
      inscricao_estadual_emitente: company.state_registration?.replace(/\D/g, '') || "ISENTO",

      // Dados do Destinatário
      nome_destinatario: order.customer.legal_name || order.customer.fantasy_name || order.customer.nickname,
      cpf_destinatario: order.customer.document?.replace(/\D/g, '').length === 11 ? order.customer.document.replace(/\D/g, '') : undefined,
      cnpj_destinatario: order.customer.document?.replace(/\D/g, '').length > 11 ? order.customer.document.replace(/\D/g, '') : undefined,
      inscricao_estadual_destinatario: order.customer.state_registration?.replace(/\D/g, '') || "ISENTO",
      logradouro_destinatario: order.customer.address,
      numero_destinatario: order.customer.number,
      bairro_destinatario: order.customer.neighborhood,
      municipio_destinatario: order.customer.city,
      uf_destinatario: order.customer.state,
      cep_destinatario: order.customer.cep?.replace(/\D/g, ''),

      informacoes_adicionais_contribuinte: order.obs_contribuinte || fiscalOp.contribuinte_info || "",
      informacoes_adicionais_fisco: order.obs_fisco || fiscalOp.fisco_info || "",

      // Itens
      items: order.items.map((item: any, index: number) => {
        let itemCfop = cfopHeader
        
        // Regra de CFOP do Item (Prioridade: Item > Produto > Cabeçalho)
        const baseProductCfop = item.cfop || item.product.cfop
        if (baseProductCfop) {
          const baseCfop = baseProductCfop.replace(/\D/g, '')
          if (baseCfop.length === 4) {
            const firstDigit = baseCfop.charAt(0)
            const rest = baseCfop.substring(1)
            if (isInterState) {
              if (firstDigit === '5') itemCfop = '6' + rest
              else if (firstDigit === '1') itemCfop = '2' + rest
              else itemCfop = baseCfop
            } else {
              if (firstDigit === '6') itemCfop = '5' + rest
              else if (firstDigit === '2') itemCfop = '1' + rest
              else itemCfop = baseCfop
            }
          } else {
            itemCfop = baseCfop
          }
        }

        // Regra da Origem
        const rawOrigin = String(item.origin || item.product.origin || "0").trim()
        let cleanOrigin = "0"
        if (rawOrigin.match(/^[0-8]/)) {
          cleanOrigin = rawOrigin.charAt(0)
        } else if (rawOrigin.toLowerCase().includes("nacional")) {
          if (rawOrigin.includes("> 40%") || rawOrigin.includes("superior a 40%") && rawOrigin.includes("inferior ou igual a 70%")) cleanOrigin = "3"
          else if (rawOrigin.includes("processos produtivos básicos") || rawOrigin.includes("básicos")) cleanOrigin = "4"
          else if (rawOrigin.includes("<= 40%") || rawOrigin.includes("inferior ou igual a 40%")) cleanOrigin = "5"
          else if (rawOrigin.includes("> 70%") || rawOrigin.includes("superior a 70%")) cleanOrigin = "8"
          else cleanOrigin = "0"
        } else if (rawOrigin.toLowerCase().includes("estrangeira")) {
          if (rawOrigin.includes("adquirida no mercado interno")) {
            if (rawOrigin.includes("sem similar nacional") || rawOrigin.includes("camex")) cleanOrigin = "7"
            else cleanOrigin = "2"
          } else {
            if (rawOrigin.includes("sem similar nacional") || rawOrigin.includes("camex")) cleanOrigin = "6"
            else cleanOrigin = "1"
          }
        } else {
          cleanOrigin = rawOrigin.replace(/\D/g, '').charAt(0) || "0"
        }

        const itemPayload: any = {
          numero_item: index + 1,
          codigo_produto: item.product.code,
          descricao: item.product.description,
          cfop: itemCfop,
          unidade_comercial: item.product.unit_measure || "UN",
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: item.unit_price,
          valor_bruto: item.total_price,
          codigo_ncm: (item.ncm || item.product.ncm || "00000000").replace(/\D/g, ''),
          icms_origem: cleanOrigin,
        }

        // Simples Nacional: CSOSN / Regimes Normais: CST
        if (isSimplesNacional) {
          const itemCsosn = item.csosn || item.product.csosn || fiscalOp.document_situation || "102"
          itemPayload.icms_situacao_tributaria = itemCsosn
          
          if (itemCsosn === "101") {
            const icmsRate = item.icms_rate !== undefined && item.icms_rate !== null ? item.icms_rate : (item.product.icms_rate || 0)
            if (icmsRate > 0) {
              itemPayload.icms_percentual_credito = icmsRate
              itemPayload.icms_valor_credito = parseFloat(((item.total_price * icmsRate) / 100).toFixed(2))
            }
          }
        } else {
          // TODO: Implementar CST para Regime Normal
          const itemCst = item.cst || item.product.cst || "00"
          itemPayload.icms_situacao_tributaria = itemCst
        }

        return itemPayload
      })
    }

    return payload
  }
}
