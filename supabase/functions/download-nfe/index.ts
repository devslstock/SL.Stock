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

    const { docId, type } = await req.json();
    if (!docId || !type) {
      throw new Error("docId and type are required");
    }

    if (type !== 'pdf' && type !== 'xml') {
      throw new Error("Type must be 'pdf' or 'xml'");
    }

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('focusnfe_token')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    const { data: nfe, error: nfeError } = await adminClient
      .from('nfe_records')
      .select('pdf_url, xml_url')
      .eq('id', docId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (nfeError || !nfe) throw new Error("Registro de NF-e não encontrado");

    const url = type === 'pdf' ? nfe.pdf_url : nfe.xml_url;
    if (!url) throw new Error(`URL do ${type.toUpperCase()} não disponível`);

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    
    // As URLs vindas do FocusNfe já são completas
    const focusRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
      }
    });

    if (!focusRes.ok) {
      throw new Error(`Erro ao baixar ${type.toUpperCase()} da Focus NFe: ${focusRes.statusText}`);
    }

    const arrayBuffer = await focusRes.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Encode Base64
    const CHUNK_SIZE = 0x8000;
    const c = [];
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      c.push(String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE) as unknown as number[]));
    }
    const base64 = btoa(c.join(""));

    return new Response(JSON.stringify({ 
      success: true, 
      data: base64,
      contentType: type === 'pdf' ? 'application/pdf' : 'application/xml'
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
