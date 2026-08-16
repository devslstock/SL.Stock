import type { TestCase } from './types';

/**
 * Normaliza strings para facilitar a busca ignorando acentos e maiúsculas
 */
function normalizeStr(str: string): string {
  return str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Analisa o problema relatado e sugere testes baseados em palavras-chave e categorias.
 */
export function suggestTestsForDiagnostic(problemDescription: string, allTests: TestCase[]): TestCase[] {
  if (!problemDescription || problemDescription.trim() === '') {
    return [];
  }

  const normalizedProblem = normalizeStr(problemDescription);
  
  // Extrai palavras-chave simples (palavras com mais de 3 letras)
  const tokens = normalizedProblem.split(/\W+/).filter(t => t.length > 3);

  const scoredTests = allTests.map(test => {
    let score = 0;
    const testTitleNorm = normalizeStr(test.name);
    const testDescNorm = normalizeStr(test.description);
    const categoryNorm = normalizeStr(test.category);
    
    // Verifica tokens do relato
    tokens.forEach(token => {
      // 1. Match exato na categoria = score alto (ex: "estoque")
      if (categoryNorm.includes(token)) score += 5;
      
      // 2. Match no título do teste
      if (testTitleNorm.includes(token)) score += 3;
      
      // 3. Match na descrição
      if (testDescNorm.includes(token)) score += 1;

      // 4. Match em keywords definidas manualmente no teste
      if (test.keywords) {
         test.keywords.forEach(kw => {
           if (normalizeStr(kw).includes(token) || token.includes(normalizeStr(kw))) {
             score += 4;
           }
         });
      }
    });

    return { test, score };
  });

  // Retorna os testes que tiveram algum score > 0, ordenados pela relevância
  return scoredTests
    .filter(st => st.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(st => st.test);
}
