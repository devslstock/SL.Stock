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

    const { salesOrderId } = await req.json();
    if (!salesOrderId) throw new Error("salesOrderId is required");

    // Get Company info for Focus NFe token
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env, cnpj, name, garage_address, garage_number, garage_neighborhood, garage_city, garage_state, garage_cep')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    // Get Sales Order info
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
      .eq('company_id', callerProfile.company_id)
      .single();

    if (orderError || !order) throw new Error("Sales order not found");

    // TODO: This is a simplified NF-e payload. It needs to be adjusted 
    // according to Focus NFe requirements (NCM, CFOP, Taxes, etc.)
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
      valor_frete: 0,
      valor_seguro: 0,
      valor_total: order.total_amount,
      valor_produtos: order.net_amount,
      emitente: {
        cnpj: company.cnpj?.replace(/\D/g, ''),
        nome: company.name,
        logradouro: company.garage_address,
        numero: company.garage_number,
        bairro: company.garage_neighborhood,
        municipio: company.garage_city,
        uf: company.garage_state,
        cep: company.garage_cep?.replace(/\D/g, ''),
        inscricao_estadual: "ISENTO" // Precisa vir da empresa futuramente
      },
      destinatario: {
        nome: order.customer.legal_name || order.customer.fantasy_name || order.customer.nickname,
        cpf_cnpj: order.customer.document?.replace(/\D/g, ''),
        inscricao_estadual: "ISENTO", // Precisa vir do cliente futuramente
        logradouro: order.customer.address,
        numero: order.customer.number,
        bairro: order.customer.neighborhood,
        municipio: order.customer.city,
        uf: order.customer.state,
        cep: order.customer.cep?.replace(/\D/g, '')
      },
      itens: order.items.map((item: any, index: number) => ({
        numero_item: index + 1,
        codigo_produto: item.product.code,
        descricao: item.product.description,
        cfop: "5102", // Precisa ser parametrizado
        unidade_comercial: item.product.unit_measure || "UN",
        quantidade_comercial: item.quantity,
        valor_unitario_comercial: item.unit_price,
        valor_bruto: item.total_price,
        codigo_ncm: "00000000", // Precisa vir do produto futuramente
        icms_situacao_tributaria: "102", // Simples Nacional
        icms_origem: "0"
      }))
    };

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';

    // 1. Gravar registro preliminar no BD
    const { data: record, error: recordError } = await adminClient
      .from('nfe_records')
      .insert({
        company_id: callerProfile.company_id,
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

      throw new Error(`Erro na emissão: ${JSON.stringify(focusData)}`);
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
