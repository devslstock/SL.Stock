# Documentação Geral - SL Stock

Bem-vindo ao portal de documentação do sistema SL Stock.
O projeto cresceu ao longo do tempo ganhando módulos complexos de gestão de força de vendas (App Offline), integração com emissores fiscais, gestão de logística (romaneios) e comodatos.

Para facilitar a manutenção do código, auditorias de segurança e o "onboarding" de novos engenheiros na equipe, fragmentamos a documentação da arquitetura nos arquivos abaixo:

### 🗄️ Backend e Persistência de Dados
**[`docs/database_schema.md`](./database_schema.md)**
Manual que lista todos os módulos lógicos, explicando como o banco de dados Supabase/PostgreSQL gerencia as tabelas, as restrições e a política agressiva de segurança e isolamento de dados por empresa (RLS Multi-tenant).

**[`docs/estrutura_completa_atualizada.sql`](./estrutura_completa_atualizada.sql)**
Arquivo mestre unificado contendo o código bruto em SQL de todas as tabelas, funções, enums e políticas do banco de dados (consolidação final gerada das migrations).

### 🖥️ Frontend e Código-Fonte
**[`docs/frontend_architecture.md`](./frontend_architecture.md)**
Detalha as convenções de projeto do cliente React + Vite, estrutura de diretórios em `src/`, uso de tipagem TypeScript, cache com React Query, e as decisões arquiteturais por trás da renderização Offline-First e PWA.
