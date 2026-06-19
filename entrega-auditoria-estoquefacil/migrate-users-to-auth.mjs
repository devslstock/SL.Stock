/**
 * migrate-users-to-auth.mjs
 * --------------------------------------------------------------------------
 * FASE 1 (parte 3/4): migra os usuários de public.users para o Supabase Auth.
 *
 * O que faz (idempotente — pode rodar mais de uma vez sem duplicar):
 *   - Para cada linha de public.users SEM auth_user_id:
 *       1. gera um e-mail técnico a partir do username (se não houver e-mail);
 *       2. cria o usuário no Supabase Auth com uma SENHA TEMPORÁRIA;
 *       3. grava auth_user_id, email e must_change_password=true em public.users.
 *   - Não apaga nem altera nenhum outro dado. Não toca em password_hash.
 *
 * Como o hash antigo (SHA-256) não é reversível, todos recebem uma senha
 * temporária e devem trocá-la no primeiro login (o front trata must_change_password).
 *
 * PRÉ-REQUISITOS:
 *   - 20260615000000_auth_integration.sql já aplicado.
 *   - Node 18+ e a dependência @supabase/supabase-js (já está no projeto).
 *
 * COMO RODAR (NUNCA comitar a service_role!):
 *   SUPABASE_URL="https://xxxx.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="<service_role secreta>" \
 *   TEMP_PASSWORD="Trocar@123" \
 *   node scripts/migrate-users-to-auth.mjs
 *
 * A service_role é encontrada em: Painel Supabase -> Project Settings -> API.
 * É uma chave SECRETA (bypassa RLS). Use só localmente, nunca no front nem no git.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEMP_PASSWORD = process.env.TEMP_PASSWORD || 'Trocar@123'
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || 'estoquefacil.local'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function emailFor(user) {
  if (user.email && user.email.includes('@')) return user.email.trim().toLowerCase()
  const slug = (user.username || user.id).toString().trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  return `${slug}@${EMAIL_DOMAIN}`
}

async function main() {
  const { data: users, error } = await admin
    .from('users')
    .select('id, name, username, email, auth_user_id, is_super_admin, company_id, active')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro lendo public.users:', error.message)
    process.exit(1)
  }

  console.log(`Encontrados ${users.length} usuários. Migrando os que ainda não têm auth_user_id...`)
  let criados = 0, pulados = 0, falhas = 0

  for (const u of users) {
    if (u.auth_user_id) { pulados++; continue }

    const email = emailFor(u)
    try {
      // 1. cria no Auth (ou reaproveita se já existir esse e-mail)
      let authId = null
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name, legacy_user_id: u.id },
      })

      if (cErr) {
        // e-mail já existe no Auth -> localiza e reaproveita
        if (/already been registered|already exists/i.test(cErr.message)) {
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const found = list?.users?.find(x => x.email?.toLowerCase() === email)
          if (!found) throw cErr
          authId = found.id
        } else {
          throw cErr
        }
      } else {
        authId = created.user.id
      }

      // 2. vincula em public.users
      const { error: uErr } = await admin
        .from('users')
        .update({ auth_user_id: authId, email, must_change_password: true })
        .eq('id', u.id)
      if (uErr) throw uErr

      criados++
      console.log(`  ✓ ${u.username}  ->  ${email}`)
    } catch (e) {
      falhas++
      console.error(`  ✗ ${u.username}: ${e.message}`)
    }
  }

  console.log(`\nConcluído. Vinculados: ${criados} | já existentes: ${pulados} | falhas: ${falhas}`)
  console.log(`Senha temporária de todos: "${TEMP_PASSWORD}" (forçar troca no 1º login).`)
}

main()
