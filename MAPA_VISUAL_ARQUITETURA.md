# 🗺️ MAPA VISUAL DO SISTEMA - SL STOCK

## Arquitetura em Camadas

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         🖥️ FRONTEND LAYER                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   React Pages    │  │   React State    │  │   UI Components  │         │
│  │  (11+ Modules)   │  │   (Zustand/      │  │  (Shadcn + Tail) │         │
│  │                  │  │   React Query)   │  │                  │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
└───────────┼────────────────────┼────────────────────┼────────────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │ (REST API + Real-time)
┌────────────────────────────────▼────────────────────────────────────────────┐
│                       🌐 API LAYER (Supabase)                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  Auth & Users    │  │  CRM & Sales     │  │  Logistics       │         │
│  │                  │  │                  │  │                  │         │
│  │ - Login          │  │ - Customers      │  │ - Routes         │         │
│  │ - RBAC           │  │ - Orders         │  │ - Deliveries     │         │
│  │ - Permissions    │  │ - Rep Regions    │  │ - Operations     │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                     │                   │
│  ┌────────▼──────────────────────▼─────────────────────▼─────────┐        │
│  │                    🗄️ ROW LEVEL SECURITY (RLS)                │        │
│  │  Every query filtered by: company_id = current_user.company_id│        │
│  └─────────────────────────────────────────────────────────────────┘       │
│           │                     │                     │                   │
│  ┌────────▼──────────────────────▼─────────────────────▼─────────┐        │
│  │           💾 POSTGRESQL DATABASE (Unified)                     │        │
│  │                                                                │        │
│  │  Módulos: CRM, Sales, Fiscal, Logistics, Comodatos,Finance   │        │
│  └────────────────────────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────────────────────┘
            ▲                      ▲                      ▲
            │                      │                      │
┌───────────┼──────────┐  ┌────────┼──────────┐  ┌───────┼──────────┐
│  🏛️ FOCUS NFe      │  │🏢 MAXIPROD       │  │🗺️ GOOGLE MAPS   │
│  (Emissão Fiscal)  │  │(ERP Externo)     │  │(Geocoding)       │
│                    │  │                  │  │                  │
│ ✅ NF-e            │  │✅ Sync Stock     │  │✅ Routing        │
│ ✅ NFC-e           │  │✅ Sync Products  │  │✅ Optimization   │
│ ✅ MDF-e           │  │⏳ Order Send     │  │                  │
└────────────────────┘  └──────────────────┘  └──────────────────┘
         ▲                      ▲                      ▲
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │ (HTTP Proxy)
                    ┌───────────▼─────────────┐
                    │  ⚡ VERCEL API GATEWAY  │
                    │  (Serverless Functions) │
                    └─────────────────────────┘
```

---

## Fluxo de Dados: Venda até Entrega

```
╔════════════════════════════════════════════════════════════════════════════╗
║                     CICLO COMPLETO DE VENDA                               ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1️⃣ VENDEDOR CRIA PEDIDO (SalesApp - OFFLINE READY)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Vendedor no celular → Abre SalesApp                                       │
│  ├─ App funciona offline (IndexedDB cache)                                 │
│  ├─ Seleciona Cliente (pre-carregado)                                      │
│  ├─ Adiciona Produtos (tabela de preço customizada)                        │
│  └─ Salva como Rascunho                                                    │
│                                                                             │
│  [Estado no BD] sales_orders: status = 'Digitação'                         │
│  [Storage]      IndexedDB + Supabase (quando volta online)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2️⃣ GESTOR APROVA PEDIDO (Dashboard)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Gestor entra no Dashboard → Aba Pedidos Pendentes                         │
│  ├─ Revisa valores e itens                                                │
│  ├─ Clica "Aprovar"                                                        │
│  └─ Sistema valida: estoque, limite crédito, etc                          │
│                                                                             │
│  [Estado no BD] sales_orders: status = 'Aprovado'                          │
│  [Evento]       React Query refetch em tempo real                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3️⃣ ADMIN EMITE NF-e (Fiscal Module)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Admin abre Pedido → Clica "Emitir NF-e"                                   │
│  ├─ Dialog abre com resumo fiscal                                          │
│  ├─ Valida CFOP, CST, informações de expedição                            │
│  ├─ Clica "Enviar para SEFAZ"                                             │
│  └─ Sistema monta JSON NF-e                                               │
│                                                                             │
│  ┌─ Backend (Vercel) ────────────┐                                         │
│  │ 1. Valida dados              │                                         │
│  │ 2. Pega token Focus (seguro) │                                         │
│  │ 3. Envia para Focus API      │                                         │
│  │ 4. Focus envia para SEFAZ    │                                         │
│  │ 5. SEFAZ retorna protocolo   │                                         │
│  └──────────────────────────────┘                                          │
│                                                                             │
│  [Estado no BD] sales_orders: status = 'Faturado'                          │
│  [Novo Record]  nfe_records: id, chave_acesso, protocolo                  │
│  [Arquivo]      XML + PDF salvos                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4️⃣ GESTOR CRIA ROTA DE ENTREGA (Deliveries)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Gestor entra em Entregas → "Nova Rota"                                    │
│  ├─ Seleciona motorista + veículo                                          │
│  ├─ Adiciona pedidos faturados (filtro automático)                         │
│  ├─ Sistema otimiza sequência (Google Maps API)                            │
│  └─ Salva rota                                                             │
│                                                                             │
│  [Novo Record]  delivery_routes: id, status='planning'                     │
│  [Sub-records]  delivery_clients: pontos de parada                         │
│  [Sub-records]  delivery_items: itens por cliente                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5️⃣ MOTORISTA FAZ ENTREGA (Mobile)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Motorista abre App → Minhas Rotas → Começa rota                           │
│  ├─ GPS ativa (latitude/longitude tracking)                                │
│  ├─ Chega no primeiro cliente                                              │
│  ├─ Clica em cliente → Abre lista de itens                                 │
│  ├─ LÊ QR/código de barras (câmera ativada)                                │
│  ├─ Sistema marca item: ✅ Entregue / ⚠️ Faltante / 🔴 Danificado         │
│  ├─ Colhe assinatura digital (canvas)                                      │
│  └─ Próximo cliente                                                         │
│                                                                             │
│  [Atualizações]  delivery_items: status, assinatura_data_uri              │
│  [Tracking]      delivery_routes: GPS trace, timestamps                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6️⃣ ROTA CONCLUÍDA (Automático)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Motorista fecha rota → Sistema valida:                                    │
│  ├─ Todos os clientes visitados? ✅                                        │
│  ├─ Todas assinaturas colhidas? ✅                                         │
│  └─ Atualiza estado                                                        │
│                                                                             │
│  [Estado no BD]  delivery_routes: status = 'completed'                     │
│  [Cascade]       Todos pedidos: status = 'Entregue'                        │
│  [Sync]          Sistema sincroniza com estoque                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Segurança em Camadas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 1: CLIENTE (Browser/Mobile)                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Criptografia SHA-256 (crypto.subtle.digest)                            │
│     - Senha → SHA-256 ANTES de enviar ao servidor                          │
│     - Nunca transmite senha em plain text                                   │
│                                                                             │
│  ✅ HTTPS obrigatório                                                       │
│     - Todos os requests criptografados em trânsito                         │
│                                                                             │
│  ✅ Token Supabase (JWT)                                                    │
│     - Armazenado em localStorage                                           │
│     - Enviado em Authorization header                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 2: GATEWAY (Vercel - API Proxy)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Validação de entrada (zod/joi)                                          │
│     - Rejeita payloads malformados                                         │
│                                                                             │
│  ✅ Rate limiting                                                           │
│     - Previne force brute attacks                                          │
│                                                                             │
│  ✅ Token Focus/Maxiprod seguro (environment variables)                     │
│     - Nunca expõe chaves no código                                         │
│     - Proxy transparente para cliente                                      │
│                                                                             │
│  ✅ CORS configurado                                                        │
│     - Apenas domínios whitelistados                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 3: BANCO DE DADOS (Supabase - PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔐 ROW LEVEL SECURITY (RLS) - CRÍTICO!                                    │
│                                                                             │
│     Policy Exemplo:                                                        │
│     ┌─────────────────────────────────────────────────────┐               │
│     │ CREATE POLICY select_own_company ON sales_orders   │               │
│     │ FOR SELECT USING (                                 │               │
│     │   company_id = auth.uid()::uuid            ❌      │               │
│     │   company_id = (SELECT company_id FROM users)  ✅  │               │
│     │ )                                                  │               │
│     └─────────────────────────────────────────────────────┘               │
│                                                                             │
│  ✅ Criptografia de senhas (SHA-256 salvo no BD)                           │
│     - Comparação: SHA256(input) = senha_no_bd                             │
│                                                                             │
│  ✅ Soft deletes (deleted_at timestamp)                                    │
│     - Dados históricos conservados                                         │
│                                                                             │
│  ✅ Auditoria (created_by, created_at, updated_by, updated_at)             │
│     - Rastreabilidade completa                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ CAMADA 4: APLICAÇÃO (React Context)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ AuthContext valida:                                                     │
│     - Token JWT válido?                                                    │
│     - Company existe?                                                      │
│     - User ativo?                                                          │
│                                                                             │
│  ✅ Route Guards:                                                           │
│     - PlanGuard: Valida se plano SaaS permite feature                      │
│     - Protected routes: Rejeita acesso sem token                           │
│                                                                             │
│  ✅ RBAC (Role-Based Access Control):                                      │
│     - Renderiza UI baseado em permissões                                   │
│     - Botão "Emitir NF-e" só aparece para admin                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Módulos & Dependências

```
                    ┌─────────────────────────────────┐
                    │      App.tsx (Router)            │
                    │   - React Router DOM v7          │
                    │   - Route Guards                 │
                    └──────────────┬──────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
    ┌────▼────┐          ┌────────▼──────────┐      ┌──────▼──────┐
    │ Login   │          │  Dashboard        │      │  SalesApp   │
    └────┬────┘          └────────┬──────────┘      └──────┬──────┘
         │                        │                       │
    ┌────▼─────────────┬──────────▼──────────┬──────────────▼───────┐
    │                  │                     │                      │
┌───▼──┐      ┌──────▼──┐      ┌──────────┬─▼────┐      ┌──────────▼────┐
│Auth  │      │Products │      │Deliveries│ Fiscal│      │ Comodatos    │
│      │      │         │      │          │      │      │              │
│ CRM  │◄────►│ Finance │◄────►│ Counts   │ Sales│◄────►│ Equipments   │
│      │      │         │      │          │      │      │              │
└───┬──┘      └──────┬──┘      └──────────┴─┬────┘      └──────────┬────┘
    │                │                      │                      │
    └────────────────┼──────────────────────┼──────────────────────┘
                     │                      │
              ┌──────▼────────┐      ┌──────▼───────┐
              │ AuthContext   │      │ React Query  │
              │ (Global State)│      │ (Cache)      │
              └──────┬────────┘      └──────┬───────┘
                     │                      │
                     └──────────┬───────────┘
                                │
                     ┌──────────▼────────────┐
                     │ Supabase Client API   │
                     │  - queries (SELECT)   │
                     │  - mutations (INSERT) │
                     │  - subscriptions      │
                     └──────────┬────────────┘
                                │
                     ┌──────────▼────────────┐
                     │   PostgreSQL BD      │
                     │   (RLS Policies)     │
                     └──────────────────────┘
```

---

## Matriz de Permissões (RBAC)

| Permissão | Master | Admin | Gestor | Conferente | Motorista | Vendedor |
|-----------|--------|-------|--------|------------|-----------|----------|
| Ver Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gerenciar Cargas | ✅ | ✅ | ✅ | ⚠️ R | ✅ | ❌ |
| Emitir NF-e | ✅ | ✅ | ⚠️ R | ❌ | ❌ | ❌ |
| Conferir Mercadoria | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fazer Entrega | ✅ | ✅ | ⚠️ R | ❌ | ✅ | ❌ |
| Criar Pedido | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Usar SalesApp | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gerenciar Usuários | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Empresa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar SaaS | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legenda**: ✅ Acesso Completo | ⚠️ R = Acesso Restrito (read-only) | ❌ Sem Acesso

---

## Fluxo de Dados: Integração Focus NFe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  EMISSÃO DE NF-e (Integração Focus)                         │
└──────────────────────────────────────────────────────────────────────────────┘

   React Component                 Vercel API                    Focus API
   (src/pages/Fiscal)              (api/focus-proxy.ts)          (3rd party)

        │                                 │                           │
        │  1. Clica "Emitir NF-e"        │                           │
        ├──────────────────────────────►│                           │
        │                                │ 2. Monta JSON NF-e        │
        │                                ├─────────────────────────►│
        │                                │ (CNPJ, Produtos,         │
        │                                │  Impostos, etc)           │
        │                                │                           │
        │                                │ 3. Focus valida          │
        │                                │    + monta XML             │
        │                                │                           │
        │                                │ 4. Envia para SEFAZ       │
        │                                │    (autoridade fiscal)    │
        │                                │                           │
        │                                │◄────────────────────────┤
        │                                │ 5. Retorna protocolo    │
        │                                │    + chave acesso        │
        │                                │                          │
        │◄──────────────────────────────┤                          │
        │ 6. Salva no BD:               │                          │
        │    - nfe_records              │                          │
        │    - chave_acesso             │                          │
        │    - protocolo                │                          │
        │    - status_sefaz             │                          │
        │                               │                          │
        │ 7. Atualiza order:            │                          │
        │    status = 'Faturado'        │                          │
        │                               │                          │
        │ 8. Exibe sucesso              │                          │
        │    + botão "Baixar PDF"       │                          │
        │                               │                          │
        ├─ [WEBHOOK] Focus envia ──────►│                          │
        │   atualizações de status      │  Atualiza nfe_records    │
        │   (consulta periódica)        │                          │
        │                               │                          │
```

**Segurança Focus**:
- ✅ Token armazenado em Vercel env var (nunca no cliente)
- ✅ Requests assinados com HMAC
- ✅ Validação de CNPJ/empresa
- ✅ Rate limit ~100 req/min

---

## Checklist de Deployment

```
☐ Variáveis de Ambiente (Vercel)
  ☐ SUPABASE_URL
  ☐ SUPABASE_KEY
  ☐ FOCUS_NFE_TOKEN
  ☐ FOCUS_NFE_ENVIRONMENT (homologacao/producao)
  ☐ MAXIPROD_* (se usando)
  ☐ GOOGLE_MAPS_API_KEY

☐ Banco de Dados
  ☐ Migrations executadas
  ☐ RLS policies ativadas
  ☐ Índices criados (principalmente company_id)
  ☐ Backups automáticos configurados

☐ Frontend
  ☐ npm run build (sem erros)
  ☐ npm run lint (sem warnings)
  ☐ Lighthouse score > 80
  ☐ Testes E2E passando

☐ Mobile (iOS/Android)
  ☐ Capacitor sync (npx cap sync)
  ☐ Assets bundle inclusos
  ☐ Permissões de câmera configuradas
  ☐ Icons e splash screens

☐ Segurança
  ☐ HTTPS habilitado
  ☐ CORS configurado
  ☐ Rate limiting ativo
  ☐ WAF (Web Application Firewall) se necessário

☐ Monitoring
  ☐ Sentry configurado
  ☐ Logs centralizados
  ☐ Alertas de erro

☐ SaaS
  ☐ Primeira empresa criada em /saas
  ☐ Plano testado
  ☐ Limite max_users validado
  ☐ Billing integrado
```

---

*Diagrama atualizado em 2026-08-20*
