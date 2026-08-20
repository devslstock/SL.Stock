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
      .select('focusnfe_token, focusnfe_env')
      .eq('id', callerProfile.company_id)
      .single();

    if (companyError || !company) throw new Error("Company not found");
    if (!company.focusnfe_token) throw new Error("A empresa não configurou o Token da Focus NFe");

    const { data: nfe, error: nfeError } = await adminClient
      .from('nfe_records')
      .select('pdf_url, xml_url, status')
      .eq('id', docId)
      .eq('company_id', callerProfile.company_id)
      .single();

    if (nfeError || !nfe) throw new Error("Registro de NF-e não encontrado ou pertence a outra empresa.");
    if (nfe.status !== 'autorizado' && nfe.status !== 'cancelado') {
      throw new Error(`O documento da NF-e ainda não está disponível. Status atual: ${nfe.status}`);
    }

    let url = type === 'pdf' ? nfe.pdf_url : nfe.xml_url;
    if (!url) throw new Error(`URL do ${type.toUpperCase()} não disponível.`);

    if (!url.startsWith('http')) {
      const baseUrl = company.focusnfe_env === 'producao' 
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';
      url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    const tokenBase64 = btoa(`${company.focusnfe_token}:`);
    
    // Tratamento de redirecionamento 302 sem enviar o Authorization token pro Location
    let focusRes = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "Authorization": `Basic ${tokenBase64}`,
      }
    });

    if (focusRes.status === 302 || focusRes.status === 301 || focusRes.status === 303 || focusRes.status === 307) {
      const location = focusRes.headers.get("location");
      if (!location) throw new Error("Redirecionamento recebido sem a URL de destino (Location).");
      
      // Faz fetch na nova URL SEM o cabeçalho de Authorization para não quebrar a AWS/S3
      focusRes = await fetch(location, {
        method: "GET",
      });
    }

    if (!focusRes.ok) {
      // Lê o erro pra logar e repassar
      const errText = await focusRes.text().catch(() => "Sem detalhes do erro");
      console.error(`Erro Focus NFe (${focusRes.status}):`, errText);
      throw new Error(`Erro ao baixar ${type.toUpperCase()} da Focus NFe: ${focusRes.status} ${focusRes.statusText}`);
    }

    const arrayBuffer = await focusRes.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Validação de Magic Bytes
    if (uint8Array.length === 0) {
      throw new Error("O arquivo retornado está vazio.");
    }
    
    if (type === 'pdf') {
      // Checar se inicia com %PDF (25 50 44 46)
      if (uint8Array.length < 4 || uint8Array[0] !== 0x25 || uint8Array[1] !== 0x50 || uint8Array[2] !== 0x44 || uint8Array[3] !== 0x46) {
        // Logar o que recebemos para debug
        const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 50));
        console.error("Conteúdo recebido não é um PDF válido:", firstBytes);
        throw new Error("Focus NFe não retornou um PDF válido (não contém %PDF).");
      }
    } else if (type === 'xml') {
      // Checar se inicia com < (0x3C)
      const firstChar = String.fromCharCode(uint8Array[0]);
      if (firstChar !== '<') {
        const firstBytes = new TextDecoder().decode(uint8Array.slice(0, 50));
        console.error("Conteúdo recebido não é um XML válido:", firstBytes);
        throw new Error("Focus NFe não retornou um XML válido.");
      }
    }

    // Encode Base64
    const CHUNK_SIZE = 0x8000;
    const c = [];
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      c.push(String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE) as unknown as number[]));
    }
    const base64 = btoa(c.join(""));

    console.log(`Documento ${type.toUpperCase()} para NF ${docId} baixado com sucesso. Status: 200 OK.`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: base64,
      contentType: type === 'pdf' ? 'application/pdf' : 'application/xml'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Erro no download-nfe:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
