import type { TestCase } from './types';

// O Registry armazena todos os testes disponíveis no sistema.
// Ele é populado em runtime quando as baterias são importadas.
class TestRegistry {
  private tests: Map<string, TestCase> = new Map();

  register(testCase: TestCase) {
    if (this.tests.has(testCase.id)) {
      console.warn(`[TestRegistry] Aviso: Teste com ID ${testCase.id} já registrado. Sobrescrevendo.`);
    }
    this.tests.set(testCase.id, testCase);
  }

  registerMany(testCases: TestCase[]) {
    testCases.forEach(tc => this.register(tc));
  }

  getTest(id: string): TestCase | undefined {
    return this.tests.get(id);
  }

  getAllTests(): TestCase[] {
    return Array.from(this.tests.values());
  }

  getTestsByCategory(category: string): TestCase[] {
    return this.getAllTests().filter(t => t.category === category);
  }

  clear() {
    this.tests.clear();
  }
}

export const testRegistry = new TestRegistry();
