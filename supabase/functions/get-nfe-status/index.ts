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

    // url format: /get-nfe-status?id=uuid ou ref=string
    const url = new URL(req.url);
    const nfeId = url.searchParams.get("id");
    const refId = url.searchParams.get("ref");

    if (!nfeId && !refId) throw new Error("nfeId or ref is required");

    let query = adminClient
      .from('nfe_records')
      .select('*')
      .eq('company_id', callerProfile.company_id);
    
    if (nfeId) query = query.eq('id', nfeId);
    if (refId) query = query.eq('focus_reference', refId);

    const { data: nfeRecord, error: recordError } = await query.single();

    if (recordError || !nfeRecord) throw new Error("NFe Record not found");

    // If it's already finished, we can just return what we have (or update if we want fresh data)
    // Always good to poll Focus NFe to get the latest status
    const { data: company } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (!company?.focusnfe_token) throw new Error("Company NFe Token missing");

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    const focusRes = await fetch(baseUrl + `/${nfeRecord.focus_reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${tokenBase64}`
      }
    });

    const focusData = await focusRes.json();

    if (focusRes.ok) {
      const { status, caminho_xml_nota_fiscal, caminho_danfe } = focusData;
      
      // Update DB if status changed
      if (status !== nfeRecord.status) {
        await adminClient.from('nfe_records').update({
          status: status || nfeRecord.status,
          xml_url: caminho_xml_nota_fiscal || nfeRecord.xml_url,
          pdf_url: caminho_danfe || nfeRecord.pdf_url,
          error_message: status === 'erro_autorizacao' ? JSON.stringify(focusData.erros) : null
        }).eq('id', nfeRecord.id);
      }

      return new Response(JSON.stringify(focusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Erro na consulta: ${JSON.stringify(focusData)}`);
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
