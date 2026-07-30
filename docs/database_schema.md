# Dicionário de Dados e Esquema do Banco

Este documento descreve a arquitetura do banco de dados (Supabase / PostgreSQL) do sistema SL Stock.
O banco foi otimizado e estruturado para garantir segurança (via Row Level Security - RLS) de que cada empresa ou cliente visualize apenas os seus dados (multi-tenant implícito).

---

## 1. Módulo de CRM e Cadastros
Responsável pela manutenção das entidades que interagem com o sistema (clientes e usuários).

- `customers`: Tabela de Clientes. Guarda dados fiscais (CNPJ/CPF, Inscrição Estadual, CNAE) e endereços.
- `sales_reps`: Representantes Comerciais / Vendedores. Contém percentuais de comissão.
- `regions` e `sales_rep_regions`: Controle de territórios. Vendedores podem ser associados a múltiplas regiões.
- `price_tables` e `price_table_items`: Tabelas de preços customizadas. Permite diferentes markups e preços específicos por produto/cliente.
- `payment_conditions` e `customer_payment_conditions`: Prazos e parcelamentos (Ex: 30/60/90 dias) e o vínculo de quais condições estão liberadas para determinados clientes.

---

## 2. Módulo de Vendas (Pedidos)
O coração do faturamento do sistema.

- `sales_orders`: Cabeçalho do pedido de venda.
  - **Status do Pedido**: O ciclo de vida do pedido flui através dos estados: `Digitação` ➔ `Aprovado` ➔ `Faturado` ➔ (`Entregue` / `Retornou` / `Cancelado`).
  - Armazena valores brutos, líquidos, descontos, e vínculos com as condições de pagamento e tabelas de preço utilizadas no ato da venda.
- `sales_order_items`: Os produtos contidos dentro de um pedido, guardando o valor unitário congelado no momento da compra, desconto aplicado e quantidade.
- `order_groups`: Agrupamento de pedidos (Útil para consolidação de compras e logística).

---

## 3. Módulo de Produtos e Fiscal
Gerencia o inventário base e regras tributárias de emissão de NF-e/MDF-e.

- `products`: Tabela mestre de SKUs. Possui campos importantes para o controle de estoque (estoque físico, reservado, previsto, lotes e pontos de ressuprimento).
  - *Dados Fiscais*: Contém NCM, CEST, % IPI, Origem da Mercadoria e número da FCI.
- `fiscal_operations`: Lista de Naturezas de Operação (CFOP, CST, CSOSN, % ICMS). Usado para geração correta dos XMLs das notas fiscais.
- `nfe_records`: Histórico de Notas Fiscais Eletrônicas geradas. Guarda chave de acesso, protocolo de autorização, e links para impressão (PDF/XML).
- `mdfe_records`: Manifesto Eletrônico de Documentos Fiscais. Usado na logística para acobertar o transporte de múltiplas notas fiscais em uma mesma carga.

---

## 4. Módulo de Logística (Cargas e Romaneios)
Gerencia as rotas de entrega após o faturamento dos pedidos.

- `delivery_routes`: A carga ou o romaneio criado. Contém dados do motorista, placa do veículo, e status geral (`planning`, `in_progress`, `completed`).
- `delivery_clients`: Os pontos de parada do motorista (Quais clientes ele deve visitar na rota).
- `delivery_items`: Quais itens devem ser descarregados em cada cliente. Suporta marcação de divergências físicas (Faltou produto, mercadoria danificada, etc).

---

## 5. Módulo de Comodatos (Equipamentos)
Módulo especializado para empresas que emprestam / locam equipamentos para os clientes em troca de exclusividade ou contratos de fornecimento.

- `equipments`: Cadastro do parque de máquinas (Ex: Freezers, Máquinas de Café, etc). Contém Número de Série, Voltagem, e Status físico (`Estoque`, `No Cliente`, `Em Manutenção`).
- `equipment_orders` (Ordens de Serviço / Chamados): Registro de pedidos de instalação, manutenção corretiva/preventiva ou recolhimento da máquina.
- `equipment_history`: Linha do tempo imutável de tudo que aconteceu com a máquina (rastreabilidade completa de qual cliente utilizou em cada período).
- `supplies` e `supply_requests`: Controle de suprimentos das máquinas e solicitações feitas pelos clientes.

---

## 6. Módulo de Infraestrutura (SaaS)
Controle do próprio ecossistema multi-tenant.

- `companies`: As "lojas" ou empresas raiz.
- `saas_plans`: Planos de assinatura do sistema (Start, Pro, Platina, etc).
- `profiles`: Extensão da tabela de usuários do Supabase (`auth.users`) que guarda nome, avatar e a qual empresa e nível de permissão (role) esse login pertence.

---

## Política de Segurança (Row Level Security - RLS)
Praticamente todas as tabelas deste sistema possuem RLS habilitado com a política:
```sql
company_id = public.current_company_id()
```
Isso garante, diretamente no nível do banco de dados, que nenhuma consulta (mesmo feita via API pelo lado do cliente) retorne dados de outra empresa assinante do sistema. O Supabase extrai o `company_id` diretamente do token JWT gerado no login.
