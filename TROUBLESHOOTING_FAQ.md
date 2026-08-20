# 🔧 GUIA DE TROUBLESHOOTING & FAQ - SL STOCK

## 📌 Problemas Comuns & Soluções

### 🔴 **Erro: "RLS Policy Violado" (403 Forbidden)**

**Sintomas**:
- Usuário recebe erro 403 ao tentar acessar dados
- Message: `new row violates row level security policy`

**Causas Mais Comuns**:
1. `company_id` não foi passado corretamente
2. RLS policy referenciando coluna errada
3. User não está vinculado a `company_id`
4. JWT token inválido/expirado

**Solução**:
```sql
-- Verificar policy
SELECT * FROM pg_policies 
WHERE tablename = 'sales_orders' 
AND policyname = 'select_own_company';

-- Verificar user vinculação
SELECT id, email, company_id FROM auth.users 
WHERE id = 'USER_ID_AQUI';

-- Testar RLS manualmente
SET app.current_company_id = 'COMPANY_ID';
SELECT * FROM sales_orders;
```

**Código React (verificar)**:
```typescript
// ✅ CORRETO - com try/catch
const { data, error } = await supabase
  .from('sales_orders')
  .select('*')
  .eq('company_id', company?.id)  // ← Sempre incluir company_id
  
if (error) {
  console.error('RLS violation:', error.code === 'PGRST100')
  // Handle 403 gracefully
}

// ❌ ERRADO - sem validar company_id
const { data } = await supabase.from('sales_orders').select('*')
```

---

### 🔴 **Erro: "Token Focus NFe Inválido ou Expirado"**

**Sintomas**:
- Usuário tenta emitir NF-e
- Erro: `Autenticação na Focus falhou` ou `Token inválido`

**Causas**:
1. Token expirado (geralmente tem 12 meses de validade)
2. Token errado (homologação vs produção)
3. Certificado digital expirado
4. CNPJ não cadastrado na Focus

**Solução**:

```typescript
// 1. Verificar token no painel Focus
// https://app.focus.com.br → Configurações → Token

// 2. No SL Stock, ir para Company Settings
// Admin → Configurações → Integração Fiscal

// 3. Testando a conexão
const testResult = await focusIntegrationApi.testConnection(newToken)
if (testResult.success) {
  // Token válido!
} else {
  // Erro: conferir token/ambiente
}

// 4. Se certificado expirado:
// - Gerar novo certificado A1 (.pfx)
// - Upload no painel Focus
// - Gerar novo token
```

**Verificação no Backend (Vercel)**:
```typescript
// api/focus-proxy.ts
async function testConnection() {
  const token = process.env.FOCUS_NFE_TOKEN
  const env = process.env.FOCUS_NFE_ENVIRONMENT // 'homologacao'
  
  if (!token || token.includes('undefined')) {
    return { error: 'Token não configurado em env vars' }
  }
  
  try {
    const res = await fetch(`https://${env}.focus.com.br/api/v2/empresas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return { success: res.ok, status: res.status }
  } catch (e) {
    return { error: e.message }
  }
}
```

---

### 🟡 **Erro: Pedido Aprovado Mas Não Aparece para Emitir NF-e**

**Sintomas**:
- Gestor aprova pedido ✅
- Admin vem buscar para emitir NF-e ❌
- Pedido não aparece na lista

**Causas**:
1. Cache desatualizado (React Query)
2. Filtro está escondendo (status, company_id)
3. Permissão do usuário (`can_manage_sales`)
4. Dados não sincronizados do offline

**Solução**:

```typescript
// 1. Limpar cache React Query
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ['sales_orders'] })

// 2. Verificar filtro da query
const { data } = await supabase
  .from('sales_orders')
  .select('*')
  .eq('company_id', company?.id)
  .eq('status', 'Aprovado')  // ← Filtrando por status
  .order('created_at', { ascending: false })

// 3. Verificar permissão
if (!user?.permissions?.can_manage_sales) {
  // Usuário não tem permissão!
  return <div>Acesso negado</div>
}

// 4. Se vindo de offline
// Aguardar sync automático ou:
const syncService = new OfflineSyncService()
await syncService.syncPendingChanges()
```

---

### 🟡 **Motorista Não Consegue Fazer Entrega (App Trava)**

**Sintomas**:
- Motorista abre rota
- Câmera não abre ou trava
- Assinatura não salva

**Causas**:
1. Permissão de câmera negada (Android/iOS)
2. IndexedDB cheio ou corrompido
3. Sync offline com conflito
4. Conectividade intermitente

**Solução**:

```typescript
// 1. Verificar permissão câmera (Android)
// AndroidManifest.xml deve ter:
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />

// 2. Limpar IndexedDB (último recurso)
// No console do browser:
await Dexie.delete() // Limpa todas as stores
window.location.reload()

// 3. Forçar sincronização
// No app mobile, abrir menu → Sincronizar

// 4. Verificar conectividade
const isOnline = navigator.onLine
if (!isOnline) {
  // App trabalha offline, sincroniza depois
  showNotification('App offline - mudanças sincronizarão depois')
}

// 5. Re-criar assinatura (canvas)
const canvas = canvasRef.current
if (!canvas) {
  // Canvas não iniciado!
  // Verificar ThemeProvider (podem estar bloqueando renderização)
}
```

**Mobile - Forçar Sincronização**:
```typescript
// src/services/OfflineSyncService.ts
async syncPendingChanges() {
  try {
    // 1. Sincroniza alterações locais
    const localChanges = await db.pendingChanges.toArray()
    
    for (const change of localChanges) {
      const result = await this.uploadChange(change)
      if (result.ok) {
        await db.pendingChanges.delete(change.id)
      }
    }
    
    // 2. Busca dados atualizados do servidor
    await this.downloadLatestData()
    
  } catch (e) {
    console.error('Sync failed:', e)
    showNotification('Sincronização falhou - tentaremos novamente')
  }
}
```

---

### 🟡 **Integração Maxiprod: Produtos Não Sincronizam**

**Sintomas**:
- Admin clica "Sincronizar Produtos"
- Nada acontece ou dá erro
- Estoque não atualiza

**Causas**:
1. Token Maxiprod inválido
2. Payload incorreto (moeda_id, operacao_id)
3. Produto não existe no Maxiprod
4. Rede/firewall bloqueando

**Solução**:

```typescript
// 1. Testar conexão Maxiprod
const testResult = await maxiprodApi.testConnection()

if (!testResult) {
  // Erro: Verificar token nas configurações da empresa
  // Ir para: Configurações → Integrações → Maxiprod
  return
}

// 2. Verificar configuração
const company = await companiesApi.getCompany(companyId)
if (!company.maxiprod_api_token) {
  throw new Error('Token Maxiprod não configurado')
}

// 3. Sincronização manual
const result = await maxiprodApi.syncProductsStock()
console.log(`Sincronizados ${result} produtos`)

// 4. Se falhar, verificar logs
const logs = await supabase
  .from('sync_logs')
  .select('*')
  .eq('type', 'maxiprod')
  .order('created_at', { ascending: false })
  .limit(5)
```

**Nota**: Sincronização bidirecional está **desabilitada por padrão** por segurança. Para ativar:

```typescript
// src/api/maxiprod.ts
async syncProductsStock() {
  // ⚠️ RISCO: Se ativar, pode sobrescrever preços/estoque
  console.warn('Sincronização desabilitada por padrão.')
  return 0
  
  // Para ativar:
  // const products = await fetchFromMaxiprod()
  // await updateProductsInSupabase(products)
}
```

---

### 🟢 **Aviso: Pedido Muito Lento Para Carregar**

**Sintomas**:
- Dashboard demora 5+ segundos
- Página de produtos congela
- "Loading..." indefinidamente

**Causas**:
1. Query sem índice
2. N+1 problem (múltiplas queries)
3. Cache expirado (React Query staleTime)
4. Banda internet lenta

**Otimização**:

```typescript
// ❌ RUIM: N+1 (faz 100+ queries)
const orders = await supabase.from('sales_orders').select('*')
for (const order of orders) {
  order.customer = await supabase
    .from('customers')
    .select('*')
    .eq('id', order.customer_id)
    .single()
}

// ✅ BOM: Fetch com join
const { data: orders } = await supabase
  .from('sales_orders')
  .select(`
    *,
    customer:customers(*),
    items:sales_order_items(*, product:products(*))
  `)

// ✅ React Query com cache
const { data } = useQuery({
  queryKey: ['sales_orders', company?.id],
  queryFn: async () => ordersApi.getOrders(),
  staleTime: 5 * 60 * 1000, // 5 min
  cacheTime: 30 * 60 * 1000, // 30 min
})

// ✅ Índices no banco (SQL)
CREATE INDEX idx_sales_orders_company_id 
  ON sales_orders(company_id);

CREATE INDEX idx_sales_orders_status 
  ON sales_orders(company_id, status);

-- Verificar índices
SELECT * FROM pg_indexes 
WHERE tablename = 'sales_orders';
```

---

## ❓ FAQ (Perguntas Frequentes)

### **P: Posso desabilitar RLS para melhorar performance?**

**R**: ⚠️ **NÃO!** RLS é crítico para segurança multi-tenant. Desabilitar é **extremamente perigoso**:
- Usuário A conseguiria ver dados da Empresa B
- Violação total de privacidade
- Breach de dados confidenciais
- Violação de LGPD/GDPR

Se performance é problema, a solução é:
- ✅ Adicionar índices
- ✅ Otimizar queries
- ✅ Aumentar resources do PostgreSQL
- ✅ Usar Redis cache (se necessário)

---

### **P: Posso usar senhas "simples" como "123456"?**

**R**: Sim, **apenas para login inicial**. O sistema força mudança:

```typescript
// Login.tsx - Após autenticação bem-sucedida
if (user.password === 'default_hash_123456') {
  // Força redirecionamento para /trocar-senha
  navigate('/trocar-senha', { replace: true })
}
```

**Processo**:
1. Admin cria usuário com senha padrão
2. Usuário faz primeiro login
3. Sistema detecta e força /trocar-senha
4. Usuário só consegue acessar depois de nova senha

---

### **P: Quanto tempo o cache offline dura?**

**R**: Depende da configuração:

```typescript
// src/pages/SalesApp/index.tsx
const { data } = useQuery({
  queryKey: ['sales_data', company?.id],
  queryFn: fetchSalesData,
  staleTime: 1 * 60 * 60 * 1000,     // 1 hora
  cacheTime: 24 * 60 * 60 * 1000,    // 24 horas
  networkMode: 'always'              // Revalidar online
})

// IndexedDB (Dexie) - Sem expiração automática
// Limpar manualmente ou com versioning
```

**Recomendação**: TTL 1-4 horas para dados críticos (estoque, tabelas preço).

---

### **P: Preciso sincronizar NF-e em tempo real?**

**R**: Não é necessário. Focus NFe usa **webhooks** para notificações:

```typescript
// api/webhooks/focus-nfe.ts
export default async (req, res) => {
  const event = req.body  // { chave_nfe, status, protocolo, ... }
  
  // 1. Atualizar nfe_records no BD
  await supabase
    .from('nfe_records')
    .update({ status_sefaz: event.status })
    .eq('chave_acesso', event.chave_nfe)
  
  // 2. Notificar usuário em tempo real (Supabase realtime)
  await supabase.from('notifications').insert({
    user_id: event.user_id,
    message: `NF-e ${event.chave_nfe} autorizada!`
  })
  
  res.json({ success: true })
}
```

**Fluxo**:
```
1. Emitir → Status = 'Processando'
2. Focus recebe de SEFAZ → Webhook enviado
3. Sistema atualiza → Status = 'Autorizada'
4. Usuário vê notificação em tempo real
```

---

### **P: Como habilitar o Modo Retro (Windows 2000)?**

**R**: No app, menu → Configurações → Tema → "Modo Tradicional (Windows 2000)"

```typescript
// src/components/ThemeProvider.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'modern' | 'retro'>('modern')
  
  return (
    <div className={theme === 'retro' ? 'theme-retro' : 'theme-modern'}>
      {children}
    </div>
  )
}

// src/pages/App.css
.theme-retro {
  /* Desabilita GPU transitions para hardware antigo */
  --disable-animations: true;
  background: #C0C0C0;
  color: #000;
  font-family: 'MS Sans Serif', Tahoma, Arial;
}

.theme-retro .button {
  border: 2px solid;
  border-color: #dfdfdf #808080 #808080 #dfdfdf;
  background: #c0c0c0;
}
```

**Benefício**: Coletores de dados robustos antigos conseguem ler código de barras sem travamento.

---

### **P: Qual é o limite de usuários por empresa?**

**R**: Configurável no SaaS, definido por `companies.max_users`:

```typescript
// Verificar limite na autenticação
const company = await supabase
  .from('companies')
  .select('max_users')
  .eq('id', companyId)
  .single()

const activeUsers = await supabase
  .from('users')
  .select('id')
  .eq('company_id', companyId)
  .eq('active', true)

if (activeUsers.length >= company.max_users) {
  throw new Error('Limite de usuários atingido!')
}
```

**Planos**:
- Bronze: 5 usuários
- Prata: 15 usuários
- Ouro: 50 usuários
- Platina: Ilimitado

---

### **P: Como monitorar a saúde do sistema?**

**R**: Recomendações:

1. **Sentry** (Error tracking)
   ```typescript
   import * as Sentry from "@sentry/react"
   
   Sentry.init({
     dsn: "https://..@sentry.io/...",
     environment: process.env.NODE_ENV
   })
   ```

2. **Database Monitoring**
   ```sql
   -- Verificar tamanho do banco
   SELECT pg_size_pretty(pg_database_size('slstock'))
   
   -- Tabelas maiores
   SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables
   ORDER BY pg_total_relation_size DESC
   ```

3. **API Performance**
   ```typescript
   // Middleware Vercel
   export const runtimeConfig = {
     timeout: 30,  // 30 segundos
   }
   ```

4. **Real-time Alerts**
   - Setup webhooks no Slack para erros críticos
   - Monitorar CPU/Memory de PostgreSQL
   - Alertar se RLS bloqueando muitas queries

---

### **P: Posso exportar todos os dados de um cliente?**

**R**: Sim, com GDPR compliance:

```typescript
// src/pages/Master/DataExport.tsx
async function exportCompanyData(companyId: string) {
  // 1. Busca todos os dados (respeitando RLS)
  const data = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()
  
  // 2. Gera XLSX
  const workbook = XLSX.utils.book_new()
  
  // 3. Adiciona sheets
  XLSX.utils.book_append_sheet(workbook, 
    XLSX.utils.json_to_sheet(data.orders), 
    'Pedidos'
  )
  
  // 4. Download
  XLSX.writeFile(workbook, `export_${companyId}.xlsx`)
}
```

---

### **P: Quais são as responsabilidades de cada role?**

**R**: Veja matriz de permissões no arquivo [MAPA_VISUAL_ARQUITETURA.md](MAPA_VISUAL_ARQUITETURA.md#matriz-de-permissões-rbac).

---

## 🚨 Checklist de Segurança

```
☐ HTTPS habilitado em produção
☐ JWT token com expiração configurada
☐ Rate limiting ativo em endpoints
☐ CORS whitelist apenas domínios autorizados
☐ RLS policies testadas e auditadas
☐ Senhas hasheadas com SHA-256
☐ Tokens sensíveis em env vars (não em código)
☐ LGPD/GDPR compliance documentado
☐ Backup automático diário
☐ Logs centralizados (ELK/Splunk/etc)
☐ Testes de segurança (OWASP Top 10)
☐ SSL/TLS certificado válido
☐ WAF configurado (CloudFlare/AWS Shield)
```

---

## 📞 Suporte Técnico

**Contatos**:
- 🐛 **Bugs**: Abrir issue no GitHub
- 🚀 **Features**: Criar PR com discussion
- 💬 **Dúvidas**: Slack #dev-slstock
- 📧 **Urgente**: suporte@slstock.com.br

---

*FAQ atualizado em 2026-08-20*
