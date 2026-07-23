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
    
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in the Edge Function environment. Please add it via secrets.");
    }

    // Client usando token do usuário chamador para verificar quem está chamando
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client admin para criar o usuário no Auth
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) throw new Error("Unauthorized");

    // Verificar no banco o perfil do chamador
    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('role, is_super_admin, company_id')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");

    const { user: newUser, forceCompanyId } = await req.json();

    const isMaster = callerProfile.is_super_admin === true;
    const isGestorOrAdmin = callerProfile.role === 'admin' || callerProfile.role === 'gestor';

    if (!isMaster && !isGestorOrAdmin) {
      throw new Error("Apenas administradores podem criar usuários");
    }

    const targetCompanyId = forceCompanyId || callerProfile.company_id;
    if (!targetCompanyId) throw new Error("No company context");

    if (!isMaster && targetCompanyId !== callerProfile.company_id) {
      throw new Error("Não autorizado a criar usuários em outra empresa");
    }

    // Gerar e-mail temporário e senha provisória se não vier email
    const defaultDomain = 'estoquefacil.local';
    const email = newUser.email || `${newUser.username.trim().toLowerCase()}@${defaultDomain}`;
    const password = 'Trocar@123'; // Padrão forçado

    // Criar no Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { company_id: targetCompanyId },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        throw new Error("Este usuário/e-mail já existe no sistema.");
      }
      throw authError;
    }

    // Inserir no public.users
    const profileToInsert = {
      auth_user_id: authData.user.id,
      company_id: targetCompanyId,
      name: newUser.name,
      username: newUser.username.trim().toLowerCase(),
      email,
      role: newUser.role || 'conferente',
      permissions: newUser.permissions || {},
      active: true,
      must_change_password: true,
    };

    const { data: createdProfile, error: dbError } = await adminClient
      .from('users')
      .insert([profileToInsert])
      .select()
      .single();

    if (dbError) {
      // Rollback no auth
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new Error("Erro ao salvar perfil: " + dbError.message);
    }

    return new Response(JSON.stringify(createdProfile), {
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
