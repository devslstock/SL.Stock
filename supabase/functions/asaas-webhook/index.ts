import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Recebido Webhook Asaas:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const payment = payload.payment;
    const eventType: string | undefined = payload.event;

    if (!payment) {
      console.error("Payload sem objeto 'payment'");
      return new Response("OK", { status: 200 });
    }

    // Resolve a parcela via externalReference (id da accounts_receivable), com fallback pelo asaas_payment_id
    let account: { id: string; company_id: string } | null = null;

    if (payment.externalReference) {
      const { data } = await adminClient
        .from('accounts_receivable')
        .select('id, company_id')
        .eq('id', payment.externalReference)
        .maybeSingle();
      account = data;
    }

    if (!account && payment.id) {
      const { data } = await adminClient
        .from('accounts_receivable')
        .select('id, company_id')
        .eq('asaas_payment_id', payment.id)
        .maybeSingle();
      account = data;
    }

    if (!account) {
      console.warn(`Parcela não encontrada para payment ${payment.id} / externalReference ${payment.externalReference}`);
      await adminClient.from('asaas_webhooks_logs').insert({
        company_id: null,
        accounts_receivable_id: null,
        asaas_payment_id: payment.id,
        event_type: eventType || 'unknown',
        payload,
        processed: false,
      });
      return new Response("OK", { status: 200 });
    }

    // Valida o token do webhook, específico da empresa dona da parcela
    const { data: company } = await adminClient
      .from('companies')
      .select('asaas_webhook_token')
      .eq('id', account.company_id)
      .single();

    const providedToken = req.headers.get('asaas-access-token');
    if (!company?.asaas_webhook_token || providedToken !== company.asaas_webhook_token) {
      console.error("Token de webhook Asaas inválido ou ausente");
      await adminClient.from('asaas_webhooks_logs').insert({
        company_id: account.company_id,
        accounts_receivable_id: account.id,
        asaas_payment_id: payment.id,
        event_type: eventType || 'unknown',
        payload,
        processed: false,
      });
      return new Response("Unauthorized", { status: 401 });
    }

    const updateData: Record<string, unknown> = {
      asaas_last_webhook_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        updateData.status = 'pago';
        updateData.paid_amount = payment.value;
        updateData.paid_at = payment.paymentDate || payment.clientPaymentDate || new Date().toISOString();
        break;
      case 'PAYMENT_OVERDUE':
        updateData.status = 'vencido';
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        updateData.status = 'cancelado';
        break;
      default:
        // Outros eventos (PAYMENT_CREATED, PAYMENT_UPDATED, etc.) só são logados
        break;
    }

    await adminClient.from('accounts_receivable').update(updateData).eq('id', account.id);

    await adminClient.from('asaas_webhooks_logs').insert({
      company_id: account.company_id,
      accounts_receivable_id: account.id,
      asaas_payment_id: payment.id,
      event_type: eventType || 'unknown',
      payload,
      processed: true,
    });

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Erro no processamento do webhook Asaas:", error instanceof Error ? error.message : error);
    return new Response("OK", { status: 200 });
  }
});
