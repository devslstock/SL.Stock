import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateAuthToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

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

    const { data: masterSettings } = await adminClient
      .from('asaas_master_settings')
      .select('api_key, environment')
      .limit(1)
      .single();

    const masterApiKey = masterSettings?.api_key;
    const masterEnv = masterSettings?.environment === "producao" ? "producao" : "sandbox";

    if (!masterApiKey) {
      throw new Error("Chave master da Asaas não configurada. Configure em /saas/asaas antes de criar subcontas.");
    }

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) throw new Error("Unauthorized");

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('is_super_admin')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");
    if (!callerProfile.is_super_admin) {
      return new Response(JSON.stringify({ success: false, error: "Apenas administradores master podem provisionar subcontas Asaas" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const body = await req.json();
    const { companyId, mobilePhone, incomeValue, companyType, address, addressNumber, province, postalCode } = body;

    if (!companyId || !mobilePhone || !incomeValue || !companyType) {
      throw new Error("companyId, mobilePhone, incomeValue e companyType são obrigatórios");
    }

    const validCompanyTypes = ["MEI", "LIMITED", "INDIVIDUAL", "ASSOCIATION"];
    if (!validCompanyTypes.includes(companyType)) {
      throw new Error("companyType inválido — use MEI, LIMITED, INDIVIDUAL ou ASSOCIATION");
    }

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id, name, fantasy_name, cnpj, email, garage_cep, garage_street, garage_number, garage_neighborhood, asaas_subaccount_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) throw new Error("Empresa não encontrada");
    if (company.asaas_subaccount_id) {
      throw new Error("Esta empresa já tem uma subconta Asaas criada — não é possível criar outra. Se precisar alterar dados, faça isso direto no painel da Asaas.");
    }
    if (!company.cnpj) throw new Error("Empresa sem CNPJ cadastrado — obrigatório para criar subconta Asaas");
    if (!company.email) throw new Error("Empresa sem e-mail cadastrado — obrigatório para criar subconta Asaas");

    const baseUrl = masterEnv === 'producao'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;
    const authToken = generateAuthToken();

    const payload = {
      name: company.fantasy_name || company.name,
      email: company.email,
      cpfCnpj: company.cnpj.replace(/\D/g, ''),
      companyType,
      mobilePhone,
      incomeValue: Number(incomeValue),
      address: address || company.garage_street || undefined,
      addressNumber: addressNumber || company.garage_number || undefined,
      province: province || company.garage_neighborhood || undefined,
      postalCode: (postalCode || company.garage_cep || '').replace(/\D/g, '') || undefined,
      webhooks: [{
        name: "SL Stock",
        url: webhookUrl,
        email: company.email,
        enabled: true,
        interrupted: false,
        apiVersion: 3,
        authToken,
        sendType: "SEQUENTIALLY",
        events: ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"],
      }],
    };

    const asaasRes = await fetch(`${baseUrl}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": masterApiKey,
      },
      body: JSON.stringify(payload),
    });
    const asaasData = await asaasRes.json();

    if (!asaasRes.ok) {
      const msg = asaasData.errors?.[0]?.description || "Erro ao criar subconta na Asaas";
      await adminClient.from('companies').update({
        asaas_subaccount_status: 'erro',
        asaas_subaccount_last_error: msg,
      }).eq('id', companyId);

      return new Response(JSON.stringify({ success: false, error: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    await adminClient.from('companies').update({
      asaas_api_key: asaasData.apiKey,
      asaas_env: masterEnv,
      asaas_webhook_token: authToken,
      asaas_subaccount_id: asaasData.id,
      asaas_wallet_id: asaasData.walletId,
      asaas_subaccount_status: 'pendente_avaliacao',
      asaas_subaccount_last_error: null,
      asaas_subaccount_created_at: new Date().toISOString(),
    }).eq('id', companyId);

    // Garante que a subconta apareça como forma de cobrança selecionável em Gestão de Pedidos
    const { data: existingMethod } = await adminClient
      .from('receipt_methods')
      .select('id')
      .eq('company_id', companyId)
      .eq('gateway_provider', 'asaas')
      .maybeSingle();

    if (existingMethod) {
      await adminClient.from('receipt_methods').update({
        status: 'Ativo',
      }).eq('id', existingMethod.id);
    } else {
      await adminClient.from('receipt_methods').insert({
        company_id: companyId,
        name: 'Asaas',
        payment_method: 'Boleto (com registro)',
        is_receivable: true,
        is_payable: false,
        financial_institution: 'Asaas',
        status: 'Ativo',
        gateway_provider: 'asaas',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      subaccountId: asaasData.id,
      walletId: asaasData.walletId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
