export type TestStatus = 'PASSOU' | 'FALHOU' | 'BLOQUEADO' | 'NÃO EXECUTADO' | 'EM EXECUÇÃO';

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

export interface TestStep {
  name: string;
  run: (ctx: TestContext) => Promise<void>;
}

export interface TestBattery {
  id: string;
  name: string;
  module: string;
  description: string;
  type: 'CRUD' | 'Operacional' | 'Fluxo' | 'Permissão' | 'Integração' | 'Offline' | 'Relatório' | 'E2E';
  priority?: 'Alta' | 'Normal' | 'Crítica' | 'Baixa';
  tags?: string[];
  dependsOn?: string[]; // IDs das baterias que precisam passar antes desta
  
  /** Executado uma vez antes de todos os testes da bateria */
  setup?: (ctx: TestContext) => Promise<void>;
  
  /** Lista de testes granulares da bateria */
  tests: TestStep[];
  
  /** Executado no final, independentemente de sucesso ou falha */
  cleanup?: (ctx: TestContext) => Promise<void>;
}

export interface TestExecutionResult {
  batteryId: string;
  status: TestStatus;
  durationMs: number;
  logs: TestLog[];
  error?: string;
  stackTrace?: string;
  executedAt: Date;
  testsPassed: number;
  testsTotal: number;
}

