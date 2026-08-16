export type TestCategory = 
  | 'Sistema' | 'Autenticação' | 'Usuários' | 'Permissões' 
  | 'Produtos' | 'Estoque' | 'Entradas' | 'Saídas' | 'Pedidos' 
  | 'Coleta' | 'Conferência' | 'Rotas' | 'Entregas' | 'Clientes'
  | 'Fornecedores' | 'Fiscal' | 'NF-e' | 'MDF-e' | 'Relatórios'
  | 'Importação' | 'Exportação' | 'Integrações' | 'Notificações'
  | 'Banco de dados' | 'APIs' | 'Responsividade' | 'Segurança'
  | 'Performance' | 'Regressão' | 'Diagnóstico';

export type TestType = 'UNIT' | 'INTEGRATION' | 'API' | 'E2E' | 'DATABASE' | 'SECURITY' | 'PERFORMANCE' | 'MANUAL';

export type TestPriority = 'Baixa' | 'Normal' | 'Alta' | 'Crítica';

export type TestStatus = 'PASSOU' | 'FALHOU' | 'BLOQUEADO' | 'NÃO EXECUTADO' | 'EM EXECUÇÃO' | 'NÃO APLICÁVEL';

export interface TestLog {
  time: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface TestContext {
  log: (message: string, data?: any) => void;
  assert: (condition: boolean, errorMessage: string) => void;
  assertEqual: (actual: any, expected: any, errorMessage?: string) => void;
  authUserId?: string;
  companyId?: string;
}

export interface TestCase {
  id: string;
  name: string;
  category: TestCategory;
  type: TestType;
  priority: TestPriority;
  description: string;
  prerequisites?: string[];
  estimatedTimeMs?: number;
  
  /** Lista de tags ou palavras-chave para ajudar a IA de diagnóstico a achar o teste */
  keywords?: string[];

  /** A função que efetivamente executa o teste */
  run: (ctx: TestContext) => Promise<void>;
  
  /** Função de limpeza, executada sempre no final (mesmo se o teste falhar) */
  cleanup?: (ctx: TestContext) => Promise<void>;
}

export interface TestExecutionResult {
  testId: string;
  status: TestStatus;
  durationMs: number;
  logs: TestLog[];
  error?: string;
  stackTrace?: string;
  executedAt: Date;
}
