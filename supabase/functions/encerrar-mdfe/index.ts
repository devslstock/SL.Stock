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

    const { recordId, uf, codigo_municipio } = await req.json();
    if (!recordId || !uf || !codigo_municipio) {
      throw new Error("recordId, uf, and codigo_municipio are required");
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

    const { data: mdfe, error: mdfeError } = await adminClient
      .from('mdfe_records')
      .select('focus_reference')
      .eq('id', recordId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (mdfeError || !mdfe) throw new Error("Registro de MDF-e não encontrado");

    const docRef = mdfe.focus_reference;
    const endpoint = `/mdfe/${docRef}/encerrar`;

    const focusRes = await fetch(baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uf,
        codigo_municipio,
        data_encerramento: new Date().toISOString()
      })
    });

    const data = await focusRes.json();

    if (!focusRes.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro na Focus NFe ao encerrar MDF-e",
        details: data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Se sucesso, atualizar localmente
    await adminClient.from('mdfe_records').update({
      status: 'encerrado',
      updated_at: new Date().toISOString()
    }).eq('id', recordId);

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
