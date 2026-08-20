import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) throw new Error("Unauthorized");

    // Verificar no banco o perfil do chamador
    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('company_id')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");

    const { salesOrderId, fiscalOperationId } = await req.json();
    if (!salesOrderId) throw new Error("salesOrderId is required");

    // Get Sales Order info FIRST so we know which company it belongs to
    const { data: order, error: orderError } = await adminClient
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        items:sales_order_items(
          *,
          product:products(*)
        ),
        carrier:carriers(*)
      `)
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) throw new Error("Sales Order not found");

    // Get Company info for Focus NFe token using the order's company_id
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id, focusnfe_token, focusnfe_env, tax_regime, cnpj, name, garage_address, garage_number, garage_neighborhood, garage_city, garage_state, garage_cep, state_registration, ibge_code')
      .eq('id', order.company_id)
      .single();

    if (companyError || !company) {
      console.error("Company fetch error:", companyError);
      throw new Error("Company not found: " + (companyError?.message || 'Missing data'));
    }
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");
    // Get Fiscal Operation
    let fiscalOpQuery = adminClient.from('fiscal_operations').select('*');
    
    if (fiscalOperationId) {
      fiscalOpQuery = fiscalOpQuery.eq('id', fiscalOperationId);
    } else {
      const opCodeOrName = order.operacao_fiscal || 'Venda de mercadoria';
      fiscalOpQuery = fiscalOpQuery.or(`code.eq.${opCodeOrName},name.ilike.${opCodeOrName}`).eq('company_id', order.company_id);
    }

    const { data: fiscalOpData, error: fiscalOpError } = await fiscalOpQuery.limit(1);
    
    if (fiscalOpError || !fiscalOpData || fiscalOpData.length === 0) {
      throw new Error("Fiscal operation not found for name: " + (order.operacao_fiscal || 'Venda de mercadoria'));
    }
    
    const fiscalOp = fiscalOpData[0];

    const isInterState = company.garage_state !== order.customer.state;
    const cfop = isInterState ? fiscalOp.cfop_inter : fiscalOp.cfop_intra;
    const isSimplesNacional = company.tax_regime === 'simples_nacional' || !company.tax_regime;
    const referenceId = crypto.randomUUID();

    // Construção do Payload (Fiscal Engine)
    const nfePayload = {
      referencia: referenceId,
      natureza_operacao: fiscalOp.nature_of_operation || fiscalOp.name || "VENDA DE MERCADORIA",
      data_emissao: new Date().toISOString(),
      tipo_documento: 1,
      local_destino: isInterState ? 2 : 1,
      finalidade_emissao: 1,
      consumidor_final: order.customer.ie_indicator === 9 ? 1 : (fiscalOp.consumer_final ? 1 : 0),
      presenca_comprador: 1,
      modalidade_frete: order.condicao_frete || 9,
      valor_frete: order.frete || 0,
      valor_seguro: order.seguro || 0,
      valor_total: order.total_amount,
      valor_produtos: order.net_amount,
      valor_desconto: order.total_discount || 0,

      cnpj_emitente: company.cnpj?.replace(/\D/g, ''),
      nome_emitente: company.name,
      logradouro_emitente: company.garage_address,
      numero_emitente: company.garage_number,
      bairro_emitente: company.garage_neighborhood,
      municipio_emitente: company.garage_city,
      uf_emitente: company.garage_state,
      cep_emitente: company.garage_cep?.replace(/\D/g, ''),
      codigo_municipio_emitente: company.ibge_code,
      inscricao_estadual_emitente: company.state_registration?.replace(/\D/g, '') || "ISENTO",

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
      codigo_municipio_destinatario: order.customer.ibge_code,
      indicador_inscricao_estadual_destinatario: order.customer.ie_indicator || 9,
      
      informacoes_adicionais_contribuinte: order.obs_contribuinte || fiscalOp.contribuinte_info || "",
      informacoes_adicionais_fisco: order.obs_fisco || fiscalOp.fisco_info || "",

      pagamentos: [{
        forma_pagamento: "99", // 99 - Outros (fallback genérico, precisa ser refinado no front-end para enviar tPag correto)
        valor_pagamento: order.total_amount
      }],

      ...(order.carrier ? {
        transportadora: {
          cnpj: order.carrier.document?.replace(/\D/g, '').length > 11 ? order.carrier.document.replace(/\D/g, '') : undefined,
          cpf: order.carrier.document?.replace(/\D/g, '').length === 11 ? order.carrier.document.replace(/\D/g, '') : undefined,
          nome_razao_social: order.carrier.legal_name,
          inscricao_estadual: order.carrier.ie?.replace(/\D/g, ''),
          endereco_completo: `${order.carrier.address}${order.carrier.number ? ', ' + order.carrier.number : ''}`,
          municipio: order.carrier.city,
          uf: order.carrier.state
        }
      } : {}),

      ...(order.volume_qty ? {
        volumes: [{
          quantidade: order.volume_qty,
          especie: order.volume_species || 'VOLUMES',
          peso_bruto: order.gross_weight,
          peso_liquido: order.net_weight
        }]
      } : {}),

      items: order.items.map((item: any, index: number) => {
        let itemCfop = cfop; 
        
        const baseProductCfop = item.cfop || item.product.cfop;
        if (baseProductCfop) {
          const baseCfop = baseProductCfop.replace(/\D/g, '');
          if (baseCfop.length === 4) {
            const firstDigit = baseCfop.charAt(0);
            const rest = baseCfop.substring(1);
            if (isInterState) {
              if (firstDigit === '5') itemCfop = '6' + rest;
              else if (firstDigit === '1') itemCfop = '2' + rest;
              else itemCfop = baseCfop;
            } else {
              if (firstDigit === '6') itemCfop = '5' + rest;
              else if (firstDigit === '2') itemCfop = '1' + rest;
              else itemCfop = baseCfop;
            }
          } else {
            itemCfop = baseCfop;
          }
        }

        const rawOrigin = String(item.origin || item.product.origin || "0").trim();
        let cleanOrigin = "0";

        if (rawOrigin.match(/^[0-8]/)) {
          cleanOrigin = rawOrigin.charAt(0);
        } else if (rawOrigin.toLowerCase().includes("nacional")) {
          if (rawOrigin.includes("> 40%") || rawOrigin.includes("superior a 40%") && rawOrigin.includes("inferior ou igual a 70%")) cleanOrigin = "3";
          else if (rawOrigin.includes("processos produtivos básicos") || rawOrigin.includes("básicos")) cleanOrigin = "4";
          else if (rawOrigin.includes("<= 40%") || rawOrigin.includes("inferior ou igual a 40%")) cleanOrigin = "5";
          else if (rawOrigin.includes("> 70%") || rawOrigin.includes("superior a 70%")) cleanOrigin = "8";
          else cleanOrigin = "0";
        } else if (rawOrigin.toLowerCase().includes("estrangeira")) {
          if (rawOrigin.includes("adquirida no mercado interno")) {
            if (rawOrigin.includes("sem similar nacional") || rawOrigin.includes("camex")) cleanOrigin = "7";
            else cleanOrigin = "2";
          } else {
            if (rawOrigin.includes("sem similar nacional") || rawOrigin.includes("camex")) cleanOrigin = "6";
            else cleanOrigin = "1";
          }
        } else {
          cleanOrigin = rawOrigin.replace(/\D/g, '').charAt(0) || "0";
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
        };

        if (isSimplesNacional) {
          let itemCsosn = item.csosn || item.product.csosn || fiscalOp.document_situation || "102";
          itemCsosn = String(itemCsosn).split(" - ")[0].replace(/\D/g, "") || "102";
          itemPayload.icms_situacao_tributaria = itemCsosn;
          
          if (itemCsosn === "101") {
            const icmsRate = item.icms_rate !== undefined && item.icms_rate !== null ? item.icms_rate : (item.product.icms_rate || 0);
            if (icmsRate > 0) {
              itemPayload.icms_percentual_credito = icmsRate;
              itemPayload.icms_valor_credito = parseFloat(((item.total_price * icmsRate) / 100).toFixed(2));
            }
          }
        } else {
          let finalCst = String(item.cst || item.product.cst || fiscalOp.cst || "00");
          finalCst = finalCst.split(" - ")[0].replace(/\D/g, "") || "00";
          itemPayload.icms_situacao_tributaria = finalCst;
        }

        const pisCst = item.pis_cst || item.product.pis_cst || "01";
        
        // Dados de ICMS ST Retido Anteriormente (CSOSN 500 / CST 60)
        if (item.product) {
          if (item.product.icms_st_base_ret !== null && item.product.icms_st_base_ret !== undefined) itemPayload.icms_base_calculo_st_retido = item.product.icms_st_base_ret;
          if (item.product.icms_st_value_ret !== null && item.product.icms_st_value_ret !== undefined) itemPayload.icms_valor_st_retido = item.product.icms_st_value_ret;
          if (item.product.icms_fcp_st_base_ret !== null && item.product.icms_fcp_st_base_ret !== undefined) itemPayload.icms_base_calculo_fcp_st_retido = item.product.icms_fcp_st_base_ret;
          if (item.product.icms_fcp_st_value_ret !== null && item.product.icms_fcp_st_value_ret !== undefined) itemPayload.icms_valor_fcp_st_retido = item.product.icms_fcp_st_value_ret;
          if (item.product.icms_fcp_st_rate_ret !== null && item.product.icms_fcp_st_rate_ret !== undefined) itemPayload.icms_aliquota_fcp_st_retido = item.product.icms_fcp_st_rate_ret;
          if (item.product.consumer_supported_rate !== null && item.product.consumer_supported_rate !== undefined) itemPayload.icms_aliquota_suportada_consumidor_final = item.product.consumer_supported_rate;
          if (item.product.icms_substitute_value !== null && item.product.icms_substitute_value !== undefined) itemPayload.icms_valor_substituto = item.product.icms_substitute_value;
          if (item.product.icms_percentual_reducao_bc !== null && item.product.icms_percentual_reducao_bc !== undefined) itemPayload.icms_reducao_base_calculo = item.product.icms_percentual_reducao_bc;
          if (item.product.icms_percentual_diferimento !== null && item.product.icms_percentual_diferimento !== undefined) itemPayload.icms_percentual_diferimento = item.product.icms_percentual_diferimento;
        }
        const pisRate = item.pis_rate !== undefined && item.pis_rate !== null ? item.pis_rate : (item.product.pis_rate || fiscalOp.pis_rate || 0);
        
        const cofinsCst = item.cofins_cst || item.product.cofins_cst || "01";
        const cofinsRate = item.cofins_rate !== undefined && item.cofins_rate !== null ? item.cofins_rate : (item.product.cofins_rate || fiscalOp.cofins_rate || 0);
        
        const ipiRate = item.ipi_rate !== undefined && item.ipi_rate !== null ? item.ipi_rate : (item.product.ipi_rate || 0);

        if (pisRate > 0 || pisCst !== "01" || !isSimplesNacional) {
          itemPayload.pis_situacao_tributaria = pisCst;
          if (pisRate > 0) itemPayload.pis_aliquota_porcentual = pisRate;
        }
        
        if (cofinsRate > 0 || cofinsCst !== "01" || !isSimplesNacional) {
          itemPayload.cofins_situacao_tributaria = cofinsCst;
          if (cofinsRate > 0) itemPayload.cofins_aliquota_porcentual = cofinsRate;
        }

        if (ipiRate > 0) {
          itemPayload.ipi_situacao_tributaria = "50"; 
          itemPayload.ipi_aliquota_porcentual = ipiRate;
        }

        return itemPayload;
      })
    };

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';

    // 1. Gravar registro preliminar no BD (Snapshot)
    const { data: record, error: recordError } = await adminClient
      .from('nfe_records')
      .insert({
        company_id: order.company_id,
        sales_order_id: salesOrderId,
        focus_reference: referenceId,
        status: 'ENVIANDO', // Novo padrão em caixa alta
        payload_snapshot: nfePayload, // Salvando snapshot fiscal imutável
        operacao_fiscal: fiscalOp.name
      })
      .select()
      .single();

    if (recordError) throw new Error("Erro ao criar registro NFe: " + recordError.message);

    // 2. Gravar Evento de Emissão
    await adminClient.from('nfe_events').insert({
        company_id: order.company_id,
        nfe_id: record.id,
        event_type: 'EMISSAO',
        status: 'ENVIANDO',
        message: 'Nota fiscal gerada e enviada para processamento da Focus NFe',
        payload: nfePayload,
        created_by: callerUser.id
    });

    // 3. Chamar Focus NFe (Adapter)
    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    const focusRes = await fetch(baseUrl + `?ref=${referenceId}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nfePayload)
    });

    const focusData = await focusRes.json();

    if (!focusRes.ok) {
      // Falha de validação inicial
      await adminClient.from('nfe_records').update({
        status: 'ERRO',
        error_message: JSON.stringify(focusData)
      }).eq('id', record.id);
      
      await adminClient.from('nfe_events').insert({
        company_id: order.company_id,
        nfe_id: record.id,
        event_type: 'REJEICAO_SISTEMA',
        status: 'ERRO',
        message: focusData.mensagem || 'Erro de validação na Focus NFe',
        focus_code: focusData.codigo?.toString(),
        payload: focusData,
        created_by: callerUser.id
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro de validação na Focus NFe",
        details: focusData 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Sucesso, a nota foi enviada para processamento
    await adminClient.from('nfe_records').update({
      status: 'PROCESSANDO'
    }).eq('id', record.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Nota fiscal enviada para processamento",
      nfeId: record.id,
      focusResponse: focusData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
