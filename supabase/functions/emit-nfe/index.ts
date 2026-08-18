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
        )
      `)
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) throw new Error("Sales Order not found");

    // Get Company info for Focus NFe token using the order's company_id
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id, focusnfe_token, focusnfe_env, tax_regime, cnpj, name, garage_address, garage_number, garage_neighborhood, garage_city, garage_state, garage_cep')
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

    const nfePayload = {
      referencia: referenceId,
      natureza_operacao: "VENDA DE MERCADORIA",
      data_emissao: new Date().toISOString(),
      tipo_documento: 1,
      local_destino: 1,
      finalidade_emissao: 1,
      consumidor_final: 1,
      presenca_comprador: 1,
      modalidade_frete: 9,
      valor_frete: 0,
      valor_seguro: 0,
      valor_total: order.total_amount,
      valor_produtos: order.net_amount,
      cnpj_emitente: company.cnpj?.replace(/\D/g, ''),
      nome_emitente: company.name,
      logradouro_emitente: company.garage_address,
      numero_emitente: company.garage_number,
      bairro_emitente: company.garage_neighborhood,
      municipio_emitente: company.garage_city,
      uf_emitente: company.garage_state,
      cep_emitente: company.garage_cep?.replace(/\D/g, ''),
      inscricao_estadual_emitente: company.state_registration || "ISENTO",
      nome_destinatario: order.customer.legal_name || order.customer.fantasy_name || order.customer.nickname,
      cpf_destinatario: order.customer.document?.replace(/\D/g, '').length === 11 ? order.customer.document.replace(/\D/g, '') : undefined,
      cnpj_destinatario: order.customer.document?.replace(/\D/g, '').length > 11 ? order.customer.document.replace(/\D/g, '') : undefined,
      inscricao_estadual_destinatario: "ISENTO",
      logradouro_destinatario: order.customer.address,
      numero_destinatario: order.customer.number,
      bairro_destinatario: order.customer.neighborhood,
      municipio_destinatario: order.customer.city,
      uf_destinatario: order.customer.state,
      cep_destinatario: order.customer.cep?.replace(/\D/g, ''),
      informacoes_adicionais_contribuinte: fiscalOp.default_message || "",
      items: order.items.map((item: any, index: number) => {
        let itemCfop = cfop; // Padrao do cabecalho
        
        // CFOP priority: Item Override > Product > Header
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

        const rawOrigin = item.origin || item.product.origin || "0";
        const cleanOrigin = String(rawOrigin).replace(/\D/g, '').charAt(0) || "0";

        const itemPayload: any = {
          numero_item: index + 1,
          codigo_produto: item.product.code,
          descricao: item.product.description,
          cfop: itemCfop,
          unidade_comercial: item.product.unit_measure || "UN",
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: item.unit_price,
          valor_bruto: item.total_price,
          codigo_ncm: item.ncm || item.product.ncm || "00000000",
          icms_origem: cleanOrigin,
        };

        if (isSimplesNacional) {
          const itemCsosn = item.csosn || item.product.csosn || fiscalOp.csosn || "102";
          itemPayload.icms_situacao_tributaria = itemCsosn;
          
          if (itemCsosn === "101") {
            const icmsRate = item.icms_rate !== undefined && item.icms_rate !== null ? item.icms_rate : (item.product.icms_rate || 0);
            if (icmsRate > 0) {
              itemPayload.icms_percentual_credito = icmsRate;
              itemPayload.icms_valor_credito = parseFloat(((item.total_price * icmsRate) / 100).toFixed(2));
            }
          }
        } else {
          itemPayload.icms_situacao_tributaria = item.cst || item.product.cst || fiscalOp.cst || "00";
        }

        const pisCst = item.pis_cst || item.product.pis_cst || "01";
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
          itemPayload.ipi_situacao_tributaria = "50"; // Simplified default
          itemPayload.ipi_aliquota_porcentual = ipiRate;
        }

        return itemPayload;
      })
    };

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';

    // 1. Gravar registro preliminar no BD
    const { data: record, error: recordError } = await adminClient
      .from('nfe_records')
      .insert({
        company_id: order.company_id,
        sales_order_id: salesOrderId,
        focus_reference: referenceId,
        status: 'processando'
      })
      .select()
      .single();

    if (recordError) throw new Error("Erro ao criar registro NFe: " + recordError.message);

    // 2. Chamar Focus NFe
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
        status: 'erro',
        error_message: JSON.stringify(focusData)
      }).eq('id', record.id);

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
