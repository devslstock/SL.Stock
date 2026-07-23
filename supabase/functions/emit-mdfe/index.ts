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

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('company_id')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");

    const { deliveryRouteId } = await req.json();
    if (!deliveryRouteId) throw new Error("deliveryRouteId is required");

    // Get Company info for Focus NFe token
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env, cnpj, name, garage_state, garage_city')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    // Get Delivery Route
    const { data: route, error: routeError } = await adminClient
      .from('delivery_routes')
      .select(`
        *,
        driver:users!delivery_routes_driver_id_fkey(name, cpf),
        operation:operations(vehicle_plate)
      `)
      .eq('id', deliveryRouteId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (routeError || !route) throw new Error("Rota não encontrada");
    if (!route.driver?.cpf) throw new Error("Motorista selecionado não possui CPF cadastrado (Vá em Configurações > Acessos e edite o usuário).");

    // Get Clients / Orders on this route
    const { data: clients, error: clientsError } = await adminClient
      .from('delivery_clients')
      .select('*')
      .eq('delivery_route_id', deliveryRouteId);

    if (clientsError || !clients) throw new Error("Erro ao buscar clientes da rota");

    const orderNumbers = clients.map(c => c.order_number).filter(Boolean).map(n => Number(n));
    if (orderNumbers.length === 0) throw new Error("Nenhum pedido vinculado a esta rota para gerar o MDF-e");

    // Buscando as ordens de venda para achar o ID delas
    const { data: salesOrders, error: salesOrdersError } = await adminClient
      .from('sales_orders')
      .select('id, order_number')
      .in('order_number', orderNumbers)
      .eq('company_id', callerProfile.company_id);
    
    if (salesOrdersError) throw new Error("Erro ao buscar pedidos");

    const salesOrderIds = salesOrders?.map(so => so.id) || [];
    
    // Buscando os NFe Records para ver se tem NFe emitida
    const { data: nfeRecords, error: nfeRecordsError } = await adminClient
      .from('nfe_records')
      .select('*')
      .in('sales_order_id', salesOrderIds)
      .eq('status', 'autorizado');

    if (nfeRecordsError) throw new Error("Erro ao buscar NFes dos pedidos");

    if (!nfeRecords || nfeRecords.length === 0) {
      throw new Error("Nenhum pedido desta rota possui NF-e 'autorizada'. Emita as notas primeiro.");
    }

    // Para o MDF-e, precisamos buscar as CHAVES de ACESSO na FocusNFe
    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    const baseUrlNfe = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';

    const chavesNfe = [];
    for (const record of nfeRecords) {
       // Buscar o status para pegar a chave_nfe
       const res = await fetch(baseUrlNfe + `/${record.focus_reference}`, {
          method: "GET",
          headers: { "Authorization": `Basic ${tokenBase64}` }
       });
       if (res.ok) {
         const data = await res.json();
         if (data.chave_nfe) {
           chavesNfe.push(data.chave_nfe);
         } else if (data.caminho_xml_nota_fiscal) {
           // Fallback extraindo do XML url
           const match = data.caminho_xml_nota_fiscal.match(/(\d{44})\.xml/);
           if (match) chavesNfe.push(match[1]);
         }
       }
    }

    if (chavesNfe.length === 0) {
      throw new Error("Não foi possível recuperar as Chaves de Acesso das NF-es. Tente novamente.");
    }

    // Build MDF-e Payload
    const referenceId = crypto.randomUUID();
    const mdfePayload = {
      cnpj_emitente: company.cnpj?.replace(/\D/g, ''),
      modalidade: "1", // Rodoviario
      tipo_emitente: "2", // Transportador Carga Própria
      tipo_transportador: "1", // ETC
      uf_inicio: company.garage_state || "SP",
      uf_fim: company.garage_state || "SP", // Simplificado para mesma UF por padrão
      data_emissao: new Date().toISOString(),
      municipio_carregamento: company.garage_city || "SAO PAULO",
      uf_carregamento: company.garage_state || "SP",
      veiculo_tracao: {
        placa: (route.operation?.vehicle_plate || "ABC1234").replace(/[^a-zA-Z0-9]/g, ''),
        tara: "1000",
        capacidade_kg: "5000",
        tipo_carroceria: "01",
        tipo_rodado: "01",
        uf: company.garage_state || "SP"
      },
      condutor: [
        {
          nome: route.driver.name,
          cpf: route.driver.cpf?.replace(/\D/g, '')
        }
      ],
      municipios_descarregamento: [
        {
          municipio: company.garage_city || "SAO PAULO",
          nfe: chavesNfe
        }
      ]
    };

    const baseUrlMdfe = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/mdfe'
      : 'https://homologacao.focusnfe.com.br/v2/mdfe';

    // 1. Save preliminary record
    const { data: record, error: recordError } = await adminClient
      .from('mdfe_records')
      .insert({
        company_id: callerProfile.company_id,
        delivery_route_id: deliveryRouteId,
        focus_reference: referenceId,
        status: 'processando'
      })
      .select()
      .single();

    if (recordError) throw new Error("Erro ao criar registro MDF-e: " + recordError.message);

    // 2. Call Focus NFe
    const focusRes = await fetch(baseUrlMdfe + `?ref=${referenceId}`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mdfePayload)
    });

    const focusData = await focusRes.json();

    if (!focusRes.ok) {
      // Failed initial validation
      await adminClient.from('mdfe_records').update({
        status: 'erro',
        error_message: JSON.stringify(focusData)
      }).eq('id', record.id);

      throw new Error(`Erro na emissão do MDF-e: ${JSON.stringify(focusData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "MDF-e enviado para processamento",
      mdfeId: record.id,
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
