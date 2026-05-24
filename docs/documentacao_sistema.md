# 📦 Coletor IA (Estoque Fácil) - Documentação do Sistema

O **Coletor IA** (também denominado *Estoque Fácil*) é uma plataforma ERP/WMS SaaS Multitenant completa, projetada para gerenciar operações em Centros de Distribuição (CD), armazéns e logística de última milha (Last-Mile). O sistema se destaca por sua renderização dupla de interface (Modo Moderno vs. Modo Tradicional Windows 2000) e mecanismos eficientes de travas duras e liberação remota em tempo real.

---

## 🏗️ 1. Arquitetura Tecnológica e Engenharia

A plataforma foi desenvolvida utilizando tecnologias modernas que garantem velocidade, baixo consumo de banda e excelente performance em dispositivos robustos e móveis.

### Core Stack
*   **Frontend**: React 18 + TypeScript + Vite (alta velocidade de compilação e carregamento).
*   **Banco de Dados & Backend BaaS**: Supabase (PostgreSQL).
*   **Estilização**: Tailwind CSS (design responsivo e otimizado).
*   **Roteamento**: React Router DOM v6 com proteção de rotas integrada ao contexto de autenticação.
*   **Estado & Cache**: React Query (`@tanstack/react-query`) para cache dinâmico e sincronização de dados em tempo real.
*   **Leitura/Geração de Arquivos**: Biblioteca `xlsx` para importação e exportação de dados via planilhas nativas.

### Segurança e Criptografia
Para mitigar os riscos de segurança sem a necessidade de manter sessões complexas de infraestrutura, o sistema adota:
*   **Criptografia no Cliente**: As senhas dos usuários são transformadas em hash SHA-256 usando a API nativa do navegador (`crypto.subtle`) antes de trafegarem pela rede e serem gravadas/validadas no banco de dados.
*   **Isolamento de Dados (Multitenant)**: Embora a base do PostgreSQL seja unificada, a segurança lógica e a separação entre empresas (tenants) são impostas na camada de aplicação através da amarração do `company_id` em todas as operações e consultas API. O RLS do Supabase é mantido desativado para chaves anônimas (`anon_key`) conforme regras em [fix_rls.sql](file:///c:/Users/lucas/OneDrive/Projeto%20IA/coletor/fix_rls.sql), garantindo que as mutations no cliente comandem a lógica de gravação rápida.
*   **Troca de Senha Obrigatória**: Usuários recém-criados possuem a senha padrão `123456`. Ao fazer o primeiro login, a rota protegida detecta a senha padrão e força o redirecionamento para a tela `/trocar-senha`, impedindo o uso do dashboard antes da atualização.

---

## 🗄️ 2. Modelagem do Banco de Dados (Supabase/PostgreSQL)

A modelagem é dividida em duas camadas lógicas: **SaaS Global** e **Tenant Local**.

### A. Camada SaaS Global (Gestão do Ecossistema)

#### `companies` (Empresas Clientes)
Armazena os inquilinos/clientes do sistema.
*   `id` (UUID, PK, Default: `gen_random_uuid()`)
*   `slug` (TEXT, Unique, Not Null) - Identificador da empresa na URL/Login (Ex: `delicius-ba`).
*   `name` (TEXT, Not Null) - Razão Social / Nome Fantasia.
*   `cnpj` (TEXT, Nullable) - Registro comercial.
*   `max_users` (INTEGER, Default: 5) - Limite de usuários ativos.
*   `active` (BOOLEAN, Default: true) - Status de ativação do cliente.
*   `created_at` (TIMESTAMP, Not Null)

#### `company_payments` (Controle Financeiro)
Registra o histórico de mensalidades e status financeiro dos clientes SaaS.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Cascade)
*   `amount` (DECIMAL(10,2), Not Null) - Valor da mensalidade.
*   `status` (TEXT, Default: 'pendente') - Estados: `'pendente'`, `'pago'`, `'atrasado'`.
*   `due_date` (DATE, Not Null) - Data de vencimento da fatura.
*   `paid_at` (TIMESTAMP, Nullable) - Data do pagamento efetivo.
*   `notes` (TEXT, Nullable)
*   `created_at` (TIMESTAMP)

#### `system_notes` (Mural Administrativo do SaaS)
Notas internas de comunicação compartilhadas entre a equipe do painel Master.
*   `id` (UUID, PK)
*   `author_id` (UUID, FK -> `users.id`)
*   `author_name` (TEXT, Not Null)
*   `content` (TEXT, Not Null)
*   `created_at` (TIMESTAMP)

---

### B. Camada Tenant Local (Operações Logísticas)
Todas as tabelas desta camada contêm a coluna `company_id` e chaves estrangeiras apropriadas.

#### `users` (Funcionários / Operadores)
Controle de acessos locais e globais (Master).
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Nullable para Admins Globais)
*   `is_super_admin` (BOOLEAN, Default: false) - Define se o usuário pertence à equipe Master do SaaS.
*   `name` (TEXT, Not Null)
*   `username` (TEXT, Not Null, Unique)
*   `password_hash` (TEXT, Not Null)
*   `role` (TEXT, Not Null) - Perfis: `'admin'`, `'gestor'`, `'conferente'`, `'motorista'`.
*   `active` (BOOLEAN, Default: true)
*   `permissions` (JSONB, Not Null) - Flags granulares de funcionalidade.
*   `created_at` (TIMESTAMP)

#### `products` (Catálogo de Mercadorias)
*   `id` (UUID, PK)
*   `company_id` (UUID, FK -> `companies.id`, Not Null)
*   `code` (TEXT, Not Null) - SKU / Código do produto.
*   `external_code` (TEXT, Nullable)
*   `description` (TEXT, Not Null)
*   `group_name` (TEXT, Nullable) - Categoria/Grupo de produto.
*   `stock` (NUMERIC, Not Null, Default: 0) - Estoque atual.
*   `batch` (TEXT, Nullable) - Lote.
*   `unit_weight` (NUMERIC, Nullable) - Peso unitário.
*   `box_quantity` (NUMERIC, Nullable) - Multiplicador de embalagem (Ex: caixa com 12).
*   *Restrição*: Unique combinando `(company_id, code)` para garantir SKU exclusivo por empresa.

#### `operations` (Documentos de Movimentação)
Registra o cabeçalho de cargas, recebimentos e inventários.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK)
*   `type` (TEXT, Not Null) - Tipos: `'LOAD'` (Expedição), `'INVENTORY'` (Inventário), `'BLIND_RECEIPT'` / `'RECEIPT'` (Recebimento).
*   `status` (TEXT, Not Null) - Status: `'pending'`, `'in_progress'`, `'dispatched'`, `'completed'`, `'cancelled'`.
*   `load_number` (TEXT, Nullable) - Identificador numérico da carga (romaneio).
*   `driver_name` (TEXT, Nullable)
*   `vehicle_plate` (TEXT, Nullable)
*   `notes` (TEXT, Nullable)
*   `created_at` (TIMESTAMP)

#### `operation_items` (Itens de Movimentação)
Controle quantitativo previsto versus realizado.
*   `id` (UUID, PK)
*   `company_id` (UUID, FK)
*   `operation_id` (UUID, FK -> `operations.id`)
*   `product_id` (UUID, FK -> `products.id`)
*   `product_code` (TEXT, Not Null)
*   `description` (TEXT, Not Null)
*   `quantity_expected` (NUMERIC, Not Null) - Quantidade planejada.
*   `quantity_scanned` (NUMERIC, Not Null, Default: 0) - Quantidade bipada.
*   `status` (TEXT, Default: 'pending') - Estados: `'pending'`, `'ok'`, `'divergent'`.

#### `delivery_routes`, `delivery_clients` & `delivery_items` (Módulo Last-Mile)
Tabelas específicas para controle das paradas do motorista em trânsito e conferências em cliente:
*   `delivery_routes`: Mapeia a rota do motorista vinculada a uma operação (`LOAD`).
*   `delivery_clients`: Paradas físicas do caminhão. Contém campos para assinatura digital (`signature_data` em Base64), nome do recebedor (`receiver_name`) e coordenadas.
*   `delivery_items`: Mercadorias a serem conferidas na porta do cliente. Possui campos de aprovação remota (`approval_status` como `'approved' | 'pending' | 'rejected'`, e `requested_qty` para solicitações de excedente).

#### `inventory_counts` & `inventory_count_items` (Auditoria e Ajuste)
Mapeia as contagens de inventário oficial do armazém e logs de divergência para conciliação física e contábil.

---

## 🎨 3. Motor de Temas e UI Dupla (Moderno vs. Tradicional)

Uma das maiores inovações de usabilidade do **Coletor IA** é o sistema de renderização dupla no frontend. O operador pode alternar o layout de acordo com o dispositivo utilizado:

### 1. Modo Moderno (Padrão)
*   **Estética**: Inspirada no Glassmorphism moderno. Blur de fundo, gradientes vibrantes, bordas arredondadas e sombras neon.
*   **Foco**: Administradores e gestores acessando de desktops modernos, notebooks ou smartphones potentes.

### 2. Modo Tradicional (Retro - Windows 2000 Style)
*   **Estética**: Cinza clássico (`#d4d0c8`), fontes pixeladas Tahoma/MS Sans Serif, bordas retas (Radius zero), botões com sombreamento "Bevel" chanfrado tridimensional simulando botões do Windows 95/2000.
*   **Foco**: Coletores de dados dedicados (Zebra, Honeywell, Datalogic) ou celulares Android antigos.
*   **Engenharia de Performance**: Este modo desativa via CSS e JS todos os efeitos de blur, sombras dinâmicas, gradientes complexos e animações por GPU. Isso reduz drasticamente o consumo de bateria, reduz o uso de CPU no navegador portátil a quase zero e elimina o "lag" de renderização na bipagem contínua.

---

## 📦 4. Mapeamento de Funcionalidades por Módulo

### 🏢 A. Painel Master (Administração SaaS)
Acessado exclusivamente pela URL `/saas` por usuários com a flag `is_super_admin = true`.
1.  **Gestão de Inquilinos (Empresas)**: Cadastro completo de empresas, definição do slug de login, CNPJ, data de adesão e limite máximo de contas de usuários (`max_users`).
2.  **Impersonate (Acesso Direto)**: Botão "Acessar" que permite ao administrador Master entrar diretamente no painel corporativo do cliente para prestar suporte, configurar dados ou auditar divergências sem precisar da senha do cliente.
3.  **Financeiro SaaS**: Lançamento de cobranças. O sistema monitora a data de vencimento (`due_date`). Se uma fatura permanecer pendente por mais de 5 dias após o vencimento, o sistema **bloqueia o login** de todos os usuários da empresa, redirecionando-os para um alerta de cobrança.
4.  **Controle Granular da Equipe Master**: Criação de colaboradores internos do SaaS com permissões específicas:
    *   `can_manage_saas_clients` (Cadastro e modificação de empresas).
    *   `can_manage_saas_finance` (Gestão de mensalidades e recebíveis).
    *   `can_manage_saas_staff` (Cadastro e remoção de outros super-admins).
5.  **Mural Compartilhado**: Bloco de notas persistente no banco de dados para troca de informações operacionais internas da equipe SaaS.

### 🏭 B. Módulo de Recebimento de Mercadorias (Inbound)
Focado no recebimento físico de fornecedores na doca de entrada.
1.  **Criação de expectativa**: O gestor cria um documento de recebimento inserindo os códigos e quantidades esperadas ou importando uma planilha do ERP.
2.  **Bipagem às Cegas (Blind Receipt)**: No fluxo de entrada do aplicativo móvel, o conferente tem liberdade operacional. Caso chegue um produto não listado na expectativa ou uma quantidade maior que a planejada, o sistema **não bloqueia a operação** — o excesso é gravado de imediato como "divergência aceita" para não congestionar a área de descarga.

### 🚛 C. Módulo de Expedição e Entregas Last-Mile (Outbound)
Responsável pela triagem de saída de cargas e controle das rotas dos motoristas.
1.  **Conferência de Expedição (Travas Duras)**: Ao bipar as mercadorias que estão subindo no caminhão, o aplicativo móvel aplica **travas duras**. O operador é impedido de bipar produtos fora da lista ou em quantidades maiores que o pedido.
2.  **Solicitação de Liberação**: Caso o conferente ou motorista precise carregar um produto excedente, o app bloqueia a tela e permite enviar uma solicitação com a quantidade excedente desejada.
3.  **Liberações Remotas (Alçadas de Gestão)**: O gestor administrativo visualiza em tempo real um painel de alertas com as solicitações pendentes (`/liberacoes`). Ele pode aprovar ou rejeitar à distância. Se aprovado, a tela do operador no celular destrava instantaneamente para concluir o carregamento.
4.  **App do Motorista (Entregas)**:
    *   O motorista acessa sua conta e visualiza sua rota ativa no celular.
    *   O sistema lista os clientes na ordem sequencial de paradas planejada.
    *   O motorista clica na parada do cliente, bipa os produtos que estão sendo descarregados na porta e confirma as quantidades.
    *   **POD (Proof of Delivery)**: Para finalizar a entrega, o motorista colhe a assinatura do cliente na tela do celular (usando canvas de desenho digital), preenche o nome e documento do recebedor e finaliza a entrega.
5.  **Histórico e Comprovantes**: O painel administrativo permite pesquisar rotas, números de pedidos ou nomes de clientes para visualizar o relatório completo e a assinatura digital colhida no ato da entrega.

### 👥 D. Controle de Acessos da Empresa (RBAC Local)
Dentro de cada empresa (tenant), o administrador define permissões granulares:
*   **Perfis**: Admin (permissões irrestritas), Gestor, Conferente e Motorista.
*   **Permissões específicas**:
    *   `can_view_dashboard`: Visualização de gráficos financeiros e operacionais.
    *   `can_manage_loads`: Criar e excluir rotas de entrega e cargas.
    *   `can_do_conference`: Acesso à área de bipagem de inbound/outbound.
    *   `can_manage_products`: Cadastro, edição e deleção de produtos.
    *   `can_manage_users`: Cadastro e edição da equipe local da empresa.
    *   `can_do_delivery`: Acesso ao painel e aplicativo do motorista.

### 📊 E. Módulo de Contagens (Auditoria de Estoque)
Oferece ferramentas para manter a precisão do estoque.
1.  **Contagem Avulsa (Auditoria Rápida)**:
    *   O operador bipa produtos em uma determinada prateleira ou setor sem necessidade de um documento pré-existente.
    *   Ao terminar, ele gera um relatório comparativo em Excel.
    *   **Característica técnica**: Não altera os saldos de estoque do sistema. É uma ferramenta puramente analítica.
2.  **Contagem de Inventário (Oficial)**:
    *   Abertura de uma sessão oficial de inventário (global ou por setor).
    *   Os operadores bipam as mercadorias físicas.
    *   O sistema calcula a diferença: `Quantidade Contada - Quantidade em Sistema`.
    *   O gestor visualiza a tabela de sobras (excess) ou faltas (missing).
    *   **Ajuste de Estoque**: Apenas usuários com permissão de Gestão/Admin podem clicar em "Ajustar Estoque", o que reescreve os saldos da tabela `products` para corresponder à contagem física realizada, registrando o log da operação.
