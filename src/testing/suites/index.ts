import { testRegistry } from '../registry';
import { smokeTests } from './smoke';
import { stockTests } from './stock';
import { authTests } from './auth';
import { masterDataTests } from './masterData';
import { salesTests } from './sales';
import { logisticsTests } from './logistics';
import { financeTests } from './finance';
import { comodatosTests } from './comodatos';
import { saasTests } from './saas';
import { offlineTests } from './offline';
import { fiscalTests } from './fiscal';
import { focusIntegrationSuite } from './focusIntegration';
import { e2eTests } from './e2e';

export function initializeTestRegistry() {
  testRegistry.clear();
  
  testRegistry.registerMany(smokeTests);
  testRegistry.registerMany(stockTests);
  testRegistry.registerMany(authTests);
  testRegistry.registerMany(masterDataTests);
  testRegistry.registerMany(salesTests);
  testRegistry.registerMany(logisticsTests);
  testRegistry.registerMany(financeTests);
  testRegistry.registerMany(comodatosTests);
  testRegistry.registerMany(saasTests);
  testRegistry.registerMany(offlineTests);
  testRegistry.registerMany(fiscalTests);
  testRegistry.registerMany(focusIntegrationSuite);
  testRegistry.registerMany(e2eTests);

  console.log(`[TestRegistry] Registradas ${testRegistry.getAllBatteries().length} baterias.`);
}
