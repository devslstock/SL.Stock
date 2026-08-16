import type { TestBattery } from './types';
import { FUNCTIONALITY_CATALOG } from './catalog';

// O Registry armazena todas as baterias disponíveis no sistema.
// Ele é populado em runtime quando as baterias são importadas.
class TestRegistry {
  private batteries: Map<string, TestBattery> = new Map();

  register(battery: TestBattery) {
    if (this.batteries.has(battery.id)) {
      console.warn(`[TestRegistry] Aviso: Bateria com ID ${battery.id} já registrada. Sobrescrevendo.`);
    }
    
    // Validate if the battery's module exists in the catalog
    const catalogEntry = FUNCTIONALITY_CATALOG.find(f => f.id === battery.id);
    if (!catalogEntry) {
      console.warn(`[TestRegistry] Aviso: Bateria ${battery.id} não mapeada no catálogo oficial (FUNCTIONALITY_CATALOG).`);
    }

    this.batteries.set(battery.id, battery);
  }

  registerMany(batteries: TestBattery[]) {
    batteries.forEach(b => this.register(b));
  }

  getBattery(id: string): TestBattery | undefined {
    return this.batteries.get(id);
  }

  getAllBatteries(): TestBattery[] {
    return Array.from(this.batteries.values());
  }

  getBatteriesByModule(moduleName: string): TestBattery[] {
    return this.getAllBatteries().filter(b => b.module === moduleName);
  }

  getBatteriesByTags(tags: string[]): TestBattery[] {
    return this.getAllBatteries().filter(b => 
      b.tags && tags.some(t => b.tags!.includes(t))
    );
  }

  clear() {
    this.batteries.clear();
  }
}

export const testRegistry = new TestRegistry();
