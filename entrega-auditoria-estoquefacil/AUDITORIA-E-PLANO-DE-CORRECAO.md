# Auditoria Técnica & Plano de Correção — Estoque Fácil (`gerenciamento`)

> **Para a IA/dev que vai executar:** este documento é a especificação completa de correção do projeto.
> Leia a seção **0. Como usar este documento** antes de tocar em qualquer arquivo.
> As fases estão em ordem de prioridade. **Não pule a Fase 1** — todo o resto depende dela.

**Stack:** React 19 + TypeScript + Vite + TailwindCSS + Supabase (Postgres) + Capacitor. App SaaS multi-tenant (várias empresas), deploy na Vercel.

---

## 0. Como usar este documento

**Regras inegociáveis para quem executar:**

1. **Trabalhe por fase, na ordem.** Cada fase tem tarefas numeradas com: arquivos afetados, o que fazer, exemplo de código e **critério de aceitação**. Só marque uma tarefa como concluída quando o critério for atendido.
2. **Não quebre o que funciona.** Faça mudanças incrementais, rode `npm run build` (que executa `tsc -b && vite build`) após cada tarefa significativa e teste o fluxo afetado.
3. **Segurança vem primeiro.** A Fase 1 reescreve a autenticação e o isolamento entre empresas. Hoje o app está **totalmente exposto** (qualquer pessoa lê/edita dados de todas as empresas). Nenhuma melhoria de performance ou UX importa antes disso.
4. **Nunca confie no cliente.** Toda regra de segurança (quem vê o quê, quem pode editar) precisa ser garantida no **banco (RLS)** ou em **função server-side**. Checagens no React (`hasPermission`, `PlanGuard`) são apenas cosméticas.
5. **Commits pequenos e descritivos**, um por tarefa quando possível.
6. **Não versionar segredos nem dados reais** (ver Fase 0).

---

## 0.6 — Artefatos JÁ PRONTOS neste repositório

Para reduzir o trabalho, boa parte da Fase 1 e 3 já está escrita. **Revise antes de
aplicar** e rode primeiro em ambiente de teste/staging. Ordem de execução:

| Ordem | Arquivo | O que faz |
|------|---------|-----------|
| 1 | `supabase/migrations/20260615000000_auth_integration.sql` | Vincula `users` ao Supabase Auth (`auth_user_id`), cria enum de roles, adiciona `company_id` às tabelas de contagem legadas (com backfill), cria helpers de RLS e o Custom Access Token Hook. **Não-destrutivo.** |
| 2 | *(painel)* | Ativar o hook: **Authentication → Hooks → Custom Access Token → `custom_access_token_hook`** |
| 3 | `scripts/migrate-users-to-auth.mjs` | Cria os usuários no Supabase Auth e vincula em `public.users`. Idempotente. Rodar com a service_role (instruções no topo do arquivo). |
| 4 | `supabase/migrations/20260615000001_rls_policies.sql` | **Liga a RLS de verdade** por `company_id` em todas as tabelas + default de `company_id` nos inserts. Só rodar depois de 1–3. |
| 5 | `supabase/migrations/20260615000002_indexes.sql` | Índices em `company_id` e todas as FKs. |
| 6 | `supabase/migrations/20260615000003_atomic_rpcs.sql` | RPCs de estoque atômico + `delete_company` transacional. |
| 7 | `docs/refactor-frontend-auth.md` | Código pronto do `AuthContext`/login + checklist para limpar os filtros manuais e trocar pelas RPCs. |
| — | `.env.example`, `.gitignore` | Já criados/atualizados (Fase 0). |

> ⚠️ **Não rode o passo 4 antes dos passos 1–3 em produção:** enquanto o front ainda
> usa a anon key (pré-refactor), ligar a RLS bloqueia o acesso. Faça a sequência
> inteira em staging, valide o login e o teste de isolamento (apêndice), e só então
> promova para produção.

---

## 1. Diagnóstico — estado atual (resumo)

| # | Problema | Severidade | Fase |
|---|----------|------------|------|
| 1 | Autenticação caseira: login compara hash de senha direto do navegador com a chave anon | 🔴 Crítico | 1 |
| 2 | Senha em SHA-256 **sem salt**, calculada no cliente; hash = senha na prática | 🔴 Crítico | 1 |
| 3 | RLS desligada / `USING(true)` em dezenas de tabelas, inclusive liberada para `anon` | 🔴 Crítico | 1 |
| 4 | Isolamento entre empresas só no JS (`.eq('company_id', ...)`), e ausente em muitas funções | 🔴 Crítico | 1 |
| 5 | `.env` e dados pessoais reais (CSV/XLSX/PDF de clientes) versionados no Git | 🔴 Crítico | 0 |
| 6 | `ProtectedRoute` não valida role/permissão; rotas master e admin abertas por URL | 🟠 Alto | 2 |
| 7 | `PlanGuard` libera plano máximo por padrão (`plan || 'platina'`) | 🟠 Alto | 2 |
| 8 | TypeScript sem `strict`; ~292 usos de `any` | 🟠 Alto | 5 |
| 9 | Operações de estoque sem atomicidade (read-modify-write) | 🟠 Alto | 3 |
| 10 | `deleteCompany` sem transação, ignora erros | 🟠 Alto | 3 |
| 11 | Sem code-splitting; `xlsx`/`jspdf` no bundle inicial; 50 páginas importadas estaticamente | 🟠 Alto | 4 |
| 12 | Faltam índices em `company_id` e FKs | 🟠 Alto | 3 |
| 13 | Componentes gigantes (Conference 1277, CreateLoad 789, RouteClients 779) com lógica duplicada | 🟡 Médio | 5 |
| 14 | Sem Error Boundary; `QueryClient` sem defaults | 🟡 Médio | 4 |
| 15 | Migrations duplicadas/conflitantes (raiz vs `supabase/migrations`) | 🟡 Médio | 3 |
| 16 | Scripts soltos com credenciais hardcoded; dumps `.txt` no repo | 🟡 Médio | 0 |
| 17 | Erros engolidos (ex: `verifyCompanyFinancialStatus` falha aberta) | 🟡 Médio | 3 |
| 18 | N+1 em loops de escrita | 🟡 Médio | 3 |
| 19 | Versões suspeitas no `package.json`; `xlsx` com CVE; import órfão de `sonner` | 🟢 Baixo | 6 |
| 20 | Listas sem virtualização; acessibilidade; `console.*` em produção | 🟢 Baixo | 6 |

---

## FASE 0 — Higiene do repositório e segredos (fazer imediatamente)

**Objetivo:** parar de vazar dados reais e segredos pelo Git.

### 0.1 — Remover dados pessoais e segredos do working tree
Mover para fora do repositório (ou apagar) e **nunca** mais versionar:
- `.env`
- `Empresas.csv`, `Empresas (1).csv` (631 clientes reais — CNPJ/CPF/telefone/endereço)
- `EstoqueFacil.xlsx`, `Pedido de venda Delicius ... .xlsx`, `tabela_precos (1).pdf`
- `dashboard_old.txt`, `dashboard_real_data.txt`, `parsed_pdf.txt`
- Scripts soltos com credencial hardcoded ou descartáveis: `geocode_all.ts`, `import-customers.js`, `update_prices.cjs`, `test-payment.mjs`, `test-rls.mjs`, `test-user.mjs`, `test-db.cjs`, `test_search.js`, `test.ts`, `test2.ts`, `fix.js`, `replace-sonner.js`
  - Se algum script for útil de verdade, mova para uma pasta `scripts/` **fora do versionamento** e troque credenciais hardcoded por leitura de `.env`.

### 0.2 — Corrigir o `.gitignore`
Adicionar:
```gitignore
# Segredos
.env
.env.*
!.env.example

# Dados / planilhas / dumps (nunca versionar dados reais)
*.csv
*.xlsx
*.pdf
parsed_pdf.txt
dashboard_old.txt
dashboard_real_data.txt

# Scripts locais
/scripts/
```

### 0.3 — Criar `.env.example` (sem valores reais)
```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 0.4 — Limpar o histórico do Git
Os arquivos acima já estão no histórico. Reescrever com `git filter-repo` (preferível) ou BFG:
```bash
git filter-repo --invert-paths \
  --path .env \
  --path "Empresas.csv" \
  --path "Empresas (1).csv" \
  --path "EstoqueFacil.xlsx" \
  --path-glob "*.pdf" \
  --path-glob "dashboard_*.txt" \
  --path parsed_pdf.txt
```
> Coordene com o dono do repo antes (reescrever histórico exige `--force` no push e reclone por todos).

### 0.5 — Rotacionar credenciais
- A `VITE_SUPABASE_ANON_KEY` é pública por natureza (vai no bundle), então o risco real não é a chave em si — é a **RLS frouxa** (Fase 1). Ainda assim, após endurecer a RLS, considere rotacionar a anon key.
- **Garanta que a `service_role` key NUNCA apareça em nenhum arquivo do front-end nem no histórico.**

**Critério de aceitação Fase 0:** `git ls-files` não retorna `.env`, CSVs, XLSX, PDFs nem dumps; `.gitignore` atualizado; `.env.example` presente; histórico limpo.

---

## FASE 1 — Refundar a segurança: Supabase Auth + RLS real 🔴

> **Esta é a fase mais importante e a mais trabalhosa.** Hoje a autenticação é caseira (compara hash no cliente) e o banco não isola nada. A correção definitiva é **migrar para Supabase Auth** (que gera um JWT real) e escrever **RLS por `company_id`** em todas as tabelas. Sem `auth.uid()` funcionando, é impossível proteger o banco.

### Arquitetura alvo

```
Login  ─► Supabase Auth (email+senha)  ─► JWT contendo app_metadata.company_id e role
                                              │
Queries do front ──────────────────────────────► Postgres aplica RLS:
                                                  "só vejo/edito linhas onde company_id = (jwt.company_id)"
```

A tabela `users` atual vira uma tabela de **perfil** (`profiles`) ligada a `auth.users` por `id`. A senha sai de `users` e passa a viver no Supabase Auth (bcrypt gerenciado pela plataforma).

### 1.1 — Habilitar e modelar Auth

1. No painel Supabase: **Authentication → Providers → Email** habilitado. Desligar "Confirm email" se o fluxo for interno (admin cria usuário), ou manter conforme o produto.
2. Criar tabela de perfil ligada ao Auth:

```sql
-- migration: 20260615000000_auth_profiles.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  username text unique,
  role public.user_role not null default 'conferente',
  permissions jsonb not null default '{}'::jsonb,
  is_super_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- enum de roles (substitui os CHECK divergentes espalhados)
do $$ begin
  create type public.user_role as enum
    ('admin','gestor','conferente','motorista','ajudante',
     'vendedor','representante','operador','mecanico','master');
exception when duplicate_object then null; end $$;
```

3. **Custom claims** — colocar `company_id`, `role` e `is_super_admin` no JWT via Auth Hook (Custom Access Token Hook) para a RLS poder lê-los:

```sql
-- function chamada pelo "Custom Access Token" hook (Auth → Hooks)
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims jsonb := event->'claims';
  prof   record;
begin
  select company_id, role, is_super_admin
    into prof
  from public.profiles
  where id = (event->>'user_id')::uuid;

  if prof.company_id is not null then
    claims := jsonb_set(claims, '{app_metadata,company_id}', to_jsonb(prof.company_id));
  end if;
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(prof.role));
  claims := jsonb_set(claims, '{app_metadata,is_super_admin}', to_jsonb(coalesce(prof.is_super_admin,false)));

  return jsonb_set(event, '{claims}', claims);
end;
$$;
```
> Registrar a função em **Authentication → Hooks → Custom Access Token**.

### 1.2 — Helpers de RLS

```sql
-- migration: 20260615000001_rls_helpers.sql
create or replace function public.current_company_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid;
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false);
$$;
```

### 1.3 — Política RLS padrão por tabela (aplicar em TODAS as tabelas de tenant)

Para cada tabela que tem `company_id` (`products`, `operations`, `operation_items`, `operation_alerts`, `delivery_routes`, `delivery_clients`, `delivery_items`, `customers`, `customer_equipments`, `sales_reps`, `regions`, `price_tables`, `price_table_items`, `sales_rep_regions`, `sales_orders`, `sales_order_items`, `payment_conditions`, `customer_payment_conditions`, `equipments`, `equipment_orders`, `equipment_history`, `equipment_order_supplies`, `supplies`, `supply_requests`, `planned_inventories`, `planned_inventory_areas`, `planned_inventory_counts`, `planned_inventory_sectors`, `adhoc_counts`, `adhoc_count_items`, `inventory_counts`, `inventory_count_items`, `related_codes` via join, etc.):

```sql
-- TEMPLATE — repetir por tabela, trocando <TBL>
alter table public.<TBL> enable row level security;

drop policy if exists "<TBL>_tenant_all" on public.<TBL>;

create policy "<TBL>_tenant_all" on public.<TBL>
for all
to authenticated
using ( company_id = public.current_company_id() or public.is_super_admin() )
with check ( company_id = public.current_company_id() or public.is_super_admin() );
```

> **Tabelas-filhas sem `company_id` direto** (ex.: `operation_items`, `delivery_items`, `related_codes`): ou (a) **adicione `company_id`** e preencha por trigger no insert, ou (b) escreva a policy via `EXISTS` no pai. Preferir (a) por performance:
> ```sql
> using ( exists (
>   select 1 from public.operations o
>   where o.id = operation_items.operation_id
>     and (o.company_id = public.current_company_id() or public.is_super_admin())
> ))
> ```

### 1.4 — Tabela `profiles` e tabelas globais

```sql
alter table public.profiles enable row level security;

-- cada um lê o próprio perfil; gestor/admin leem os da própria empresa; super admin lê todos
create policy "profiles_select" on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or company_id = public.current_company_id()
  or public.is_super_admin()
);

-- só gestor/admin da empresa (ou super admin) gerencia usuários da própria empresa
create policy "profiles_write" on public.profiles
for all to authenticated
using (
  public.is_super_admin()
  or (company_id = public.current_company_id()
      and (auth.jwt()->'app_metadata'->>'role') in ('admin','gestor'))
)
with check (
  public.is_super_admin()
  or (company_id = public.current_company_id()
      and (auth.jwt()->'app_metadata'->>'role') in ('admin','gestor'))
);
```

- `companies`: SELECT permitido para quem é da empresa (`id = current_company_id()`) ou super admin; UPDATE/DELETE só super admin (ou admin da própria empresa, conforme regra de negócio).
- `saas_plans`: SELECT liberado para `authenticated`; escrita só `is_super_admin()`.
- `system_notes`, `company_payments`, `system_leads`, `campaigns`: leitura/escrita só `is_super_admin()`, **exceto** o INSERT público de `system_leads` (landing) — manter `to anon` apenas para `INSERT` com `WITH CHECK (true)` e, idealmente, proteger com captcha/edge function.

### 1.5 — Migrar usuários existentes para o Auth

Script único (rodar uma vez com a **service_role**, fora do front-end):
1. Para cada linha de `users`, criar o usuário no Auth com `auth.admin.createUser({ email, password, email_confirm: true })`.
   - Se não houver e-mail real, gerar `username@empresa-slug.local` como e-mail técnico e exigir troca no primeiro login.
   - Senha: como o hash atual é SHA-256 sem salt e não é reversível, definir uma **senha temporária** e forçar troca (reaproveitar o fluxo `DEFAULT_PASSWORD_HASH` → `/trocar-senha`, agora via Auth).
2. Inserir o perfil em `profiles` com o mesmo `id` do `auth.users`, copiando `company_id`, `role`, `permissions`, `is_super_admin`, `name`, `username`.
3. Validar contagem: `select count(*) from profiles` == usuários ativos migrados.
4. Depois de validado, **dropar a coluna `password_hash`** de `users`/`profiles`.

### 1.6 — Refatorar o front-end

**`src/lib/supabase.ts`** — manter, mas o client agora gerencia sessão automaticamente.

**`src/contexts/AuthContext.tsx`** — reescrever:
- `login(email, password)` → `supabase.auth.signInWithPassword({ email, password })`.
- `logout()` → `supabase.auth.signOut()`.
- Sessão: usar `supabase.auth.onAuthStateChange` em vez de ler `localStorage` manualmente.
- `user`/`company` derivados do JWT + `profiles` (uma query). **Remover** a variável global `currentCompanyId` (linha 22) — o `company_id` agora vem do token e é aplicado pela RLS; o front não precisa mais filtrar manualmente.
- `switchCompany` (super admin): em vez de trocar uma variável global, use **impersonação controlada** — uma Edge Function que valida `is_super_admin` e retorna um token com o `company_id` alvo, ou um claim adicional. Não dá para um super admin "virar" outra empresa só mudando JS.

**`src/api/users.ts`** — `login()` sai daqui (vai para o AuthContext via `supabase.auth`). CRUD de usuário passa a operar em `profiles` + `supabase.auth.admin` (via Edge Function para criar/desativar, pois `admin` exige service_role).

**Todas as `src/api/*.ts`** — **remover os `.eq('company_id', currentCompanyId)` manuais** e o guard `if (!currentCompanyId)`. A RLS passa a garantir o isolamento. Em **inserts**, definir `company_id` via `default public.current_company_id()` na coluna OU via trigger `before insert`, para não depender do cliente:
```sql
alter table public.products
  alter column company_id set default public.current_company_id();
```
> Isso de uma vez resolve os ~30 pontos onde o filtro/insert estava faltando (priceTables, regions, salesReps, sales, supplies, etc.), porque agora é o banco que decide.

### 1.7 — `crypto.ts`
Apagar `src/utils/crypto.ts` (SHA-256/`DEFAULT_PASSWORD_HASH`). O fluxo de "senha padrão → trocar senha" passa a usar um flag no perfil (`must_change_password boolean`) ou o próprio `email_confirmed`/metadata do Auth.

**Critérios de aceitação Fase 1:**
- Login funciona via Supabase Auth; nenhuma senha/hash trafega ou é comparada no cliente.
- `select * from users` com a anon key **não retorna nada** sem sessão (testar com `test-rls` adaptado).
- Usuário da empresa A **não consegue** ler nem editar dados da empresa B mesmo manipulando o client (testar trocando IDs manualmente).
- Toda tabela de tenant tem `rowsecurity = true` e policy por `company_id`. Verificar:
  ```sql
  select tablename, rowsecurity from pg_tables where schemaname='public' and rowsecurity = false;
  -- deve retornar só tabelas globais intencionais
  ```

---

## FASE 2 — Autorização de rotas e UI (depende da Fase 1) 🟠

### 2.1 — Guard de role/permissão no roteador
`src/App.tsx` (`ProtectedRoute`, linha ~31) só checa login. Criar um wrapper que valide permissão:

```tsx
function RequirePermission({ perm, children }: { perm: keyof UserPermissions; children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(perm)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireMaster({ children }: { children: React.ReactNode }) {
  const { isMaster } = useAuth();
  if (!isMaster) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```
- Envolver **todas** as rotas `/saas/*` com `<RequireMaster>`.
- Envolver `/acesso` (AccessControl), `/configuracoes/empresa`, cadastros sensíveis com `<RequirePermission perm="...">`.
> Lembrar: isto é **defesa em profundidade/UX**. A barreira real é a RLS da Fase 1 (ex.: `system_notes` só `is_super_admin`).

### 2.2 — Corrigir `PlanGuard`
`src/components/PlanGuard.tsx:16` — trocar o default permissivo:
```tsx
const plan = company.plan ?? 'bronze'; // sem plano = menor nível, nunca o máximo
```
Mesma correção em `AppLayout.tsx` (`isFeatureLocked`). Corrigir também o HTML inválido (`<ul>` dentro de `<ul>`, linhas 49 e 56 → usar `<li>`) e o telefone placeholder `559999999999` (linha 67).

**Critério de aceitação:** acessar `/saas` como usuário comum redireciona; empresa sem `plan` não acessa recursos premium.

---

## FASE 3 — Integridade de dados e banco 🟠

### 3.1 — Estoque atômico via RPC
Substituir o padrão "lê estoque → soma no JS → grava" (em `operations.ts`, `deliveries.ts`, `products.ts:98-120`, `supplies.ts`) por funções no banco:

```sql
create or replace function public.increment_stock(p_product_id uuid, p_delta numeric)
returns void language sql as $$
  update public.products
     set stock = stock + p_delta
   where id = p_product_id
     and (company_id = public.current_company_id() or public.is_super_admin());
$$;
```
No front: `await supabase.rpc('increment_stock', { p_product_id, p_delta })`. Isso elimina a race condition (dois usuários conferindo a mesma carga ao mesmo tempo).

### 3.2 — `incrementStockByCode` busca por código
`products.ts:98-120` busca produto por `code` sem `company_id` e com `.limit(1)` sem `order` → pode pegar produto da empresa errada. Com a RLS da Fase 1 isso já fica restrito à empresa; ainda assim, mova a lógica para uma RPC `increment_stock_by_code(p_code text, p_delta numeric)` que resolve o produto **dentro** da empresa do JWT.

### 3.3 — Transações
- `companies.ts:85-126` (`deleteCompany`): envolver os ~11 deletes numa **RPC transacional** (`SECURITY DEFINER`, só `is_super_admin`), ou confiar em `ON DELETE CASCADE` (ver 3.5) e deletar só a `companies`. Hoje ignora erros e pode deixar órfãos.
- `deliveries.ts confirmRouteReturn` e `operations.ts` (devolução de estoque em loop): transformar em RPC única que faz tudo numa transação, eliminando também o N+1.

### 3.4 — Índices
Criar índices em `company_id` e em todas as FKs (Postgres não cria índice de FK automaticamente):
```sql
-- migration: 20260615000010_indexes.sql
create index if not exists idx_products_company on public.products(company_id);
create index if not exists idx_operations_company on public.operations(company_id);
create index if not exists idx_operation_items_operation on public.operation_items(operation_id);
create index if not exists idx_operation_items_product on public.operation_items(product_id);
create index if not exists idx_delivery_clients_route on public.delivery_clients(delivery_route_id);
create index if not exists idx_delivery_items_client on public.delivery_items(delivery_client_id);
create index if not exists idx_related_codes_product on public.related_codes(product_id);
create index if not exists idx_sales_order_items_order on public.sales_order_items(sales_order_id);
create index if not exists idx_customer_equipments_customer on public.customer_equipments(customer_id);
create index if not exists idx_price_table_items_table on public.price_table_items(price_table_id);
-- ...repetir company_id para TODAS as tabelas de tenant e os demais FKs
```

### 3.5 — Consolidar migrations e padronizar integridade
- **Eliminar duplicatas raiz vs `supabase/migrations/`.** Os `.sql` soltos na raiz (`migration_*.sql`, `fix_*.sql`, `add_*.sql`, `rls_*.sql`, `update_*.sql`, `supabase_inventories.sql`) duplicam/conflitam com `supabase/migrations/`. Definir **`supabase/migrations/` como fonte única de verdade** e remover os da raiz após confirmar que o conteúdo já está versionado lá.
- Padronizar `ON DELETE` (hoje diverge entre criação incremental e o consolidado `docs/estrutura_completa_banco.sql`): definir CASCADE/SET NULL conscientemente por FK.
- Resolver o conflito de RLS de `system_notes`/`company_payments`/`companies` (estados divergentes entre scripts) — após a Fase 1 todas seguem as policies novas.
- Adicionar `CHECK` em colunas de status hoje livres (`operations.status/type`, `operation_items.status`, `delivery_*.status`, `supply_requests.status`) ou convertê-las para `enum`.
- Trocar `operations.created_by TEXT` por FK para `profiles(id)`.
- Avaliar `operations.clients TEXT[]` → tabela de junção; `users.permissions JSONB` está ok como flags, mas valide as chaves.

### 3.6 — Erros engolidos
- `companies.ts verifyCompanyFinancialStatus`: hoje em caso de erro retorna "adimplente" (falha **aberta**). Inverter para falha **fechada** ou propagar o erro.
- `api/saas.ts` leads: remover o fallback para `localStorage` que mascara falhas do banco; tratar erro de verdade.
- `equipments.ts createHistory`: não engolir erro de auditoria silenciosamente.

**Critério de aceitação Fase 3:** conferência simultânea da mesma carga não corrompe estoque; `deleteCompany` é atômico; `EXPLAIN` de listagens usa índice em `company_id`; uma só pasta de migrations; nenhuma função de finanças/estoque com `catch` que retorna sucesso falso.

---

## FASE 4 — Performance e robustez do front-end 🟠

### 4.1 — Code-splitting de rotas
`src/App.tsx` importa ~50 páginas estaticamente. Trocar por `React.lazy` + `<Suspense>`:
```tsx
const Conference = lazy(() => import('@/pages/Conference'));
// ...
<Suspense fallback={<TelaCarregando />}>
  <Routes>...</Routes>
</Suspense>
```

### 4.2 — Lazy-load das libs pesadas
`xlsx` e `jspdf` estão importados estaticamente em 8+ arquivos (`Conference`, `CreateLoad`, `RouteClients`, `Products`, `AdhocCount`, `Manager`, `PriceTables/*`, `CreateReceipt`, `utils/pdf.ts`). Importar **dentro do handler**:
```ts
async function exportar() {
  const XLSX = await import('xlsx');
  // ...usa XLSX
}
```
Idem `jspdf` em `utils/pdf.ts`. Opcional: `manualChunks` no `vite.config.ts` para separar `recharts`, `xlsx`, `jspdf`.

### 4.3 — Error Boundary global
Não existe nenhum hoje — um throw derruba o app (tela branca). Criar `src/components/ErrorBoundary.tsx` e envolver o `<App/>` em `main.tsx`.

### 4.4 — Defaults do React Query
`src/main.tsx:10` — `new QueryClient()` sem config. Definir:
```ts
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
```
Revisar os `refetchInterval` curtos do `AppLayout` (15s/60s) — só manter onde realmente precisa de tempo real.

### 4.5 — Virtualização de listas grandes
`Conference.tsx`, `RouteClients.tsx`, `Products.tsx`, contagens renderizam todos os itens. Para listas de 300+ linhas, usar `@tanstack/react-virtual`. Remover `animationDelay` inline por item (força reflow).

**Critério de aceitação Fase 4:** bundle inicial cai significativamente (medir com `vite build` / análise de chunks); `xlsx`/`jspdf` não aparecem no chunk de entrada; erro em uma página não derruba o app; conferência com muitos itens não trava.

---

## FASE 5 — Qualidade de código e arquitetura 🟡

### 5.1 — Ativar TypeScript `strict`
`tsconfig.app.json`: adicionar `"strict": true` (e `noImplicitAny`). São ~292 `any` em 58 arquivos; corrigir **por arquivo**, começando pelos piores: `RouteClients.tsx` (21), `Conference.tsx` (13), `PriceTables/Form.tsx` (12), `ReturnConference.tsx`, `ClientConference.tsx`, `CreateLoad.tsx`, `Dashboard.tsx`. Usar os tipos de `src/types/database.ts` como base.

### 5.2 — Extrair lógica duplicada
- **Parser de planilha XLSX**: `CreateLoad.tsx` (linhas ~244-581) e `RouteClients.tsx` (~306-552) duplicam ~300 linhas quase idênticas (templates "novo/antigo", `normalizeCode`). Extrair para `src/utils/spreadsheet.ts` (`parseDeliverySpreadsheet()`) e `src/utils/normalizeCode.ts`.
- **`ItemRow` da `Conference.tsx`**: 3 variações inline + cálculo de `systemStock`/`isDivergent` repetido 3x → um componente `ConferenceItemRow` + um helper.

### 5.3 — Quebrar componentes gigantes
`Conference.tsx` (1277), `CreateLoad.tsx` (789), `RouteClients.tsx` (779), `Operator.tsx` (708), `AdhocCount.tsx` (706): separar em (a) hook de dados (`useConference()`), (b) subcomponentes de UI, (c) utils de cálculo. Meta: nenhum arquivo de página > ~350 linhas.

### 5.4 — Centralizar a camada de API
Criar um helper para remover o boilerplate repetido em ~80 funções. Após a Fase 1 (RLS cuida do tenant), o helper foca em erro/tipagem:
```ts
// src/api/_client.ts
export async function tquery<T>(p: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new ApiError(error);
  return data as T;
}
```

**Critério de aceitação Fase 5:** `npm run build` passa com `strict: true`; zero `any` implícito; parser de planilha em um único lugar; nenhuma página > ~350 linhas.

---

## FASE 6 — Limpeza final e dependências 🟢

- **Validar versões reais**: `npm ls typescript vite eslint lucide-react jspdf xlsx`. Os ranges no `package.json` parecem incorretos (`typescript ~6.0.2`, `vite ^8`, `eslint ^10`, `lucide-react ^1.14.0`, `jspdf ^4.2.1`). Corrigir para versões que existem e fixar no lock.
- **`xlsx` (SheetJS `^0.18.5`)**: tem CVEs de prototype pollution. Atualizar (SheetJS recomenda instalar do CDN oficial deles) ou migrar para alternativa.
- **Remover `sonner`**: corrigir o import órfão em `src/pages/Master/Settings/index.tsx` (usar o toaster custom) e remover a dependência.
- **Remover `console.*` de produção** (~32 ocorrências) ou trocar por um logger com nível.
- **Acessibilidade**: `aria-label` em botões só-ícone; dropdowns `<div onClick>` → `role`/teclado; `<label htmlFor>` nos selects; remover classes Tailwind duplicadas (`dark:text-amber-600 dark:text-amber-400`).
- **`salesCart` (zustand persist)**: adicionar versionamento/migração e escopar a chave por empresa/usuário (hoje `'sales-cart-storage'` global pode misturar contexto entre logins no mesmo navegador).

---

## Checklist de progresso

```
FASE 0 — Higiene e segredos
  [ ] 0.1 Remover dados/segredos do working tree
  [ ] 0.2 .gitignore corrigido
  [ ] 0.3 .env.example criado
  [ ] 0.4 Histórico do Git limpo
  [ ] 0.5 Credenciais rotacionadas / service_role garantidamente ausente

FASE 1 — Supabase Auth + RLS
  [ ] 1.1 Auth habilitado + tabela profiles + custom claims hook
  [ ] 1.2 Helpers current_company_id() / is_super_admin()
  [ ] 1.3 RLS por company_id em TODAS as tabelas de tenant
  [ ] 1.4 RLS de profiles e tabelas globais
  [ ] 1.5 Migração dos usuários para o Auth
  [ ] 1.6 Front refatorado (AuthContext, api/*, defaults de company_id)
  [ ] 1.7 crypto.ts removido
  [ ] Teste de isolamento A↔B passa

FASE 2 — Autorização de rotas/UI
  [ ] 2.1 RequirePermission / RequireMaster nas rotas
  [ ] 2.2 PlanGuard default corrigido + HTML/placeholder

FASE 3 — Integridade de dados
  [ ] 3.1 Estoque atômico via RPC
  [ ] 3.2 increment_stock_by_code dentro da empresa
  [ ] 3.3 Transações (deleteCompany, confirmRouteReturn)
  [ ] 3.4 Índices em company_id e FKs
  [ ] 3.5 Migrations consolidadas + integridade padronizada
  [ ] 3.6 Erros engolidos corrigidos

FASE 4 — Performance front
  [ ] 4.1 Code-splitting de rotas
  [ ] 4.2 Lazy-load xlsx/jspdf
  [ ] 4.3 Error Boundary global
  [ ] 4.4 Defaults do QueryClient
  [ ] 4.5 Virtualização de listas

FASE 5 — Qualidade
  [ ] 5.1 strict: true + zerar any
  [ ] 5.2 Extrair parser de planilha + ItemRow
  [ ] 5.3 Quebrar componentes gigantes
  [ ] 5.4 Helper central de API

FASE 6 — Limpeza
  [ ] 6.1 Versões de deps validadas
  [ ] 6.2 xlsx atualizado (CVE)
  [ ] 6.3 sonner removido
  [ ] 6.4 console.* / acessibilidade / salesCart
```

---

## Apêndice — Como testar o isolamento (faça sempre após a Fase 1)

1. Crie duas empresas (A e B) e um usuário em cada.
2. Logado como usuário de A, no console do navegador:
   ```js
   const { data } = await supabase.from('products').select('*');
   // deve retornar SÓ produtos da empresa A
   ```
3. Tente forçar acesso a um `id` conhecido da empresa B (update/delete) — deve falhar/retornar vazio.
4. Sem login (anon), tente `supabase.from('users').select('*')` — deve vir vazio.
5. Como super admin, confirme que consegue ver todas as empresas (via claim `is_super_admin`).

Se todos passarem, o buraco crítico está fechado.
