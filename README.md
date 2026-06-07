# Coletor IA - Sistema de Logística Inteligente & SaaS 📦

O **Coletor IA** (ou Estoque Fácil) é um sistema completo tipo ERP / WMS focado na operação em Centros de Distribuição (CD), e que agora atua como uma plataforma **SaaS (Software as a Service) Multitenant**. 

O sistema provê:
1. **Painel Master (SaaS):** Gestão de clientes (empresas), finanças (mensalidades dinâmicas com planos Bronze, Prata e Ouro), equipe interna e avisos globais.
2. **Dashboard de Gestão (Desktop):** Controle em tempo real das rotas, estoque, usuários e aprovações para gestores das empresas clientes.
3. **App do Operador (Mobile-first):** Interface ultrarrápida de bipagem voltada para coletores de dados e smartphones (Android/iOS) na operação física.

---

## 🏢 Arquitetura Multitenant e Painel Master (SaaS)

A plataforma utiliza um modelo "Multitenant", onde uma única base de dados hospeda diversas empresas (clientes). O isolamento de dados é garantido na camada de aplicação através da vinculação obrigatória de `company_id`.

### Permissões do Master (`is_super_admin: true`)
Existe um nível global e supremo acima dos administradores das empresas. A equipe "Master" não pertence a nenhuma empresa cliente.

#### Funcionalidades Exclusivas do Painel Master (`/saas`):
- **Gestão de Empresas:** Cadastro de clientes vinculando o CNPJ automaticamente como identificador único (Slug), definição de limite máximo de usuários (`max_users`) e botão de Sair/Acessar o painel daquela empresa diretamente (Impersonate).
- **Planos Dinâmicos e Financeiro:** O sistema é balizado por três planos escaláveis (Bronze, Prata e Ouro).
  - Tabela dinâmica de preços padrão (`saas_plans`) no estilo "Planilha Excel" para reajustar mensalidade base e valores de usuários extras.
  - Lançamento de cobranças. Se um pagamento atrasar por mais de 5 dias corridos do vencimento (`due_date`), o sistema bloqueia automaticamente o acesso da empresa inativando-a.
- **Acessos (Equipe SaaS):** Gestão da equipe interna do SaaS com controle granular.
- **Anotações:** Mural de recados / bloco de notas global compartilhado entre a equipe Master.

---

## ⚙️ Funcionalidades Logísticas (Tenant / Empresa Cliente)

### Bloqueio por Planos (Feature Toggling)
Os recursos são destravados conforme a assinatura do cliente:
- **[Bronze]**: Focado no estoque interno. Libera apenas Dashboard, Produtos, Contagens e Recebimento.
- **[Prata]**: Focado em Expedição. Libera montagem de Cargas/Rotas e Conferência de doca.
- **[Ouro]**: Focado em Last-Mile. Libera App do Motorista, Assinatura na tela, Tracking e Histórico.

### 1. 🏭 Recebimentos (Inbound de Fábrica)
- O gestor cadastra a expectativa de recebimento manualmente ou importando uma planilha.
- **Bipagem às Cegas:** No fluxo de recebimento, o conferente tem autorização para ignorar bloqueios.

### 2. 🚛 Cargas e Entregas (Outbound)
- **Conferência de Expedição:** Existem **Travas Duras**. O conferente não consegue carregar itens não listados ou em quantidade superior ao pedido sem autorização.
- **Painel do Motorista:** O motorista visualiza a lista de entregas ordenada no celular.
- **Prova de Entrega (POD):** Coleta de assinatura digital na tela e motivo justificado para recusas.

### 3. 🚨 Liberações Remotas (Alçadas de Gestão)
- Se o operador tenta despachar divergências, o app emite um pedido de liberação.
- O Gestor visualizará um alerta na sala administrativa e pode "Aprovar" ou "Rejeitar" à distância.

### 4. 👥 Controle de Acessos da Empresa (RBAC)
Cada funcionário do cliente possui um "Perfil" (Role) e "Permissões Granulares":
- **Perfis Base:** Administrador (Admin), Gestor, Conferente, Motorista.

---

## 🎨 Engine de Temas e UI Dupla

O sistema possui uma renderização dupla focada em Performance vs Estética.
**Modo Moderno (Padrão):**
- Blur, Transparências, Glassmorphism, Cores por Planos (Bronze-Laranja, Prata-Cinza, Ouro-Amarelo).
**Modo Tradicional (Windows 2000):**
- Foco em rodar leve em coletores e celulares antigos desativando todo o processamento de animações.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Camada Global (SaaS)
- **`companies`**: `id`, `name`, `slug` (CNPJ auto-gerado), `cnpj`, `max_users`, `plan`, `active`.
- **`saas_plans`**: `id`, `name`, `base_price`, `base_users`, `extra_user_price`.
- **`company_payments`**: `company_id`, `amount`, `status`.

### Camada Local (Tenant)
Tabelas abaixo contém `company_id` referenciando `companies(id)` para isolamento.
- **`users`**: RBAC dos operadores + flag `is_super_admin`. (O sistema possui um roadmap congelado para transicionar a chave de autenticação de `username` para `email`).
- **`products`**: Tabela mestra de mercadorias.
- **`operations`**: `LOAD`, `RECEIPT`, `INVENTORY`.
- **`operation_items`**: Itens atrelados à operação.
- **`delivery_routes`** & **`delivery_clients`** & **`delivery_items`**.

---

## 🚀 Scripts e Inicialização

O repositório já contém configuração completa.

1. **Instalar Dependências:**
```bash
npm install
```

2. **Rodar Ambiente Local:**
```bash
npm run dev
```

3. **Gerar Build de Produção:**
```bash
npm run build
```

O ambiente já está conectado diretamente à API Key e URL no Supabase. Todos os `push` na branch `main` ativam o deploy automatizado via Vercel. 
