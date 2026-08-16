import { testRegistry } from '../registry';
import { smokeTests } from './smoke';
import { stockTests } from './stock';

// Importe outras baterias aqui futuramente:
// import { authTests } from './auth';

export function initializeTestRegistry() {
  testRegistry.clear();
  
  testRegistry.registerMany(smokeTests);
  testRegistry.registerMany(stockTests);
  // testRegistry.registerMany(authTests);
  
  console.log(`[TestRegistry] Registrados ${testRegistry.getAllTests().length} testes.`);
}
