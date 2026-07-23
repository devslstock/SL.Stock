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

    const { arquivo, senha } = await req.json();
    if (!arquivo || !senha) throw new Error("Arquivo (base64) e Senha são obrigatórios");

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('focusnfe_token, focusnfe_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    const baseUrl = company.focusnfe_env === 'producao' 
      ? 'https://api.focusnfe.com.br/v2/certificados'
      : 'https://homologacao.focusnfe.com.br/v2/certificados';

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    
    // As per Focus NFe docs, it's usually `arquivo` (base64 of the pfx) and `senha`.
    const focusRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        arquivo: arquivo.replace(/^data:application\/(x-pkcs12|pkcs12|octet-stream|x-pem-file);base64,/, ""),
        senha
      })
    });

    const focusData = await focusRes.json();

    if (!focusRes.ok) {
      throw new Error(`Erro no envio: ${JSON.stringify(focusData)}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Certificado enviado com sucesso!",
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
