# Plano de Migração de Autenticação e Segurança (Staging -> Produção)

Este é o plano de execução detalhado baseado na auditoria técnica (`AUDITORIA-E-PLANO-DE-CORRECAO.md`). O objetivo principal é fechar a brecha crítica de segurança migrando o sistema para o **Supabase Auth** e ativando o isolamento de dados **Row Level Security (RLS)** por `company_id`.

## ⚠️ User Review Required

> [!WARNING]
> **Ordem Crítica:** O passo de ligar a RLS (Etapa 2) **nunca** pode ser executado antes da migração de usuários (Etapa 1), caso contrário todo o sistema perderá acesso ao banco de dados.
> Faremos todos os testes no banco de **Staging** (credenciais já fornecidas) antes de pensar em Produção.

> [!IMPORTANT]
> A tela de login mudará. Atualmente ela usa o "username". Na nova arquitetura baseada no Supabase Auth, o padrão é utilizar "email". Precisamos da sua decisão sobre a UX do login (ver Open Questions).

## Open Questions

> [!CAUTION]
> 1. **UX do Login:** Você prefere que eu troque o campo visual da tela de login de "Usuário" para "E-mail" (recomendado pelo Supabase), ou prefere manter visualmente como "Usuário" e eu faço uma conversão invisível no código para um e-mail técnico (ex: `joao@estoquefacil.local`)?
> 2. **Execução de SQL no Staging:** Como você me enviou as chaves de Staging (URL, anon key, service_role), eu posso conectar ao banco para rodar o script em Javascript. Porém, para rodar as *Migrations SQL* (`20260615000000_auth_integration.sql`, etc), eu precisaria acessar diretamente o banco via Postgres connection string (ex: `postgresql://postgres...`) ou você mesmo terá que colar esses arquivos no **SQL Editor** do painel do Supabase de Staging. Você prefere colar lá ou quer me passar a connection string do banco de Staging?

## Proposed Changes

### Etapa 0: Saneamento Local
- Atualizar o `.gitignore` para bloquear chaves e arquivos sensíveis.
- Remover arquivos de senhas, relatórios `.txt`, e planilhas `.csv`/`.xlsx` reais que foram "vazados" para dentro da pasta do código.

### Etapa 1: Preparação do Auth (Requer ações no painel)
- **SQL 1:** Aplicar `20260615000000_auth_integration.sql` no Supabase (não-destrutivo, prepara a tabela `users` para receber o Auth).
- **Ação Manual:** Você deve ir em *Authentication → Hooks → Custom Access Token* e selecionar a função `custom_access_token_hook`.
- **Migração:** Eu rodarei o script `migrate-users-to-auth.mjs` usando a `service_role` de Staging que você me enviou, transferindo os usuários atuais para a arquitetura segura.

### Etapa 2: Endurecimento (RLS, Índices e RPCs)
- **SQL 2:** Aplicar `20260615000001_rls_policies.sql` (Liga a RLS de forma estrita em todo o banco).
- **SQL 3:** Aplicar `20260615000002_indexes.sql` (Melhora a performance de queries por empresa).
- **SQL 4:** Aplicar `20260615000003_atomic_rpcs.sql` (Impede "race conditions" ao fechar cargas no estoque).

### Etapa 3: Refatoração Front-end
Implementarei as mudanças na branch separada `fix/auth-rls`.

#### [MODIFY] `src/contexts/AuthContext.tsx`
- Substituir a autenticação caseira por chamadas nativas do `supabase.auth.signInWithPassword`.
- Remover a variável global `currentCompanyId` (o controle de sessão agora é via JWT inviolável).

#### [MODIFY] `src/pages/Login.tsx`
- Atualizar os campos e a lógica de verificação da variável `must_change_password`.

#### [MODIFY] `src/api/*` (Todos os arquivos de API)
- Remover todos os filtros inseguros baseados no código do front (`.eq('company_id', currentCompanyId)`). O banco passará a forçar essa segurança.
- Trocar todas as leituras e gravações matemáticas de estoque pelas funções RPC (ex: `increment_stock`).

## Verification Plan

### Manual Verification
Após finalizar o front-end, testaremos diretamente em sua máquina usando a URL localhost apontada para o banco de Staging:
1. Tentar logar como um usuário da Empresa A e verificar se apenas dados da Empresa A aparecem.
2. Injetar um ID conhecido de um produto da Empresa B e tentar forçar uma alteração de quantidade no console (deve falhar e retornar erro de segurança).
3. Testar a conferência de carga simultânea em duas abas para checar a atomicidade de atualização do estoque.
4. Tentar ler os dados da tabela `users` sem estar logado (deve retornar array vazio).
