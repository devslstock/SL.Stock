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

    const { recordId, correcao } = await req.json();
    if (!recordId || !correcao) {
      throw new Error("recordId and correcao are required");
    }

    if (correcao.length < 15) {
      throw new Error("A carta de correção deve ter no mínimo 15 caracteres");
    }
    if (correcao.length > 1000) {
      throw new Error("A carta de correção deve ter no máximo 1000 caracteres");
    }

    // Get Company info for Focus NFe token
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2'
      : 'https://homologacao.focusnfe.com.br/v2';

    const { data: nfe, error: nfeError } = await adminClient
      .from('nfe_records')
      .select('focus_reference')
      .eq('id', recordId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (nfeError || !nfe) throw new Error("Registro de NF-e não encontrado");

    const docRef = nfe.focus_reference;
    const endpoint = `/nfe/${docRef}/carta_correcao`;

    const focusRes = await fetch(baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ correcao })
    });

    const data = await focusRes.json();

    if (!focusRes.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro na Focus NFe ao emitir Carta de Correção",
        details: data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Registrar o sucesso na auditoria (ou numa tabela cce_logs no futuro)
    await adminClient.from('focus_webhooks_logs').insert([{
      event_type: 'cce_emitida',
      focus_reference: docRef,
      payload: data
    }]);

    return new Response(JSON.stringify({ 
      success: true, 
      data 
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
