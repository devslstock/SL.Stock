import type { TestBattery } from './types';

/**
 * Normaliza strings para facilitar a busca ignorando acentos e maiúsculas
 */
function normalizeStr(str: string): string {
  return str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Analisa o problema relatado e sugere baterias baseadas em palavras-chave e categorias.
 */
export function suggestTestsForDiagnostic(problemDescription: string, allBatteries: TestBattery[]): TestBattery[] {
  if (!problemDescription || problemDescription.trim() === '') {
    return [];
  }

  const normalizedProblem = normalizeStr(problemDescription);
  
  // Extrai palavras-chave simples (palavras com mais de 3 letras)
  const tokens = normalizedProblem.split(/\W+/).filter(t => t.length > 3);

  const scoredBatteries = allBatteries.map(battery => {
    let score = 0;
    const testTitleNorm = normalizeStr(battery.name);
    const testDescNorm = normalizeStr(battery.description);
    const moduleNorm = normalizeStr(battery.module);
    
    // Verifica tokens do relato
    tokens.forEach(token => {
      // 1. Match exato no modulo = score alto (ex: "estoque")
      if (moduleNorm.includes(token)) score += 5;
      
      // 2. Match no título do teste
      if (testTitleNorm.includes(token)) score += 3;
      
      // 3. Match na descrição
      if (testDescNorm.includes(token)) score += 1;

      // 4. Match em tags definidas na bateria
      if (battery.tags) {
         battery.tags.forEach(tag => {
           if (normalizeStr(tag).includes(token) || token.includes(normalizeStr(tag))) {
             score += 4;
           }
         });
      }
    });

    return { battery, score };
  });

  // Filtra as que tiveram score > 0 e ordena pelas mais relevantes
  return scoredBatteries
    .filter(tb => tb.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(tb => tb.battery);
}
