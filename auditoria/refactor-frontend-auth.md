# Refatoração do front-end para Supabase Auth — código pronto

> Este guia tem o **código pronto** para a IA copiar/adaptar na Fase 1, depois que
> as migrations e a migração de usuários já tiverem rodado. Mantenha o visual igual —
> as mudanças são só de autenticação e isolamento, não de UI.
>
> **Ordem:** aplicar as migrations → rodar `scripts/migrate-users-to-auth.mjs` → ativar
> o Custom Access Token Hook → só então trocar estes arquivos do front e testar o login.

---

## 1. `src/lib/supabase.ts` — manter (já está correto)

Nenhuma mudança necessária. O client com a anon key agora gerencia a sessão do
Supabase Auth automaticamente (guarda o JWT no localStorage e o anexa nas queries).

---

## 2. `src/contexts/AuthContext.tsx` — substituir pelo conteúdo abaixo

O login passa a usar `supabase.auth.signInWithPassword`. O perfil continua vindo
de `public.users` (agora localizado por `auth_user_id`). A variável global
`currentCompanyId` **deixa de existir** — o isolamento é feito pela RLS via JWT.

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { companiesApi } from '@/api/companies';
import { toast } from '@/components/ui/toaster';
import type { User, UserPermissions, Company } from '@/types/database';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isMaster: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchCompany: (companyId: string) => Promise<boolean>;
  exitCompany: () => void;
  isLoading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o perfil (public.users) a partir da sessão do Supabase Auth.
  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setUser(null); setCompany(null); return; }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .eq('active', true)
      .maybeSingle();

    if (!profile) { setUser(null); setCompany(null); return; }
    setUser(profile as User);

    if (profile.company_id) {
      const comp = await companiesApi.getCompany(profile.company_id);
      setCompany(comp && comp.active ? comp : null);
    } else {
      setCompany(null); // super admin sem empresa selecionada
    }
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange(() => { loadProfile(); });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error('Usuário ou senha inválidos'); return false; }
    await loadProfile();
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
  };

  // Troca de empresa do super admin: ver nota abaixo sobre impersonação real.
  const switchCompany = async (companyId: string) => {
    if (!user?.is_super_admin) return false;
    const comp = await companiesApi.getCompany(companyId);
    if (comp && comp.active) { setCompany(comp); return true; }
    toast.error('Empresa inativa ou inexistente.');
    return false;
  };

  const exitCompany = () => {
    if (!user?.is_super_admin) return;
    setCompany(null);
  };

  const hasPermission = (permission: keyof UserPermissions) => {
    if (user?.role === 'admin' || user?.role === 'master' || user?.role === 'gestor' || user?.is_super_admin) return true;
    if (!user || !user.permissions) return false;
    if (user.permissions[permission] !== undefined) return user.permissions[permission] === true;
    if (user.role === 'vendedor' || user.role === 'representante')
      return ['can_view_dashboard','can_manage_products','can_use_sales_app','can_manage_sales','can_manage_customers'].includes(permission);
    if (user.role === 'conferente' || user.role === 'operador')
      return ['can_view_dashboard','can_manage_loads','can_do_conference'].includes(permission);
    if (user.role === 'motorista' || user.role === 'ajudante')
      return ['can_view_dashboard','can_do_delivery'].includes(permission);
    if (user.role === 'mecanico')
      return ['can_view_dashboard','can_manage_equipments'].includes(permission);
    return false;
  };

  const isMaster = user?.is_super_admin === true;

  return (
    <AuthContext.Provider value={{ user, company, isMaster, login, logout, switchCompany, exitCompany, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

> **`currentCompanyId` removido.** Procure por `import { currentCompanyId }` em todo o
> `src/` e remova esses usos (ver passo 4). Os arquivos de API param de filtrar
> manualmente — a RLS faz isso.

### Tela de Login (`src/pages/Login.tsx`)
O login agora é por **e-mail + senha**. Duas opções, escolha a de menor atrito:
- **(Recomendada)** trocar o campo "usuário" por "e-mail".
- **(Compatível)** manter "usuário" e, antes do `login()`, converter para o e-mail
  técnico: `const email = `${username.trim().toLowerCase()}@estoquefacil.local`` —
  precisa bater com o `EMAIL_DOMAIN` usado no script de migração.

O fluxo de senha padrão muda: em vez de comparar `DEFAULT_PASSWORD_HASH`, use o campo
`user.must_change_password`. No `ProtectedRoute` (`src/App.tsx`), troque:
```tsx
// antes: if (user.password_hash === DEFAULT_PASSWORD_HASH && ...)
if (user.must_change_password && location.pathname !== '/trocar-senha') {
  return <Navigate to="/trocar-senha" replace />;
}
```
E em `src/pages/ChangePassword.tsx`, trocar a senha via
`supabase.auth.updateUser({ password })` e depois `update users set must_change_password=false`.

---

## 3. Impersonação do super admin (switchCompany) — fazer direito

Com RLS por JWT, mudar a empresa só no estado React **não** dá acesso aos dados da
outra empresa (a RLS olha o `company_id` do token, não o React). Para o super admin
"entrar" numa empresa, o `company_id` precisa estar no token. Opções:

- **Simples:** o super admin tem `is_super_admin=true` no token, e a RLS já inclui
  `or public.is_super_admin()` — ou seja, ele enxerga todas as empresas. O
  `switchCompany` então serve só para **filtrar a UI** por empresa (adicionar
  `.eq('company_id', company.id)` apenas nas telas do painel master onde ele escolheu
  uma empresa). Não é vazamento: ele já é super admin.
- **Estrito (futuro):** Edge Function que valida `is_super_admin` e devolve um token
  com `company_id` setado para a empresa-alvo (impersonação real, sem o bypass).

Comece pela opção simples.

---

## 4. Limpar os `.eq('company_id', currentCompanyId)` da camada `src/api/*`

Depois que a RLS está ativa, esses filtros viram redundantes (e o `currentCompanyId`
nem existe mais). Faça assim, arquivo por arquivo:

1. Remover `import { currentCompanyId } from '@/contexts/AuthContext'`.
2. Remover linhas `if (!currentCompanyId) return []` / `throw`.
3. Remover os `.eq('company_id', currentCompanyId)` das **leituras**.
4. Nos **inserts**, remover `company_id: currentCompanyId` do payload — a coluna agora
   tem `default current_company_id()` (definido na migration de RLS). Para o super
   admin operando dentro de uma empresa, envie `company_id: company.id` explicitamente.

> Benefício colateral: isso corrige de uma vez os ~30 pontos onde o filtro estava
> faltando (priceTables, regions, salesReps, sales, supplies, users.deleteUser, etc.),
> porque agora quem garante o isolamento é o banco.

### Trocar o estoque manual pelas RPCs atômicas
Onde houver "lê estoque → soma no JS → grava" (`operations.ts`, `deliveries.ts`,
`products.ts`, `supplies.ts`), trocar por:
```ts
await supabase.rpc('increment_stock', { p_product_id: id, p_delta: delta });
// por código:
await supabase.rpc('increment_stock_by_code', { p_code: code, p_delta: delta });
// insumos:
await supabase.rpc('increment_supply_stock', { p_supply_id: id, p_delta: delta });
```
E `companies.deleteCompany` vira:
```ts
await supabase.rpc('delete_company', { p_company_id: id });
```

### Remover `src/utils/crypto.ts`
Não é mais usado (senha agora é gerida pelo Supabase Auth). Remover o arquivo e os
imports de `DEFAULT_PASSWORD_HASH`/`hashPassword`.

---

## 5. Criação/edição de usuários (admin/gestor)

Criar usuário agora envolve criar no Auth (precisa de service_role) + inserir em
`public.users`. Como a service_role não pode ir ao front, crie uma **Edge Function**
`create-company-user` que:
1. valida que o chamador é admin/gestor da empresa (ou super admin);
2. cria no Auth (`auth.admin.createUser`);
3. insere o perfil em `public.users` com `auth_user_id`, `company_id`, `role`, etc.

O front chama `supabase.functions.invoke('create-company-user', { body: {...} })`.
Desativar usuário = `update users set active=false` (já coberto pela RLS de `users_write`).

---

## 6. Teste de aceitação (obrigatório antes de considerar pronto)

Rodar o roteiro de **"Como testar o isolamento"** do final de
`AUDITORIA-E-PLANO-DE-CORRECAO.md`. Todos os 5 passos têm que passar.
