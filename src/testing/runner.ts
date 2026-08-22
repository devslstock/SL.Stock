import type { TestBattery, TestContext, TestExecutionResult, TestLog, TestStatus } from './types';
import { getErrorMessage } from '@/utils/errorMessage';

export class TestRunner {
  
  /**
   * Executa uma bateria completa de testes iterando por seus passos internos.
   */
  static async runBattery(
    battery: TestBattery, 
    authUserId?: string, 
    companyId?: string,
    onLogUpdate?: (logs: TestLog[]) => void
  ): Promise<TestExecutionResult> {
    
    const logs: TestLog[] = [];
    const startTime = performance.now();
    let status: TestStatus = 'EM EXECUÇÃO';
    let errorMsg: string | undefined;
    let stackTrace: string | undefined;
    let testsPassed = 0;

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

    appendLog('info', `Iniciando bateria [${battery.id}] ${battery.name} (${battery.tests.length} testes)`);

    try {
      if (!ctx.companyId) {
        appendLog('warning', 'Nenhuma empresa selecionada (super admin sem impersonação ativa). Testes que gravam dados provavelmente serão bloqueados pelo RLS — entre em uma empresa em Master > Empresas antes de rodar baterias de escrita.');
      }

      // 1. SETUP
      if (battery.setup) {
        appendLog('info', 'Executando Setup da bateria...');
        await battery.setup(ctx);
      }

      // 2. RUN TESTS
      for (let i = 0; i < battery.tests.length; i++) {
        const step = battery.tests[i];
        appendLog('info', `▶ Executando Teste ${i+1}/${battery.tests.length}: ${step.name}`);
        await step.run(ctx);
        testsPassed++;
        appendLog('success', `✓ Teste passou: ${step.name}`);
      }

      status = 'PASSOU';
      appendLog('success', `Bateria concluída com sucesso! Todos os testes passaram.`);
    } catch (e: unknown) {
      // 3. ERROR CATCHING
      errorMsg = getErrorMessage(e);
      stackTrace = e instanceof Error ? e.stack : undefined;
      
      if (errorMsg?.includes('row-level security policy')) {
        status = 'BLOQUEADO';
        appendLog('warning', `Bateria bloqueada (RLS): O usuário atual não possui permissão para executar esta operação no banco de dados. Autentique-se com uma conta compatível para rodar este teste de inserção.`);
      } else {
        status = 'FALHOU';
        appendLog('error', `Falha na bateria: ${errorMsg}`);
      }
    } finally {
      // 4. TEARDOWN (CLEANUP)
      if (battery.cleanup) {
        appendLog('info', 'Executando rotina de limpeza (cleanup)...');
        try {
          await battery.cleanup(ctx);
          appendLog('success', 'Limpeza concluída.');
        } catch (cleanupError: unknown) {
          const cleanupMsg = getErrorMessage(cleanupError);
          appendLog('error', `Falha ao executar limpeza: ${cleanupMsg}`);
          if (status === 'PASSOU') {
             // Se o teste passou mas o cleanup falhou, consideramos como alerta ou falha parcial.
             status = 'FALHOU';
             errorMsg = `Bateria passou, mas CLEANUP falhou: ${cleanupMsg}`;
          }
        }
      }
    }

    const durationMs = performance.now() - startTime;

    return {
      batteryId: battery.id,
      status,
      durationMs,
      logs,
      error: errorMsg,
      stackTrace,
      executedAt: new Date(),
      testsPassed,
      testsTotal: battery.tests.length
    };
  }
}
