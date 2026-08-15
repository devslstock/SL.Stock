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

    const { docType, recordId } = await req.json();
    if (!docType || !recordId) {
      throw new Error("docType and recordId are required");
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

    let endpoint = "";
    let tableName = "";
    let docRef = "";

    if (docType === "nfe") {
      tableName = "nfe_records";
      const { data: nfe, error: nfeError } = await adminClient
        .from('nfe_records')
        .select('focus_reference')
        .eq('id', recordId)
        .eq('company_id', callerProfile.company_id)
        .single();
      if (nfeError || !nfe) throw new Error("Registro de NF-e não encontrado");
      docRef = nfe.focus_reference;
      endpoint = `/nfe/${docRef}?completa=1`;
    } else if (docType === "mdfe") {
      tableName = "mdfe_records";
      const { data: mdfe, error: mdfeError } = await adminClient
        .from('mdfe_records')
        .select('focus_reference')
        .eq('id', recordId)
        .eq('company_id', callerProfile.company_id)
        .single();
      if (mdfeError || !mdfe) throw new Error("Registro de MDF-e não encontrado");
      docRef = mdfe.focus_reference;
      endpoint = `/mdfe/${docRef}`;
    } else {
      throw new Error("docType deve ser 'nfe' ou 'mdfe'");
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
      if (focusRes.status === 404) {
         return new Response(JSON.stringify({
            success: true,
            status: 'nao_encontrado'
         }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Erro na consulta à Focus NFe",
        details: data 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Se sucesso, atualizar localmente o status de forma síncrona
    const updateData: any = {
      status: data.status,
      updated_at: new Date().toISOString()
    };

    if (data.status === 'autorizado') {
      updateData.access_key = docType === 'nfe' ? data.chave_nfe : (data.chave_mdfe || data.chave_nfe);
      updateData.xml_url = docType === 'nfe' ? data.caminho_xml_nota_fiscal : data.caminho_xml;
      updateData.pdf_url = docType === 'nfe' ? data.caminho_danfe : data.caminho_pdf;
    } else if (data.status === 'erro_autorizacao' || data.status === 'cancelado') {
      updateData.error_message = JSON.stringify(data.erros || data);
    }

    await adminClient.from(tableName).update(updateData).eq('id', recordId);

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
