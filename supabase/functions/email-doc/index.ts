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

    const body = await req.json();
    const { docType, recordId, emails } = body;

    if (!docType || !recordId || !emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error("Missing docType, recordId, or emails array");
    }

    const { data: company } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (!company?.focusnfe_token) throw new Error("Company NFe Token missing");

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2'
      : 'https://homologacao.focusnfe.com.br/v2';

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);

    let endpoint = "";
    let docRef = "";

    if (docType === "nfe") {
      const { data: nfe, error: nfeError } = await adminClient
        .from('nfe_records')
        .select('focus_reference')
        .eq('id', recordId)
        .eq('company_id', callerProfile.company_id)
        .single();
      if (nfeError || !nfe) throw new Error("Registro de NF-e não encontrado");
      docRef = nfe.focus_reference;
      endpoint = `/nfe/${docRef}/email`;
    } else if (docType === "mdfe") {
      // Endpoint is similar for mdfe usually, but Focus docs specify email API mostly for NFe.
      // If mdfe is needed later, we can add it here.
      throw new Error("Envio de e-mail atualmente suportado apenas para NF-e");
    } else {
      throw new Error("docType deve ser 'nfe'");
    }

    const focusRes = await fetch(baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ emails })
    });

    const data = await focusRes.text();
    let parsedData = {};
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // Ignorar se não for JSON
    }

    if (!focusRes.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro na Focus NFe ao enviar e-mail",
        details: parsedData || data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Retornamos 200 para o frontend tratar
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: parsedData 
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
