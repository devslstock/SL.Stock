# Arquitetura do Frontend (React + Vite)

Este documento descreve as convenções, bibliotecas e estrutura do código-fonte frontend da aplicação SL Stock. 
O sistema foi projetado para funcionar perfeitamente em Desktops (Painel de Gestão) e Dispositivos Móveis (PWA para Vendedores e Motoristas).

---

## 1. Stack Tecnológica Principal

- **Framework**: React 18
- **Build Tool**: Vite (Rápido HMR e bundling eficiente)
- **Linguagem**: TypeScript (Garantia de tipos estáticos para integração com o Supabase)
- **Roteamento**: `react-router-dom`
- **Gerenciamento de Estado de Servidor (Cache & API)**: `@tanstack/react-query` (Essencial para manter a interface rápida e suportar modo offline/PWA sem travamentos).
- **Estilização**: TailwindCSS + Componentes acessíveis inspirados no Shadcn/UI (Radix Primitives).
- **Ícones**: `lucide-react`
- **PWA**: `vite-plugin-pwa` para instalar como app em celulares e funcionar com cache dinâmico.

---

## 2. Estrutura de Diretórios (`src/`)

```text
src/
├── api/          # Comunicação com o Backend. Todos os endpoints e queries do Supabase ficam aqui separados por domínio (sales, products, equipments).
├── components/   # Componentes visuais genéricos ou de domínio.
│   ├── layout/   # NavBar, Sidebar, AppLayout.
│   └── ui/       # Componentes primitivos do Shadcn (Buttons, Inputs, Dialogs, Toasts).
├── contexts/     # React Contexts (ex: AuthContext para gerenciar o estado global de login e informações da Empresa).
├── data/         # Arquivos estáticos JSON (Ex: Lista de CFOPs, NCMs em cache).
├── db/           # Configurações de IndexedDB local (Dexie.js) usado para o funcionamento offline do app de Vendas.
├── lib/          # Configurações de bibliotecas externas (ex: supabase client, helpers de formatação, utilitários).
├── pages/        # Views principais da aplicação. O roteamento (App.tsx) aponta diretamente para cá.
│   ├── Comodatos/# Telas de ordens de serviço e equipamentos.
│   ├── Master/   # Cadastros base do sistema (Clientes, Tabelas de Preço).
│   ├── SalesApp/ # O APP mobile-first voltado para os representantes comerciais na rua.
│   └── ...       # Telas do Backoffice de Gestão (Produtos, Estoque, etc).
├── services/     # Serviços mais complexos de lógica de negócio (Ex: OfflineSyncService).
└── types/        # Definições de Tipos TypeScript (`database.ts` é o espelho exato da estrutura SQL do Supabase).
```

---

## 3. Padrões de Código Adotados

### Comunicação com o Supabase
Toda chamada de dados não é feita diretamente nas Views. Elas ficam isoladas na pasta `src/api/`. 
Isso permite utilizar o **React Query** (`useQuery` / `useMutation`) nas telas, facilitando estados de *Loading*, *Error*, re-buscas automáticas (refetch) em background e melhorando dramaticamente a UX.

### Suporte Offline / PWA
O sistema possui regras específicas para a parte de força de vendas (`SalesApp`):
- Os pedidos (Rascunhos ou Digitação) podem ser manipulados sem conexão com a internet.
- Os dados vitais (Clientes daquele vendedor, Tabelas de preço, Catálogo de Produtos) são cacheados e atualizados em background pelo React Query.

### Modos Visuais e Temas
A aplicação possui suporte nativo para Dark Mode e Customização de Cores baseadas nas configurações da `Company` (Empresa logada). 
O `AuthContext` é responsável por injetar propriedades dinâmicas do TailwindCSS (`--primary`) com base na paleta de cor selecionada pelo lojista no painel de configurações.

### Tratamento de Tipos
O arquivo `src/types/database.ts` é a fonte da verdade do sistema. Ele mapeia os enums (como o Status do Pedido de Venda: `'Digitação' | 'Aprovado' | 'Faturado' | ...`) para que o TypeScript acuse erros de compilação caso algo seja digitado errado em qualquer ponto do projeto, garantindo consistência em larga escala.
