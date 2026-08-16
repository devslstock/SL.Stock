import { TestCase, TestContext, TestExecutionResult, TestLog, TestStatus } from './types';

export class TestRunner {
  
  /**
   * Executa um único teste, injetando o contexto isolado.
   */
  static async runTest(
    test: TestCase, 
    authUserId?: string, 
    companyId?: string,
    onLogUpdate?: (logs: TestLog[]) => void
  ): Promise<TestExecutionResult> {
    
    const logs: TestLog[] = [];
    const startTime = performance.now();
    let status: TestStatus = 'EM EXECUÇÃO';
    let errorMsg: string | undefined;
    let stackTrace: string | undefined;

    const appendLog = (level: TestLog['level'], message: string, data?: any) => {
      logs.push({ time: new Date().toLocaleTimeString(), level, message, data });
      if (onLogUpdate) {
        onLogUpdate([...logs]); // Clona para forçar re-render no React
      }
    };

    const ctx: TestContext = {
      authUserId,
      companyId,
      log: (msg, data) => appendLog('info', msg, data),
      assert: (condition, msg) => {
        if (!condition) {
          throw new Error(`[AssertionFailed] ${msg}`);
        }
      },
      assertEqual: (actual, expected, msg) => {
        if (actual !== expected) {
          throw new Error(`[AssertionFailed] ${msg || 'Valores não são iguais'}. Recebeu: ${actual}, Esperado: ${expected}`);
        }
      }
    };

    appendLog('info', `Iniciando teste [${test.id}] ${test.name}`);

    try {
      // 1. RUN
      await test.run(ctx);
      status = 'PASSOU';
      appendLog('success', `Teste concluído com sucesso.`);
    } catch (e: any) {
      // 2. ERROR CATCHING
      status = 'FALHOU';
      errorMsg = e.message || 'Erro desconhecido';
      stackTrace = e.stack;
      appendLog('error', `Falha no teste: ${errorMsg}`);
    } finally {
      // 3. TEARDOWN (CLEANUP)
      if (test.cleanup) {
        appendLog('info', 'Executando rotina de limpeza (cleanup)...');
        try {
          await test.cleanup(ctx);
          appendLog('success', 'Limpeza concluída.');
        } catch (cleanupError: any) {
          appendLog('error', `Falha ao executar limpeza: ${cleanupError.message}`);
          if (status === 'PASSOU') {
             // Se o teste passou mas o cleanup falhou, consideramos como alerta ou falha parcial.
             // Para rigor, mantemos o status, mas registramos o erro crítico.
             status = 'FALHOU';
             errorMsg = `Teste passou, mas CLEANUP falhou: ${cleanupError.message}`;
          }
        }
      }
    }

    const durationMs = performance.now() - startTime;

    return {
      testId: test.id,
      status,
      durationMs,
      logs,
      error: errorMsg,
      stackTrace,
      executedAt: new Date()
    };
  }
}
