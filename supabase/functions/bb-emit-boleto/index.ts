// Baseado na spec OpenAPI pública da API de Cobrança do Banco do Brasil (v2), reconstruída a partir
// de SDKs de terceiros gerados via Swagger Codegen — o portal oficial (developers.bb.com.br) não é
// acessível para leitura automatizada. Validar contra uma chamada sandbox real antes de habilitar em
// produção para qualquer cliente: nomes de campos de payload, header do app key e URL de OAuth podem
// precisar de ajuste fino.
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

    const { data: accounts, error: accountsError } = await adminClient
      .from('accounts_receivable')
      .select('*, customer:customers(*), sales_order:sales_orders(order_number), receipt_method:receipt_methods(*)')
      .in('id', accountIds)
      .eq('company_id', callerProfile.company_id);

    if (accountsError || !accounts) throw new Error("Erro ao buscar as contas a receber");

    const results: EmitResult[] = [];
    const tokenCache = new Map<string, string>();

    for (const account of accounts) {
      try {
        if (account.status === 'pago' || account.status === 'cancelado') {
          results.push({ accountId: account.id, success: false, error: `Parcela já está com status '${account.status}'` });
          continue;
        }

        const rm = account.receipt_method;
        if (!rm) {
          results.push({ accountId: account.id, success: false, error: "Parcela sem forma de cobrança vinculada" });
          continue;
        }
        if (!rm.bb_client_id || !rm.bb_client_secret || !rm.bb_app_key) {
          results.push({ accountId: account.id, success: false, error: "Forma de cobrança sem credenciais do Banco do Brasil configuradas" });
          continue;
        }
        if (!rm.agreement_code || !rm.portfolio || !rm.agency || !rm.account_number) {
          results.push({ accountId: account.id, success: false, error: "Forma de cobrança sem convênio/carteira/agência/conta preenchidos" });
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

        const isProducao = rm.remittance_environment === 'Produção';
        const oauthUrl = isProducao
          ? 'https://oauth.bb.com.br/oauth/token'
          : 'https://oauth.hm.bb.com.br/oauth/token';
        const apiBaseUrl = isProducao
          ? 'https://api.bb.com.br/cobrancas/v2'
          : 'https://api.hm.bb.com.br/cobrancas/v2';

        let accessToken = tokenCache.get(rm.id);
        if (!accessToken) {
          const basicAuth = btoa(`${rm.bb_client_id}:${rm.bb_client_secret}`);
          const tokenRes = await fetch(oauthUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${basicAuth}`,
            },
            body: "grant_type=client_credentials&scope=cobrancas.boletos-requisicao%20cobrancas.boletos-info",
          });
          const tokenData = await tokenRes.json();
          if (!tokenRes.ok || !tokenData.access_token) {
            results.push({ accountId: account.id, success: false, error: tokenData.error_description || "Erro ao autenticar com o Banco do Brasil" });
            continue;
          }
          accessToken = tokenData.access_token;
          tokenCache.set(rm.id, accessToken!);
        }

        const orderNumber = account.sales_order?.order_number || account.sales_order_id;
        const tipoInscricao = customer.document_type === 'CNPJ' ? 2 : 1;

        const payload = {
          numeroConvenio: Number(rm.agreement_code),
          numeroCarteira: Number(rm.portfolio),
          numeroVariacaoCarteira: 19,
          codigoModalidade: 1,
          dataEmissao: new Date().toLocaleDateString('pt-BR'),
          dataVencimento: new Date(account.due_date).toLocaleDateString('pt-BR'),
          valorOriginal: Number(account.amount),
          quantidadeDiasProtesto: rm.protest_days || 0,
          indicadorAceiteTituloVencido: "N",
          numeroDiasLimiteRecebimento: 0,
          codigoAceite: "A",
          codigoTipoTitulo: 2,
          descricaoTipoTitulo: "DM",
          indicadorPermissaoRecebimentoParcial: "N",
          numeroTituloBeneficiario: account.id.replace(/-/g, '').slice(0, 15),
          campoUtilizacaoBeneficiario: `Pedido ${orderNumber} - Parcela ${account.installment_number}`,
          numeroTituloCliente: account.id.replace(/-/g, '').slice(0, 20),
          mensagemBloquetoOcorrencia: `Pedido ${orderNumber} - Parcela ${account.installment_number}`,
          desconto: { tipo: 0, dataExpiracao: "", valor: 0 },
          segundoDesconto: { data: "", valor: 0 },
          terceiroDesconto: { data: "", valor: 0 },
          jurosMora: { tipo: rm.interest_type === '% ao dia' ? 1 : 2, data: "", valor: 0, taxa: rm.interest_after_due || 0 },
          multa: { tipo: rm.fine_type === 'R$' ? 1 : 2, data: "", valor: rm.fine_type === 'R$' ? (rm.fine_after_due || 0) : 0, taxa: rm.fine_type === '%' ? (rm.fine_after_due || 0) : 0 },
          pagador: {
            tipoInscricao,
            numeroInscricao: Number(customer.document.replace(/\D/g, '')),
            nome: customer.legal_name || customer.fantasy_name || customer.nickname,
            endereco: customer.address || "",
            cep: Number((customer.cep || '0').replace(/\D/g, '')) || 0,
            cidade: customer.city || "",
            bairro: customer.neighborhood || "",
            uf: customer.state || "",
            telefone: customer.phone1 || "",
          },
        };

        const boletoRes = await fetch(`${apiBaseUrl}/boletos?gw-dev-app-key=${rm.bb_app_key}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "gw-dev-app-key": rm.bb_app_key,
          },
          body: JSON.stringify(payload),
        });
        const boletoData = await boletoRes.json();

        if (!boletoRes.ok) {
          const msg = boletoData.erros?.[0]?.mensagem || boletoData.mensagem || boletoData.message || "Erro ao registrar boleto no Banco do Brasil";
          results.push({ accountId: account.id, success: false, error: msg });
          continue;
        }

        await adminClient.from('accounts_receivable').update({
          status: 'boleto_emitido',
          bank_slip_url: boletoData.url || boletoData.linkBoleto || undefined,
          bank_slip_digitable_line: boletoData.linhaDigitavel,
          bank_slip_barcode: boletoData.codigoBarraNumerico,
          gateway_provider: 'banco_do_brasil',
          updated_at: new Date().toISOString(),
        }).eq('id', account.id);

        results.push({ accountId: account.id, success: true, bankSlipUrl: boletoData.url || boletoData.linkBoleto });
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
