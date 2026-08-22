import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmitResult {
  accountId: string;
  success: boolean;
  bankSlipUrl?: string;
  error?: string;
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

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) throw new Error("Unauthorized");

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('company_id')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");

    const { accountIds } = await req.json();
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      throw new Error("accountIds is required and must be a non-empty array");
    }

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id, asaas_api_key, asaas_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.asaas_api_key) {
      return new Response(JSON.stringify({
        success: false,
        error: "Empresa não configurou a integração Asaas"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const baseUrl = company.asaas_env === 'producao'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    const asaasHeaders = {
      "Content-Type": "application/json",
      "access_token": company.asaas_api_key,
    };

    const { data: accounts, error: accountsError } = await adminClient
      .from('accounts_receivable')
      .select('*, customer:customers(*), sales_order:sales_orders(order_number)')
      .in('id', accountIds)
      .eq('company_id', callerProfile.company_id);

    if (accountsError || !accounts) throw new Error("Erro ao buscar as contas a receber");

    const results: EmitResult[] = [];
    const asaasCustomerCache = new Map<string, string>();

    for (const account of accounts) {
      try {
        if (account.status === 'pago' || account.status === 'cancelado') {
          results.push({ accountId: account.id, success: false, error: `Parcela já está com status '${account.status}'` });
          continue;
        }

        const customer = account.customer;
        if (!customer) {
          results.push({ accountId: account.id, success: false, error: "Cliente não encontrado" });
          continue;
        }
        if (!customer.document || !customer.document_type) {
          results.push({ accountId: account.id, success: false, error: "Cliente sem CPF/CNPJ cadastrado" });
          continue;
        }

        // 1. Garantir cliente na Asaas (cache em memória por customer_id dentro do loop)
        let asaasCustomerId = customer.asaas_customer_id || asaasCustomerCache.get(customer.id);

        if (!asaasCustomerId) {
          const cpfCnpj = customer.document.replace(/\D/g, '');

          const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, {
            method: "GET",
            headers: asaasHeaders,
          });
          const searchData = await searchRes.json();

          if (searchRes.ok && searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
          } else {
            const createRes = await fetch(`${baseUrl}/customers`, {
              method: "POST",
              headers: asaasHeaders,
              body: JSON.stringify({
                name: customer.legal_name || customer.fantasy_name || customer.nickname,
                cpfCnpj,
                email: customer.email || undefined,
                phone: customer.phone1 || undefined,
                postalCode: customer.cep?.replace(/\D/g, '') || undefined,
                address: customer.address || undefined,
                addressNumber: customer.number || undefined,
                complement: customer.complement || undefined,
                province: customer.neighborhood || undefined,
                externalReference: customer.id,
              }),
            });
            const createData = await createRes.json();
            if (!createRes.ok) {
              const msg = createData.errors?.[0]?.description || "Erro ao criar cliente na Asaas";
              results.push({ accountId: account.id, success: false, error: msg });
              continue;
            }
            asaasCustomerId = createData.id;
          }

          asaasCustomerCache.set(customer.id, asaasCustomerId!);
          await adminClient.from('customers').update({ asaas_customer_id: asaasCustomerId }).eq('id', customer.id);
        }

        // 2. Criar a cobrança (boleto)
        const orderNumber = account.sales_order?.order_number || account.sales_order_id;
        const paymentRes = await fetch(`${baseUrl}/payments`, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify({
            customer: asaasCustomerId,
            billingType: "BOLETO",
            value: account.amount,
            dueDate: account.due_date,
            externalReference: account.id,
            description: `Pedido ${orderNumber} - Parcela ${account.installment_number}`,
          }),
        });
        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
          const msg = paymentData.errors?.[0]?.description || "Erro ao criar cobrança na Asaas";
          results.push({ accountId: account.id, success: false, error: msg });
          continue;
        }

        // 3. Buscar linha digitável / código de barras
        // TODO: validar este endpoint contra a documentação oficial da Asaas quando a sandbox key estiver disponível
        let digitableLine: string | undefined;
        let barCode: string | undefined;
        try {
          const idFieldRes = await fetch(`${baseUrl}/payments/${paymentData.id}/identificationField`, {
            method: "GET",
            headers: asaasHeaders,
          });
          if (idFieldRes.ok) {
            const idFieldData = await idFieldRes.json();
            digitableLine = idFieldData.identificationField;
            barCode = idFieldData.barCode;
          }
        } catch {
          // Não bloqueia a emissão se a linha digitável falhar - o link do boleto já foi obtido
        }

        await adminClient.from('accounts_receivable').update({
          status: 'boleto_emitido',
          asaas_payment_id: paymentData.id,
          bank_slip_url: paymentData.bankSlipUrl,
          bank_slip_digitable_line: digitableLine,
          bank_slip_barcode: barCode,
          gateway_provider: 'asaas',
          updated_at: new Date().toISOString(),
        }).eq('id', account.id);

        results.push({ accountId: account.id, success: true, bankSlipUrl: paymentData.bankSlipUrl });
      } catch (itemError) {
        results.push({
          accountId: account.id,
          success: false,
          error: itemError instanceof Error ? itemError.message : "Erro desconhecido ao emitir boleto",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
