export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string | React.ReactNode;
  tags: string[];
  isCommon?: boolean;
}

export const FAQ_CATEGORIES = [
  'Primeiros passos',
  'Produtos e Estoque',
  'Movimentações',
  'Cadastros',
  'Relatórios',
  'Conta e Usuário',
  'Logística e Cargas',
  'Fiscal (NF-e/MDF-e)',
  'Financeiro'
];

export const FAQ_DATA: FAQItem[] = [
  // Primeiros passos
  {
    id: 'pp-1',
    category: 'Primeiros passos',
    question: 'Como começar a utilizar o SL.Stock?',
    answer: 'Para começar, certifique-se de que sua conta está ativa. O primeiro passo ideal é cadastrar seus Produtos no menu "Produtos" e depois ajustar o saldo atual no menu "Entrada de Estoque". Em seguida, cadastre seus clientes para poder gerar pedidos de venda.',
    tags: ['iniciar', 'começar', 'introdução', 'configuração'],
    isCommon: true
  },
  {
    id: 'pp-2',
    category: 'Primeiros passos',
    question: 'Como acessar o sistema de qualquer lugar?',
    answer: 'O SL.Stock funciona 100% na nuvem. Basta acessar o link do seu ambiente pelo navegador do computador ou do celular. Para vendas em campo, você pode usar o App de Vendas adaptado para celular acessando o menu "App de Vendas".',
    tags: ['acesso', 'nuvem', 'mobile', 'celular'],
  },

  // Produtos e Estoque
  {
    id: 'pe-1',
    category: 'Produtos e Estoque',
    question: 'Como cadastrar um produto?',
    answer: 'Acesse o menu "Produtos" na barra lateral e clique no botão verde "Novo Produto". Preencha o Código, Descrição e o Preço de Venda. Se desejar, adicione o código de barras, NCM e categoria. Clique em Salvar. O sistema criará o produto com saldo inicial zero.',
    tags: ['produto', 'cadastrar', 'novo', 'preço', 'código'],
    isCommon: true
  },
  {
    id: 'pe-2',
    category: 'Produtos e Estoque',
    question: 'Como editar as informações de um produto?',
    answer: 'Vá no menu "Produtos", localize o item desejado usando a barra de busca e clique no ícone de lápis (Editar) na linha do produto. Altere as informações necessárias e clique em Salvar.',
    tags: ['editar', 'produto', 'alterar', 'atualizar'],
  },
  {
    id: 'pe-3',
    category: 'Produtos e Estoque',
    question: 'Como consultar a quantidade em estoque?',
    answer: 'A tela de "Produtos" exibe a coluna Saldo para cada item cadastrado. Você também pode visualizar o valor exato pesquisando pelo código ou nome do produto diretamente na tela de Entrada ou Saída de Estoque.',
    tags: ['estoque', 'quantidade', 'saldo', 'ver'],
  },

  // Movimentações
  {
    id: 'mov-1',
    category: 'Movimentações',
    question: 'Como registrar uma entrada de estoque?',
    answer: 'Acesse "Estoque" > "Nova Entrada". Selecione o tipo de operação (Entrada), informe os itens manualmente ou bipando com um leitor de código de barras. Confirme as quantidades e conclua a operação. O saldo dos produtos será somado imediatamente.',
    tags: ['entrada', 'estoque', 'adicionar', 'bipar', 'código de barras'],
    isCommon: true
  },
  {
    id: 'mov-2',
    category: 'Movimentações',
    question: 'Como registrar uma saída de estoque avulsa?',
    answer: 'Acesse "Estoque" > "Nova Saída". Informe os itens que estão sendo retirados do estoque e finalize a operação. O saldo será subtraído. Lembre-se: Vendas já reduzem o saldo se você aprovar a entrega ou faturamento.',
    tags: ['saída', 'estoque', 'remover', 'avulsa', 'baixa'],
  },
  {
    id: 'mov-3',
    category: 'Movimentações',
    question: 'Onde vejo o histórico das movimentações (entradas/saídas)?',
    answer: 'No menu "Histórico de Movimentações", você tem a lista completa de todas as entradas, saídas, devoluções e inventários realizados, identificando quem fez, a data e a quantidade de itens alterados.',
    tags: ['histórico', 'movimentações', 'relatório', 'entradas', 'saídas'],
  },

  // Cadastros
  {
    id: 'cad-1',
    category: 'Cadastros',
    question: 'Como cadastrar clientes?',
    answer: 'Acesse o menu "Clientes" na seção Cadastros (barra lateral). Clique em "Novo Cliente", preencha Razão Social (ou Nome), CNPJ/CPF, e o endereço de entrega (Rota). Clientes são necessários para emitir Pedidos de Venda.',
    tags: ['cliente', 'cadastrar', 'novo', 'comprador'],
    isCommon: true
  },
  {
    id: 'cad-2',
    category: 'Cadastros',
    question: 'Como gerenciar vendedores/representantes?',
    answer: 'No menu "Vendedores/Representantes", você pode cadastrar sua equipe comercial, definindo taxa de comissão e meta mensal. Ao gerar um pedido, você poderá vincular qual vendedor o atendeu.',
    tags: ['vendedor', 'representante', 'cadastrar', 'comissão'],
  },

  // Relatórios
  {
    id: 'rel-1',
    category: 'Relatórios',
    question: 'Onde vejo um resumo das minhas vendas e estoque?',
    answer: 'A tela de Dashboard Principal e o Dashboard de Vendas (no menu Vendas) oferecem gráficos em tempo real sobre faturamento do mês, tickets médios, quantidade de pedidos e alertas de produtos com estoque baixo.',
    tags: ['relatório', 'dashboard', 'gráfico', 'resumo', 'vendas'],
    isCommon: true
  },
  {
    id: 'rel-2',
    category: 'Relatórios',
    question: 'Como exportar os dados do sistema?',
    answer: 'Várias tabelas do SL.Stock (como Produtos, Clientes e Pedidos) possuem um botão "Exportar" que gera um relatório em Excel (Planilha) ou PDF com os dados listados na tela.',
    tags: ['exportar', 'excel', 'pdf', 'baixar', 'relatório'],
  },

  // Conta e Usuário
  {
    id: 'usr-1',
    category: 'Conta e Usuário',
    question: 'Como alterar minha senha?',
    answer: 'Acesse a engrenagem (Configurações) ou clique na sua foto de perfil no canto superior direito e vá em "Minha Conta". Encontre a seção "Alterar Senha", digite a nova senha e salve.',
    tags: ['senha', 'alterar', 'mudar', 'conta', 'perfil'],
  },
  {
    id: 'usr-2',
    category: 'Conta e Usuário',
    question: 'Como adicionar mais usuários ao sistema?',
    answer: 'Se o seu plano permitir, acesse o menu "Usuários" (Configurações > Usuários da Empresa). Clique em "Novo Usuário", preencha e-mail, nome, defina um Papel (ex: Operador, Conferente, Gestor) e salve. Ele receberá acesso ao sistema com base nas permissões do papel.',
    tags: ['usuário', 'adicionar', 'novo', 'equipe', 'funcionário'],
    isCommon: true
  },

  // Logística e Cargas
  {
    id: 'log-1',
    category: 'Logística e Cargas',
    question: 'Como funciona o controle de Cargas?',
    answer: 'Acesse "Gestão de Cargas". Aqui você pode montar uma Carga de Entrega agrupando vários pedidos. O conferente usa a tela de "Conferência Cega" para bipar todos os produtos que entram no caminhão, garantindo que nada falte antes do motorista sair.',
    tags: ['carga', 'caminhão', 'entrega', 'logística', 'conferência'],
    isCommon: true
  },
  {
    id: 'log-2',
    category: 'Logística e Cargas',
    question: 'Como monitorar as entregas do motorista?',
    answer: 'O motorista usa o menu "Minhas Rotas" no celular dele. Lá ele sinaliza quando chegou no cliente, recolhe assinatura digital e marca como Entregue. O gestor acompanha o progresso em tempo real pelo "Painel de Roteirização".',
    tags: ['motorista', 'rota', 'acompanhar', 'entrega', 'status'],
  },

  // Fiscal e Financeiro
  {
    id: 'fisc-1',
    category: 'Fiscal (NF-e/MDF-e)',
    question: 'Como emitir uma Nota Fiscal Eletrônica (NF-e)?',
    answer: 'O SL.Stock integra com o Focus NFe. Primeiro, garanta que nas configurações da Empresa o certificado A1 esteja configurado. Ao visualizar um Pedido de Venda Faturado, clique no botão "Gerar NF-e". O sistema enviará os dados para a SEFAZ.',
    tags: ['nota fiscal', 'nfe', 'emitir', 'gerar', 'sefaz', 'focus'],
    isCommon: true
  },
  {
    id: 'fin-1',
    category: 'Financeiro',
    question: 'Como lanço o Contas a Receber dos clientes?',
    answer: 'Quando um Pedido de Venda é faturado, se as condições de pagamento gerarem parcelas, os títulos são lançados automaticamente na tela de "Contas a Receber" no menu Financeiro. Lá você pode dar baixa manual (marcar como Pago) quando receber o dinheiro.',
    tags: ['financeiro', 'receber', 'boleto', 'parcela', 'pagamento', 'faturamento'],
  }
];
