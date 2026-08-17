export const FUNCTIONALITY_CATALOG = [
  // ==============================
  // DASHBOARD
  // ==============================
  {
    id: "DASH-001",
    nome: "Dashboard — Visualização e Indicadores",
    modulo: "Dashboard",
    tipo: "Relatório",
    rota: "/saas"
  },
  
  // ==============================
  // AUTENTICAÇÃO E SEGURANÇA
  // ==============================
  {
    id: "AUTH-001",
    nome: "Login — Autenticação",
    modulo: "Autenticação",
    tipo: "Permissão",
    rota: "/"
  },
  {
    id: "AUTH-002",
    nome: "Recuperação de Senha",
    modulo: "Autenticação",
    tipo: "Permissão",
    rota: "/reset-password-auto"
  },
  {
    id: "SEC-001",
    nome: "Segurança — Multi-tenant e RLS",
    modulo: "Segurança",
    tipo: "Segurança",
    rota: "global"
  },

  // ==============================
  // MASTER E EMPRESAS
  // ==============================
  {
    id: "EMP-001",
    nome: "Empresas — Cadastro e Configuração",
    modulo: "SaaS",
    tipo: "CRUD",
    rota: "/configuracoes/empresa"
  },
  {
    id: "SAAS-001",
    nome: "SaaS — Financeiro e Faturamento",
    modulo: "SaaS",
    tipo: "Operacional",
    rota: "/saas/financeiro"
  },

  // ==============================
  // CADASTROS BASE (MASTER DATA)
  // ==============================
  {
    id: "PROD-001",
    nome: "Produtos — Cadastro, Edição e Listagem",
    modulo: "Produtos",
    tipo: "CRUD",
    rota: "/cadastros/produtos"
  },
  {
    id: "CLI-001",
    nome: "Clientes — Cadastro, Edição e Listagem",
    modulo: "CRM",
    tipo: "CRUD",
    rota: "/cadastros/clientes"
  },
  {
    id: "TAB-001",
    nome: "Tabelas de Preço — Gestão",
    modulo: "Preços",
    tipo: "CRUD",
    rota: "/cadastros/tabelas-de-preco"
  },
  {
    id: "REP-001",
    nome: "Representantes — Gestão",
    modulo: "CRM",
    tipo: "CRUD",
    rota: "/cadastros/representantes"
  },

  // ==============================
  // ESTOQUE
  // ==============================
  {
    id: "EST-001",
    nome: "Estoque — Entrada e Saída",
    modulo: "Estoque",
    tipo: "Operacional",
    rota: "/estoque/movimentacao"
  },
  {
    id: "EST-002",
    nome: "Estoque — Consulta e Saldo",
    modulo: "Estoque",
    tipo: "Relatório",
    rota: "/estoque/consulta"
  },

  // ==============================
  // VENDAS & B2B
  // ==============================
  {
    id: "VEN-001",
    nome: "Força de Vendas — Novo Pedido",
    modulo: "Vendas",
    tipo: "Fluxo",
    rota: "/vendas/novo-pedido"
  },
  {
    id: "VEN-002",
    nome: "Gestão de Pedidos — Consulta",
    modulo: "Vendas",
    tipo: "CRUD",
    rota: "/vendas/pedidos"
  },

  // ==============================
  // LOGÍSTICA & ENTREGAS
  // ==============================
  {
    id: "LOG-001",
    nome: "Cargas — Criação e Edição",
    modulo: "Logística",
    tipo: "Operacional",
    rota: "/entregas/cargas"
  },
  {
    id: "LOG-002",
    nome: "Recebimento — Conferência Bipagem",
    modulo: "Logística",
    tipo: "Fluxo",
    rota: "/entregas/conferencia"
  },
  {
    id: "LOG-003",
    nome: "Rotas — Roteirização e Clientes",
    modulo: "Logística",
    tipo: "Fluxo",
    rota: "/entregas/rota"
  },
  {
    id: "POD-001",
    nome: "Entregas Mobile — POD e Assinatura",
    modulo: "Mobile",
    tipo: "Fluxo",
    rota: "/entregas/assinatura"
  },

  // ==============================
  // FINANCEIRO
  // ==============================
  {
    id: "FIN-001",
    nome: "Financeiro — Contas a Receber",
    modulo: "Financeiro",
    tipo: "CRUD",
    rota: "/financeiro/contas-receber"
  },

  // ==============================
  // COMODATOS E PATRIMÔNIO
  // ==============================
  {
    id: "COM-001",
    nome: "Comodato — Equipamentos e Patrimônio",
    modulo: "Comodato",
    tipo: "CRUD",
    rota: "/comodatos/equipamentos"
  },

  // ==============================
  // FISCAL
  // ==============================
  {
    id: "FSC-001",
    nome: "NF-e — Emissão e Homologação",
    modulo: "Fiscal",
    tipo: "Integração",
    rota: "/fiscal/notas"
  },
  {
    id: "FCS-INT-001",
    nome: "Integração Global Focus NFe",
    modulo: "Fiscal",
    tipo: "Integração",
    rota: "/saas/focus-nfe"
  },

  // ==============================
  // OFFLINE E SINCRONIZAÇÃO
  // ==============================
  {
    id: "OFF-001",
    nome: "Offline — Sincronização e Cache",
    modulo: "Offline",
    tipo: "Offline",
    rota: "ServiceWorker"
  }
];

export const CATEGORIES = Array.from(new Set(FUNCTIONALITY_CATALOG.map(f => f.modulo)));
