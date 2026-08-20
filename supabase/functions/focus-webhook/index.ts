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
    // A Focus NFe faz POST para este webhook com um JSON body.
    const payload = await req.json();
    
    // Log do webhook payload para auditoria
    console.log("Recebido Webhook FocusNFe:", JSON.stringify(payload));
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Usamos o adminClient pois o webhook vem de fora (Focus NFe) sem auth de usuário
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const ref = payload.ref;
    if (!ref) {
      console.error("Payload não possui REF");
      return new Response("OK", { status: 200 }); // Always return 200 to avoid Focus retries for bad payloads
    }

    // Identificar a empresa dona desta REF (procurando na NFe e MDFe)
    // Procurar em nfe_records
    const { data: nfeRecord } = await adminClient
      .from('nfe_records')
      .select('id, company_id')
      .eq('focus_reference', ref)
      .single();

    const { data: mdfeRecord } = await adminClient
      .from('mdfe_records')
      .select('id, company_id')
      .eq('focus_reference', ref)
      .single();

    const companyId = nfeRecord?.company_id || mdfeRecord?.company_id;

    // Logar no nosso banco focus_webhooks_logs
    await adminClient.from('focus_webhooks_logs').insert({
      company_id: companyId || null,
      focus_reference: ref,
      event_type: payload.status || 'unknown',
      payload: payload,
      processed: true
    });

    if (nfeRecord) {
      // Atualizar NFe Record
      const updateData: any = {
        status: payload.status,
        updated_at: new Date().toISOString()
      };
      
      if (payload.status === 'autorizado') {
        updateData.chave_acesso = payload.chave_nfe;
        updateData.numero = payload.numero;
        updateData.serie = payload.serie;
        updateData.xml_url = payload.caminho_xml_nota_fiscal;
        updateData.pdf_url = payload.caminho_danfe;
      } else if (payload.status === 'erro_autorizacao' || payload.status === 'cancelado') {
        updateData.error_message = JSON.stringify(payload.erros || payload);
      }
      
      await adminClient.from('nfe_records').update(updateData).eq('id', nfeRecord.id);
      
    } else if (mdfeRecord) {
      // Atualizar MDFe Record
      const updateData: any = {
        status: payload.status,
        updated_at: new Date().toISOString()
      };
      
      if (payload.status === 'autorizado') {
        updateData.chave_acesso = payload.chave_mdfe || payload.chave_nfe;
        updateData.numero = payload.numero;
        updateData.serie = payload.serie;
        updateData.xml_url = payload.caminho_xml;
        updateData.pdf_url = payload.caminho_pdf;
      } else if (payload.status === 'erro_autorizacao' || payload.status === 'cancelado') {
        updateData.error_message = JSON.stringify(payload.erros || payload);
      }
      
      await adminClient.from('mdfe_records').update(updateData).eq('id', mdfeRecord.id);
    } else {
      console.warn(`REF ${ref} não encontrada em nossos registros de NFe ou MDFe.`);
    }

    // A Focus NFe exige um retorno 200 OK para considerar o webhook entregue com sucesso.
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("Erro no processamento do webhook:", error.message);
    // Mesmo em erro de parse, retorna 200 para a Sefaz/Focus não ficar fazendo retry infinito desnecessário
    return new Response("OK", { status: 200 });
  }
});
