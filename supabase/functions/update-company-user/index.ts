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
      .select('role, is_super_admin, company_id')
      .eq('auth_user_id', callerUser.id)
      .single();

    if (profileError || !callerProfile) throw new Error("Caller profile not found");

    const { id, updates } = await req.json();
    if (!id || !updates) throw new Error("Missing id or updates");

    const isMaster = callerProfile.is_super_admin === true;
    const isGestorOrAdmin = callerProfile.role === 'admin' || callerProfile.role === 'gestor';

    if (!isMaster && !isGestorOrAdmin) {
      throw new Error("Apenas administradores podem atualizar usuários");
    }

    // Buscar o usuário que será alterado para validar empresa
    const { data: targetUser, error: targetError } = await adminClient
      .from('users')
      .select('auth_user_id, company_id')
      .eq('id', id)
      .single();

    if (targetError || !targetUser) throw new Error("Usuário não encontrado");

    if (!isMaster && targetUser.company_id !== callerProfile.company_id) {
      throw new Error("Não autorizado a alterar usuário de outra empresa");
    }

    if (updates.force_password_reset) {
      // Usar a senha padrão
      const { error: authError } = await adminClient.auth.admin.updateUserById(targetUser.auth_user_id, {
        password: 'Trocar@123',
      });
      if (authError) throw authError;

      // Definir flag no perfil para obrigar troca
      const { data: updatedProfile, error: updateError } = await adminClient
        .from('users')
        .update({ must_change_password: true, reset_requested: false })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return new Response(JSON.stringify(updatedProfile), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Se houver outras atualizações sensíveis que precisem passar pelo adminClient, faríamos aqui.
    // O fallback atualiza apenas a tabela public.users
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify(updatedProfile), {
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
