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

    const { type, searchParams } = await req.json();
    if (!type) throw new Error("type is required (cep, cnpj, cfop, ncm)");

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

    let endpoint = "";
    
    switch (type) {
      case "cep":
        if (searchParams.cep) {
          endpoint = `/ceps/${searchParams.cep.replace(/\D/g, '')}`;
        } else {
          throw new Error("Missing searchParams.cep");
        }
        break;
      case "cnpj":
        if (searchParams.cnpj) {
          endpoint = `/cnpjs/${searchParams.cnpj.replace(/\D/g, '')}`;
        } else {
          throw new Error("Missing searchParams.cnpj");
        }
        break;
      case "cfop":
        if (searchParams.codigo) {
          endpoint = `/cfops/${searchParams.codigo}`;
        } else if (searchParams.offset) {
          endpoint = `/cfops?offset=${searchParams.offset}&descricao=${searchParams.descricao || ''}`;
        } else {
          endpoint = `/cfops?descricao=${searchParams.descricao || ''}`;
        }
        break;
      case "ncm":
        if (searchParams.codigo) {
          endpoint = `/ncms/${searchParams.codigo}`;
        } else if (searchParams.offset) {
          endpoint = `/ncms?offset=${searchParams.offset}&descricao=${searchParams.descricao || ''}`;
        } else {
          endpoint = `/ncms?descricao=${searchParams.descricao || ''}`;
        }
        break;
      default:
        throw new Error("Invalid type");
    }

    const focusRes = await fetch(baseUrl + endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
        "Content-Type": "application/json"
      }
    });

    const data = await focusRes.json();

    if (!focusRes.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro na consulta à Focus NFe",
        details: data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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
